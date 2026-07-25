"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Autocomplete,
  createFilterOptions,
  Popover,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { PostType, POST_TYPE_CONFIG, Tag, communityService } from "@/lib/services/community.service";
import { softBreakMarkdown } from "@/lib/utils/html-utils";

interface TagOption extends Tag {
  inputValue?: string; // populated when offering "Create new tag" option
}
const tagFilter = createFilterOptions<TagOption>();

// Common emoji set - covers smileys, gestures, dev/tech, and reactions.
// Keeps bundle small (no extra dep). Users can paste their own emoji freely.
const EMOJI_SET = [
  "😀", "😂", "🤣", "😊", "😍", "🥺", "😅", "🤔",
  "😎", "🤩", "🙃", "😴", "🙄", "😤", "😭", "🤯",
  "👍", "👎", "👏", "🙏", "🙌", "🤝", "💪", "✌️",
  "🔥", "🚀", "💡", "✨", "⭐", "🎉", "🎯", "💯",
  "❤️", "💔", "💖", "💙", "💚", "💛", "💜", "🖤",
  "💻", "🐛", "⚙️", "🔧", "🛠️", "📚", "📦", "🗂️",
  "✅", "❌", "⚠️", "❓", "❗", "💬", "📌", "🔗",
];

interface CreateThreadDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    body: string;
    tag_ids: number[];
    post_type: PostType;
    poll_options?: string[];
    resource_url?: string;
    tried_steps?: string;
    humor_tone?: string;
    punchline?: string;
    stance?: string;
    tldr?: string;
    image_urls?: string[];
  }) => Promise<void>;
  initialPostType?: PostType;
}

interface AttachedFile {
  fileId: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string; // blob URL for immediate local preview
  s3Url?: string;      // permanent S3 URL after upload
  uploading: boolean;
  uploadFailed: boolean;
}

const POST_TYPES = Object.keys(POST_TYPE_CONFIG) as PostType[];

const TITLE_PLACEHOLDERS: Record<PostType, string> = {
  question: "e.g. How do I handle JWT refresh tokens in Django?",
  poll: "e.g. Which state management library do you prefer?",
  resource: "e.g. Best guide for learning React hooks (2024)",
  humorous: "e.g. When you forget a semicolon at 2 AM...",
  discussion: "e.g. Is TypeScript worth it for solo projects?",
};

const BODY_PLACEHOLDERS: Record<PostType, string> = {
  question:
    "**Problem:**\nDescribe what you're seeing...\n\n**What I expected:**\n\n**Actual result:**\n\n```\n// Paste relevant code here\n```",
  poll: "Provide context for the poll - why are you asking the community?",
  resource: "Describe what this resource covers and *why it's valuable*...",
  humorous: "Set the scene... the more detail the funnier it gets 😄",
  discussion:
    "Share your perspective. Be specific and invite pushback - good discussions have two sides...",
};

const BODY_LABEL: Record<PostType, string> = {
  question: "Problem description",
  poll: "Context",
  resource: "About this resource",
  humorous: "The story",
  discussion: "Your take",
};

const EDITOR_BG: Record<PostType, string> = {
  question: "#f7f8ff",
  poll: "#faf8ff",
  resource: "#f0f9ff",
  humorous: "#fffcf0",
  discussion: "#f0fdf8",
};

const HUMOR_TONES = [
  { key: "relatable", emoji: "😅", label: "Relatable", color: "#f59e0b" },
  { key: "hot_take", emoji: "🌶️", label: "Hot Take", color: "#ef4444" },
  { key: "meme", emoji: "🤣", label: "Pure Meme", color: "#8b5cf6" },
  { key: "vibes", emoji: "✨", label: "Just Vibes", color: "#ec4899" },
] as const;

type HumorTone = (typeof HUMOR_TONES)[number]["key"] | "";

const STANCES = [
  { key: "for", emoji: "👍", label: "I'm For It", color: "#10b981" },
  { key: "against", emoji: "👎", label: "I'm Against", color: "#ef4444" },
  { key: "neutral", emoji: "🤔", label: "Neutral / Curious", color: "#f59e0b" },
] as const;

type Stance = (typeof STANCES)[number]["key"] | "";

// ── HTML → Markdown converter for paste handling ─────────────────────────────

