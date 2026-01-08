"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminModeContextType {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (value: boolean) => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Load admin mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_mode");
      if (saved === "true") {
        setIsAdminMode(true);
      }
    }
  }, []);

  const toggleAdminMode = () => {
    setIsAdminMode((prev) => {
      const newValue = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_mode", String(newValue));
      }
      return newValue;
    });
  };

  const setAdminMode = (value: boolean) => {
    setIsAdminMode(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_mode", String(value));
    }
  };

  return (
    <AdminModeContext.Provider value={{ isAdminMode, toggleAdminMode, setAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error("useAdminMode must be used within an AdminModeProvider");
  }
  return context;
}


