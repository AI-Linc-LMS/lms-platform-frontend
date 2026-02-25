"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isRtl } from "@/lib/i18n";

export function DirectionSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lng = i18n.language || "en";
    const dir = isRtl(lng) ? "rtl" : "ltr";
    const lang = lng.split("-")[0];
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
    }
  }, [i18n.language]);

  return null;
}
