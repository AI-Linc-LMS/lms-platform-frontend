"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
}

interface StickyTabNavProps {
  tabs: Tab[];
  onTabSelect?: (id: string) => void;
}

/**
 * Section-aware sticky tab bar. Tabs scroll to their section on click; the
 * active tab tracks whichever section is closest to the top via
 * IntersectionObserver. Underline animates between tabs with a Framer
 * shared `layoutId`.
 */
export function StickyTabNav({ tabs, onTabSelect }: StickyTabNavProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const userClickRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (userClickRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];
        if (visible) {
          const id = visible.target.getAttribute("data-sc-section");
          if (id) setActive(id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.5, 1] }
    );
    tabs.forEach((t) => {
      const el = document.querySelector(`[data-sc-section="${t.id}"]`);
      if (el) observer.observe(el);
    });
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [tabs]);

  const handleClick = (id: string) => {
    userClickRef.current = true;
    setActive(id);
    onTabSelect?.(id);
    const target = document.querySelector(`[data-sc-section="${id}"]`);
    if (target) {
      const top = (target as HTMLElement).getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
    window.setTimeout(() => {
      userClickRef.current = false;
    }, 800);
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 8,
        zIndex: 10,
        margin: "16px 0",
      }}
    >
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: 4,
          padding: 6,
          borderRadius: 999,
          background: "var(--sc-bg-glass)",
          border: "1px solid var(--sc-border-subtle)",
          boxShadow: "var(--sc-shadow-soft)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => handleClick(t.id)}
              style={{
                position: "relative",
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background: "transparent",
                color: selected ? "var(--sc-text-inverted)" : "var(--sc-text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 200ms ease",
              }}
            >
              {selected ? (
                <motion.span
                  layoutId="sc-tab-pill"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: "var(--sc-accent-primary)",
                    zIndex: 0,
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              ) : null}
              <span style={{ position: "relative", zIndex: 1 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
