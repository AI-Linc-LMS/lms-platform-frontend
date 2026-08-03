"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useToast } from "@/components/common/Toast";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import {
  adminAdaptiveCourseService,
  type BankMcq,
  type BankCodingProblem,
  type SubmoduleSuggestions,
} from "@/lib/services/admin/admin-adaptive-course.service";
import {
  adaptiveVideoAdminService,
  type VimeoVideoWire,
} from "@/lib/services/adaptive-video.service";

/* ------------------------------------------------------------------ palette */

type ContentKind = "article" | "quiz" | "coding" | "video";

const KIND_ORDER: ContentKind[] = ["article", "quiz", "coding", "video"];
const KIND_TAB: Record<ContentKind, number> = { article: 0, quiz: 1, coding: 2, video: 3 };

const KIND_META: Record<ContentKind, { label: string; icon: string; accent: string }> = {
  article: { label: "Article", icon: "mdi:text-box-outline", accent: "#6366f1" },
  quiz: { label: "Quiz", icon: "mdi:help-circle-outline", accent: "#a855f7" },
  coding: { label: "Coding", icon: "mdi:code-braces", accent: "#f59e0b" },
  video: { label: "Video", icon: "mdi:play-circle-outline", accent: "#ec4899" },
};

const GREEN = "#10b981";
/** Theme token, not a literal grey: this text/icon tone has to follow light and dark. */
const MUTED = "var(--font-secondary)";

const DIFF_TONE: Record<string, string> = { easy: GREEN, medium: "#f59e0b", hard: "#ec4899" };

const DEBOUNCE_MS = 350;

/* ------------------------------------------------------------------ helpers */

function fmtDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function DifficultyChip({ value }: { value: string }) {
  const tone = DIFF_TONE[(value || "").toLowerCase()] ?? MUTED;
  return (
    <Box
      component="span"
      sx={{
        px: 0.9,
        py: 0.15,
        borderRadius: 999,
        fontSize: "0.65rem",
        fontWeight: 800,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
        color: tone,
        bgcolor: `color-mix(in srgb, ${tone} 14%, transparent)`,
      }}
    >
      {value || "unrated"}
    </Box>
  );
}

/** A hand-written MCQ still being edited. `uid` keeps React row identity stable across
 *  removals - with index keys, deleting row 1 would leave row 2's text sitting in row 1's inputs. */
interface DraftMcq {
  uid: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "a" | "b" | "c" | "d";
  explanation: string;
  difficulty_level: "easy" | "medium" | "hard";
}

let draftUid = 0;
function blankDraft(): DraftMcq {
  draftUid += 1;
  return {
    uid: draftUid,
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "a",
    explanation: "",
    difficulty_level: "medium",
  };
}

function draftIsComplete(d: DraftMcq): boolean {
  return (
    d.question_text.trim().length > 0 &&
    d.option_a.trim().length > 0 &&
    d.option_b.trim().length > 0 &&
    d.option_c.trim().length > 0 &&
    d.option_d.trim().length > 0
  );
}

/* ------------------------------------------------------- shared bank search */

/**
 * Debounced verified-bank search shared by the quiz and coding tabs.
 * `enabled` is false while the tab is off-screen so switching tabs does not fire
 * requests nobody is looking at.
 */
