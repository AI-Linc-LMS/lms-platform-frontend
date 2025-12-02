// components/interview/InterviewSetup.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
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

  // Transcription test state
  const [isTestingTranscription, setIsTestingTranscription] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [transcriptionTestComplete, setTranscriptionTestComplete] =
    useState(false);
  const recognitionRef = useRef<any>(null);
  const isManualStopRef = useRef(false);
  const transcribedTextRef = useRef("");

  // Enhanced error handling state
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 128) * 100));
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };

      updateLevel();
    } catch (error) {
      // Audio monitoring is optional
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initialize camera with enhanced error handling
    const initializeCamera = async () => {
      try {
        setCameraStatus("initializing");
        setMicrophoneStatus("checking");
        setErrorDetails("");

        // Check if media devices are supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "Your browser doesn't support camera/microphone access. Please use a modern browser like Chrome, Edge, or Firefox."
          );
        }

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

        // Check video tracks
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
          throw new Error(
            "No camera found. Please connect a camera and try again."
          );
        }

        // Check audio tracks
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          setMicrophoneStatus("error");
          setErrorDetails("No microphone found. Please connect a microphone.");
        } else {
          setMicrophoneStatus("ready");
          // Start audio level monitoring
          startAudioLevelMonitoring(stream);
        }

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;

          // Wait for video to be playing
          const handlePlaying = () => {
            if (!mounted) return;

            setCameraStatus("ready");

            // Send stream to parent only once
            if (!streamSentRef.current) {
              onCameraReady(stream);
              streamSentRef.current = true;
            }
          };

          previewVideoRef.current.onplaying = handlePlaying;

          // Handle video load errors
          previewVideoRef.current.onerror = () => {
            if (mounted) {
              setCameraStatus("error");
              setErrorDetails("Failed to load camera feed. Please try again.");
            }
          };

          // Try to play
          previewVideoRef.current.onloadedmetadata = async () => {
            try {
              await previewVideoRef.current!.play();
            } catch (error: any) {
              if (mounted) {
                setCameraStatus("error");
                setErrorDetails(`Failed to start camera: ${error.message}`);
              }
            }
          };
        }
      } catch (error: any) {
        if (mounted) {
          setCameraStatus("error");

          // Provide specific error messages
          let errorMessage = "Failed to access camera/microphone. ";

          if (
            error.name === "NotAllowedError" ||
            error.name === "PermissionDeniedError"
          ) {
            errorMessage =
              "Camera/microphone access denied. Please allow permissions in your browser settings and refresh the page.";
          } else if (
            error.name === "NotFoundError" ||
            error.name === "DevicesNotFoundError"
          ) {
            errorMessage =
              "No camera or microphone found. Please connect your devices and try again.";
          } else if (
            error.name === "NotReadableError" ||
            error.name === "TrackStartError"
          ) {
            errorMessage =
              "Camera/microphone is already in use by another application. Please close other apps and try again.";
          } else if (error.name === "OverconstrainedError") {
            errorMessage =
              "Camera/microphone doesn't meet the required specifications. Please try with a different device.";
          } else if (error.message) {
            errorMessage += error.message;
          }

          setErrorDetails(errorMessage);
        }
      }
    };

    initializeCamera();

    // Cleanup
    return () => {
      mounted = false;

      // Stop audio monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onCameraReady, startAudioLevelMonitoring]);

  // Keep transcribedTextRef in sync
  useEffect(() => {
    transcribedTextRef.current = transcribedText;
  }, [transcribedText]);

  // Initialize Speech Recognition (only once)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening continuously
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          }
        }

        if (finalTranscript) {
          setTranscribedText((prev) => {
            const updated = prev + finalTranscript;
            transcribedTextRef.current = updated; // Keep ref in sync
            return updated;
          });
        }
      };

      recognition.onend = () => {
        // Reset manual stop flag if it was set
        if (isManualStopRef.current) {
          isManualStopRef.current = false;
          // UI updates already handled in handleTestTranscription
        } else {
          // Auto-restart if it stopped unexpectedly (e.g., silence detection)
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          } catch (e) {
            // Already running or other error - ignore
          }
        }
      };

      recognition.onerror = (event: any) => {
        // Only stop on critical errors
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          setIsTestingTranscription(false);
          isManualStopRef.current = false;
        }
        // For other errors like 'no-speech', 'audio-capture', let it restart automatically
      };

      recognitionRef.current = recognition;
    } catch (error) {
      // Silent fail
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Silent
        }
      }
    };
  }, []); // Only initialize once

  const expectedText =
    "Hello, this is a test of my microphone and speech recognition. I am preparing for my mock interview.";

  // Calculate similarity between transcribed and expected text
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Simple word matching
    const words1 = s1.split(/\s+/).filter((w) => w.length > 2);
    const words2 = s2.split(/\s+/).filter((w) => w.length > 2);

    let matches = 0;
    words2.forEach((word) => {
      if (words1.some((w) => w.includes(word) || word.includes(w))) {
        matches++;
      }
    });

    return words2.length > 0 ? (matches / words2.length) * 100 : 0;
  };

  const handleTestTranscription = (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    e?.preventDefault();
    e?.stopPropagation();

    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome or Edge."
      );
      return;
    }

    if (isTestingTranscription) {
      // User clicked Stop Recording - set manual stop flag
      isManualStopRef.current = true;

      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Silent
      }

      // Immediately update UI and mark test as complete
      setIsTestingTranscription(false);

      // Force enable the button after stopping recording
      // We'll check for text in multiple ways to be thorough

      // First, check immediately
      const currentRefText = transcribedTextRef.current;
      const currentStateText = transcribedText;

      if (
        currentRefText.trim().length > 0 ||
        currentStateText.trim().length > 0
      ) {
        // Have text, enable immediately
        setTranscriptionTestComplete(true);
      }

      // Also set a timeout to catch any late-arriving transcriptions
      // and enable button regardless (user attempted the test)
      setTimeout(() => {
        // Always enable after user stops recording - they've completed the test
        setTranscriptionTestComplete(true);
      }, 300);
    } else {
      // Start recording
      setTranscribedText("");
      transcribedTextRef.current = "";
      setTranscriptionTestComplete(false);
      setIsTestingTranscription(true);
      isManualStopRef.current = false; // Reset manual stop flag

      try {
        recognitionRef.current.start();
      } catch (e) {
        setIsTestingTranscription(false);
      }
    }
  };

  const handleRetry = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    e?.preventDefault();
    e?.stopPropagation();

    setIsRetrying(true);
    setCameraStatus("initializing");
    setMicrophoneStatus("checking");
    setErrorDetails("");

    // Force page reload to reinitialize media devices
    window.location.reload();
  };

  const handleStartClick = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    e?.preventDefault();
    e?.stopPropagation();

    if (cameraStatus === "ready" && transcriptionTestComplete) {
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

        {/* Audio Level Indicator */}
        {microphoneStatus === "ready" && (
          <div className="mt-4 bg-white rounded-lg p-4 border-2 border-green-300">
            <div className="flex items-center space-x-3">
              <svg
                className="w-5 h-5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Microphone Level
                </p>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(audioLevel)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Speak to test your microphone
            </p>
          </div>
        )}

        {/* Error Details */}
        {errorDetails && (
          <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Setup Error
                </p>
                <p className="text-sm text-red-700">{errorDetails}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isRetrying ? "Retrying..." : "Retry Setup"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transcription Test Section */}
      {cameraStatus === "ready" && microphoneStatus === "ready" && (
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  Test Your Microphone
                </h3>
                <p className="text-sm text-gray-600">
                  Try speech-to-text before starting
                </p>
              </div>
            </div>
            {transcriptionTestComplete && (
              <div className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-full">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold">Tested</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-semibold">📖 Read this text aloud:</span>
            </p>
            <p className="text-base font-medium text-gray-800 italic border-l-4 border-blue-500 pl-4 bg-blue-50 py-3 px-4 rounded">
              "{expectedText}"
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestTranscription}
            disabled={!recognitionRef.current}
            className={`w-full py-3 rounded-lg font-semibold text-base transition-all flex items-center justify-center space-x-2 ${
              isTestingTranscription
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            } ${
              !recognitionRef.current ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isTestingTranscription ? (
              <>
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Start Test Recording</span>
              </>
            )}
          </button>

          {transcribedText && (
            <div className="mt-4 bg-white rounded-lg p-4 border-2 border-green-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-gray-700">
                    What We Heard:
                  </p>
                </div>
                {(() => {
                  const similarity = calculateSimilarity(
                    transcribedText,
                    expectedText
                  );
                  return (
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        similarity >= 70
                          ? "bg-green-100 text-green-700"
                          : similarity >= 50
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {Math.round(similarity)}% Match
                    </div>
                  );
                })()}
              </div>
              <div className="bg-green-50 rounded p-3 mb-3 border border-green-200">
                <p className="text-base text-gray-800 italic">
                  "{transcribedText}"
                </p>
              </div>
              {transcriptionTestComplete &&
                (() => {
                  const similarity = calculateSimilarity(
                    transcribedText,
                    expectedText
                  );
                  if (similarity >= 70) {
                    return (
                      <div className="flex items-start space-x-2 bg-green-100 border border-green-300 rounded-lg p-3">
                        <svg
                          className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="text-sm text-green-800 font-semibold">
                            🎉 Excellent! Perfect match!
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            Your microphone and speech recognition are working
                            perfectly. You're ready to start the interview!
                          </p>
                        </div>
                      </div>
                    );
                  } else if (similarity >= 50) {
                    return (
                      <div className="flex items-start space-x-2 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <svg
                          className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="text-sm text-yellow-800 font-semibold">
                            ✓ Good! Your microphone is working!
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            We can hear you clearly. You're ready to start the
                            interview!
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-start space-x-2 bg-orange-100 border border-orange-300 rounded-lg p-3">
                        <svg
                          className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="text-sm text-orange-800 font-semibold">
                            Microphone detected, but try speaking more clearly
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            Speak a bit louder and clearer. You can try again or
                            proceed if you're satisfied.
                          </p>
                        </div>
                      </div>
                    );
                  }
                })()}
            </div>
          )}
        </div>
      )}

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
        type="button"
        onClick={handleStartClick}
        disabled={
          cameraStatus !== "ready" ||
          microphoneStatus !== "ready" ||
          isStarting ||
          !transcriptionTestComplete
        }
        className={`px-12 py-4 rounded-xl font-bold text-lg transform transition-all  items-center justify-center gap-3 ${
          cameraStatus === "ready" &&
          microphoneStatus === "ready" &&
          !isStarting &&
          transcriptionTestComplete
            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-2xl hover:-translate-y-1 cursor-pointer items-center justify-center"
            : "bg-gray-400 text-gray-200 cursor-not-allowed opacity-50 items-center justify-center"
        }`}
      >
        {isStarting ? (
          <>
            <CircularProgress size={20} color="inherit" />
            <span>Starting Interview...</span>
          </>
        ) : !transcriptionTestComplete ? (
          "Complete Microphone Test to Start"
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

      {/* Reminder to test microphone */}
      {cameraStatus === "ready" &&
        microphoneStatus === "ready" &&
        !transcriptionTestComplete && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-semibold">
                Please complete the microphone test above before starting the
                interview
              </p>
            </div>
          </div>
        )}

      {/* Success message when test is complete */}
      {transcriptionTestComplete && (
        <div className="mt-4 bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-green-800">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-bold">
              ✓ Microphone test completed! You can now start the interview.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <BackButton onClick={onBack} label="Go Back" />
      </div>
    </div>
  );
};

export default InterviewSetup;
