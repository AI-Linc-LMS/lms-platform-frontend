"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { motion } from "framer-motion";
import apiClient from "@/lib/services/api";
import { WizardData } from "@/lib/setup/wizardData";

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

interface Feature {
  id: number;
  name: string;
}

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

/**
 * Per-feature short descriptions. Keyed by exact name from the backend.
 * Falls back gracefully — features without a description still render, they
 * just don't show the helper line.
 */
const FEATURE_DESCRIPTIONS: Record<string, string> = {
  // Learner-facing
  LMS: "Core learning management — courses, modules, lessons.",
  Assessment: "Quizzes, tests, and assignments.",
  "Live Class": "Real-time virtual classes with Zoom integration.",
  "Community Forum": "Learner-to-learner discussion threads.",
  "Mock Interview": "AI-driven mock interviews for prep.",
  Proctoring: "Browser-based proctoring for high-stakes exams.",
  "AI Tutor": "Per-lesson AI tutoring chat for learners.",
  // Admin-facing (matches backend sidebar feature keys)
  admin_dashboard: "Org-wide KPIs, recent activity, and quick actions.",
  admin_manage_students: "Add, edit, and segment learner accounts.",
  admin_course_builder: "Author courses, modules, and lessons.",
  admin_assessment: "Build and manage quizzes and exams.",
  admin_mock_interview: "Configure AI mock-interview prompts and rubrics.",
  admin_scorecard: "Performance dashboards across cohorts.",
  admin_jobs_v2: "Curated job board for your learners.",
  admin_live_sessions: "Schedule and manage live classes.",
  admin_attendance: "Mark and review attendance records.",
  admin_notifications: "Broadcast announcements to learners.",
  admin_emails: "Manage transactional and marketing email templates.",
  admin_certificates: "Issue and manage completion certificates.",
  admin_branding: "Theme colours, logos, and white-label settings.",
  admin_pending_instructors: "Approve or reject instructor sign-up requests.",
  admin_ai_course_builder: "Generate course outlines with AI assistance.",
  admin_verify_content: "Review user-submitted content before publish.",
};

/**
 * Convention: AppFeatures whose name starts with "admin_" (case-insensitive)
 * are admin-portal modules. Everything else is learner-facing.
 */
function isAdminFeature(name: string): boolean {
  return /^admin[_\s-]/i.test(name);
}

/**
 * Pretty-print admin feature keys for display ("admin_manage_students" → "Manage Students").
 */
