import React from "react";

interface FaceDetectionDebugProps {
  faceCount: number;
  isValidFrame: boolean;
  currentWarning: string | null;
  isDetecting: boolean;
}

const FaceDetectionDebug: React.FC<FaceDetectionDebugProps> = ({
  faceCount,
  isValidFrame,
  currentWarning,
  isDetecting,
}) => {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2 text-green-400">Face Detection Debug:</div>
      <div>Detecting: {isDetecting ? "✓ YES" : "✗ NO"}</div>
      <div>
        Face Count:{" "}
        <span
          className={
            faceCount === 1
              ? "text-green-400"
              : faceCount > 1
              ? "text-yellow-400"
              : "text-red-400"
          }
        >
          {faceCount}
        </span>
      </div>
      <div>Valid Frame: {isValidFrame ? "✓" : "✗"}</div>
      <div>
        Warning:{" "}
        <span className={currentWarning ? "text-red-400" : "text-green-400"}>
          {currentWarning || "None"}
        </span>
      </div>
    </div>
  );
};

export default FaceDetectionDebug;