function convertHtmlToMarkdown(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(walk).join("");

    switch (tag) {
      case "strong": case "b": return `**${children.trim()}**`;
      case "em": case "i": return `*${children.trim()}*`;
      case "h1": return `# ${children.trim()}\n\n`;
      case "h2": return `## ${children.trim()}\n\n`;
      case "h3": return `### ${children.trim()}\n\n`;
      case "h4": case "h5": case "h6": return `#### ${children.trim()}\n\n`;
      case "p": return `${children.trim()}\n\n`;
      case "br": return "\n";
      case "a": return `[${children}](${el.getAttribute("href") ?? ""})`;
      case "code": return el.closest("pre") ? children : `\`${children}\``;
      case "pre": return `\`\`\`\n${el.textContent ?? ""}\n\`\`\`\n\n`;
      case "ul": return `${children}\n`;
      case "ol": return `${children}\n`;
      case "li": return `- ${children.trim()}\n`;
      case "blockquote": return `> ${children.trim()}\n\n`;
      case "img": return `![${el.getAttribute("alt") ?? ""}](${el.getAttribute("src") ?? ""})\n`;
      case "hr": return `---\n\n`;
      case "table": return `${children}\n`;
      case "thead": case "tbody": case "tr": return children;
      case "th": return ` ${children.trim()} |`;
      case "td": return ` ${children.trim()} |`;
      default: return children;
    }
  }

  return walk(div).replace(/\n{3,}/g, "\n\n").trim();
}

// ── Component ────────────────────────────────────────────────────────────────

