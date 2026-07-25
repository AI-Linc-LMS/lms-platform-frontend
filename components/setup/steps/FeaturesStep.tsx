"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { motion } from "framer-motion";
import apiClient from "@/lib/services/api";
import { WizardData } from "@/lib/setup/wizardData";
import {
  adminEntries,
  learnerEntries,
  learnerKeyForAdmin,
  lookupFeatureByKey,
  pairedKeys,
  type FeatureIconName,
  type WizardFeatureEntry,
} from "@/lib/setup/featureCatalogue";

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: i * 0.04,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const sectionVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

interface ApiFeature {
  id: number;
  name: string;
}

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

interface SectionConfig {
  key: "learner" | "admin";
  label: string;
  kicker: string;
  description: string;
  iconBg: string;
  // Primary brand colour for the section - used for accents, borders, glow.
  accent: string;
  // Soft companion colour for the card backdrop gradient.
  accentSoft: string;
  // Vivid second stop for the icon tile gradient.
  accentDeep: string;
  icon: ReactElement;
}

const SECTIONS: SectionConfig[] = [
  {
    key: "learner",
    label: "Learner modules",
    kicker: "What learners see",
    description:
      "These show up in the student app sidebar. Pick the ones your org will actually use - admin tools auto-enable to match.",
    iconBg: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
    accent: "#0ea5e9",
    accentSoft: "#bae6fd",
    accentDeep: "#0369a1",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    key: "admin",
    label: "Admin tools",
    kicker: "What your team manages",
    description:
      "These show up in the admin portal for tenant admins, instructors, and course managers. Some auto-toggle with a learner module; others are standalone.",
    iconBg: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
    accent: "#d97706",
    accentSoft: "#fde68a",
    accentDeep: "#92400e",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 16.9l.9-5.4-3.9-3.8 5.4-.8z" />
      </svg>
    ),
  },
];

// Catalogue entry + the backend AppFeatures.id we resolved it to.
interface ResolvedEntry extends WizardFeatureEntry {
  id: number;
}

