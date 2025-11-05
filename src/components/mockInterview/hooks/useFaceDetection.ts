import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

interface FaceDetectionResult {
  faceCount: number;
  isValidFrame: boolean;
  boundingBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface UseFaceDetectionReturn {
  faceDetection: FaceDetectionResult | null;
  isModelLoading: boolean;
  error: string | null;
  startDetection: () => void;
  stopDetection: () => void;
  isDetecting: boolean;
  isLoading: boolean;
}

const useFaceDetection = (
  videoRef: React.RefObject<HTMLVideoElement | null>
): UseFaceDetectionReturn => {
  const [faceDetection, setFaceDetection] =
    useState<FaceDetectionResult | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const modelRef = useRef<tf.GraphModel | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize TensorFlow and load the face detection model
  const initializeModel = useCallback(async () => {
    try {
      setIsModelLoading(true);
      setError(null);

      // Initialize TensorFlow backend
      await tf.ready();

      // Load a lightweight face detection model (BlazeFace)
      const modelUrl =
        "https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1";

      modelRef.current = await tf.loadGraphModel(modelUrl, { fromTFHub: true });
    } catch (err) {
      setError(
        "Failed to load face detection model. Please check your internet connection."
      );
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  // Detect faces in the video frame
  const detectFaces = useCallback(async () => {
    if (
      !videoRef.current ||
      !modelRef.current ||
      !videoRef.current.videoWidth ||
      videoRef.current.videoWidth === 0
    ) {
      return;
    }

    try {
      const video = videoRef.current;

      // Create canvas for processing if it doesn't exist
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to tensor - BlazeFace expects RGB image
      const imgTensor = tf.browser.fromPixels(canvas, 3);

      // Resize to 128x128 for BlazeFace model with better interpolation
      const resized = tf.image.resizeBilinear(imgTensor, [128, 128], true);
      const casted = tf.cast(resized, "float32");

      // Normalize to [0, 255] range if needed (BlazeFace typically expects this)
      const normalized = casted.div(255.0).mul(255.0);
      const batched = normalized.expandDims(0);

      // Run face detection
      const predictions = await modelRef.current.executeAsync(batched);

      let boxes: Float32Array | Int32Array | Uint8Array;
      let scores: Float32Array | Int32Array | Uint8Array;

      // Handle model output - BlazeFace returns [boxes, scores]
      if (Array.isArray(predictions) && predictions.length >= 2) {
        const detectionsData = await predictions[0].data();
        const scoresData = await predictions[1].data();
        boxes = detectionsData as Float32Array | Int32Array | Uint8Array;
        scores = scoresData as Float32Array | Int32Array | Uint8Array;

        // Clean up prediction tensors
        predictions.forEach((tensor: tf.Tensor) => tensor.dispose());
      } else {
        // Fallback for unexpected format
        if (imgTensor) imgTensor.dispose();
        if (resized) resized.dispose();
        if (casted) casted.dispose();
        if (batched) batched.dispose();
        if (Array.isArray(predictions)) {
          predictions.forEach((tensor: tf.Tensor) => tensor.dispose());
        } else if (predictions) {
          (predictions as tf.Tensor).dispose();
        }
        return;
      }

      // Very lenient detection - prioritize finding faces
      const primaryThreshold = 0.35; // Lower primary threshold
      const fallbackThreshold = 0.15; // Very low fallback

      const validDetections: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        confidence: number;
      }> = [];

      // BlazeFace typically has 896 anchors
      const maxDetections = Math.min(896, scores.length);

      // First pass - try with primary threshold
      for (let i = 0; i < maxDetections; i++) {
        const confidence = scores[i];

        if (confidence > primaryThreshold) {
          if (boxes.length >= (i + 1) * 4) {
            const ymin = boxes[i * 4];
            const xmin = boxes[i * 4 + 1];
            const ymax = boxes[i * 4 + 2];
            const xmax = boxes[i * 4 + 3];

            // Convert normalized coordinates to pixel coordinates
            const x = Math.max(0, xmin * canvas.width);
            const y = Math.max(0, ymin * canvas.height);
            const width = Math.min(
              canvas.width - x,
              (xmax - xmin) * canvas.width
            );
            const height = Math.min(
              canvas.height - y,
              (ymax - ymin) * canvas.height
            );

            // Very lenient size validation
            const faceArea = width * height;
            const videoArea = canvas.width * canvas.height;
            const areaRatio = faceArea / videoArea;

            // Accept faces from 1% to 98% of frame
            if (
              width > 10 &&
              height > 10 &&
              areaRatio > 0.01 &&
              areaRatio < 0.98
            ) {
              validDetections.push({ x, y, width, height, confidence });
            }
          }
        }
      }

      // Second pass - very lenient fallback if no faces found
      if (validDetections.length === 0) {
        for (let i = 0; i < maxDetections; i++) {
          const confidence = scores[i];

          if (confidence > fallbackThreshold && boxes.length >= (i + 1) * 4) {
            const ymin = boxes[i * 4];
            const xmin = boxes[i * 4 + 1];
            const ymax = boxes[i * 4 + 2];
            const xmax = boxes[i * 4 + 3];

            const x = Math.max(0, xmin * canvas.width);
            const y = Math.max(0, ymin * canvas.height);
            const width = Math.min(
              canvas.width - x,
              (xmax - xmin) * canvas.width
            );
            const height = Math.min(
              canvas.height - y,
              (ymax - ymin) * canvas.height
            );

            // Minimal validation - just check it's not tiny
            if (width > 8 && height > 8) {
              validDetections.push({ x, y, width, height, confidence });
            }
          }
        }
      }

      // Update face detection state
      const detectionResult = {
        faceCount: validDetections.length,
        isValidFrame: video.videoWidth > 0 && !video.paused,
        boundingBoxes: validDetections.map((d) => ({
          x: d.x,
          y: d.y,
          width: d.width,
          height: d.height,
        })),
      };

      setFaceDetection(detectionResult);

      // Clean up tensors to prevent memory leaks
      imgTensor.dispose();
      resized.dispose();
      casted.dispose();
      normalized.dispose();
      batched.dispose();
    } catch (err) {
      setError("Error during face detection: " + (err as Error).message);
      setFaceDetection({
        faceCount: 0,
        isValidFrame: false,
        boundingBoxes: [],
      });
    }
  }, [videoRef]);

  // Animation loop for continuous detection
  const detectLoop = useCallback(() => {
    if (isDetecting) {
      detectFaces();
      // Run detection every 500ms to reduce CPU load
      animationRef.current = setTimeout(() => {
        requestAnimationFrame(detectLoop);
      }, 500);
    }
  }, [detectFaces, isDetecting]);

  // Start face detection
  const startDetection = useCallback(() => {
    if (!modelRef.current) {
      setError("Model not loaded. Please wait for initialization.");
      return;
    }

    if (!videoRef.current) {
      setError("Video element not available.");
      return;
    }

    setIsDetecting(true);
    setError(null);
  }, []);

  // Stop face detection
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Initialize model on mount
  useEffect(() => {
    initializeModel();

    return () => {
      // Cleanup on unmount
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      if (modelRef.current) {
        modelRef.current.dispose();
      }
    };
  }, [initializeModel]);

  // Start/stop detection loop
  useEffect(() => {
    if (isDetecting) {
      detectLoop();
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [detectLoop, isDetecting]);

  return {
    faceDetection,
    isModelLoading,
    error,
    startDetection,
    stopDetection,
    isDetecting,
    isLoading: isModelLoading,
  };
};

export default useFaceDetection;