function useBankSearch<T>(kind: "mcq" | "coding", enabled: boolean) {
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("any");
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const reset = useCallback(() => {
    setQ("");
    setDifficulty("any");
    setRows([]);
    setTotal(0);
    setError(null);
    setLoading(false);
    // Invalidate anything already in flight: its results belong to a dialog state
    // that no longer exists.
    seq.current += 1;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Each run claims a ticket and only the newest one may write state, so a slow
    // response for an earlier query cannot clobber the list the admin is reading now.
    seq.current += 1;
    const ticket = seq.current;
    // The spinner is raised inside the timer, not before it: raising it on every
    // keystroke would strobe the list during the debounce window.
    const timer = setTimeout(() => {
      setLoading(true);
      adminAdaptiveCourseService
        .searchBank<T>(kind, {
          q: q.trim() || undefined,
          difficulty: difficulty === "any" ? undefined : difficulty,
          limit: 40,
        })
        .then((r) => {
          if (seq.current !== ticket) return;
          setRows(r.results ?? []);
          setTotal(r.total ?? 0);
          setError(null);
        })
        .catch((e: unknown) => {
          if (seq.current !== ticket) return;
          setRows([]);
          setError(getAxiosErrorDetail(e, "Couldn't search the verified bank."));
        })
        .finally(() => {
          if (seq.current === ticket) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [kind, q, difficulty, enabled]);

  return { q, setQ, difficulty, setDifficulty, rows, total, loading, error, reset };
}

/* ---------------------------------------------------------------- fragments */

function SearchControls({
  q,
  onQ,
  difficulty,
  onDifficulty,
  placeholder,
}: {
  q: string;
  onQ: (v: string) => void;
  difficulty: string;
  onDifficulty: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
      <TextField
        size="small"
        fullWidth
        value={q}
        onChange={(e) => onQ(e.target.value)}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <Icon icon="mdi:magnify" width={18} style={{ marginRight: 6, opacity: 0.55 }} />
          ),
        }}
      />
      <Select
        size="small"
        value={difficulty}
        onChange={(e) => onDifficulty(String(e.target.value))}
        sx={{ minWidth: 118 }}
      >
        <MenuItem value="any">Any level</MenuItem>
        <MenuItem value="easy">Easy</MenuItem>
        <MenuItem value="medium">Medium</MenuItem>
        <MenuItem value="hard">Hard</MenuItem>
      </Select>
    </Box>
  );
}

function ResultShell({
  loading,
  error,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        maxHeight: 300,
        overflowY: "auto",
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        p: 0.5,
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ m: 0.5 }}>
          {error}
        </Alert>
      ) : loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={22} />
        </Box>
      ) : empty ? (
        <Typography
          sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", textAlign: "center", py: 4 }}
        >
          {emptyText}
        </Typography>
      ) : (
        children
      )}
    </Box>
  );
}

