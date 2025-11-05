import React, { useEffect, useRef, useState } from "react";
import useTextToSpeech from "../services/textToSpeechService";

interface InterviewAvatarProps {
  currentQuestion?: string;
  isAsking?: boolean;
  onQuestionComplete?: () => void;
  className?: string;
  avatarStyle?: "female" | "male" | "neutral";
}

interface AvatarAnimation {
  speaking: boolean;
  blinking: boolean;
  lipSync: number; // 0-1 for mouth movement
}

const InterviewAvatar: React.FC<InterviewAvatarProps> = ({
  currentQuestion,
  isAsking = false,
  onQuestionComplete,
  className = "",
  avatarStyle = "female",
}) => {
  const [animation, setAnimation] = useState<AvatarAnimation>({
    speaking: false,
    blinking: false,
    lipSync: 0,
  });

  const { speak, stop, isSpeaking, setVoice, availableVoices } =
    useTextToSpeech();
  const animationFrameRef = useRef<number | null>(null);
  const lastSpeakTimeRef = useRef<number>(0);

  // Avatar configurations for different styles
  const avatarConfigs = {
    female: {
      backgroundColor: "#FEF7F0",
      skinColor: "#F4C2A1",
      hairColor: "#8B4513",
      eyeColor: "#4A90E2",
      lipColor: "#E91E63",
      voicePreference: ["female", "woman", "samantha", "karen", "moira"],
    },
    male: {
      backgroundColor: "#F0F4FE",
      skinColor: "#D4A574",
      hairColor: "#2C1810",
      eyeColor: "#2E7D32",
      lipColor: "#795548",
      voicePreference: ["male", "man", "alex", "daniel", "fred"],
    },
    neutral: {
      backgroundColor: "#F8F9FA",
      skinColor: "#E0B59C",
      hairColor: "#5D4037",
      eyeColor: "#37474F",
      lipColor: "#8D6E63",
      voicePreference: ["female", "male"],
    },
  };

  const config = avatarConfigs[avatarStyle];

  // Set appropriate voice based on avatar style
  useEffect(() => {
    if (availableVoices.length > 0) {
      const preferredVoice =
        availableVoices.find((voice) =>
          config.voicePreference.some((pref) =>
            voice.name.toLowerCase().includes(pref.toLowerCase())
          )
        ) || availableVoices.find((voice) => voice.lang.startsWith("en"));

      if (preferredVoice) {
        setVoice(preferredVoice);
      }
    }
  }, [availableVoices, setVoice, config.voicePreference]);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setAnimation((prev) => ({ ...prev, blinking: true }));
      setTimeout(() => {
        setAnimation((prev) => ({ ...prev, blinking: false }));
      }, 150);
    }, 2000 + Math.random() * 3000); // Random blinking between 2-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  // Lip sync animation during speech
  useEffect(() => {
    if (isSpeaking) {
      const startTime = Date.now();

      const animateLipSync = () => {
        const elapsed = Date.now() - startTime;
        const intensity =
          0.3 + 0.7 * Math.sin(elapsed * 0.01) * Math.sin(elapsed * 0.003);

        setAnimation((prev) => ({
          ...prev,
          speaking: true,
          lipSync: Math.max(0, Math.min(1, intensity)),
        }));

        if (isSpeaking) {
          animationFrameRef.current = requestAnimationFrame(animateLipSync);
        }
      };

      animateLipSync();
    } else {
      setAnimation((prev) => ({
        ...prev,
        speaking: false,
        lipSync: 0,
      }));

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking]);

  // Speak current question
  useEffect(() => {
    if (isAsking && currentQuestion && currentQuestion.trim()) {
      const currentTime = Date.now();

      // Prevent rapid re-speaking of the same question
      if (currentTime - lastSpeakTimeRef.current < 1000) {
        return;
      }

      lastSpeakTimeRef.current = currentTime;

      // Add a slight delay before speaking
      setTimeout(() => {
        speak(currentQuestion, {
          rate: 0.9,
          pitch: avatarStyle === "female" ? 1.1 : 0.9,
          volume: 0.8,
        });
      }, 500);
    }
  }, [isAsking, currentQuestion, speak, avatarStyle]);

  // Handle speech completion
  useEffect(() => {
    if (!isSpeaking && animation.speaking) {
      // Speech just finished
      setTimeout(() => {
        onQuestionComplete?.();
      }, 500);
    }
  }, [isSpeaking, animation.speaking, onQuestionComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stop]);

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 ${className}`}
    >
      {/* Avatar Container */}
      <div
        className="relative w-48 h-48 rounded-full shadow-2xl transition-all duration-300 transform"
        style={{
          backgroundColor: config.backgroundColor,
          transform: animation.speaking ? "scale(1.02)" : "scale(1)",
          boxShadow: animation.speaking
            ? "0 20px 40px rgba(0,0,0,0.3), 0 0 0 4px rgba(74, 144, 226, 0.3)"
            : "0 15px 30px rgba(0,0,0,0.2)",
        }}
      >
        {/* Face */}
        <div
          className="absolute inset-4 rounded-full"
          style={{ backgroundColor: config.skinColor }}
        >
          {/* Hair */}
          <div
            className="absolute -top-2 left-4 right-4 h-16 rounded-full"
            style={{ backgroundColor: config.hairColor }}
          />

          {/* Eyes */}
          <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
            {/* Left Eye */}
            <div className="relative">
              <div
                className={`w-6 h-6 rounded-full transition-all duration-150 ${
                  animation.blinking ? "scale-y-0" : "scale-y-100"
                }`}
                style={{ backgroundColor: config.eyeColor }}
              >
                <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full">
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
            </div>

            {/* Right Eye */}
            <div className="relative">
              <div
                className={`w-6 h-6 rounded-full transition-all duration-150 ${
                  animation.blinking ? "scale-y-0" : "scale-y-100"
                }`}
                style={{ backgroundColor: config.eyeColor }}
              >
                <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full">
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Nose */}
          <div
            className="absolute top-12 left-1/2 transform -translate-x-1/2 w-2 h-3 rounded-full opacity-30"
            style={{
              backgroundColor: config.skinColor,
              filter: "brightness(0.8)",
            }}
          />

          {/* Mouth */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
            <div
              className="relative transition-all duration-100"
              style={{
                width: `${20 + animation.lipSync * 15}px`,
                height: `${8 + animation.lipSync * 8}px`,
                backgroundColor: config.lipColor,
                borderRadius: animation.lipSync > 0.3 ? "50%" : "50px",
                transform: `scaleY(${0.8 + animation.lipSync * 0.6})`,
              }}
            >
              {/* Teeth (visible when speaking) */}
              {animation.lipSync > 0.4 && (
                <div
                  className="absolute top-0.5 left-1/2 transform -translate-x-1/2 bg-white"
                  style={{
                    width: `${animation.lipSync * 12}px`,
                    height: "2px",
                    borderRadius: "1px",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Speaking indicator */}
        {animation.speaking && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-700">
          {animation.speaking
            ? "Speaking..."
            : isAsking
            ? "Ready to ask"
            : "Listening"}
        </p>
        {currentQuestion && (
          <p className="mt-2 text-xs text-gray-500 max-w-md line-clamp-2">
            {currentQuestion}
          </p>
        )}
      </div>

      {/* Audio Visualization */}
      {animation.speaking && (
        <div className="mt-4 flex space-x-1 items-end h-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-t from-blue-500 to-purple-500 w-1 rounded-full transition-all duration-150"
              style={{
                height: `${
                  10 + Math.sin(Date.now() * 0.01 + i) * animation.lipSync * 20
                }px`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewAvatar;
