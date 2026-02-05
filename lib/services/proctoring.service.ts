import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";

export type ProctoringViolationType =
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "FACE_NOT_VISIBLE"
  | "LOOKING_AWAY"
  | "EYE_MOVEMENT"
  | "FACE_TOO_CLOSE"
  | "FACE_TOO_FAR"
  | "POOR_LIGHTING"
  | "NORMAL";

export interface ProctoringViolation {
  type: ProctoringViolationType;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: number;
  confidence?: number;
}

export interface FaceDetectionResult {
  faceCount: number;
  violations: ProctoringViolation[];
  status: "NORMAL" | "WARNING" | "VIOLATION";
  predictions?: blazeface.NormalizedFace[];
}

export interface ProctoringConfig {
  // Detection thresholds
  minFaceSize: number; // Minimum face size (percentage of video)
  maxFaceSize: number; // Maximum face size (percentage of video)
  lookingAwayThreshold: number; // How off-center before considered looking away
  detectionInterval: number; // How often to run detection (ms)
  violationCooldown: number; // Cooldown before reporting same violation again (ms)
  /** Minimum confidence (0-1) for a face prediction to count. Reduces false negatives. */
  minConfidence?: number;
  /** Number of consecutive frames to smooth face count (reduces flicker). */
  smoothFrameCount?: number;
  /** Probability below which to report poor lighting (higher = stricter). Default 0.4. */
  poorLightingThreshold?: number;
  /** Minimum confidence to accept face as "properly visible" (reject hand/obstruction). Default 0.65. */
  minConfidenceForValidFace?: number;

  // Callbacks
  onViolation?: (violation: ProctoringViolation) => void;
  onStatusChange?: (status: FaceDetectionResult["status"]) => void;
  onFaceCountChange?: (count: number) => void;
}

const DEFAULT_CONFIG: ProctoringConfig = {
  minFaceSize: 12, // 12% of video height (slightly more lenient for far)
  maxFaceSize: 75, // 75% of video height (slightly more lenient for close)
  lookingAwayThreshold: 0.3, // 30% off-center (reduces false "looking away")
  detectionInterval: 800, // Check every 800ms (responsive but not heavy)
  violationCooldown: 2500, // 2.5 seconds cooldown
  minConfidence: 0.4, // Ignore very low-confidence face boxes
  smoothFrameCount: 3, // Require 3 consistent frames to reduce flicker
  poorLightingThreshold: 0.4, // Only flag lighting if confidence < 0.4
  minConfidenceForValidFace: 0.78, // Require high confidence for "face OK" (reject hand covering face)
};

export class ProctoringService {
  private model: blazeface.BlazeFaceModel | null = null;
  private isModelLoading = false;
  private isRunning = false;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private detectionInterval: ReturnType<typeof setInterval> | null = null;
  private config: ProctoringConfig;
  private lastViolationTime: Map<ProctoringViolationType, number> = new Map();
  private currentStatus: FaceDetectionResult["status"] = "NORMAL";
  private currentFaceCount = 0;
  private violationHistory: ProctoringViolation[] = [];
  private currentLatestViolation: ProctoringViolation | null = null;
  /** Rolling buffer of recent face counts for smoothing */
  private faceCountBuffer: number[] = [];

