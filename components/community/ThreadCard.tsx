"use client";

import { useRouter } from "next/navigation";

import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box, Paper, Typography, Chip, Avatar, IconButton, Tooltip } from "@mui/material";

import { POST_TYPE_CONFIG, type Thread } from "@/lib/services/community.service";
import { usePrefetchOnHover } from "@/hooks/usePrefetchOnHover";
import { IconWrapper } from "@/components/common/IconWrapper";
import { VoteButtons } from "./VoteButtons";
import { PollWidget } from "./PollWidget";
import { QuickCommentBar } from "./QuickCommentBar";
import { ImageGallery } from "./ImageGallery";

import { formatDistanceToNow } from "@/lib/utils/date-utils";

const CARD_MD_SX = {
  "& p": { mb: 0.35, mt: 0, lineHeight: 1.65, color: "var(--font-secondary)", fontSize: "0.875rem" },
  "& h1, & h2, & h3, & h4": {
    fontSize: "0.92rem", fontWeight: 700, mb: 0.25, mt: 0.25,
    color: "var(--font-primary)", lineHeight: 1.4,
  },
  "& strong": { fontWeight: 700 },
  "& em": { fontStyle: "italic" },
  "& code": {
    fontFamily: "monospace", fontSize: "0.8em",
    backgroundColor: "rgba(0,0,0,0.06)", borderRadius: "3px", px: "3px", py: "1px",
  },
  "& pre": {
    backgroundColor: "#1a1b26", color: "#c0caf5", borderRadius: "6px",
    p: 0.75, my: 0.5, overflowX: "auto", fontSize: "0.78rem",
    "& code": { backgroundColor: "transparent", px: 0 },
  },
  "& ul, & ol": { pl: 2, mb: 0.35, mt: 0 },
  "& li": { mb: 0.1, fontSize: "0.875rem", color: "var(--font-secondary)" },
  "& blockquote": {
    borderLeft: "2px solid var(--border-default)", pl: 1, ml: 0,
    color: "var(--font-secondary)", my: 0.4,
  },
  "& a": { color: "var(--accent-indigo)", textDecoration: "underline" },
  "& hr": { border: "none", borderTop: "1px solid var(--border-default)", my: 0.75 },
  "& img": { maxWidth: "100%", borderRadius: "6px", my: 0.5 },
  "& table": { borderCollapse: "collapse", width: "100%", mb: 0.75 },
  "& th, & td": { border: "1px solid var(--border-default)", px: 1, py: 0.4, fontSize: "0.8rem" },
};

/**
 * A thumb needs 44px of target; the desktop row is deliberately dense, so the step-up is xs-only.
 * Applied to every control in the card's action row, which the audit found at 28-34px.
 */
const TOUCH = {
  minWidth: { xs: 44, sm: "auto" },
  minHeight: { xs: 44, sm: "auto" },
} as const;

interface ThreadCardProps {
  thread: Thread;
  onVote: (threadId: number, type: "upvote" | "downvote") => Promise<void>;
  onBookmark?: (threadId: number) => Promise<void>;
  onPollVote?: (threadId: number, optionIndex: number) => Promise<void>;
  onComment?: (threadId: number, body: string) => Promise<void>;
  onOfferBounty?: (threadId: number) => void;
  onTagClick?: (tag: { id: number; name: string }) => void;
  onAuthorClick?: (authorId: number) => void;
  onShare?: (threadId: number) => void;
  onReport?: (threadId: number) => void;
  currentUserName?: string | null;
}