export function FeaturesStep({ data, onChange }: Props) {
  const [apiFeatures, setApiFeatures] = useState<ApiFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const selected = useMemo(
    () => new Set<number>(data.features?.selected_feature_ids || []),
    [data.features?.selected_feature_ids]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<
          ApiFeature[] | { features: ApiFeature[] }
        >("/accounts/features/");
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.features || [];
        if (!cancelled) setApiFeatures(list);
      } catch {
        if (!cancelled) {
          setApiFeatures([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // API-side index of name → id. Drives the catalogue filter: a catalogue
  // entry only renders if the backend has the matching AppFeatures row.
  const apiIdByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of apiFeatures) m.set(f.name, f.id);
    return m;
  }, [apiFeatures]);

  // Catalogue entries that have a corresponding backend row, ready to render.
  const { resolvedLearner, resolvedAdmin } = useMemo(() => {
    const resolve = (entries: WizardFeatureEntry[]): ResolvedEntry[] => {
      const out: ResolvedEntry[] = [];
      for (const e of entries) {
        const id = apiIdByName.get(e.key);
        if (typeof id === "number") out.push({ ...e, id });
      }
      return out;
    };
    return {
      resolvedLearner: resolve(learnerEntries()),
      resolvedAdmin: resolve(adminEntries()),
    };
  }, [apiIdByName]);

  /**
   * Toggle a feature card AND every catalogue-paired key. Treats the
   * clicked card's new state as the source of truth - turning an ON card
   * OFF clears the whole pair; turning an OFF card ON enables them all.
   */
  const toggleEntry = (entry: ResolvedEntry) => {
    const willTurnOn = !selected.has(entry.id);
    const idsToToggle = pairedKeys(entry.key)
      .map((k) => apiIdByName.get(k))
      .filter((x): x is number => typeof x === "number");
    const next = new Set(selected);
    for (const id of idsToToggle) {
      if (willTurnOn) next.add(id);
      else next.delete(id);
    }
    onChange({
      features: {
        ...(data.features || {}),
        selected_feature_ids: Array.from(next),
      },
    });
  };

  const toggleSection = (entries: ResolvedEntry[]) => {
    const allOn = entries.every((e) => selected.has(e.id));
    const next = new Set(selected);
    for (const e of entries) {
      const ids = pairedKeys(e.key)
        .map((k) => apiIdByName.get(k))
        .filter((x): x is number => typeof x === "number");
      for (const id of ids) {
        if (allOn) next.delete(id);
        else next.add(id);
      }
    }
    onChange({
      features: {
        ...(data.features || {}),
        selected_feature_ids: Array.from(next),
      },
    });
  };

  const learnerOn = resolvedLearner.filter((e) => selected.has(e.id)).length;
  const adminOn = resolvedAdmin.filter((e) => selected.has(e.id)).length;
  const totalAvailable = resolvedLearner.length + resolvedAdmin.length;

  return (
    <div className="space-y-7">
      <p className="aw-text-dim text-[14px] leading-[1.65]">
        Pick the modules your LMS will ship with. Learner modules show up in
        the student app; admin tools live in the admin portal. You can change
        either set later from Settings.
      </p>

      {loading ? (
        <FeaturesLoading />
      ) : totalAvailable === 0 ? (
        <div
          className="rounded-[14px] p-4"
          style={{
            border: "1px solid rgba(217, 119, 6, 0.3)",
            background: "rgba(217, 119, 6, 0.06)",
          }}
        >
          <p className="aw-mono text-[10px] uppercase tracking-[0.3em] text-[#d97706]">
            Modules unavailable
          </p>
          <p className="aw-text-dim mt-2 text-[13px] leading-relaxed">
            {loadError
              ? "Couldn't load modules from the server. You can still launch and enable modules later from Settings."
              : "No modules are currently available for your account. Reach out to support and we'll get you set up."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <PairingBanner />

          {SECTIONS.map((section) => {
            const list =
              section.key === "learner" ? resolvedLearner : resolvedAdmin;
            if (list.length === 0) return null;
            const onCount =
              section.key === "learner" ? learnerOn : adminOn;
            const allOn = list.length > 0 && onCount === list.length;
            return (
              <motion.section
                key={section.key}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                aria-labelledby={`features-section-${section.key}`}
                className="relative overflow-hidden rounded-[18px] p-5 sm:p-6"
                style={{
                  border: `1px solid ${section.accent}24`,
                  background: `linear-gradient(135deg, ${section.accent}08 0%, transparent 40%), rgba(11, 18, 38, 0.02)`,
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-[3px]"
                  style={{ background: section.iconBg }}
                />

                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
                      style={{
                        background: section.iconBg,
                        boxShadow: `0 6px 18px -8px ${section.accent}`,
                      }}
                    >
                      {section.icon}
                    </span>
                    <div>
                      <p
                        className="aw-mono text-[10px] font-semibold uppercase tracking-[0.3em]"
                        style={{ color: section.accent }}
                      >
                        {section.kicker}
                      </p>
                      <h3
                        id={`features-section-${section.key}`}
                        className="aw-text mt-1 text-[16px] font-semibold"
                      >
                        {section.label}
                        <span className="aw-text-mute ml-2 text-[12px] font-normal">
                          {onCount} / {list.length} on
                        </span>
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSection(list)}
                    className="aw-mono shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors"
                    style={{
                      borderColor: `${section.accent}66`,
                      color: section.accent,
                      background: `${section.accent}0d`,
                    }}
                  >
                    {allOn ? "Turn all off" : "Turn all on"}
                  </button>
                </div>

                <p className="aw-text-dim mb-5 text-[13px] leading-relaxed">
                  {section.description}
                </p>

                <div className="grid gap-4 lg:grid-cols-2">
                  {list.map((entry, i) => (
                    <FeatureCard
                      key={entry.id}
                      entry={entry}
                      index={i}
                      isOn={selected.has(entry.id)}
                      section={section}
                      onToggle={() => toggleEntry(entry)}
                    />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      {!loading && totalAvailable > 0 && (
        <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
          {learnerOn + adminOn} of {totalAvailable} modules on
          <span className="ml-2 opacity-60">
            · {learnerOn} learner · {adminOn} admin
          </span>
        </p>
      )}
    </div>
  );
}

// ──────────────────────── Card ────────────────────────

interface FeatureCardProps {
  entry: ResolvedEntry;
  index: number;
  isOn: boolean;
  section: SectionConfig;
  onToggle: () => void;
}

/**
 * Big, opinionated feature card. Four visual layers, back to front:
 *   1. Base surface - light card colour for the unselected state, tinted
 *      gradient when selected.
 *   2. Backdrop watermark - the feature's own icon rendered huge in the
 *      bottom-right at low opacity, giving each card a unique silhouette
 *      without using stock photography.
 *   3. Diagonal gradient sheen - a thin highlight bar across the top that
 *      brightens on hover, so the card feels lit rather than flat.
 *   4. Foreground - icon tile (top-left), title, tagline, pair caption,
 *      and a status badge top-right that flips between an outline circle
 *      (off) and a vivid filled checkmark (on).
 */
function FeatureCard({
  entry,
  index,
  isOn,
  section,
  onToggle,
}: FeatureCardProps) {
  const { accent, accentSoft, accentDeep, iconBg } = section;

  // One-direction pair caption - fixes the old "Assessment, Assessment" bug.
  let pairCaption: string | null = null;
  if (entry.side === "learner" && entry.pairsWithAdmin?.length) {
    const adminLabels = entry.pairsWithAdmin
      .map((k) => lookupFeatureByKey(k)?.label)
      .filter((x): x is string => Boolean(x));
    if (adminLabels.length) {
      const more = adminLabels.length > 2 ? ` +${adminLabels.length - 2}` : "";
      const shown = adminLabels.slice(0, 2).join(" · ");
      pairCaption = `Auto-enables ${shown}${more}`;
    }
  } else if (entry.side === "admin") {
    const learnerKey = learnerKeyForAdmin(entry.key);
    if (learnerKey) {
      const learnerLabel = lookupFeatureByKey(learnerKey)?.label;
      if (learnerLabel) {
        pairCaption = `Pairs with ${learnerLabel}`;
      }
    }
  }

  return (
    <motion.button
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      type="button"
      onClick={onToggle}
      aria-pressed={isOn}
      className="group relative isolate flex min-h-[180px] flex-col overflow-hidden rounded-[20px] p-6 text-left transition-shadow"
      style={
        isOn
          ? {
              border: `1.5px solid ${accent}`,
              background: `linear-gradient(135deg, ${accent}12 0%, ${accentSoft}28 60%, #ffffff 100%)`,
              boxShadow: `0 18px 40px -18px ${accent}99, 0 2px 6px -2px ${accent}33, inset 0 1px 0 0 #ffffffcc`,
            }
          : {
              border: "1px solid rgb(var(--aw-line) / var(--aw-line-2-alpha))",
              background:
                "linear-gradient(135deg, #ffffff 0%, rgb(var(--aw-bg-2)) 100%)",
              boxShadow:
                "0 1px 2px -1px rgba(11, 18, 38, 0.04), 0 8px 22px -14px rgba(11, 18, 38, 0.08)",
            }
      }
    >
      {/* Backdrop: huge feature glyph in the bottom-right, watermark-level
          opacity. Pointer-events disabled so it never intercepts clicks. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-6 z-0"
        style={{
          color: isOn ? accent : "rgb(var(--aw-fg))",
          opacity: isOn ? 0.16 : 0.05,
          transform: "rotate(-8deg)",
          filter: isOn ? `drop-shadow(0 6px 18px ${accent}55)` : "none",
          transition: "opacity 0.25s, color 0.25s",
        }}
      >
        <BigFeatureGlyph name={entry.icon} />
      </span>

      {/* Hover sheen - diagonal highlight across the top edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1px] opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent}80 50%, transparent 100%)`,
        }}
      />

      {/* Foreground content */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px]"
          style={{
            background: isOn ? iconBg : "#ffffff",
            border: isOn ? "none" : `1px solid ${accent}24`,
            boxShadow: isOn
              ? `0 10px 26px -10px ${accentDeep}, inset 0 1px 0 0 #ffffff66`
              : `0 4px 12px -6px ${accent}33`,
            transition: "background 0.25s, box-shadow 0.25s",
          }}
        >
          <FeatureIcon
            name={entry.icon}
            color={isOn ? "#ffffff" : accent}
            size={24}
            strokeWidth={2}
          />
        </span>
        <StatusBadge isOn={isOn} accent={accent} accentDeep={accentDeep} />
      </div>

      <div className="relative z-10 mt-5 flex-1">
        <h4 className="aw-text text-[18px] font-bold leading-[1.2] tracking-tight">
          {entry.label}
        </h4>
        <p className="aw-text-dim mt-2 text-[13.5px] leading-[1.55]">
          {entry.tagline}
        </p>
      </div>

      {pairCaption ? (
        <div className="relative z-10 mt-5 flex items-center gap-2">
          <span
            className="aw-mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{
              color: isOn ? accentDeep : accent,
              background: isOn ? `${accent}1f` : `${accent}10`,
              border: `1px solid ${accent}33`,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            {pairCaption}
          </span>
        </div>
      ) : null}
    </motion.button>
  );
}

function StatusBadge({
  isOn,
  accent,
  accentDeep,
}: {
  isOn: boolean;
  accent: string;
  accentDeep: string;
}) {
  return (
    <span
      aria-hidden
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all"
      style={
        isOn
          ? {
              background: accent,
              border: `1.5px solid ${accentDeep}`,
              boxShadow: `0 6px 18px -6px ${accent}, inset 0 1px 0 0 #ffffff66`,
            }
          : {
              background: "transparent",
              border: "1.5px dashed rgb(var(--aw-line) / 0.32)",
            }
      }
    >
      {isOn ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "rgb(var(--aw-line) / 0.22)" }}
        />
      )}
    </span>
  );
}

/** Oversized version of the feature glyph used as the card backdrop. Same
 *  shapes as FeatureIcon, but rendered at 140px so it reads as a
 *  silhouette. */
function BigFeatureGlyph({ name }: { name: FeatureIconName }) {
  return (
    <FeatureIcon
      name={name}
      color="currentColor"
      size={150}
      strokeWidth={1.4}
    />
  );
}

// ──────────────────────── Icons ────────────────────────

function FeatureIcon({
  name,
  color,
  size = 18,
  strokeWidth = 1.8,
}: {
  name: FeatureIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "book":
      return (
        <svg {...common}>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5v-13z" />
          <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" />
        </svg>
      );
    case "checklist":
      return (
        <svg {...common}>
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "live":
      return (
        <svg {...common}>
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="M22 8l-6 4 6 4z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
        </svg>
      );
    case "interview":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 11h-6" />
          <path d="M19 8l3 3-3 3" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "robot":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M12 8V4" />
          <circle cx="8.5" cy="14" r="1.5" />
          <circle cx="15.5" cy="14" r="1.5" />
          <path d="M9 18h6" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "builder":
      return (
        <svg {...common}>
          <path d="M12 20l9-5-9-5-9 5 9 5z" />
          <path d="M3 10l9 5 9-5" />
          <path d="M3 15l9 5 9-5" />
        </svg>
      );
    case "scorecard":
      return (
        <svg {...common}>
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "presence":
      return (
        <svg {...common}>
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <polyline points="22 7 12 13 2 7" />
        </svg>
      );
    case "certificate":
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="6" />
          <path d="M9 14.5v6L12 19l3 1.5v-6" />
        </svg>
      );
    case "paint":
      return (
        <svg {...common}>
          <circle cx="13.5" cy="6.5" r=".5" />
          <circle cx="17.5" cy="10.5" r=".5" />
          <circle cx="8.5" cy="7.5" r=".5" />
          <circle cx="6.5" cy="12.5" r=".5" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      );
    case "approve":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4z" />
          <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" />
        </svg>
      );
    case "verify":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      );
  }
}

// ──────────────────────── Banner ────────────────────────

function PairingBanner() {
  return (
    <div
      className="rounded-[14px] p-3.5"
      style={{
        border: "1px solid rgba(14, 165, 233, 0.22)",
        background: "rgba(14, 165, 233, 0.04)",
      }}
    >
      <p className="aw-mono text-[10px] uppercase tracking-[0.28em] text-[#0284c7]">
        How pairing works
      </p>
      <p className="aw-text-dim mt-1.5 text-[12.5px] leading-relaxed">
        Pick a learner module - say{" "}
        <span className="aw-text font-semibold">Quizzes &amp; tests</span> -
        and we automatically switch on the admin tools that manage it (
        <span className="aw-text font-semibold">Assessment editor</span>,{" "}
        <span className="aw-text font-semibold">Scorecard</span>). Untick
        either side and both sides clear together. You can adjust everything
        later from Settings.
      </p>
    </div>
  );
}

// ──────────────────────── Loading ────────────────────────

/**
 * Branded loading panel for the features list - mirrors the AI LINC mark used
 * on the setup page's initial loader so the wizard feels consistent end-to-end.
 */
function FeaturesLoading() {
  return (
    <div
      className="aw-card aw-card-thin flex flex-col items-center gap-4 py-10"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(14,165,233,0.18), transparent 70%)",
            filter: "blur(12px)",
            animation: "aw-fl-pulse 2.2s ease-in-out infinite",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/ai-linc-mark-darkmode.svg"
          alt=""
          width={56}
          height={56}
          decoding="async"
          loading="eager"
          style={{
            width: 56,
            height: 56,
            display: "block",
            animation: "aw-fl-breathe 2.2s ease-in-out infinite",
          }}
        />
      </div>
      <p className="aw-mono aw-text-mute text-[11px] uppercase tracking-[0.28em]">
        Loading available modules…
      </p>
      <div className="h-[2px] w-40 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full"
          style={{
            width: "40%",
            background: "linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)",
            animation: "aw-marquee-scroll 1.6s ease-in-out infinite",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes aw-fl-breathe {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes aw-fl-pulse {
          0%, 100% { opacity: 0.45; transform: scale(0.95); }
          50% { opacity: 0.85; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
