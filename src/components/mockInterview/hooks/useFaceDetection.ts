import { useEffect, useRef, useState, useCallback } from "react";
import type { BlazeFaceModel } from "@tensorflow-models/blazeface";
import { loadBlazeFaceModel } from "../utils/faceDetectionLoader";

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

const useFaceDetection = (videoRef: {
  current: HTMLVideoElement | null;
}): UseFaceDetectionReturn => {
  const [faceDetection, setFaceDetection] =
    useState<FaceDetectionResult | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const modelRef = useRef<BlazeFaceModel | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize TensorFlow and load BlazeFace model
  const initializeModel = useCallback(async () => {
    try {
      setIsModelLoading(true);
      setError(null);

      const model = await loadBlazeFaceModel();
      modelRef.current = model;
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
      // Video not ready - report no face
      setFaceDetection({
        faceCount: 0,
        isValidFrame: false,
        boundingBoxes: [],
      });
      return;
    }

    try {
      const video = videoRef.current;

      // Check if video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setFaceDetection({
          faceCount: 0,
          isValidFrame: false,
          boundingBoxes: [],
        });
        return;
      }

      // Run face detection using BlazeFace
      const predictions = await modelRef.current.estimateFaces(video, false);
      const faceCount = predictions.length;

      // Prepare bounding box data
      const boundingBoxes = predictions.map((prediction: any) => {
        const [x1, y1] = prediction.topLeft as [number, number];
        const [x2, y2] = prediction.bottomRight as [number, number];

        return {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
        };
      });

      // Update face detection state IMMEDIATELY
      const detectionResult = {
        faceCount,
        isValidFrame: video.videoWidth > 0 && !video.paused,
        boundingBoxes,
      };

      setFaceDetection(detectionResult);
    } catch (err) {
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
      // Run detection every 300ms for LIVE responsive tracking
      animationRef.current = setTimeout(() => {
        requestAnimationFrame(detectLoop);
      }, 300);
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
  }, [videoRef]);

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
      modelRef.current?.dispose?.();
      modelRef.current = null;
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
