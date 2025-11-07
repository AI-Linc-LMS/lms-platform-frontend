import { useContext } from "react";
import { ProctoringContext } from "./ProctoringProvider";

// Simple hook to access proctoring context
export const useProctoring = () => {
  const ctx = useContext(ProctoringContext);
  if (!ctx) throw new Error("useProctoring must be used within ProctoringProvider");
  return ctx;
};

