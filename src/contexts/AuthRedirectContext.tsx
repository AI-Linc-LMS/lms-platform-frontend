import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthRedirectContextType {
  intendedPath: string | null;
  setIntendedPath: (path: string | null) => void;
  clearIntendedPath: () => void;
}

const AuthRedirectContext = createContext<AuthRedirectContextType | undefined>(
  undefined
);

export const useAuthRedirect = () => {
  const context = useContext(AuthRedirectContext);
  if (context === undefined) {
    throw new Error(
      "useAuthRedirect must be used within an AuthRedirectProvider"
    );
  }
  return context;
};

interface AuthRedirectProviderProps {
  children: ReactNode;
}

export const AuthRedirectProvider: React.FC<AuthRedirectProviderProps> = ({
  children,
}) => {
  const [intendedPath, setIntendedPathState] = useState<string | null>(null);

  const setIntendedPath = (path: string | null) => {
    console.log("[AuthRedirectContext] Setting intended path:", path);
    setIntendedPathState(path);
  };

  const clearIntendedPath = () => {
    console.log("[AuthRedirectContext] Clearing intended path");
    setIntendedPathState(null);
  };

  return (
    <AuthRedirectContext.Provider
      value={{ intendedPath, setIntendedPath, clearIntendedPath }}
    >
      {children}
    </AuthRedirectContext.Provider>
  );
};
