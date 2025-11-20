// components/interview/InterviewSetup.tsx
import React, { useRef, useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import BackButton from "./BackButton";

interface InterviewSetupProps {
  topic: string;
  difficulty: string;
  onStart: () => void;
  onBack: () => void;
  onCameraReady: (stream: MediaStream) => void;
  isStarting?: boolean;
}

const InterviewSetup: React.FC<InterviewSetupProps> = ({
  topic,
  difficulty,
  onStart,
  onBack,
  onCameraReady,
  isStarting = false,
}) => {
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<
    "initializing" | "ready" | "error"
  >("initializing");
  const [microphoneStatus, setMicrophoneStatus] = useState<
    "checking" | "ready" | "error"
  >("checking");
  const streamSentRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Initialize camera on mount
    const initializeCamera = async () => {
      try {
        setCameraStatus("initializing");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: "user",
            frameRate: { ideal: 30, max: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;

          // Wait for video to be playing
          const handlePlaying = () => {
            if (!mounted) return;

            // Check if we have audio tracks
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
              setMicrophoneStatus("ready");
            } else {
              setMicrophoneStatus("error");
            }

            setCameraStatus("ready");

            // Send stream to parent only once
            if (!streamSentRef.current) {
              onCameraReady(stream);
              streamSentRef.current = true;
            }
          };

          previewVideoRef.current.onplaying = handlePlaying;

          // Also try onloadedmetadata
          previewVideoRef.current.onloadedmetadata = async () => {
            try {
              await previewVideoRef.current!.play();
            } catch (error) {
              if (mounted) {
                setCameraStatus("error");
              }
            }
          };
        }
      } catch (error) {
        if (mounted) {
          setCameraStatus("error");
        }
      }
    };

    initializeCamera();

    // Cleanup
    return () => {
      mounted = false;
    };
  }, [onCameraReady]);

  const handleStartClick = async () => {
    if (cameraStatus === "ready") {
      // Ensure this is a direct user interaction for fullscreen API
      await onStart();
    }
  };

  const toTitleCase = (str: string) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="max-w-4xl mx-auto text-center py-8 px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Ready to Start Your Interview?
        </h2>
        <p className="text-gray-600 mb-2">
          Topic:{" "}
          <span className="font-semibold text-indigo-600">
            {toTitleCase(topic)}
          </span>
        </p>
        <p className="text-gray-600 mb-6">
          Difficulty:{" "}
          <span className="font-semibold capitalize">{difficulty}</span>
        </p>
      </div>

      {/* Camera Preview */}
      <div className="mb-8">
        <div className="relative mx-auto max-w-md rounded-xl overflow-hidden shadow-2xl border-4 border-indigo-200">
          <video
            ref={previewVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover bg-black"
          />

          {/* Status Overlay */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div
              className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 ${
                cameraStatus === "ready" && microphoneStatus === "ready"
                  ? "bg-green-500 text-white"
                  : cameraStatus === "error" || microphoneStatus === "error"
                  ? "bg-red-500 text-white"
                  : "bg-yellow-500 text-white"
              }`}
            >
              {cameraStatus === "ready" && microphoneStatus === "ready" && (
                <>
                  <span>✓</span>
                  <span>Ready to Start</span>
                </>
              )}
              {(cameraStatus === "initializing" ||
                microphoneStatus === "checking") && (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Initializing...</span>
                </>
              )}
              {(cameraStatus === "error" || microphoneStatus === "error") && (
                <>
                  <span>✗</span>
                  <span>Setup Error</span>
                </>
              )}
            </div>
          </div>

          {cameraStatus === "initializing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-sm">Setting up camera...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-lg text-gray-800 mb-4">
          ⚠️ Important Notes:
        </h3>
        <ul className="text-left space-y-2 text-gray-700">
          <li>✓ Camera and microphone are pre-initialized and ready</li>
          <li>✓ Video and audio will be recorded for evaluation</li>
          <li>
            ✓ Interview will enter fullscreen mode (locked during session)
          </li>
          <li>
            ✓ ESC key will be disabled - use "End Interview" button to exit
          </li>
          <li>✓ Face detection will monitor your presence throughout</li>
          <li>✓ Questions will start immediately after you click Start</li>
        </ul>
      </div>

      <button
        onClick={handleStartClick}
        disabled={
          cameraStatus !== "ready" || microphoneStatus !== "ready" || isStarting
        }
        className={`px-12 py-4 rounded-xl font-bold text-lg transform transition-all  items-center justify-center gap-3 ${
          cameraStatus === "ready" &&
          microphoneStatus === "ready" &&
          !isStarting
            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-2xl hover:-translate-y-1 cursor-pointer items-center justify-center"
            : "bg-gray-400 text-gray-200 cursor-not-allowed opacity-50 items-center justify-center"
        }`}
      >
        {isStarting ? (
          <>
            <CircularProgress size={20} color="inherit" />
            <span>Starting Interview...</span>
          </>
        ) : cameraStatus === "ready" && microphoneStatus === "ready" ? (
          "Start Interview Now 🎯"
        ) : cameraStatus === "error" ? (
          "Camera Error - Cannot Start"
        ) : microphoneStatus === "error" ? (
          "Microphone Error - Cannot Start"
        ) : cameraStatus !== "ready" ? (
          "Waiting for Camera..."
        ) : microphoneStatus !== "ready" ? (
          "Waiting for Microphone..."
        ) : (
          "Initializing..."
        )}
      </button>

      <div className="mt-6">
        <BackButton onClick={onBack} label="Go Back" />
      </div>
    </div>
  );
};

export default InterviewSetup;