function formatAdminName(name: string): string {
  return name
    .replace(/^admin[_\s-]/i, "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Map a learner-facing feature → the admin-portal modules that exist to
 * MANAGE it. Toggling either side of a pair toggles all of its counterparts
 * — you can't have admins managing assessments when learners can't take
 * any, and vice versa. Keys are exact `name` strings from the backend's
 * AppFeatures table.
 *
 * Admin features that aren't anyone's counterpart (admin_branding,
 * admin_pending_instructors, admin_verify_content, etc.) are NOT in this
 * map — those toggle independently because they don't presume a paired
 * learner module.
 */
const FEATURE_PAIRS: Record<string, string[]> = {
  LMS: ["admin_course_builder", "admin_manage_students", "admin_dashboard"],
  Assessment: ["admin_assessment", "admin_scorecard"],
  "Live Class": ["admin_live_sessions", "admin_attendance"],
  "Mock Interview": ["admin_mock_interview"],
  "AI Tutor": ["admin_ai_course_builder"],
  // Community Forum, Proctoring: intentionally no admin counterparts.
};

/**
 * For a given feature (by name), return the full list of names that should
 * toggle together. Works in both directions — pass either the learner name
 * or any of its admin counterparts.
 */
function pairedFeatureNames(name: string): string[] {
  const direct = FEATURE_PAIRS[name];
  if (direct) return [name, ...direct];
  for (const [learner, admins] of Object.entries(FEATURE_PAIRS)) {
    if (admins.includes(name)) return [learner, ...admins];
  }
  return [name];
}

interface SectionConfig {
  key: "learner" | "admin";
  label: string;
  kicker: string;
  description: string;
  iconBg: string;
  accent: string;
  // Was `JSX.Element` originally — TS 5 / React 19 dropped the global JSX
  // namespace, so this needs a concrete React type. ReactElement is the
  // strict form (single element), which is exactly what the SVG icons are.
  icon: ReactElement;
}

const SECTIONS: SectionConfig[] = [
  {
    key: "learner",
    label: "Learner features",
    kicker: "What learners see",
    description:
      "Modules that appear in the learner sidebar. Toggle off anything your org doesn't need — you can re-enable later in Settings.",
    iconBg: "linear-gradient(135deg, #00e0ff 0%, #2356d6 100%)",
    accent: "#00e0ff",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#05070f"
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
    label: "Admin features",
    kicker: "Admin portal modules",
    description:
      "Tools and dashboards that show up in the admin sidebar for tenant admins, instructors, and course managers.",
    iconBg: "linear-gradient(135deg, #ffd166 0%, #ef8354 100%)",
    accent: "#ffd166",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#05070f"
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

export function FeaturesStep({ data, onChange }: Props) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const selected = useMemo(
    () => new Set<number>(data.features?.selected_feature_ids || []),
    [data.features?.selected_feature_ids]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<Feature[] | { features: Feature[] }>(
          "/accounts/features/"
        );
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.features || [];
        if (!cancelled) setFeatures(list);
      } catch {
        if (!cancelled) setFeatures([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { learnerFeatures, adminFeatures } = useMemo(() => {
    const learner: Feature[] = [];
    const admin: Feature[] = [];
    for (const f of features) {
      (isAdminFeature(f.name) ? admin : learner).push(f);
    }
    learner.sort((a, b) => a.name.localeCompare(b.name));
    admin.sort((a, b) => formatAdminName(a.name).localeCompare(formatAdminName(b.name)));
    return { learnerFeatures: learner, adminFeatures: admin };
  }, [features]);

  /**
   * Lookup table: feature name → feature object (for resolving paired names
   * to their ids when toggling cascades fire). Lowercased keys so the
   * comparison is case-insensitive against pair-map entries.
   */
  const featuresByName = useMemo(() => {
    const m = new Map<string, Feature>();
    for (const f of features) m.set(f.name.toLowerCase(), f);
    return m;
  }, [features]);

  /**
   * Toggle a single feature AND every feature it's paired with. Treats the
   * clicked feature's resulting state as the source of truth — clicking
   * an ON item turns the whole pair OFF; clicking an OFF item turns the
   * whole pair ON.
   */
  const toggle = (id: number) => {
    const target = features.find((f) => f.id === id);
    if (!target) return;
    const willTurnOn = !selected.has(id);
    const namesToToggle = pairedFeatureNames(target.name);
    const idsToToggle = namesToToggle
      .map((n) => featuresByName.get(n.toLowerCase())?.id)
      .filter((x): x is number => typeof x === "number");
    const next = new Set(selected);
    for (const fid of idsToToggle) {
      if (willTurnOn) next.add(fid);
      else next.delete(fid);
    }
    onChange({
      features: {
        ...(data.features || {}),
        selected_feature_ids: Array.from(next),
      },
    });
  };

  const toggleSection = (groupFeatures: Feature[]) => {
    const next = new Set(selected);
    const allOn = groupFeatures.every((f) => next.has(f.id));
    if (allOn) {
      // Section-level deselect: turn off the whole section AND any paired
      // features on the other side (so we don't strand admins managing
      // nothing, or learners using a module with no admin tools).
      groupFeatures.forEach((f) => {
        for (const name of pairedFeatureNames(f.name)) {
          const id = featuresByName.get(name.toLowerCase())?.id;
          if (typeof id === "number") next.delete(id);
        }
      });
    } else {
      groupFeatures.forEach((f) => {
        for (const name of pairedFeatureNames(f.name)) {
          const id = featuresByName.get(name.toLowerCase())?.id;
          if (typeof id === "number") next.add(id);
        }
      });
    }
    onChange({
      features: {
        ...(data.features || {}),
        selected_feature_ids: Array.from(next),
      },
    });
  };

  const learnerOn = learnerFeatures.filter((f) => selected.has(f.id)).length;
  const adminOn = adminFeatures.filter((f) => selected.has(f.id)).length;

  return (
    <div className="space-y-7">
      <p className="aw-text-dim text-[14px] leading-[1.65]">
        Choose what shows up in your tenants&apos; sidebars. Learner features
        appear in the student app; admin features appear inside the admin
        portal. You can change either set anytime later in Settings.
      </p>

      {loading ? (
        <FeaturesLoading />
      ) : features.length === 0 ? (
        <div
          className="rounded-[14px] p-4"
          style={{
            border: "1px solid rgba(255, 198, 109, 0.3)",
            background: "rgba(255, 198, 109, 0.06)",
          }}
        >
          <p className="aw-mono text-[10px] uppercase tracking-[0.3em] text-[#ffc66d]">
            Modules unavailable
          </p>
          <p className="aw-text-dim mt-2 text-[13px] leading-relaxed">
            Couldn&apos;t load modules from the server. You can still launch
            and enable modules later from Settings.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pairing hint banner — explains the auto-toggle behaviour up
              front so users aren't confused when ticking "Assessment" also
              switches on the admin counterparts. */}
          <div
            className="rounded-[14px] p-3.5"
            style={{
              border: "1px solid rgba(0, 224, 255, 0.22)",
              background: "rgba(0, 224, 255, 0.04)",
            }}
          >
            <p className="aw-mono text-[10px] uppercase tracking-[0.28em] text-[#00e0ff]">
              How pairing works
            </p>
            <p className="aw-text-dim mt-1.5 text-[12.5px] leading-relaxed">
              Picking a learner module like{" "}
              <span className="aw-text font-semibold">Assessment</span> also
              switches on the admin tools needed to run it (
              <span className="aw-text">Manage assessments</span>,{" "}
              <span className="aw-text">Scorecard</span>). Untick either side
              and both sides clear together — we don&apos;t leave admins
              managing modules learners can&apos;t reach.
            </p>
          </div>

          {SECTIONS.map((section) => {
            const list =
              section.key === "learner" ? learnerFeatures : adminFeatures;
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
                  // Strong section-level tint + accent left rail so the two
                  // worlds (Student app vs Admin portal) feel different
                  // surfaces, not just two lists on the same page.
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
                          {onCount} / {list.length} selected
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
                    {allOn ? "Deselect all" : "Select all"}
                  </button>
                </div>

                <p className="aw-text-dim mb-5 text-[13px] leading-relaxed">
                  {section.description}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {list.map((f, i) => {
                    const isOn = selected.has(f.id);
                    const displayName =
                      section.key === "admin" ? formatAdminName(f.name) : f.name;
                    const desc =
                      FEATURE_DESCRIPTIONS[f.name] ||
                      FEATURE_DESCRIPTIONS[displayName];
                    // Resolve any paired counterparts so we can hint at them
                    // on the card. Excludes the feature itself.
                    const pairedNames = pairedFeatureNames(f.name).filter(
                      (n) => n !== f.name
                    );
                    return (
                      <motion.button
                        key={f.id}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        type="button"
                        onClick={() => toggle(f.id)}
                        className={`group relative flex items-start gap-3 rounded-[14px] p-3.5 text-left transition-all ${
                          isOn ? "aw-option-active" : ""
                        }`}
                        style={
                          isOn
                            ? {
                                border: `1px solid ${section.accent}88`,
                                background: `${section.accent}10`,
                                boxShadow: `inset 0 0 0 1px ${section.accent}33, 0 6px 22px -10px ${section.accent}`,
                              }
                            : {
                                border: `1px solid rgb(var(--aw-line) / var(--aw-line-alpha))`,
                                background: "rgb(var(--aw-line) / 0.02)",
                              }
                        }
                      >
                        <div
                          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded transition"
                          style={{
                            border: isOn
                              ? `1px solid ${section.accent}`
                              : `1px solid rgb(var(--aw-line) / var(--aw-line-2-alpha))`,
                            background: isOn ? section.iconBg : "transparent",
                          }}
                        >
                          {isOn ? (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#05070f"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="aw-text text-[14px] font-semibold">
                            {displayName}
                          </p>
                          {desc ? (
                            <p className="aw-text-mute mt-1 text-[12px] leading-relaxed">
                              {desc}
                            </p>
                          ) : null}
                          {pairedNames.length > 0 ? (
                            <p
                              className="aw-mono mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em]"
                              style={{
                                color: section.accent,
                                opacity: 0.85,
                              }}
                            >
                              <span aria-hidden>↔</span>
                              {section.key === "learner"
                                ? "Auto-enables admin: "
                                : "Pairs with learner: "}
                              <span className="aw-text-dim normal-case tracking-normal">
                                {pairedNames
                                  .map((n) =>
                                    isAdminFeature(n) ? formatAdminName(n) : n
                                  )
                                  .join(", ")}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      {!loading && features.length > 0 && (
        <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
          {selected.size} of {features.length} modules selected
          <span className="ml-2 opacity-60">
            · {learnerOn} learner · {adminOn} admin
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * Branded loading panel for the features list — mirrors the AI LINC mark used
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
              "radial-gradient(circle, rgba(0,224,255,0.18), transparent 70%)",
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
            background: "linear-gradient(90deg, #2356d6 0%, #00e0ff 100%)",
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