export function ThreadCard({
  thread,
  onVote,
  onBookmark,
  onPollVote,
  onComment,
  onOfferBounty,
  onTagClick,
  onAuthorClick,
  onShare,
  onReport,
  currentUserName,
}: ThreadCardProps) {
  const router = useRouter();
  const { t } = useTranslation("common");

  const isSaving = thread.id < 0;
  const isPoll = thread.post_type === "poll" && !!thread.poll_options?.length;
  const isBodyLong = (thread.body?.length ?? 0) > 400;
  const hasBounty = !!thread.bounty && thread.bounty.status === "active";
  const isAuthor = !!currentUserName && thread.author.user_name === currentUserName;
  const canOfferBounty = isAuthor && thread.post_type === "question" && !hasBounty && !isSaving;

  // Warm the thread route on hover. Skipped while the card is mid-save (isSaving), which is the
  // same condition that makes the click a no-op below.
  const prefetchProps = usePrefetchOnHover(isSaving ? null : `/community/${thread.id}`);

  const handleThreadClick = () => {
    if (isSaving) return;
    router.push(`/community/${thread.id}`);
  };

  const pt = (thread.post_type || "question") as keyof typeof POST_TYPE_CONFIG;
  const postTypeCfg = POST_TYPE_CONFIG[pt];

  return (
    <Paper
      elevation={0}
      {...prefetchProps}
      sx={{
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        background: "var(--card-bg)",
        transition: "all 0.2s",
        opacity: isSaving ? 0.72 : 1,
        overflow: "hidden",
        ...(isSaving ? {} : {
          "&:hover": {
            borderColor: "color-mix(in srgb, var(--border-default) 70%, var(--font-secondary) 30%)",
            boxShadow: "0 2px 8px color-mix(in srgb, var(--font-primary) 18%, transparent)",
          },
        }),
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box
          data-testid="thread-body-row"
          sx={{
            display: "flex",
            gap: { xs: 0, sm: 3 },
            alignItems: "flex-start",
            // A flex child's min-width is `auto`, so any wide row inside the content column made
            // the column wider than the card - which clips, because the Paper hides its overflow.
            "& > *": { minWidth: 0 },
          }}
        >
          {/* Vote rail - the left gutter costs 80px of a 358px card, so on a phone the votes move
              into the action row below instead. */}
          <Box
            data-testid="thread-vote-rail"
            sx={{
              minWidth: 56,
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              alignItems: "center",
              pt: 0.25,
            }}
          >
            <VoteButtons
              upvotes={thread.upvotes}
              downvotes={thread.downvotes}
              userVote={thread.user_vote}
              onVote={(type) => onVote(thread.id, type)}
              size="small"
              orientation="vertical"
              disabled={isSaving}
            />
          </Box>

          {/* Thread Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Top row: post-type badge + pin/lock + timestamp */}
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 0.5, gap: 0.75, mb: 0.75 }}>
              <Chip
                icon={<IconWrapper icon={postTypeCfg.icon} size={12} color={postTypeCfg.color} />}
                label={postTypeCfg.label}
                size="small"
                sx={{
                  height: { xs: 24, sm: 20 },
                  fontSize: { xs: "0.75rem", sm: "0.67rem" },
                  fontWeight: 600, letterSpacing: "0.02em",
                  backgroundColor: `${postTypeCfg.color}12`, color: postTypeCfg.color,
                  border: `1px solid ${postTypeCfg.color}28`,
                  "& .MuiChip-icon": { ml: 0.5 },
                }}
              />
              {thread.is_pinned && (
                <Tooltip title="Pinned by a moderator">
                  <Chip
                    icon={<IconWrapper icon="mdi:pin" size={11} color="#f59e0b" />}
                    label="Pinned"
                    size="small"
                    sx={{
                      height: { xs: 24, sm: 20 }, fontSize: { xs: "0.75rem", sm: "0.67rem" }, fontWeight: 600,
                      backgroundColor: "rgba(245,158,11,0.12)", color: "#b45309",
                      border: "1px solid rgba(245,158,11,0.3)",
                      "& .MuiChip-icon": { ml: 0.5 },
                    }}
                  />
                </Tooltip>
              )}
              {thread.is_locked && (
                <Tooltip title="Locked - new comments disabled">
                  <Chip
                    icon={<IconWrapper icon="mdi:lock-outline" size={11} color="#6b7280" />}
                    label="Locked"
                    size="small"
                    sx={{
                      height: { xs: 24, sm: 20 }, fontSize: { xs: "0.75rem", sm: "0.67rem" }, fontWeight: 600,
                      backgroundColor: "rgba(107,114,128,0.12)", color: "#374151",
                      border: "1px solid rgba(107,114,128,0.3)",
                      "& .MuiChip-icon": { ml: 0.5 },
                    }}
                  />
                </Tooltip>
              )}
              <Typography variant="caption" sx={{ ml: "auto", color: "var(--font-secondary)", whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                {formatDistanceToNow(thread.created_at)}
              </Typography>
            </Box>

            {/* Title */}
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 0.5, gap: 1, mb: 0.75 }}>
              <Typography
                variant="h6"
                fontWeight={600}
                onClick={handleThreadClick}
                sx={{
                  cursor: isSaving ? "default" : "pointer",
                  color: "var(--font-primary)",
                  // h6 is 1.25rem, which turns a normal title into four lines on a phone.
                  fontSize: { xs: "1.05rem", sm: "1.25rem" },
                  lineHeight: { xs: 1.3, sm: 1.6 },
                  minWidth: 0,
                  overflowWrap: "anywhere",
                  ...(!isSaving && { "&:hover": { color: "var(--accent-indigo)" } }),
                }}
              >
                {thread.title}
              </Typography>
              {isSaving && (
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontStyle: "italic", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Saving…
                </Typography>
              )}
              {hasBounty && (
                <Box
                  sx={{
                    display: "flex", alignItems: "center", gap: 0.4, flexShrink: 0,
                    backgroundColor: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: "20px", px: 0.9, py: 0.2,
                  }}
                >
                  <IconWrapper icon="mdi:fire" size={12} color="#f59e0b" />
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#f59e0b", fontSize: "0.7rem" }}>
                    +{thread.bounty!.points} IP
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Body - rendered as markdown, gradient fade for long posts */}
            {thread.body && (
              <Box
                sx={{
                  position: "relative",
                  mb: isPoll ? 1 : 1.5,
                  ...(isBodyLong ? {
                    maxHeight: 96,
                    overflow: "hidden",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 0, left: 0, right: 0,
                      height: 48,
                      background: "linear-gradient(to bottom, transparent, var(--card-bg))",
                      pointerEvents: "none",
                    },
                  } : {}),
                  ...CARD_MD_SX,
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.body}</ReactMarkdown>
              </Box>
            )}

            {/* Attached images - Instagram-style gallery with lightbox */}
            {thread.image_urls && thread.image_urls.length > 0 && (
              <Box sx={{ mb: isPoll ? 1 : 1.5 }}>
                <ImageGallery urls={thread.image_urls} variant="card" />
              </Box>
            )}

            {/* Inline Poll */}
            {isPoll && (
              <PollWidget thread={thread} onPollVote={onPollVote} isSaving={isSaving} />
            )}

            {/* Tags */}
            {thread.tags.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {thread.tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={`#${tag.name}`}
                    size="small"
                    onClick={onTagClick ? (e) => { e.stopPropagation(); onTagClick(tag); } : undefined}
                    sx={{
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 18%, var(--surface) 82%)",
                      color: "var(--accent-indigo)", fontWeight: 600, fontSize: "0.75rem",
                      // A tag is how you filter the feed, so on a phone it is a real tap target.
                      height: { xs: 40, sm: 26 }, borderRadius: "6px",
                      cursor: onTagClick ? "pointer" : "default",
                      "&:hover": onTagClick
                        ? { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 32%, var(--surface) 68%)" }
                        : undefined,
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Meta row: author + stats.
                On a phone the author line and the action row are two rows: side by side they add
                up to more than the card is wide, which is what was being clipped. */}
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
              <Box
                onClick={
                  onAuthorClick && thread.author.id
                    ? (e) => { e.stopPropagation(); onAuthorClick(thread.author.id); }
                    : undefined
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                  maxWidth: "100%",
                  cursor: onAuthorClick && thread.author.id ? "pointer" : "default",
                  borderRadius: "6px",
                  px: 0.5,
                  mx: -0.5,
                  "&:hover": onAuthorClick && thread.author.id
                    ? { backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)" }
                    : undefined,
                }}
              >
                <Avatar src={thread.author.profile_pic_url} sx={{ width: 20, height: 20, flexShrink: 0 }}>
                  {thread.author.name.charAt(0)}
                </Avatar>
                <Typography
                  variant="caption"
                  color="var(--font-secondary)"
                  noWrap
                  sx={{
                    fontSize: { xs: "0.78rem", sm: "0.75rem" },
                    minWidth: 0,
                    ...(onAuthorClick && thread.author.id
                      ? { "&:hover": { color: "var(--accent-indigo)", textDecoration: "underline" } }
                      : {}),
                  }}
                >
                  {thread.author.name}
                </Typography>
                <Chip
                  label={thread.author.role}
                  size="small"
                  sx={{
                    height: { xs: 22, sm: 18 },
                    fontSize: { xs: "0.75rem", sm: "0.65rem" },
                    flexShrink: 0,
                    backgroundColor: "var(--surface)", border: "1px solid var(--border-default)", color: "var(--font-secondary)",
                  }}
                />
              </Box>

              <Box
                data-testid="thread-actions"
                sx={{
                  ml: { xs: 0, sm: "auto" },
                  width: { xs: "100%", sm: "auto" },
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  rowGap: 0.5,
                  gap: 0.5,
                  justifyContent: { xs: "space-between", sm: "flex-end" },
                }}
              >
                {/* The vote rail is hidden on a phone, so the votes live here instead. */}
                <Box data-testid="thread-vote-inline" sx={{ display: { xs: "flex", sm: "none" } }}>
                  <VoteButtons
                    upvotes={thread.upvotes}
                    downvotes={thread.downvotes}
                    userVote={thread.user_vote}
                    onVote={(type) => onVote(thread.id, type)}
                    size="small"
                    orientation="horizontal"
                    disabled={isSaving}
                  />
                </Box>
                <Tooltip title={t("community.comments")}>
                  <Box
                    onClick={handleThreadClick}
                    sx={{ ...TOUCH, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, px: 1, cursor: "pointer", borderRadius: "6px", "&:hover": { backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)" } }}
                  >
                    <IconWrapper icon="mdi:comment-outline" size={16} color="var(--font-secondary)" />
                    <Typography variant="caption" color="var(--font-secondary)" sx={{ fontSize: { xs: "0.78rem", sm: "0.75rem" } }}>{thread.comments_count}</Typography>
                  </Box>
                </Tooltip>

                {canOfferBounty && onOfferBounty && (
                  <Tooltip title="Offer a bounty to get answers faster">
                    <Box
                      onClick={() => onOfferBounty(thread.id)}
                      sx={{
                        ...TOUCH,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 0.4, cursor: "pointer",
                        px: 0.9, py: 0.3, borderRadius: "6px",
                        "&:hover": { backgroundColor: "rgba(245,158,11,0.08)" },
                      }}
                    >
                      <IconWrapper icon="mdi:fire-outline" size={15} color="var(--font-secondary)" />
                      <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: { xs: "0.78rem", sm: "0.73rem" } }}>
                        Bounty
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
                {onShare && !isSaving && (
                  <Tooltip title="Share">
                    <IconButton
                      size="small"
                      onClick={() => onShare(thread.id)}
                      sx={{
                        ...TOUCH,
                        color: "var(--font-secondary)",
                        "&:hover": { color: "var(--accent-indigo)", backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" },
                      }}
                    >
                      <IconWrapper icon="mdi:share-variant-outline" size={18} />
                    </IconButton>
                  </Tooltip>
                )}
                {onReport && !isSaving && !isAuthor && (
                  <Tooltip title="Report">
                    <IconButton
                      size="small"
                      onClick={() => onReport(thread.id)}
                      sx={{
                        ...TOUCH,
                        color: "var(--font-secondary)",
                        "&:hover": { color: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)" },
                      }}
                    >
                      <IconWrapper icon="mdi:flag-outline" size={18} />
                    </IconButton>
                  </Tooltip>
                )}
                {onBookmark && !isSaving && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title={thread.user_bookmarked ? t("community.removeBookmark") : t("community.bookmark")}>
                      <IconButton
                        size="small"
                        onClick={() => onBookmark(thread.id)}
                        sx={{ ...TOUCH, color: "var(--font-secondary)", "&:hover": { backgroundColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)" } }}
                      >
                        <IconWrapper icon={thread.user_bookmarked ? "mdi:bookmark" : "mdi:bookmark-outline"} size={20} />
                      </IconButton>
                    </Tooltip>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--font-secondary)", fontSize: { xs: "0.78rem", sm: "0.75rem" }, minWidth: "1ch", visibility: thread.bookmarks_count > 0 ? "visible" : "hidden" }}
                    >
                      {thread.bookmarks_count}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Quick comment bar */}
      {onComment && !isSaving && (
        <QuickCommentBar threadId={thread.id} onComment={onComment} />
      )}
    </Paper>
  );
}