  constructor(config: Partial<ProctoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the BlazeFace model
   */
  async initializeModel(): Promise<void> {
    if (this.model) return;
    if (this.isModelLoading) {
      // Wait for existing load to complete
      while (this.isModelLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    try {
      this.isModelLoading = true;

      // Set backend
      await tf.setBackend("webgl");
      await tf.ready();

      // Load the model
      this.model = await blazeface.load();
    } catch (error) {
      throw new Error("Failed to load face detection model");
    } finally {
      this.isModelLoading = false;
    }
  }

  /**
   * Start the camera and begin face detection
   */
  async startProctoring(
    videoElement: HTMLVideoElement,
    constraints: MediaStreamConstraints = {
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false,
    }
  ): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera access is not supported in this browser. Please use a modern browser."
        );
      }

      // Initialize model if not already loaded
      await this.initializeModel();

      // Check if there's an existing active video stream we can reuse
      let existingStream: MediaStream | null = null;
      try {
        // First, check for globally stored stream (from device-check page)
        if (
          typeof window !== "undefined" &&
          (window as any).__mockInterviewStream
        ) {
          const globalStream = (window as any).__mockInterviewStream;
          const videoTracks = globalStream.getVideoTracks();
          // Check if stream has active video track
          if (videoTracks.length > 0 && videoTracks[0].readyState === "live") {
            existingStream = globalStream;
            // Clear the global reference after using it
            delete (window as any).__mockInterviewStream;
          }
        }

        // If no global stream, check all video elements for active streams
        if (!existingStream) {
          const videoElements = document.querySelectorAll("video");
          for (const video of videoElements) {
            if (video.srcObject instanceof MediaStream) {
              const stream = video.srcObject;
              const videoTracks = stream.getVideoTracks();
              // Check if stream has active video track
              if (
                videoTracks.length > 0 &&
                videoTracks[0].readyState === "live"
              ) {
                existingStream = stream;
                break;
              }
            }
          }
        }
      } catch (error) {
        // Ignore errors when checking for existing streams
      }

      // Get camera access - reuse existing stream if available
      try {
        if (existingStream) {
          // Reuse existing stream
          this.stream = existingStream;
        } else {
          // Request new stream
          this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      } catch (mediaError: any) {
        // Provide more specific error messages
        if (
          mediaError.name === "NotAllowedError" ||
          mediaError.name === "PermissionDeniedError"
        ) {
          throw new Error(
            "Camera permission denied. Please allow camera access and try again."
          );
        } else if (
          mediaError.name === "NotFoundError" ||
          mediaError.name === "DevicesNotFoundError"
        ) {
          throw new Error(
            "No camera found. Please connect a camera and try again."
          );
        } else if (
          mediaError.name === "NotReadableError" ||
          mediaError.name === "TrackStartError"
        ) {
          throw new Error(
            "Camera is already in use by another application. Please close other apps using the camera."
          );
        } else if (
          mediaError.name === "OverconstrainedError" ||
          mediaError.name === "ConstraintNotSatisfiedError"
        ) {
          throw new Error(
            "Camera constraints could not be satisfied. Please try a different camera."
          );
        } else if (mediaError.name === "SecurityError") {
          throw new Error(
            "Camera access blocked due to security restrictions. Please use HTTPS."
          );
        } else {
          throw new Error(
            `Camera access failed: ${mediaError.message || "Unknown error"}`
          );
        }
      }

      this.videoElement = videoElement;

      // Ensure video element is set up for playback BEFORE setting stream
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;

      // Set the stream
      this.videoElement.srcObject = this.stream;

      // Verify the stream is actually set
      if (this.videoElement.srcObject !== this.stream) {
        // Try to fix it
        this.videoElement.srcObject = this.stream;
      }

      // Wait for video to load metadata and have valid dimensions (reduced timeout)
      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) {
          reject(new Error("Video element not available"));
          return;
        }

        let resolved = false;
        let timeout: ReturnType<typeof setTimeout> | null = null;

        // Listen for loadedmetadata event
        const onLoadedMetadata = async () => {
          if (this.videoElement) {
            try {
              await this.videoElement.play();
            } catch (err) {
              // Ignore play errors - video might still work
            }
          }
          checkVideoReady();
        };

        // Listen for loadeddata event
        const onLoadedData = () => {
          checkVideoReady();
        };

        // Listen for playing event (video is actually playing)
        const onPlaying = () => {
          checkVideoReady();
        };

        const cleanup = () => {
          if (this.videoElement) {
            this.videoElement.removeEventListener(
              "loadedmetadata",
              onLoadedMetadata
            );
            this.videoElement.removeEventListener("loadeddata", onLoadedData);
            this.videoElement.removeEventListener("playing", onPlaying);
          }
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
        };

        const checkVideoReady = () => {
          if (
            !resolved &&
            this.videoElement &&
            this.videoElement.videoWidth > 0 &&
            this.videoElement.videoHeight > 0 &&
            this.videoElement.readyState >= 2 // HAVE_CURRENT_DATA
          ) {
            resolved = true;
            cleanup();
            resolve();
            return true;
          }
          return false;
        };

        // Check immediately
        if (checkVideoReady()) {
          return;
        }

        this.videoElement.addEventListener("loadedmetadata", onLoadedMetadata);
        this.videoElement.addEventListener("loadeddata", onLoadedData);
        this.videoElement.addEventListener("playing", onPlaying);

        timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            // Resolve anyway - detection will retry when video is ready
            resolve();
          }
        }, 1000); // Reduced to 1 second for faster startup

        // If metadata is already loaded, try to play immediately
        if (this.videoElement.readyState >= 1) {
          this.videoElement.play().catch(() => {});
          // Check immediately for dimensions
          checkVideoReady();
        }
      });

      // Start detection loop
      this.isRunning = true;
      this.startDetectionLoop();
    } catch (error: any) {
      // Re-throw with original error message if it's already a user-friendly error
      if (error.message && error.message.includes("Camera")) {
        throw error;
      }
      throw new Error(
        error.message ||
          "Failed to start proctoring. Please check camera permissions."
      );
    }
  }

  /**
   * Stop proctoring and release camera
   */
  stopProctoring(): void {
    this.isRunning = false;

    // Clear detection interval
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Clear video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    // Reset state
    this.currentStatus = "NORMAL";
    this.currentFaceCount = 0;
    this.faceCountBuffer = [];
    this.lastViolationTime.clear();
  }

  /**
   * Start the detection loop
   */
  private startDetectionLoop(): void {
    const detect = async () => {
      if (!this.isRunning || !this.videoElement || !this.model) return;

      // Check if video is ready (has dimensions and is playing)
      if (
        !this.videoElement.videoWidth ||
        !this.videoElement.videoHeight ||
        this.videoElement.readyState < 2 // Need at least HAVE_CURRENT_DATA
      ) {
        return;
      }

      try {
        const result = await this.detectFaces();
        // Always process result, even if faceCount is 0
        // This ensures the callback is called and UI stays in sync
        if (result) {
          this.processDetectionResult(result);
        }
      } catch (error) {
        // On error, still update face count to 0 to keep UI in sync
        if (this.currentFaceCount !== 0 && this.config.onFaceCountChange) {
          this.currentFaceCount = 0;
          try {
            this.config.onFaceCountChange(0);
          } catch (callbackError) {
            // Silently handle callback errors
          }
        }
      }
    };

    // Start detection with proper video readiness check
    let retryCount = 0;
    const maxRetries = 50; // Max 10 seconds of retries (50 * 200ms)

    const startDetection = () => {
      // Check if video has dimensions, stream, and is ready
      if (
        this.videoElement &&
        this.videoElement.srcObject &&
        this.videoElement.videoWidth > 0 &&
        this.videoElement.videoHeight > 0 &&
        this.videoElement.readyState >= 2
      ) {
        // Video is ready, start detection immediately
        detect();
        // Set up interval for continuous detection
        if (!this.detectionInterval) {
          this.detectionInterval = setInterval(
            detect,
            this.config.detectionInterval
          );
        }
      } else if (retryCount < maxRetries) {
        // Retry after a short delay if video not ready
        retryCount++;
        setTimeout(startDetection, 200);
      }
    };

    // Start checking immediately
    startDetection();
  }

  /**
   * Extract [x, y] from a BlazeFace landmark (can be tensor or array)
   */
  private getLandmarkPoint(
    landmarks: unknown,
    index: number
  ): [number, number] | null {
    if (!Array.isArray(landmarks) || index < 0 || index >= landmarks.length) {
      return null;
    }
    const item = landmarks[index];
    if (Array.isArray(item) && item.length >= 2) {
      const x = Number(item[0]);
      const y = Number(item[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
    }
    try {
      const t = item as { dataSync?: () => Float32Array | number[] };
      const data = t?.dataSync?.();
      if (data && data.length >= 2) {
        const x = Number(data[0]);
        const y = Number(data[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) return [x, y];
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Extract face probability from BlazeFace prediction (handles tensor or number)
   */
  private getFaceProbability(face: blazeface.NormalizedFace): number | undefined {
    const p = (face as any).probability;
    if (p == null) return undefined;
    if (typeof p === "number") return p;
    if (Array.isArray(p) && p.length > 0) return Number(p[0]);
    try {
      const data = (p as any).dataSync?.();
      if (data && data.length > 0) return Number(data[0]);
    } catch {
      // ignore
    }
    return undefined;
  }

  /**
   * Smooth face count over recent frames to reduce flicker (0/1/0/1 -> 1)
   */
  private getSmoothedFaceCount(rawCount: number): number {
    const smoothN = this.config.smoothFrameCount ?? 3;
    this.faceCountBuffer.push(rawCount);
    if (this.faceCountBuffer.length > smoothN) {
      this.faceCountBuffer.shift();
    }
    if (this.faceCountBuffer.length < smoothN) {
      return rawCount; // Not enough samples yet
    }
    // Use mode (most frequent value) for stability
    const counts = new Map<number, number>();
    for (const n of this.faceCountBuffer) {
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    let best: number = this.faceCountBuffer[this.faceCountBuffer.length - 1];
    let bestFreq = 0;
    counts.forEach((freq, n) => {
      if (freq > bestFreq || (freq === bestFreq && n === 1)) {
        bestFreq = freq;
        best = n;
      }
    });
    return best;
  }

  /**
   * Detect faces in the current video frame
   */
  async detectFaces(): Promise<FaceDetectionResult> {
    if (!this.model || !this.videoElement) {
      throw new Error("Model or video element not initialized");
    }

    // Check if video has valid dimensions and is ready
    if (
      !this.videoElement.videoWidth ||
      !this.videoElement.videoHeight ||
      this.videoElement.readyState < 2 // Need at least HAVE_CURRENT_DATA
    ) {
      // Return empty result if video not ready - this is normal during initialization
      return {
        faceCount: 0,
        violations: [],
        status: "NORMAL",
        predictions: [],
      };
    }

    let predictions: blazeface.NormalizedFace[];
    try {
      const raw = await this.model.estimateFaces(this.videoElement, false);
      const minConf = this.config.minConfidence ?? 0.4;
      // Filter by confidence to reduce false negatives and noise
      predictions = raw.filter((face) => {
        const prob = this.getFaceProbability(face);
        return typeof prob === "number" && prob >= minConf;
      }) as blazeface.NormalizedFace[];
    } catch (error) {
      // On estimation error, push 0 and use smoothed count (avoids one-frame glitches)
      const smoothed = this.getSmoothedFaceCount(0);
      return {
        faceCount: smoothed,
        violations:
          smoothed === 0
            ? [this.createViolation("NO_FACE", "No face detected", "high")]
            : [],
        status: smoothed === 0 ? "VIOLATION" : "NORMAL",
        predictions: [],
      };
    }

    const violations: ProctoringViolation[] = [];
    const rawFaceCount = predictions.length;
    const faceCount = this.getSmoothedFaceCount(rawFaceCount);

    // Check for violations (use smoothed count for stability)
    if (faceCount === 0) {
      violations.push(
        this.createViolation("NO_FACE", "No face detected", "high")
      );
    } else if (faceCount > 1) {
      violations.push(
        this.createViolation(
          "MULTIPLE_FACES",
          `${faceCount} faces detected`,
          "high"
        )
      );
    } else if (predictions.length >= 1) {
      // Single face this frame - check visibility, position, size, lighting
      const face = predictions[0];
      const videoWidth = this.videoElement.videoWidth;
      const videoHeight = this.videoElement.videoHeight;
      const topLeft = face.topLeft as [number, number];
      const bottomRight = face.bottomRight as [number, number];
      const faceWidth = bottomRight[0] - topLeft[0];
      const faceHeight = bottomRight[1] - topLeft[1];
      const faceSizePercent = (faceHeight / videoHeight) * 100;
      const probability = this.getFaceProbability(face);
      const minValidConf = this.config.minConfidenceForValidFace ?? 0.78;
      const faceNotVisibleMsg =
        "Face not clearly visible. Remove hands or obstructions from your face.";

      // 1) Require high confidence (reject hand/obstruction - model often gives lower confidence)
      if (typeof probability === "number" && probability < minValidConf) {
        violations.push(
          this.createViolation(
            "FACE_NOT_VISIBLE",
            faceNotVisibleMsg,
            "high",
            probability
          )
        );
      }

      // 2) Require valid landmarks with proper eye spread - otherwise treat as not visible
      // When face is covered, landmarks are missing or eyes are in wrong place / collapsed
      const landmarks = (face as any).landmarks;
      const rightEye = this.getLandmarkPoint(landmarks, 0);
      const leftEye = this.getLandmarkPoint(landmarks, 1);

      if (faceWidth > 0 && rightEye && leftEye) {
        const eyeDx = leftEye[0] - rightEye[0];
        const eyeDy = leftEye[1] - rightEye[1];
        const eyeDistance = Math.sqrt(eyeDx * eyeDx + eyeDy * eyeDy);
        const eyeSpreadRatio = eyeDistance / faceWidth;
        // Real face: eyes are ~30–50% of face width apart. Hand/covered gives tiny or weird ratio
        if (eyeSpreadRatio < 0.22) {
          violations.push(
            this.createViolation("FACE_NOT_VISIBLE", faceNotVisibleMsg, "high")
          );
        }
      } else {
        // No usable landmarks – cannot verify real face (e.g. hand in front)
        violations.push(
          this.createViolation("FACE_NOT_VISIBLE", faceNotVisibleMsg, "high")
        );
      }

      // Check if face is too close or too far
      if (faceSizePercent < this.config.minFaceSize) {
        violations.push(
          this.createViolation(
            "FACE_TOO_FAR",
            "Please move closer to the camera",
            "medium"
          )
        );
      } else if (faceSizePercent > this.config.maxFaceSize) {
        violations.push(
          this.createViolation(
            "FACE_TOO_CLOSE",
            "Please move away from the camera",
            "medium"
          )
        );
      }

      // Check if looking away (face not centered) - Enhanced eye movement detection
      const faceCenterX = (topLeft[0] + bottomRight[0]) / 2;
      const faceCenterY = (topLeft[1] + bottomRight[1]) / 2;
      const videoCenterX = videoWidth / 2;
      const videoCenterY = videoHeight / 2;

      const horizontalOffset =
        Math.abs(faceCenterX - videoCenterX) / videoWidth;
      const verticalOffset = Math.abs(faceCenterY - videoCenterY) / videoHeight;

      // Enhanced eye movement detection - more sensitive threshold for eye movement
      const eyeMovementThreshold = this.config.lookingAwayThreshold * 0.7; // 70% of looking away threshold for more sensitive detection
      
      if (
        horizontalOffset > this.config.lookingAwayThreshold ||
        verticalOffset > this.config.lookingAwayThreshold
      ) {
        violations.push(
          this.createViolation(
            "LOOKING_AWAY",
            "Please look at the screen",
            "medium"
          )
        );
      } else if (
        horizontalOffset > eyeMovementThreshold ||
        verticalOffset > eyeMovementThreshold
      ) {
        // Track eye movement separately (less severe but still tracked)
        violations.push(
          this.createViolation(
            "EYE_MOVEMENT",
            "Eye movement detected - please maintain focus on screen",
            "medium"
          )
        );
      }

      // Check lighting (using probability as proxy) - only flag when very low
      const lightingThreshold = this.config.poorLightingThreshold ?? 0.4;
      if (
        typeof probability === "number" &&
        probability < lightingThreshold
      ) {
        violations.push(
          this.createViolation(
            "POOR_LIGHTING",
            "Poor lighting conditions detected",
            "low",
            probability
          )
        );
      }
    }

    // Determine overall status
    const status = this.determineStatus(violations);

    return {
      faceCount,
      violations,
      status,
      predictions: predictions as blazeface.NormalizedFace[],
    };
  }

  /**
   * Process detection result and trigger callbacks
   */
  private processDetectionResult(result: FaceDetectionResult): void {
    // Update face count immediately - always update and call callback
    const faceCountChanged = result.faceCount !== this.currentFaceCount;
    this.currentFaceCount = result.faceCount;

    // Always call callback to ensure UI is updated with latest face count
    // This ensures the UI reflects the current detection state
    // IMPORTANT: Always call this, even if count is 0, to keep UI in sync
    // Use optional chaining to safely call the callback
    this.config.onFaceCountChange?.(result.faceCount);

    // Update latest violation immediately based on current detection
    // Use the first violation from current detection (most recent)
    const newLatestViolation =
      result.violations.length > 0 ? result.violations[0] : null;

    // Update latest violation if it changed - this ensures real-time updates
    const violationChanged =
      newLatestViolation?.type !== this.currentLatestViolation?.type ||
      newLatestViolation?.message !== this.currentLatestViolation?.message ||
      (newLatestViolation === null && this.currentLatestViolation !== null);

    if (violationChanged) {
      this.currentLatestViolation = newLatestViolation;
      // Call onViolation callback immediately for latest violation updates
      // This ensures UI updates in real-time without waiting for cooldown
      if (newLatestViolation) {
        // Has violation - call immediately
        this.config.onViolation?.(newLatestViolation);
      } else {
        // No violation - clear by calling with NORMAL type
        this.config.onViolation?.({
          type: "NORMAL",
          message: "Face Detected",
          severity: "low",
          timestamp: Date.now(),
        } as ProctoringViolation);
      }
    }

    // Update status
    if (result.status !== this.currentStatus) {
      this.currentStatus = result.status;
      this.config.onStatusChange?.(result.status);
    }

    // Process violations with cooldown for history tracking only
    for (const violation of result.violations) {
      const lastTime = this.lastViolationTime.get(violation.type) || 0;
      const now = Date.now();

      if (now - lastTime > this.config.violationCooldown) {
        this.lastViolationTime.set(violation.type, now);
        this.violationHistory.push(violation);
      }
    }
  }

  /**
   * Create a violation object
   */
  private createViolation(
    type: ProctoringViolationType,
    message: string,
    severity: ProctoringViolation["severity"],
    confidence?: number
  ): ProctoringViolation {
    return {
      type,
      message,
      severity,
      timestamp: Date.now(),
      confidence,
    };
  }

  /**
   * Determine overall status from violations
   * EYE_MOVEMENT and POOR_LIGHTING are not treated as WARNING so face detection stays stable
   */
  private determineStatus(
    violations: ProctoringViolation[]
  ): FaceDetectionResult["status"] {
    const significant = violations.filter(
      (v) => v.type !== "EYE_MOVEMENT" && v.type !== "POOR_LIGHTING"
    );
    if (significant.length === 0) return "NORMAL";

    const hasHighSeverity = significant.some((v) => v.severity === "high");
    const hasMediumSeverity = significant.some((v) => v.severity === "medium");

    if (hasHighSeverity) return "VIOLATION";
    if (hasMediumSeverity) return "WARNING";
    return "NORMAL";
  }

  /**
   * Get violation history
   */
  getViolationHistory(): ProctoringViolation[] {
    return [...this.violationHistory];
  }

  /**
   * Clear violation history
   */
  clearViolationHistory(): void {
    this.violationHistory = [];
  }

  /**
   * Get current status
   */
  getCurrentStatus(): FaceDetectionResult["status"] {
    return this.currentStatus;
  }

  /**
   * Get current face count
   */
  getCurrentFaceCount(): number {
    return this.currentFaceCount;
  }

  /**
   * Check if proctoring is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ProctoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Take a snapshot of current video frame
   */
  async takeSnapshot(): Promise<string | null> {
    if (!this.videoElement) return null;

    const canvas = document.createElement("canvas");
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalViolations: number;
    violationsByType: Record<ProctoringViolationType, number>;
    averageFaceCount: number;
  } {
    const violationsByType: Record<ProctoringViolationType, number> = {
      NO_FACE: 0,
      MULTIPLE_FACES: 0,
      FACE_NOT_VISIBLE: 0,
      LOOKING_AWAY: 0,
      EYE_MOVEMENT: 0,
      FACE_TOO_CLOSE: 0,
      FACE_TOO_FAR: 0,
      POOR_LIGHTING: 0,
      NORMAL: 0,
    };

    this.violationHistory.forEach((v) => {
      violationsByType[v.type]++;
    });

    return {
      totalViolations: this.violationHistory.length,
      violationsByType,
      averageFaceCount: this.currentFaceCount,
    };
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.stopProctoring();

    if (this.model) {
      // BlazeFace model doesn't have a dispose method, but we can clean up TF resources
      this.model = null;
    }
  }
}

// Singleton instance for global use
let proctoringServiceInstance: ProctoringService | null = null;

/**
 * Get the global proctoring service instance
 */
export function getProctoringService(
  config?: Partial<ProctoringConfig>
): ProctoringService {
  if (!proctoringServiceInstance) {
    proctoringServiceInstance = new ProctoringService(config);
  } else if (config) {
    proctoringServiceInstance.updateConfig(config);
  }
  return proctoringServiceInstance;
}

/**
 * Reset the global proctoring service instance
 */
export function resetProctoringService(): void {
  if (proctoringServiceInstance) {
    proctoringServiceInstance.dispose();
    proctoringServiceInstance = null;
  }
}