function PickRow({
  checked,
  onToggle,
  accent,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        px: 1,
        py: 0.75,
        borderRadius: 2,
        cursor: "pointer",
        border: "1px solid",
        borderColor: checked ? accent : "transparent",
        bgcolor: checked ? `color-mix(in srgb, ${accent} 7%, transparent)` : "transparent",
        "&:hover": { bgcolor: `color-mix(in srgb, ${accent} 5%, transparent)` },
      }}
    >
      <Checkbox checked={checked} size="small" sx={{ p: 0.5, mt: -0.25 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

/* ---------------------------------------------------------------- component */

export function AddContentDialog({
  open,
  submoduleId,
  submoduleTitle,
  onClose,
  onAdded,
}: {
  open: boolean;
  submoduleId: number | null;
  submoduleTitle: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { showToast } = useToast();
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);

  // Suggestions rail
  const [suggestions, setSuggestions] = useState<SubmoduleSuggestions | null>(null);
  const [sugLoading, setSugLoading] = useState(false);

  // Article
  const [artTitle, setArtTitle] = useState("");
  const [artBody, setArtBody] = useState("");
  const [artSummary, setArtSummary] = useState("");

  // Quiz
  const [quizMode, setQuizMode] = useState<"bank" | "write">("bank");
  const [pickedMcqs, setPickedMcqs] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<DraftMcq[]>([blankDraft()]);
  const [quizConflict, setQuizConflict] = useState<string | null>(null);

  // Coding
  const [pickedProblems, setPickedProblems] = useState<Set<number>>(new Set());

  // Video
  const [videoMode, setVideoMode] = useState<"catalog" | "link">("catalog");
  const [vq, setVq] = useState("");
  const [vRows, setVRows] = useState<VimeoVideoWire[]>([]);
  const [vLoading, setVLoading] = useState(false);
  const [pickedVimeo, setPickedVimeo] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoNote, setVideoNote] = useState<string | null>(null);
  const vSeq = useRef(0);

  const mcqBank = useBankSearch<BankMcq>("mcq", open && tab === 1 && quizMode === "bank");
  const codingBank = useBankSearch<BankCodingProblem>("coding", open && tab === 2);
  const resetMcqBank = mcqBank.reset;
  const resetCodingBank = codingBank.reset;

  const loadSuggestions = useCallback(async (id: number) => {
    setSugLoading(true);
    try {
      setSuggestions(await adminAdaptiveCourseService.getSuggestions(id));
    } catch {
      // The rail is a hint, not the job. A failure here must not block authoring.
      setSuggestions(null);
    } finally {
      setSugLoading(false);
    }
  }, []);

  // Full reset whenever the dialog opens or is re-pointed at another submodule, so a
  // half-typed article never lands on the wrong topic.
  useEffect(() => {
    if (!open) return;
    setTab(0);
    setSaving(false);
    setArtTitle("");
    setArtBody("");
    setArtSummary("");
    setQuizMode("bank");
    setPickedMcqs(new Set());
    setDrafts([blankDraft()]);
    setQuizConflict(null);
    setPickedProblems(new Set());
    setVideoMode("catalog");
    setVq("");
    setVRows([]);
    setPickedVimeo(null);
    setVideoUrl("");
    setVideoTitle("");
    setVideoNote(null);
    vSeq.current += 1;
    resetMcqBank();
    resetCodingBank();
    setSuggestions(null);
    if (submoduleId != null) void loadSuggestions(submoduleId);
  }, [open, submoduleId, resetMcqBank, resetCodingBank, loadSuggestions]);

  // Vimeo catalog lives on its own service, so it gets its own debounce and race guard.
  useEffect(() => {
    if (!open || tab !== 3 || videoMode !== "catalog") return;
    vSeq.current += 1;
    const ticket = vSeq.current;
    const timer = setTimeout(() => {
      setVLoading(true);
      adaptiveVideoAdminService
        .searchCatalog(vq.trim(), false)
        .then((r) => {
          if (vSeq.current !== ticket) return;
          // searchCatalog answers with { results: [...] }, not a bare array.
          setVRows(r.results ?? []);
        })
        .catch(() => {
          if (vSeq.current === ticket) setVRows([]);
        })
        .finally(() => {
          if (vSeq.current === ticket) setVLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [open, tab, videoMode, vq]);

  const afterAdd = useCallback(
    (message: string | null) => {
      if (message) showToast(message, "success");
      onAdded();
      // Chips in the rail are now stale: the topic just gained a content type.
      if (submoduleId != null) void loadSuggestions(submoduleId);
    },
    [showToast, onAdded, submoduleId, loadSuggestions],
  );

  const toggleIn = (set: Set<number>, id: number) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const patchDraft = (uid: number, patch: Partial<DraftMcq>) =>
    setDrafts((prev) => prev.map((d) => (d.uid === uid ? { ...d, ...patch } : d)));

  /* -------------------------------------------------------------- submitters */

  async function submitArticle() {
    if (submoduleId == null) return;
    setSaving(true);
    try {
      const r = await adminAdaptiveCourseService.addArticle(submoduleId, {
        title: artTitle.trim(),
        body: artBody,
        summary: artSummary.trim() || undefined,
      });
      setArtTitle("");
      setArtBody("");
      setArtSummary("");
      afterAdd(`Added "${r.title}".`);
    } catch (e: unknown) {
      showToast(getAxiosErrorDetail(e, "Couldn't add the article."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitQuiz() {
    if (submoduleId == null) return;
    setQuizConflict(null);
    setSaving(true);
    try {
      const payload =
        quizMode === "bank"
          ? { mcq_ids: Array.from(pickedMcqs) }
          : {
              mcqs: drafts.filter(draftIsComplete).map((d) => ({
                question_text: d.question_text.trim(),
                option_a: d.option_a.trim(),
                option_b: d.option_b.trim(),
                option_c: d.option_c.trim(),
                option_d: d.option_d.trim(),
                correct_option: d.correct_option,
                explanation: d.explanation.trim(),
                difficulty_level: d.difficulty_level,
              })),
            };
      const r = await adminAdaptiveCourseService.addQuiz(submoduleId, payload);
      setPickedMcqs(new Set());
      setDrafts([blankDraft()]);
      afterAdd(`Quiz added with ${r.questions} question${r.questions === 1 ? "" : "s"}.`);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        // A submodule holds only one live quiz. The server's detail names the existing
        // quiz and what to do about it, which a generic "couldn't add" would throw away.
        setQuizConflict(
          getAxiosErrorDetail(e, "This topic already has a quiz. Remove it before adding another."),
        );
      } else {
        showToast(getAxiosErrorDetail(e, "Couldn't add the quiz."), "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitCoding() {
    if (submoduleId == null) return;
    setSaving(true);
    try {
      const r = await adminAdaptiveCourseService.addCoding(submoduleId, {
        problem_ids: Array.from(pickedProblems),
      });
      setPickedProblems(new Set());
      afterAdd(`Added ${r.problems} coding problem${r.problems === 1 ? "" : "s"}.`);
    } catch (e: unknown) {
      showToast(getAxiosErrorDetail(e, "Couldn't add the coding problems."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitVideo() {
    if (submoduleId == null) return;
    setSaving(true);
    setVideoNote(null);
    try {
      const r = await adminAdaptiveCourseService.addVideo(
        submoduleId,
        videoMode === "catalog"
          ? { vimeo_id: pickedVimeo ?? undefined }
          : { url: videoUrl.trim(), title: videoTitle.trim() || undefined },
      );
      setPickedVimeo(null);
      setVideoUrl("");
      setVideoTitle("");
      if (r.check_ins_built) {
        afterAdd(`Added "${r.title}" with check-ins.`);
      } else {
        // No transcript means no comprehension check-ins. A toast would vanish and the
        // admin would learn this from a student instead, so it stays on screen.
        setVideoNote(r.note || "Added as a plain video: no comprehension check-ins were built.");
        afterAdd(null);
      }
    } catch (e: unknown) {
      showToast(getAxiosErrorDetail(e, "Couldn't attach the video."), "error");
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------------------------ primary CTA */

  const completeDrafts = drafts.filter(draftIsComplete).length;
  const articleReady = artTitle.trim().length > 0 && artBody.trim().length >= 20;
  const quizReady = quizMode === "bank" ? pickedMcqs.size > 0 : completeDrafts > 0;
  const codingReady = pickedProblems.size > 0;
  const videoReady =
    videoMode === "catalog" ? pickedVimeo !== null : videoUrl.trim().length > 0;

  const primary: { label: string; ready: boolean; run: () => void } = [
    { label: "Add article", ready: articleReady, run: () => void submitArticle() },
    {
      label: quizMode === "bank" ? `Add quiz (${pickedMcqs.size})` : `Add quiz (${completeDrafts})`,
      ready: quizReady,
      run: () => void submitQuiz(),
    },
    {
      label: `Add problems (${pickedProblems.size})`,
      ready: codingReady,
      run: () => void submitCoding(),
    },
    { label: "Add video", ready: videoReady, run: () => void submitVideo() },
  ][tab];

  const accent = KIND_META[KIND_ORDER[tab]].accent;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: "var(--card-bg)", color: "var(--font-primary)", borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        Add content
        <Typography
          sx={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--font-secondary)", mt: 0.25 }}
          noWrap
        >
          {submoduleTitle}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* ---------------------------------------------------- suggestions rail */}
        {sugLoading ? (
          <Skeleton variant="rounded" height={54} sx={{ mb: 1.5, borderRadius: 2 }} />
        ) : suggestions ? (
          <Box
            sx={{
              mb: 1.5,
              p: 1,
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              bgcolor: "color-mix(in srgb, #6366f1 4%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {KIND_ORDER.map((k) => {
                const owned = suggestions.has[k];
                return (
                  <Chip
                    key={k}
                    size="small"
                    onClick={() => setTab(KIND_TAB[k])}
                    icon={
                      <Icon
                        icon={owned ? "mdi:check-circle" : "mdi:circle-outline"}
                        width={13}
                        color={owned ? GREEN : MUTED}
                      />
                    }
                    label={KIND_META[k].label}
                    sx={{
                      height: 24,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: owned ? GREEN : "var(--font-secondary)",
                      border: "1px solid",
                      borderColor: owned
                        ? `color-mix(in srgb, ${GREEN} 35%, transparent)`
                        : "var(--border-default)",
                      bgcolor: owned
                        ? `color-mix(in srgb, ${GREEN} 10%, transparent)`
                        : "transparent",
                    }}
                  />
                );
              })}
            </Box>

            {suggestions.gaps.length > 0 && (
              <Box sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.25 }}>
                {suggestions.gaps.map((g) => (
                  <Box
                    key={`${g.kind}-${g.title}`}
                    onClick={() => setTab(KIND_TAB[g.kind])}
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 0.75,
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)" },
                    }}
                  >
                    <Icon
                      icon="mdi:lightbulb-on-outline"
                      width={13}
                      color={KIND_META[g.kind].accent}
                    />
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700 }}>{g.title}</Typography>
                    <Typography
                      sx={{ fontSize: "0.7rem", color: "var(--font-secondary)", flex: 1 }}
                      noWrap
                    >
                      {g.why}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ) : null}

        {/* ------------------------------------------------------------- tabs */}
        <Tabs
          value={tab}
          onChange={(_, v: number) => setTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 40,
            borderBottom: "1px solid var(--border-default)",
            "& .MuiTab-root": {
              minHeight: 40,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.84rem",
              color: "var(--font-secondary)",
            },
            "& .Mui-selected": { color: `${accent} !important` },
            "& .MuiTabs-indicator": { backgroundColor: accent },
          }}
        >
          {KIND_ORDER.map((k) => (
            <Tab
              key={k}
              icon={<Icon icon={KIND_META[k].icon} width={16} />}
              iconPosition="start"
              label={KIND_META[k].label}
            />
          ))}
        </Tabs>

        <Box sx={{ pt: 2 }}>
          {/* ------------------------------------------------------- 1. article */}
          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                label="Title"
                value={artTitle}
                onChange={(e) => setArtTitle(e.target.value)}
              />
              <TextField
                fullWidth
                multiline
                minRows={10}
                label="Body"
                placeholder="Write the lesson. Markdown is fine."
                value={artBody}
                onChange={(e) => setArtBody(e.target.value)}
                helperText={
                  artBody.trim().length < 20
                    ? `${20 - artBody.trim().length} more characters before this can be saved`
                    : `${artBody.trim().length} characters`
                }
              />
              <TextField
                size="small"
                fullWidth
                label="Summary (optional)"
                value={artSummary}
                onChange={(e) => setArtSummary(e.target.value)}
              />
            </Box>
          )}

          {/* ---------------------------------------------------------- 2. quiz */}
          {tab === 1 && (
            <Box>
              {quizConflict && (
                <Alert severity="warning" sx={{ mb: 1.5 }} onClose={() => setQuizConflict(null)}>
                  {quizConflict}
                </Alert>
              )}

              <Box sx={{ display: "flex", gap: 0.5, mb: 1.5 }}>
                {(
                  [
                    ["bank", "From the verified bank"],
                    ["write", "Write one"],
                  ] as const
                ).map(([mode, label]) => (
                  <Button
                    key={mode}
                    size="small"
                    onClick={() => setQuizMode(mode)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.76rem",
                      borderRadius: 999,
                      px: 1.5,
                      color: quizMode === mode ? "#fff" : "var(--font-secondary)",
                      bgcolor: quizMode === mode ? KIND_META.quiz.accent : "transparent",
                      border: "1px solid",
                      borderColor:
                        quizMode === mode ? KIND_META.quiz.accent : "var(--border-default)",
                      "&:hover": {
                        bgcolor:
                          quizMode === mode
                            ? KIND_META.quiz.accent
                            : "color-mix(in srgb, #a855f7 8%, transparent)",
                      },
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Box>

              {quizMode === "bank" ? (
                <>
                  <SearchControls
                    q={mcqBank.q}
                    onQ={mcqBank.setQ}
                    difficulty={mcqBank.difficulty}
                    onDifficulty={mcqBank.setDifficulty}
                    placeholder="Search verified questions"
                  />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                      fontSize: "0.73rem",
                      color: "var(--font-secondary)",
                    }}
                  >
                    <span>
                      {mcqBank.total} match{mcqBank.total === 1 ? "" : "es"}
                    </span>
                    <Box component="span" sx={{ fontWeight: 800, color: KIND_META.quiz.accent }}>
                      {pickedMcqs.size} selected
                    </Box>
                  </Box>
                  <ResultShell
                    loading={mcqBank.loading}
                    error={mcqBank.error}
                    empty={mcqBank.rows.length === 0}
                    emptyText="No questions match that search."
                  >
                    {mcqBank.rows.map((m) => (
                      <PickRow
                        key={m.id}
                        checked={pickedMcqs.has(m.id)}
                        accent={KIND_META.quiz.accent}
                        onToggle={() => setPickedMcqs((p) => toggleIn(p, m.id))}
                      >
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {m.question_text}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}
                        >
                          <DifficultyChip value={m.difficulty_level} />
                          <Typography
                            sx={{ fontSize: "0.72rem", color: "var(--font-secondary)" }}
                            noWrap
                          >
                            {m.topic}
                          </Typography>
                        </Box>
                      </PickRow>
                    ))}
                  </ResultShell>
                </>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {drafts.map((d, i) => (
                    <Box
                      key={d.uid}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        border: "1px solid var(--border-default)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                          sx={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--font-secondary)" }}
                        >
                          Q{i + 1}
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Select
                          size="small"
                          value={d.difficulty_level}
                          onChange={(e) =>
                            patchDraft(d.uid, {
                              difficulty_level: e.target.value as DraftMcq["difficulty_level"],
                            })
                          }
                          sx={{ minWidth: 104, "& .MuiSelect-select": { py: 0.5, fontSize: "0.78rem" } }}
                        >
                          <MenuItem value="easy">Easy</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="hard">Hard</MenuItem>
                        </Select>
                        {drafts.length > 1 && (
                          <Button
                            size="small"
                            onClick={() =>
                              setDrafts((prev) => prev.filter((x) => x.uid !== d.uid))
                            }
                            sx={{ minWidth: 0, p: 0.5, color: "var(--font-secondary)" }}
                          >
                            <Icon icon="mdi:close" width={16} />
                          </Button>
                        )}
                      </Box>

                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        label="Question"
                        value={d.question_text}
                        onChange={(e) => patchDraft(d.uid, { question_text: e.target.value })}
                      />

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 1,
                        }}
                      >
                        {(["a", "b", "c", "d"] as const).map((k) => (
                          <TextField
                            key={k}
                            size="small"
                            fullWidth
                            label={`Option ${k.toUpperCase()}`}
                            value={d[`option_${k}` as const]}
                            onChange={(e) => patchDraft(d.uid, { [`option_${k}`]: e.target.value })}
                            sx={{
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor:
                                  d.correct_option === k ? GREEN : "var(--border-default)",
                              },
                            }}
                          />
                        ))}
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Typography sx={{ fontSize: "0.76rem", color: "var(--font-secondary)" }}>
                          Correct
                        </Typography>
                        <Select
                          size="small"
                          value={d.correct_option}
                          onChange={(e) =>
                            patchDraft(d.uid, {
                              correct_option: e.target.value as DraftMcq["correct_option"],
                            })
                          }
                          sx={{
                            minWidth: 72,
                            "& .MuiSelect-select": { py: 0.5, fontSize: "0.78rem", fontWeight: 800 },
                          }}
                        >
                          {(["a", "b", "c", "d"] as const).map((k) => (
                            <MenuItem key={k} value={k}>
                              {k.toUpperCase()}
                            </MenuItem>
                          ))}
                        </Select>
                        <TextField
                          size="small"
                          fullWidth
                          label="Explanation (optional)"
                          value={d.explanation}
                          onChange={(e) => patchDraft(d.uid, { explanation: e.target.value })}
                        />
                      </Box>
                    </Box>
                  ))}

                  <Button
                    size="small"
                    onClick={() => setDrafts((prev) => [...prev, blankDraft()])}
                    startIcon={<Icon icon="mdi:plus" width={16} />}
                    sx={{
                      alignSelf: "flex-start",
                      textTransform: "none",
                      fontWeight: 700,
                      color: KIND_META.quiz.accent,
                    }}
                  >
                    Add another question
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* -------------------------------------------------------- 3. coding */}
          {tab === 2 && (
            <Box>
              <SearchControls
                q={codingBank.q}
                onQ={codingBank.setQ}
                difficulty={codingBank.difficulty}
                onDifficulty={codingBank.setDifficulty}
                placeholder="Search verified coding problems"
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                  fontSize: "0.73rem",
                  color: "var(--font-secondary)",
                }}
              >
                <span>
                  {codingBank.total} match{codingBank.total === 1 ? "" : "es"}
                </span>
                <Box component="span" sx={{ fontWeight: 800, color: KIND_META.coding.accent }}>
                  {pickedProblems.size} selected
                </Box>
              </Box>
              <ResultShell
                loading={codingBank.loading}
                error={codingBank.error}
                empty={codingBank.rows.length === 0}
                emptyText="No problems match that search."
              >
                {codingBank.rows.map((p) => (
                  <PickRow
                    key={p.id}
                    checked={pickedProblems.has(p.id)}
                    accent={KIND_META.coding.accent}
                    onToggle={() => setPickedProblems((s) => toggleIn(s, p.id))}
                  >
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{p.title}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
                      <DifficultyChip value={p.difficulty_level} />
                      <Typography
                        sx={{ fontSize: "0.72rem", color: "var(--font-secondary)", flex: 1 }}
                        noWrap
                      >
                        {p.topic}
                      </Typography>
                      <Typography
                        sx={{ fontSize: "0.72rem", color: "var(--font-secondary)", whiteSpace: "nowrap" }}
                      >
                        {p.test_cases} test{p.test_cases === 1 ? "" : "s"}
                      </Typography>
                    </Box>
                  </PickRow>
                ))}
              </ResultShell>
            </Box>
          )}

          {/* --------------------------------------------------------- 4. video */}
          {tab === 3 && (
            <Box>
              {videoNote && (
                <Alert severity="info" sx={{ mb: 1.5 }} onClose={() => setVideoNote(null)}>
                  {videoNote}
                </Alert>
              )}

              <Box sx={{ display: "flex", gap: 0.5, mb: 1.5 }}>
                {(
                  [
                    ["catalog", "From the Vimeo catalog"],
                    ["link", "Paste a link"],
                  ] as const
                ).map(([mode, label]) => (
                  <Button
                    key={mode}
                    size="small"
                    onClick={() => setVideoMode(mode)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.76rem",
                      borderRadius: 999,
                      px: 1.5,
                      color: videoMode === mode ? "#fff" : "var(--font-secondary)",
                      bgcolor: videoMode === mode ? KIND_META.video.accent : "transparent",
                      border: "1px solid",
                      borderColor:
                        videoMode === mode ? KIND_META.video.accent : "var(--border-default)",
                      "&:hover": {
                        bgcolor:
                          videoMode === mode
                            ? KIND_META.video.accent
                            : "color-mix(in srgb, #ec4899 8%, transparent)",
                      },
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Box>

              {videoMode === "catalog" ? (
                <>
                  <TextField
                    size="small"
                    fullWidth
                    value={vq}
                    onChange={(e) => setVq(e.target.value)}
                    placeholder="Search the catalog"
                    sx={{ mb: 1 }}
                    InputProps={{
                      startAdornment: (
                        <Icon
                          icon="mdi:magnify"
                          width={18}
                          style={{ marginRight: 6, opacity: 0.55 }}
                        />
                      ),
                    }}
                  />
                  <ResultShell
                    loading={vLoading}
                    error={null}
                    empty={vRows.length === 0}
                    emptyText="No videos match that search."
                  >
                    {vRows.map((v) => {
                      const picked = pickedVimeo === v.vimeo_id;
                      return (
                        <Box
                          key={v.vimeo_id}
                          onClick={() => setPickedVimeo(picked ? null : v.vimeo_id)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1,
                            py: 0.75,
                            borderRadius: 2,
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: picked ? KIND_META.video.accent : "transparent",
                            bgcolor: picked
                              ? "color-mix(in srgb, #ec4899 7%, transparent)"
                              : "transparent",
                            "&:hover": { bgcolor: "color-mix(in srgb, #ec4899 5%, transparent)" },
                          }}
                        >
                          {/* Vimeo thumbnails are arbitrary remote URLs, so a plain img
                              keeps them off the next/image optimizer allow-list. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={v.thumbnail_url}
                            alt=""
                            width={84}
                            height={48}
                            style={{
                              borderRadius: 6,
                              objectFit: "cover",
                              flexShrink: 0,
                              background: "color-mix(in srgb, #ec4899 10%, transparent)",
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }} noWrap>
                              {v.title}
                            </Typography>
                            <Box
                              sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}
                            >
                              <Typography
                                sx={{ fontSize: "0.72rem", color: "var(--font-secondary)" }}
                              >
                                {fmtDuration(v.duration_seconds)}
                              </Typography>
                              {v.has_text_track && (
                                <Box
                                  component="span"
                                  sx={{
                                    px: 0.9,
                                    py: 0.15,
                                    borderRadius: 999,
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    color: GREEN,
                                    bgcolor: `color-mix(in srgb, ${GREEN} 14%, transparent)`,
                                  }}
                                >
                                  transcript
                                </Box>
                              )}
                            </Box>
                          </Box>
                          {picked && (
                            <Icon
                              icon="mdi:check-circle"
                              width={20}
                              color={KIND_META.video.accent}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </ResultShell>
                </>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Video URL"
                    placeholder="https://"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Title (optional)"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                  <Typography sx={{ fontSize: "0.75rem", color: "var(--font-secondary)" }}>
                    A pasted link has no transcript, so check-ins usually cannot be built. Catalog
                    videos are the richer option where one exists.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, borderTop: "1px solid var(--border-default)", pt: 1.5 }}>
        <Typography sx={{ flex: 1, fontSize: "0.74rem", color: "var(--font-secondary)" }}>
          The dialog stays open so you can add several items to this topic.
        </Typography>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ textTransform: "none", fontWeight: 700, color: "var(--font-secondary)" }}
        >
          Done
        </Button>
        <LoadingButton
          variant="contained"
          onClick={primary.run}
          loading={saving}
          loadingText="Adding..."
          disabled={!primary.ready || submoduleId == null}
          startIcon={<Icon icon="mdi:plus" width={16} />}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            color: "#fff",
            px: 2.5,
            borderRadius: 2,
            boxShadow: "none",
            background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 55%, #6366f1))`,
            "&.Mui-disabled": { color: "rgba(255,255,255,0.7)", opacity: 0.55 },
          }}
        >
          {primary.label}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