export function CreateThreadDialog({
  open,
  onClose,
  onSubmit,
  initialPostType = "question",
}: CreateThreadDialogProps) {
  const { t } = useTranslation("common");
  const [postType, setPostType] = useState<PostType>(initialPostType);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [resourceUrl, setResourceUrl] = useState("");
  const [triedSteps, setTriedSteps] = useState("");
  const [humorTone, setHumorTone] = useState<HumorTone>("");
  const [punchline, setPunchline] = useState("");
  const [stance, setStance] = useState<Stance>("");
  const [tldr, setTldr] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagBusy, setTagBusy] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setBody("");
      setIsPreview(false);
      setPollOptions(["", ""]);
      setResourceUrl("");
      setTriedSteps("");
      setHumorTone("");
      setPunchline("");
      setStance("");
      setTldr("");
      setSelectedTags([]);
      attachedFiles.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
      setAttachedFiles([]);
    } else {
      setPostType(initialPostType);
      // Lazy-fetch tags when dialog opens
      communityService.getTags().then(setAllTags).catch(() => setAllTags([]));
    }
  }, [open, initialPostType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Markdown toolbar ──────────────────────────────────────────────────────

  const insertAtCursor = (before: string, after = "", defaultText = "text") => {
    const el = bodyRef.current;
    if (!el) { setBody((p) => p + before + defaultText + after); return; }
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;
    const sel = body.slice(s, e) || defaultText;
    const newBody = body.slice(0, s) + before + sel + after + body.slice(e);
    setBody(newBody);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    }, 0);
  };

  const insertHeading = () => {
    const el = bodyRef.current;
    if (!el) return;
    const s = el.selectionStart ?? 0;
    const ls = body.lastIndexOf("\n", s - 1) + 1;
    const already = body.slice(ls).startsWith("## ");
    const nb = already ? body.slice(0, ls) + body.slice(ls + 3) : body.slice(0, ls) + "## " + body.slice(ls);
    setBody(nb);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + (already ? -3 : 3), s + (already ? -3 : 3)); }, 0);
  };

  const insertLink = () => {
    const el = bodyRef.current;
    if (!el) return;
    const sel = body.slice(el.selectionStart ?? 0, el.selectionEnd ?? 0);
    sel ? insertAtCursor("[", "](https://)", sel) : insertAtCursor("[link text](", ")", "https://");
  };

  // ── Paste handler - converts rich HTML to markdown ────────────────────────

  const handleBodyPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData("text/html");
    if (!html) return;
    e.preventDefault();
    const markdown = convertHtmlToMarkdown(html);
    const el = bodyRef.current;
    const s = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const newBody = body.slice(0, s) + markdown + body.slice(end);
    setBody(newBody);
    const pos = s + markdown.length;
    setTimeout(() => { el?.focus(); el?.setSelectionRange(pos, pos); }, 0);
  };

  // ── Poll helpers ──────────────────────────────────────────────────────────

  const updatePollOption = (i: number, v: string) =>
    setPollOptions((p) => p.map((o, idx) => (idx === i ? v : o)));
  const addPollOption = () => { if (pollOptions.length < 6) setPollOptions((p) => [...p, ""]); };
  const removePollOption = (i: number) => {
    if (pollOptions.length > 2) setPollOptions((p) => p.filter((_, idx) => idx !== i));
  };

  // ── File attachment ───────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";

    files.forEach((file) => {
      const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newFile: AttachedFile = {
        fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        uploading: true,
        uploadFailed: false,
      };
      setAttachedFiles((prev) => [...prev, newFile]);

      communityService
        .uploadFile(file)
        .then((result) => {
          setAttachedFiles((prev) =>
            prev.map((f) =>
              f.fileId === fileId ? { ...f, s3Url: result.url, uploading: false } : f
            )
          );
        })
        .catch(() => {
          setAttachedFiles((prev) =>
            prev.map((f) =>
              f.fileId === fileId ? { ...f, uploading: false, uploadFailed: true } : f
            )
          );
        });
    });
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.fileId === fileId);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.fileId !== fileId);
    });
  };

  const fileSizeLabel = (b: number) =>
    b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1048576).toFixed(1)}MB`;

  const fileIcon = (t: string) =>
    t.startsWith("image/") ? "mdi:image-outline" : t.startsWith("video/") ? "mdi:video-outline" : "mdi:file-outline";

  // ── Submit ────────────────────────────────────────────────────────────────

  const bodyRequired = postType !== "poll" && postType !== "resource";

  const handleSubmit = async () => {
    if (!title.trim()) return;
    if (bodyRequired && !body.trim()) return;
    if (postType === "poll" && pollOptions.filter((o) => o.trim()).length < 2) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        tag_ids: selectedTags.map((t) => t.id),
        post_type: postType,
        poll_options: postType === "poll" ? pollOptions.filter((o) => o.trim()) : undefined,
        resource_url: postType === "resource" && resourceUrl.trim() ? resourceUrl.trim() : undefined,
        tried_steps: postType === "question" && triedSteps.trim() ? triedSteps.trim() : undefined,
        humor_tone: postType === "humorous" && humorTone ? humorTone : undefined,
        punchline: postType === "humorous" && punchline.trim() ? punchline.trim() : undefined,
        stance: postType === "discussion" && stance ? stance : undefined,
        tldr: postType === "discussion" && tldr.trim() ? tldr.trim() : undefined,
        image_urls: attachedFiles
          .filter((f) => f.s3Url)
          .map((f) => f.s3Url!),
      });
      onClose();
    } catch {
      // handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const typeConfig = POST_TYPE_CONFIG[postType];
  const anyUploading = attachedFiles.some((f) => f.uploading);
  const isSubmitDisabled =
    !title.trim() ||
    (bodyRequired && !body.trim()) ||
    submitting ||
    anyUploading ||
    (postType === "poll" && pollOptions.filter((o) => o.trim()).length < 2);

  const editorBg = EDITOR_BG[postType];

  const mdPreviewSx = {
    minHeight: postType === "poll" ? 100 : 200,
    maxHeight: 380,
    overflowY: "auto" as const,
    px: 2.5,
    py: 1.75,
    backgroundColor: editorBg,
    "& h1,& h2,& h3": { fontWeight: 700, mt: 0, mb: 0.75 },
    "& h1": { fontSize: "1.4rem" },
    "& h2": { fontSize: "1.2rem" },
    "& h3": { fontSize: "1.05rem" },
    "& p": { mb: 0.75, lineHeight: 1.7, color: "var(--font-primary)", fontSize: "0.9rem" },
    "& code": { fontFamily: "monospace", fontSize: "0.84rem", backgroundColor: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "4px", px: "4px", py: "1px" },
    "& pre": { backgroundColor: "#1a1b26", color: "#c0caf5", borderRadius: "8px", p: 1.5, overflowX: "auto", "& code": { backgroundColor: "transparent", border: "none", color: "inherit", p: 0 } },
    "& blockquote": { borderLeft: `3px solid ${typeConfig.color}`, pl: 2, ml: 0, color: "var(--font-secondary)", fontStyle: "italic" },
    "& ul,& ol": { pl: 2.5, mb: 0.75 },
    "& li": { mb: 0.2, fontSize: "0.9rem" },
    "& a": { color: typeConfig.color, textDecoration: "underline" },
    "& strong": { fontWeight: 700 },
    "& table": { borderCollapse: "collapse", width: "100%", mb: 1 },
    "& th,& td": { border: "1px solid var(--border-default)", px: 1.5, py: 0.75, fontSize: "0.875rem" },
    "& th": { backgroundColor: "var(--surface)", fontWeight: 700 },
    "& img": { maxWidth: "100%", borderRadius: "8px", mt: 1 },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          border: "1px solid var(--border-default)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.13)",
          overflow: "hidden",
        },
      }}
    >
      {/* ── Type Selector Header ──────────────────────────────────────────── */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          borderBottom: "1px solid var(--border-default)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {POST_TYPES.map((type) => {
            const cfg = POST_TYPE_CONFIG[type];
            const active = postType === type;
            return (
              <Chip
                key={type}
                icon={<IconWrapper icon={cfg.icon} size={13} color={active ? "#fff" : cfg.color} />}
                label={cfg.label}
                onClick={() => setPostType(type)}
                size="small"
                sx={{
                  cursor: "pointer",
                  height: 30,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  backgroundColor: active ? cfg.color : `${cfg.color}12`,
                  color: active ? "#fff" : cfg.color,
                  border: `1.5px solid ${active ? cfg.color : `${cfg.color}40`}`,
                  "& .MuiChip-icon": { ml: 0.75 },
                  transition: "all 0.18s ease",
                  "&:hover": { backgroundColor: active ? cfg.color : `${cfg.color}22`, filter: active ? "brightness(1.05)" : "none" },
                }}
              />
            );
          })}
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>

          {/* ── Title ──────────────────────────────────────────────────── */}
          <TextField
            placeholder={TITLE_PLACEHOLDERS[postType]}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            autoFocus
            variant="standard"
            inputProps={{ maxLength: 200 }}
            InputProps={{
              disableUnderline: false,
              sx: {
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--font-primary)",
                "&:before": { borderColor: "var(--border-default)" },
                "&:after": { borderColor: typeConfig.color },
              },
            }}
            sx={{ mb: 2.5 }}
          />

          {/* ════ TYPE-SPECIFIC EXTRAS ════ */}

          {/* Question */}
          {postType === "question" && (
            <Box sx={{ mb: 2, borderRadius: "10px", border: "1px solid #c7d2fe", overflow: "hidden", backgroundColor: "#f5f7ff" }}>
              <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #c7d2fe", backgroundColor: "#eef2ff" }}>
                <IconWrapper icon="mdi:wrench-clock-outline" size={15} color="#6366f1" />
                <Typography variant="body2" fontWeight={700} sx={{ color: "#6366f1" }}>
                  What have you already tried?
                </Typography>
                <Chip label="optional" size="small" sx={{ ml: "auto", height: 18, fontSize: "0.65rem", backgroundColor: "#c7d2fe", color: "#4338ca" }} />
              </Box>
              <TextField
                placeholder="e.g. I tried X but got error Y. Also checked the docs for Z - didn't help because..."
                value={triedSteps}
                onChange={(e) => setTriedSteps(e.target.value)}
                fullWidth multiline minRows={2} maxRows={4} variant="outlined"
                InputProps={{
                  sx: {
                    borderRadius: 0, border: "none", "& fieldset": { border: "none" },
                    fontSize: "0.875rem", lineHeight: 1.6, backgroundColor: "#f5f7ff",
                    fontFamily: "inherit", "& textarea": { px: 2, py: 1.25 },
                  },
                }}
              />
            </Box>
          )}

          {/* Humorous */}
          {postType === "humorous" && (
            <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ p: 2, borderRadius: "10px", border: "1px solid #fde68a", backgroundColor: "#fffbeb" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#b45309" }}>
                    What&apos;s the vibe?
                  </Typography>
                  <Chip label="optional" size="small" sx={{ height: 18, fontSize: "0.65rem", backgroundColor: "#fde68a", color: "#92400e" }} />
                </Box>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  {HUMOR_TONES.map((tone) => {
                    const active = humorTone === tone.key;
                    return (
                      <Box
                        key={tone.key}
                        onClick={() => setHumorTone(active ? "" : tone.key)}
                        sx={{
                          display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.75,
                          borderRadius: "8px", border: `1.5px solid ${active ? tone.color : "#e5e7eb"}`,
                          backgroundColor: active ? `${tone.color}15` : "#fff",
                          cursor: "pointer", transition: "all 0.15s",
                          "&:hover": { borderColor: tone.color, backgroundColor: `${tone.color}0e` },
                        }}
                      >
                        <Typography sx={{ fontSize: "1rem", lineHeight: 1 }}>{tone.emoji}</Typography>
                        <Typography variant="caption" fontWeight={active ? 700 : 500} sx={{ color: active ? tone.color : "#374151" }}>
                          {tone.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              <TextField
                label="⚡ The Kicker (optional)"
                placeholder="One-liner punchline... e.g. Turns out it was a missing comma"
                value={punchline}
                onChange={(e) => setPunchline(e.target.value.slice(0, 120))}
                size="small" fullWidth inputProps={{ maxLength: 120 }}
                helperText={punchline.length > 80 ? `${punchline.length}/120` : undefined}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" }, "& label": { fontWeight: 600 } }}
              />
            </Box>
          )}

          {/* Discussion */}
          {postType === "discussion" && (
            <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#0f766e" }}>Your Stance</Typography>
                  <Chip label="optional" size="small" sx={{ height: 18, fontSize: "0.65rem", backgroundColor: "#ccfbf1", color: "#0f766e" }} />
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {STANCES.map((s) => {
                    const active = stance === s.key;
                    return (
                      <Box
                        key={s.key}
                        onClick={() => setStance(active ? "" : s.key)}
                        sx={{
                          flex: 1, py: 1.5, px: 1.25, borderRadius: "12px",
                          border: `2px solid ${active ? s.color : "#e5e7eb"}`,
                          backgroundColor: active ? `${s.color}10` : "#fff",
                          cursor: "pointer", textAlign: "center", transition: "all 0.18s",
                          "&:hover": { borderColor: s.color, backgroundColor: `${s.color}08` },
                        }}
                      >
                        <Typography sx={{ fontSize: "1.4rem", lineHeight: 1, mb: 0.5 }}>{s.emoji}</Typography>
                        <Typography variant="caption" fontWeight={active ? 700 : 500} sx={{ color: active ? s.color : "#374151", display: "block", lineHeight: 1.3 }}>
                          {s.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              <TextField
                label="TL;DR (optional one-liner)"
                placeholder="e.g. TypeScript adds safety but slows you down in the short term"
                value={tldr}
                onChange={(e) => setTldr(e.target.value.slice(0, 140))}
                size="small" fullWidth inputProps={{ maxLength: 140 }}
                helperText={tldr.length > 100 ? `${tldr.length}/140` : undefined}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" }, "& label": { fontWeight: 600 } }}
              />
            </Box>
          )}

          {/* Resource URL */}
          {postType === "resource" && (
            <TextField
              label="Resource URL (optional)"
              placeholder="https://..."
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              fullWidth size="small" type="url"
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex" }}>
                    <IconWrapper icon="mdi:link-variant" size={18} color="#3b82f6" />
                  </Box>
                ),
              }}
              sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          )}

          {/* Poll Options */}
          {postType === "poll" && (
            <Box sx={{ mb: 2, p: 2, border: "1px solid var(--border-default)", borderRadius: "10px", backgroundColor: `${POST_TYPE_CONFIG.poll.color}06` }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <IconWrapper icon="mdi:chart-bar" size={16} color={POST_TYPE_CONFIG.poll.color} />
                <Typography variant="body2" fontWeight={700} color={POST_TYPE_CONFIG.poll.color}>Poll Options</Typography>
                <Typography variant="caption" color="var(--font-tertiary)" sx={{ ml: "auto" }}>
                  {pollOptions.filter((o) => o.trim()).length}/{pollOptions.length} filled
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {pollOptions.map((option, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Box sx={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: option.trim() ? `${POST_TYPE_CONFIG.poll.color}20` : "var(--surface)",
                      border: `1.5px solid ${option.trim() ? POST_TYPE_CONFIG.poll.color : "var(--border-light)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s",
                    }}>
                      <Typography variant="caption" sx={{ fontSize: "0.62rem", fontWeight: 700, color: POST_TYPE_CONFIG.poll.color }}>{i + 1}</Typography>
                    </Box>
                    <TextField
                      placeholder={`Option ${i + 1}`}
                      value={option}
                      onChange={(e) => updatePollOption(i, e.target.value)}
                      size="small" fullWidth inputProps={{ maxLength: 120 }}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                    />
                    <IconButton
                      size="small"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => removePollOption(i)}
                      disabled={pollOptions.length <= 2}
                      sx={{ color: "var(--font-tertiary)", opacity: pollOptions.length <= 2 ? 0.25 : 0.7, "&:hover": { color: "var(--accent-red)", opacity: 1 } }}
                    >
                      <IconWrapper icon="mdi:close" size={15} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              {pollOptions.length < 6 && (
                <Button
                  size="small"
                  startIcon={<IconWrapper icon="mdi:plus" size={14} />}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addPollOption}
                  sx={{ mt: 1, textTransform: "none", color: POST_TYPE_CONFIG.poll.color, fontSize: "0.78rem", px: 1, "&:hover": { backgroundColor: `${POST_TYPE_CONFIG.poll.color}10` } }}
                >
                  Add option
                </Button>
              )}
            </Box>
          )}

          {/* ── Tag picker ───────────────────────────────────────────────── */}
          <Box sx={{ mb: 2 }}>
            <Autocomplete<TagOption, true, false, false>
              multiple
              freeSolo={false}
              options={allTags as TagOption[]}
              value={selectedTags as TagOption[]}
              loading={tagBusy}
              size="small"
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.inputValue ? `Create "${option.inputValue}"` : option.name
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={(options, params) => {
                const filtered = tagFilter(options, params);
                const input = params.inputValue.trim();
                const existing = options.some((o) => o.name.toLowerCase() === input.toLowerCase());
                if (input && !existing) {
                  filtered.push({ id: -1, name: input, inputValue: input });
                }
                return filtered;
              }}
              onChange={async (_, newValue) => {
                // Promote any "create new" placeholder into a real tag via backend.
                const finalTags: Tag[] = [];
                for (const item of newValue) {
                  if (typeof item === "string") continue;
                  if (item.inputValue && item.id === -1) {
                    setTagBusy(true);
                    try {
                      const created = await communityService.createTag(item.inputValue);
                      finalTags.push(created);
                      setAllTags((prev) =>
                        prev.some((t) => t.id === created.id) ? prev : [...prev, created]
                      );
                    } catch {
                      // silently skip
                    } finally {
                      setTagBusy(false);
                    }
                  } else {
                    finalTags.push({ id: item.id, name: item.name });
                  }
                }
                // dedupe by id
                const seen = new Set<number>();
                setSelectedTags(finalTags.filter((t) => !seen.has(t.id) && seen.add(t.id)));
              }}
              renderTags={(value, getTagProps) =>
                value.map((tag, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={tag.id}
                    label={`#${tag.name}`}
                    size="small"
                    sx={{
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 18%, var(--surface) 82%)",
                      color: "var(--accent-indigo)",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags (optional)"
                  placeholder={selectedTags.length === 0 ? "Add tags to help people find this post" : ""}
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <Box sx={{ pl: 0.5, pr: 0.5, display: "flex" }}>
                          <IconWrapper icon="mdi:tag-multiple-outline" size={16} color="var(--font-secondary)" />
                        </Box>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                />
              )}
            />
          </Box>

          {/* ── Markdown Editor ──────────────────────────────────────────── */}
          <Box sx={{ border: "1px solid var(--border-default)", borderRadius: "10px", overflow: "hidden" }}>
            {/* Toolbar */}
            <Box sx={{
              display: "flex", alignItems: "center", px: 1.5, py: 0.75, gap: 0.25,
              backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border-default)",
            }}>
              {/* Write / Preview toggle */}
              <Box sx={{ display: "flex", border: "1px solid var(--border-default)", borderRadius: "7px", overflow: "hidden", mr: 1.5 }}>
                {[{ label: "Write", active: !isPreview }, { label: "Preview", active: isPreview }].map(({ label, active }) => (
                  <Box
                    key={label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsPreview(label === "Preview")}
                    sx={{
                      px: 1.5, py: 0.4, fontSize: "0.76rem", fontWeight: active ? 600 : 400,
                      cursor: "pointer", backgroundColor: active ? "#fff" : "transparent",
                      color: active ? "var(--font-primary)" : "var(--font-secondary)",
                      transition: "all 0.15s", userSelect: "none",
                      "&:hover": { color: "var(--font-primary)" },
                    }}
                  >
                    {label}
                  </Box>
                ))}
              </Box>

              {!isPreview && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  {[
                    { title: "Bold", icon: "mdi:format-bold", action: () => insertAtCursor("**", "**", "bold") },
                    { title: "Italic", icon: "mdi:format-italic", action: () => insertAtCursor("*", "*", "italic") },
                    { title: "Heading", icon: "mdi:format-header-2", action: insertHeading },
                    { title: "Code block", icon: "mdi:code-braces", action: () => insertAtCursor("```\n", "\n```", "code here") },
                    { title: "Link", icon: "mdi:link-variant", action: insertLink },
                    { title: "Bullet list", icon: "mdi:format-list-bulleted", action: () => insertAtCursor("- ", "", "item") },
                  ].map(({ title, icon, action }) => (
                    <Tooltip key={title} title={title} placement="top">
                      <IconButton
                        size="small"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={action}
                        sx={{ width: 28, height: 28, borderRadius: "6px", color: "var(--font-secondary)", "&:hover": { backgroundColor: "var(--border-default)", color: "var(--font-primary)" } }}
                      >
                        <IconWrapper icon={icon} size={16} />
                      </IconButton>
                    </Tooltip>
                  ))}
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  <Tooltip title="Attach image or video">
                    <IconButton
                      size="small"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ width: 28, height: 28, borderRadius: "6px", color: "var(--font-secondary)", "&:hover": { backgroundColor: "var(--border-default)", color: "var(--font-primary)" } }}
                    >
                      <IconWrapper icon="mdi:paperclip" size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Insert emoji">
                    <IconButton
                      size="small"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => setEmojiAnchor(e.currentTarget)}
                      sx={{ width: 28, height: 28, borderRadius: "6px", color: "var(--font-secondary)", "&:hover": { backgroundColor: "var(--border-default)", color: "var(--font-primary)" } }}
                    >
                      <IconWrapper icon="mdi:emoticon-happy-outline" size={16} />
                    </IconButton>
                  </Tooltip>
                  <input type="file" ref={fileInputRef} accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleFileSelect} />
                </>
              )}

              <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.75 }}>
                {!bodyRequired && (
                  <Chip label="optional" size="small" sx={{ height: 18, fontSize: "0.65rem", backgroundColor: "var(--surface)", border: "1px solid var(--border-default)", color: "var(--font-secondary)" }} />
                )}
                <IconWrapper icon="mdi:language-markdown-outline" size={14} color="var(--font-tertiary)" />
                <Typography variant="caption" color="var(--font-tertiary)" sx={{ fontSize: "0.68rem" }}>Markdown</Typography>
              </Box>
            </Box>

            {/* Editor / Preview */}
            {isPreview ? (
              <Box sx={mdPreviewSx}>
                {body.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{softBreakMarkdown(body)}</ReactMarkdown>
                ) : (
                  <Typography variant="body2" color="var(--font-tertiary)" sx={{ fontStyle: "italic" }}>
                    Nothing to preview yet - start writing in the editor.
                  </Typography>
                )}
              </Box>
            ) : (
              <TextField
                placeholder={BODY_PLACEHOLDERS[postType]}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                fullWidth multiline
                minRows={postType === "poll" ? 3 : postType === "question" ? 6 : 7}
                maxRows={14}
                inputRef={bodyRef}
                variant="outlined"
                inputProps={{ onPaste: handleBodyPaste }}
                InputProps={{
                  sx: {
                    borderRadius: 0, border: "none", "& fieldset": { border: "none" },
                    fontSize: "0.9rem", lineHeight: 1.7,
                    fontFamily: postType === "question" ? "monospace" : "inherit",
                    backgroundColor: editorBg,
                    alignItems: "flex-start", p: 0,
                    "& textarea": { px: 2, py: 1.75 },
                  },
                }}
              />
            )}
          </Box>

          {/* ── Attached files / images ──────────────────────────────────── */}
          {attachedFiles.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              {/* Image previews */}
              {attachedFiles.some((f) => f.previewUrl) && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  {attachedFiles
                    .filter((f) => f.previewUrl)
                    .map((file) => (
                      <Box key={file.fileId} sx={{ position: "relative" }}>
                        <Box
                          component="img"
                          src={file.previewUrl}
                          alt={file.name}
                          sx={{
                            width: 80, height: 80, objectFit: "cover",
                            borderRadius: "8px",
                            border: `1px solid ${file.uploadFailed ? "#ef4444" : "var(--border-default)"}`,
                            display: "block",
                            opacity: file.uploading ? 0.5 : 1,
                            transition: "opacity 0.2s",
                          }}
                        />
                        {/* Upload status overlay */}
                        {file.uploading && (
                          <Box sx={{
                            position: "absolute", inset: 0, display: "flex",
                            alignItems: "center", justifyContent: "center",
                            borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.25)",
                          }}>
                            <Box sx={{
                              width: 18, height: 18, border: "2px solid #fff",
                              borderTopColor: "transparent", borderRadius: "50%",
                              animation: "spin 0.7s linear infinite",
                              "@keyframes spin": { to: { transform: "rotate(360deg)" } },
                            }} />
                          </Box>
                        )}
                        {file.uploadFailed && (
                          <Box sx={{
                            position: "absolute", inset: 0, display: "flex",
                            alignItems: "center", justifyContent: "center",
                            borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.18)",
                          }}>
                            <IconWrapper icon="mdi:alert-circle-outline" size={22} color="#ef4444" />
                          </Box>
                        )}
                        {!file.uploading && !file.uploadFailed && file.s3Url && (
                          <Box sx={{
                            position: "absolute", bottom: 4, right: 4,
                            backgroundColor: "#10b981", borderRadius: "50%",
                            width: 14, height: 14, display: "flex",
                            alignItems: "center", justifyContent: "center",
                          }}>
                            <IconWrapper icon="mdi:check" size={10} color="#fff" />
                          </Box>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => removeFile(file.fileId)}
                          sx={{
                            position: "absolute", top: -6, right: -6, width: 18, height: 18,
                            backgroundColor: "#111", color: "#fff", padding: 0,
                            "&:hover": { backgroundColor: "#333" },
                          }}
                        >
                          <IconWrapper icon="mdi:close" size={11} />
                        </IconButton>
                      </Box>
                    ))}
                </Box>
              )}
              {/* Non-image file chips */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {attachedFiles
                  .filter((f) => !f.previewUrl)
                  .map((file, i) => (
                    <Chip
                      key={i}
                      icon={<IconWrapper icon={fileIcon(file.type)} size={14} color="var(--font-secondary)" />}
                      label={
                        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                          <Typography variant="caption" noWrap sx={{ maxWidth: 110 }}>{file.name}</Typography>
                          <Typography variant="caption" color="var(--font-tertiary)">{fileSizeLabel(file.size)}</Typography>
                        </Box>
                      }
                      onDelete={() => removeFile(file.fileId)}
                      size="small"
                      sx={{ height: 26, backgroundColor: "var(--surface)", border: "1px solid var(--border-default)", "& .MuiChip-icon": { ml: 0.5 } }}
                    />
                  ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid var(--border-default)", backgroundColor: "var(--surface)", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="var(--font-tertiary)">
            {BODY_LABEL[postType]} · {body.length} chars
            {postType === "poll" && ` · ${pollOptions.filter((o) => o.trim()).length} options`}
            {postType === "humorous" && humorTone && ` · ${HUMOR_TONES.find((t) => t.key === humorTone)?.label}`}
            {postType === "discussion" && stance && ` · ${STANCES.find((s) => s.key === stance)?.label}`}
            {attachedFiles.length > 0 && ` · ${attachedFiles.length} file${attachedFiles.length > 1 ? "s" : ""}`}
          </Typography>
        </Box>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: "none", color: "var(--font-secondary)" }}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          loading={submitting}
          loadingText={t("common.posting")}
          startIcon={<IconWrapper icon="mdi:send" size={15} />}
          sx={{
            textTransform: "none", fontWeight: 600, borderRadius: "8px", px: 2.5,
            backgroundColor: typeConfig.color, boxShadow: "none",
            "&:hover": { backgroundColor: typeConfig.color, filter: "brightness(0.9)", boxShadow: "none" },
            "&.Mui-disabled": { backgroundColor: "var(--border-default)", color: "var(--font-tertiary)" },
          }}
        >
          {anyUploading ? "Uploading images..." : `Post ${typeConfig.label}`}
        </LoadingButton>
      </DialogActions>

      {/* Emoji picker popover */}
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 0.5,
            p: 1,
            borderRadius: "10px",
            border: "1px solid var(--border-default)",
            maxWidth: 296,
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 0.25,
          }}
        >
          {EMOJI_SET.map((emoji) => (
            <Box
              key={emoji}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                insertAtCursor(emoji, "", emoji);
                setEmojiAnchor(null);
              }}
              sx={{
                width: 32,
                height: 32,
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                cursor: "pointer",
                userSelect: "none",
                "&:hover": { backgroundColor: "var(--surface)" },
              }}
            >
              {emoji}
            </Box>
          ))}
        </Box>
      </Popover>
    </Dialog>
  );
}
