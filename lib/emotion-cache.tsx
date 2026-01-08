"use client";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

// Ensures Emotion styles are injected in correct order
// and prevents hydration mismatches in Next.js App Router
export function EmotionCacheProvider({ children }: { children: ReactNode }) {
  const [cache] = useState(() => {
    const emotionCache = createCache({
      key: "mui",
      prepend: true,
    });

    // Required for MUI v5 + Next.js App Router
    emotionCache.compat = true;

    return emotionCache;
  });

  useServerInsertedHTML(() => {
    const inserted = cache.inserted as Record<string, string>;
    const names = Object.keys(inserted);

    if (names.length === 0) return null;

    let styles = "";
    let dataEmotionAttribute = cache.key;

    names.forEach((name) => {
      const style = inserted[name];
      if (typeof style === "string") {
        styles += style;
        dataEmotionAttribute += ` ${name}`;
      }
    });

    return (
      <style
        data-emotion={dataEmotionAttribute}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
