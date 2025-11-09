import { useEffect, useRef, useState, useCallback } from "react";

interface MediaRecorderData {
  blob: Blob;
  timestamp: number;
  duration: number;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseMediaCaptureReturn {
  // Video/Audio streams
  videoStream: MediaStream | null;
  audioStream: MediaStream | null;
  isStreamActive: boolean;

  // Recording functionality
  isRecording: boolean;
  recordedChunks: MediaRecorderData[];

  // Speech recognition
  speechResult: SpeechRecognitionResult | null;
  isSpeechListening: boolean;

  // Control functions
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  startSpeechRecognition: () => void;
  stopSpeechRecognition: () => void;

  // Error handling
  error: string | null;
}

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const useMediaCapture = (): UseMediaCaptureReturn => {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<MediaRecorderData[]>([]);
  const [speechResult, setSpeechResult] =
    useState<SpeechRecognitionResult | null>(null);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Initialize Speech Recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (
      !("SpeechRecognition" in window) &&
      !("webkitSpeechRecognition" in window)
    ) {
      setError("Speech recognition not supported in this browser");
      return null;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure speech recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.language = "en-US";
    recognition.maxAlternatives = 1;

    // Handle speech recognition results
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setSpeechResult({
        transcript: finalTranscript || interimTranscript,
        confidence:
          event.results[event.results.length - 1]?.[0]?.confidence || 0,
        isFinal: event.results[event.results.length - 1]?.isFinal || false,
      });
    };

    // Handle speech recognition errors
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsSpeechListening(false);
    };

    // Handle speech recognition end
    recognition.onend = () => {
      setIsSpeechListening(false);
    };

    return recognition;
  }, []);

  // Start capturing video and audio streams
  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Request video stream with specific constraints
      const videoConstraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 },
          facingMode: "user",
        },
      };

      // Request audio stream with noise cancellation
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      };

      // Get video stream
      const videoStreamResult = await navigator.mediaDevices.getUserMedia(
        videoConstraints
      );
      setVideoStream(videoStreamResult);

      // Get audio stream
      const audioStreamResult = await navigator.mediaDevices.getUserMedia(
        audioConstraints
      );
      setAudioStream(audioStreamResult);

      setIsStreamActive(true);

      // Initialize speech recognition
      if (!speechRecognitionRef.current) {
        speechRecognitionRef.current = initializeSpeechRecognition();
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setError(
        "Failed to access camera or microphone. Please check permissions."
      );
    }
  }, [initializeSpeechRecognition]);

  // Stop capturing streams
  const stopCapture = useCallback(() => {
    // Stop video stream
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }

    // Stop audio stream
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Stop speech recognition if active
    if (isSpeechListening) {
      stopSpeechRecognition();
    }

    setIsStreamActive(false);
  }, [videoStream, audioStream, isRecording, isSpeechListening]);

  // Start recording video and audio
  const startRecording = useCallback(() => {
    if (!videoStream || !audioStream) {
      setError("Video or audio stream not available");
      return;
    }

    try {
      // Combine video and audio streams
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      // Create media recorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const duration = Date.now() - recordingStartTimeRef.current;

        setRecordedChunks((prev) => [
          ...prev,
          {
            blob,
            timestamp: recordingStartTimeRef.current,
            duration,
          },
        ]);
      };

      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Failed to start recording");
    }
  }, [videoStream, audioStream]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  // Start speech recognition
  const startSpeechRecognition = useCallback(() => {
    if (!speechRecognitionRef.current) {
      setError("Speech recognition not initialized");
      return;
    }

    try {
      speechRecognitionRef.current.start();
      setIsSpeechListening(true);
      setSpeechResult(null);
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError("Failed to start speech recognition");
    }
  }, []);

  // Stop speech recognition
  const stopSpeechRecognition = useCallback(() => {
    if (speechRecognitionRef.current && isSpeechListening) {
      speechRecognitionRef.current.stop();
      setIsSpeechListening(false);
    }
  }, [isSpeechListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    videoStream,
    audioStream,
    isStreamActive,
    isRecording,
    recordedChunks,
    speechResult,
    isSpeechListening,
    startCapture,
    stopCapture,
    startRecording,
    stopRecording,
    startSpeechRecognition,
    stopSpeechRecognition,
    error,
  };
};

export default useMediaCapture;
