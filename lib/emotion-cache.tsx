"use client";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

// Ensures Emotion styles are injected in correct order
// and prevents hydration mismatches in Next.js App Router
export function EmotionCacheProvider({ children }: { children: ReactNode }) {
  const [{ cache, flushNames }] = useState(() => {
    const emotionCache = createCache({
      key: "mui",
      prepend: true,
    });

    // Required for MUI v5 + Next.js App Router
    emotionCache.compat = true;

    // useServerInsertedHTML runs once per React stream flush. Emitting the
    // whole `cache.inserted` map there re-serializes every rule already sent,
    // once per flush — on /login that was 17 identical 43KB <style> blocks,
    // 92% of the document. So track only the names inserted since the last
    // flush (the same wrap-insert pattern @mui/material-nextjs uses) and let
    // the flush hand them over exactly once.
    const prevInsert = emotionCache.insert;
    let inserted: string[] = [];
    emotionCache.insert = (...args: Parameters<typeof prevInsert>) => {
      const serialized = args[1];
      if (emotionCache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };

    const flush = () => {
      const prev = inserted;
      inserted = [];
      return prev;
    };

    return { cache: emotionCache, flushNames: flush };
  });

  useServerInsertedHTML(() => {
    const names = flushNames();
    if (names.length === 0) return null;

    let styles = "";
    let dataEmotionAttribute = cache.key;

    names.forEach((name) => {
      const style = cache.inserted[name];
      if (typeof style === "string") {
        styles += style;
        dataEmotionAttribute += ` ${name}`;
      }
    });

    if (styles.length === 0) return null;

    return (
      <style
        data-emotion={dataEmotionAttribute}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
