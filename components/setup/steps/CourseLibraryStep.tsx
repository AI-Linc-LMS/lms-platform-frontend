"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/services/api";
import { WizardData } from "@/lib/setup/wizardData";

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: i * 0.08,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

type Choice = NonNullable<WizardData["course_library"]>["choice"];

const OPTIONS: {
  value: NonNullable<Choice>;
  label: string;
  desc: string;
}[] = [
  {
    value: "import",
    label: "Import from AI Linc catalogue",
    desc: "Cherry-pick from our 425+ curated courses. We'll duplicate each one (modules, submodules, content references) into your tenant on launch - you own the copies and can edit freely.",
  },
  {
    value: "skip",
    label: "Skip for now",
    desc: "Launch with an empty library. Add courses anytime later from Admin → Course builder or Admin → Import from catalogue.",
  },
];

/** Course summary shape returned by /api/tenant/wizard/catalogue/. */
interface CatalogueCourse {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  difficulty_level: string;
  duration_in_hours: number;
  thumbnail: string;
  modules_count: number;
  submodules_count: number;
  modules: {
    id: number;
    weekno: number;
    title: string;
    submodules_count: number;
    submodules: { id: number; title: string; order: number }[];
  }[];
}

export function CourseLibraryStep({ data, onChange }: Props) {
  const lib = data.course_library || {};

  const setChoice = (choice: NonNullable<Choice>) =>
    onChange({ course_library: { ...lib, choice } });

  return (
    <div className="space-y-6">
      <p className="aw-text-dim text-[14px] leading-[1.65]">
        Choose how to populate your course library. You can switch approaches
        or mix and match anytime - none of this is locked in.
      </p>

      <div className="space-y-3">
        {OPTIONS.map((opt, i) => {
          const on = lib.choice === opt.value;
          return (
            <motion.button
              key={opt.value}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              type="button"
              onClick={() => setChoice(opt.value)}
              className={`aw-option flex w-full items-start gap-4 text-left transition-all ${
                on ? "aw-option-active" : ""
              }`}
            >
              <div
                className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full transition"
                style={{
                  border: on
                    ? "1px solid #00e0ff"
                    : "1px solid rgb(var(--aw-line) / var(--aw-line-2-alpha))",
                  background: on
                    ? "linear-gradient(135deg, #00e0ff, #2356d6)"
                    : "transparent",
                }}
              >
                {on ? (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "#05070f" }}
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="aw-text text-[14px] font-semibold">{opt.label}</p>
                <p className="aw-text-mute mt-1.5 text-[12.5px] leading-relaxed">
                  {opt.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Expanded panels - only one shows at a time, matched to the choice. */}
      <AnimatePresence mode="wait" initial={false}>
        {lib.choice === "import" ? (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <CatalogueBrowser
              selectedIds={lib.selected_course_ids || []}
              onChangeSelection={(ids, titles) =>
                onChange({
                  course_library: {
                    ...lib,
                    selected_course_ids: ids,
                    selected_course_titles: titles,
                  },
                })
              }
            />
          </motion.div>
        ) : null}

      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   "Import from AI Linc catalogue" - fetches the master catalogue from
   /api/tenant/wizard/catalogue/ and lets the user pick courses to duplicate.
   Each card expands to show its modules + submodule counts so the admin
   knows what they're committing to before launch.
   ───────────────────────────────────────────────────────────────────────── */
function CatalogueBrowser({
  selectedIds,
  onChangeSelection,
}: {
  selectedIds: number[];
  onChangeSelection: (ids: number[], titles: string[]) => void;
}) {
  const [courses, setCourses] = useState<CatalogueCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get<{ courses: CatalogueCourse[] }>("/api/tenant/wizard/catalogue/")
      .then((res) => {
        if (cancelled) return;
        setCourses(res.data?.courses || []);
      })
      .catch(() => {
        if (cancelled) return;
        setError(
          "Couldn't load the catalogue right now. You can still launch and import courses later from the admin dashboard."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q)
    );
  }, [courses, query]);

  const toggle = (c: CatalogueCourse) => {
    const next = new Set(selectedSet);
    if (next.has(c.id)) next.delete(c.id);
    else next.add(c.id);
    const ids = Array.from(next);
    const titles = courses
      .filter((x) => next.has(x.id))
      .map((x) => x.title);
    onChangeSelection(ids, titles);
  };

  const selectAll = () => {
    const ids = filtered.map((c) => c.id);
    const titles = filtered.map((c) => c.title);
    onChangeSelection(ids, titles);
  };

  const clear = () => onChangeSelection([], []);

  return (
    <div
      className="rounded-[16px] p-5"
      style={{
        border: "1px solid rgb(var(--aw-line) / var(--aw-line-alpha))",
        background: "rgb(var(--aw-line) / 0.02)",
      }}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="aw-mono text-[10px] uppercase tracking-[0.28em] text-[#00e0ff]">
            AI Linc catalogue
          </p>
          <h4 className="aw-text mt-1 text-[16px] font-semibold">
            Pick what to import
            <span className="aw-text-mute ml-2 text-[12px] font-normal">
              {selectedIds.length} selected
            </span>
          </h4>
          <p className="aw-text-mute mt-1.5 text-[12px] leading-relaxed">
            Each selected course is duplicated into your tenant on launch -
            modules, submodules, and content references are copied so you can
            edit them without affecting anyone else.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={loading || filtered.length === 0}
            className="aw-mono rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              color: "#00e0ff",
              borderColor: "rgba(0, 224, 255, 0.4)",
              background: "rgba(0, 224, 255, 0.06)",
            }}
          >
            Select all
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={selectedIds.length === 0}
            className="aw-mono rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              color: "rgb(var(--aw-fg-dim))",
              borderColor: "rgb(var(--aw-line) / var(--aw-line-2-alpha))",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter by title or description…"
        className="aw-input mb-4"
      />

      {loading ? (
        <CatalogueSkeleton />
      ) : error ? (
        <div
          className="rounded-[12px] p-4"
          style={{
            border: "1px solid rgba(255, 198, 109, 0.3)",
            background: "rgba(255, 198, 109, 0.06)",
          }}
        >
          <p className="aw-mono text-[10px] uppercase tracking-[0.28em] text-[#ffc66d]">
            Catalogue unavailable
          </p>
          <p className="aw-text-dim mt-1.5 text-[13px] leading-relaxed">
            {error}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="aw-text-mute py-8 text-center text-[13px]">
          {query
            ? "No courses match that filter."
            : "The catalogue is empty - pick another option above."}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((c) => {
            const on = selectedSet.has(c.id);
            const isExpanded = expandedId === c.id;
            return (
              <li
                key={c.id}
                className="rounded-[12px] transition-all"
                style={{
                  border: on
                    ? "1px solid rgba(0, 224, 255, 0.55)"
                    : "1px solid rgb(var(--aw-line) / var(--aw-line-alpha))",
                  background: on
                    ? "rgba(0, 224, 255, 0.06)"
                    : "rgb(var(--aw-line) / 0.02)",
                }}
              >
                <div className="flex items-start gap-3 p-3.5">
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded transition"
                    aria-pressed={on}
                    style={{
                      border: on
                        ? "1px solid #00e0ff"
                        : "1px solid rgb(var(--aw-line) / var(--aw-line-2-alpha))",
                      background: on
                        ? "linear-gradient(135deg, #00e0ff, #2356d6)"
                        : "transparent",
                    }}
                  >
                    {on ? (
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
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="aw-text text-[14px] font-semibold">
                        {c.title}
                      </p>
                      {c.difficulty_level ? (
                        <span
                          className="aw-mono shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.22em]"
                          style={{
                            color: "#00e0ff",
                            border: "1px solid rgba(0, 224, 255, 0.3)",
                            background: "rgba(0, 224, 255, 0.06)",
                          }}
                        >
                          {c.difficulty_level}
                        </span>
                      ) : null}
                    </div>
                    {c.subtitle ? (
                      <p className="aw-text-mute mt-1 text-[12px] leading-relaxed line-clamp-2">
                        {c.subtitle}
                      </p>
                    ) : null}
                    <p className="aw-mono aw-text-mute mt-2 text-[10px] uppercase tracking-[0.22em]">
                      {c.modules_count} module{c.modules_count === 1 ? "" : "s"}
                      {" · "}
                      {c.submodules_count} submodule
                      {c.submodules_count === 1 ? "" : "s"}
                      {c.duration_in_hours
                        ? ` · ${c.duration_in_hours}h`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : c.id)
                    }
                    className="aw-mono shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] transition-colors"
                    style={{
                      color: "rgb(var(--aw-fg-dim))",
                      borderColor:
                        "rgb(var(--aw-line) / var(--aw-line-2-alpha))",
                    }}
                  >
                    {isExpanded ? "Hide" : "Show"} modules
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="border-t px-4 py-3"
                        style={{
                          borderTopColor:
                            "rgb(var(--aw-line) / var(--aw-line-alpha))",
                        }}
                      >
                        {c.modules.length === 0 ? (
                          <p className="aw-text-mute text-[12px]">
                            No modules yet.
                          </p>
                        ) : (
                          <ol className="space-y-2.5">
                            {c.modules.map((m) => (
                              <li key={m.id}>
                                <div className="flex items-baseline gap-2">
                                  <span
                                    className="aw-mono text-[10px] uppercase tracking-[0.22em]"
                                    style={{ color: "#00e0ff" }}
                                  >
                                    W{m.weekno}
                                  </span>
                                  <span className="aw-text text-[13px] font-medium">
                                    {m.title}
                                  </span>
                                  <span className="aw-text-mute ml-auto text-[11px]">
                                    {m.submodules_count} submodule
                                    {m.submodules_count === 1 ? "" : "s"}
                                  </span>
                                </div>
                                {m.submodules.length > 0 ? (
                                  <ul className="ml-6 mt-1.5 space-y-1">
                                    {m.submodules.map((sm) => (
                                      <li
                                        key={sm.id}
                                        className="aw-text-dim text-[12px] leading-relaxed"
                                      >
                                        · {sm.title}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[78px] rounded-[12px]"
          style={{
            background:
              "linear-gradient(90deg, rgb(var(--aw-line) / 0.04) 0%, rgb(var(--aw-line) / 0.02) 50%, rgb(var(--aw-line) / 0.04) 100%)",
            backgroundSize: "200% 100%",
            animation: "aw-cat-shimmer 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes aw-cat-shimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}

