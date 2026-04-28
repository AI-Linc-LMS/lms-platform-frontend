"use client";

import { Box, Typography, TextField, Button, Avatar } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";

interface SubmoduleCommentsProps {
  comments: any[];
  newComment: string;
  submittingComment: boolean;
  selectedContentId: number | null;
  onCommentChange: (value: string) => void;
  onSubmitComment: () => void;
}

export function SubmoduleComments({
  comments,
  newComment,
  submittingComment,
  selectedContentId,
  onCommentChange,
  onSubmitComment,
}: SubmoduleCommentsProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  if (!selectedContentId) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
          Select a content item to view comments
        </Typography>
      </Box>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--surface)",
      }}
    >
      {/* Comments List */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor:
              "color-mix(in srgb, var(--font-primary) 20%, transparent)",
            borderRadius: "3px",
          },
        }}
      >
        {comments.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              py: 4,
            }}
          >
            <IconWrapper
              icon="mdi:comment-outline"
              size={48}
              color="var(--font-tertiary)"
            />
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 2 }}>
              No comments yet
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--font-tertiary)", mt: 0.5 }}>
              Be the first to comment
            </Typography>
          </Box>
        ) : (
          comments.map((comment) => {
            const isCurrentUser = comment.user_profile?.id === currentUserId;

            return (
              <Box
                key={comment.id || comment.created_at}
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "flex-end",
                  gap: 0.5,
                  mb: 1,
                  px: 0.5,
                }}
              >
                {/* Avatar - Always on the left */}
                <Avatar
                  src={
                    isCurrentUser
                      ? user?.profile_picture
                      : comment.user_profile?.profile_pic_url
                  }
                  alt={
                    isCurrentUser
                      ? user?.user_name || "You"
                      : comment.user_profile?.user_name || "User"
                  }
                  sx={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    backgroundColor: "var(--accent-indigo)",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                  }}
                >
                  {isCurrentUser
                    ? user?.user_name?.[0]?.toUpperCase() || "Y"
                    : comment.user_profile?.user_name?.[0]?.toUpperCase() ||
                      "U"}
                </Avatar>

                {/* Message Container */}
                <Box
                  sx={{
                    maxWidth: "75%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  {/* User name - always show above the bubble */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.75rem",
                      mb: 0.25,
                      px: 0.5,
                      fontWeight: 400,
                    }}
                  >
                    {isCurrentUser
                      ? user?.user_name || "You"
                      : comment.user_profile?.user_name || "Anonymous"}
                  </Typography>

                  {/* Message bubble - always left aligned */}
                  <Box
                    sx={{
                      backgroundColor: isCurrentUser
                        ? "color-mix(in srgb, var(--success-500) 18%, var(--card-bg) 82%)"
                        : "var(--card-bg)",
                      borderRadius: "0 7.5px 7.5px 7.5px",
                      padding: "6px 7px 4px 9px",
                      boxShadow:
                        "0 1px 0.5px color-mix(in srgb, var(--font-primary) 16%, transparent)",
                      position: "relative",
                      wordBreak: "break-word",
                      minWidth: "60px",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        left: -7,
                        bottom: 0,
                        width: 0,
                        height: 0,
                        borderStyle: "solid",
                        borderWidth: "0 7px 11px 0",
                        borderColor: isCurrentUser
                          ? "transparent color-mix(in srgb, var(--success-500) 18%, var(--card-bg) 82%) transparent transparent"
                          : "transparent var(--card-bg) transparent transparent",
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-primary)",
                        fontSize: "0.9375rem",
                        lineHeight: 1.4,
                        mb: 0.5,
                      }}
                    >
                      {comment.text || comment.comment || comment.body || ""}
                    </Typography>

                    {/* Timestamp - below text at bottom right */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 0.5,
                        mt: 0.25,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--font-secondary)",
                          fontSize: "0.6875rem",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {comment.created_at && formatTime(comment.created_at)}
                      </Typography>
                      {isCurrentUser && (
                        <IconWrapper
                          icon="mdi:check-all"
                          size={13}
                          color="var(--accent-indigo)"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Comment Input */}
      <Box
        sx={{
          p: 1.5,
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border-default)",
        }}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type a message..."
              value={newComment}
              onChange={(e) => onCommentChange(e.target.value)}
              variant="outlined"
              size="small"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && newComment.trim()) {
                  e.preventDefault();
                  onSubmitComment();
                }
              }}
              sx={{
                backgroundColor: "var(--card-bg)",
                "& .MuiOutlinedInput-root": {
                  fontSize: "0.9375rem",
                  borderRadius: "21.5px",
                  "& fieldset": {
                    borderColor: "var(--border-default)",
                    borderWidth: "1px",
                  },
                  "&:hover fieldset": {
                    borderColor:
                      "color-mix(in srgb, var(--border-default) 70%, var(--font-secondary) 30%)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor:
                      "color-mix(in srgb, var(--border-default) 70%, var(--accent-indigo) 30%)",
                    borderWidth: "1px",
                  },
                  "& textarea": {
                    padding: "9px 12px",
                    "&::placeholder": {
                      color: "var(--font-secondary)",
                      opacity: 1,
                    },
                  },
                },
              }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={onSubmitComment}
            disabled={!newComment.trim() || submittingComment}
            sx={{
              backgroundColor: submittingComment
                ? "color-mix(in srgb, var(--font-tertiary) 70%, var(--surface) 30%)"
                : "var(--success-500)",
              minWidth: 48,
              width: 48,
              height: 48,
              borderRadius: "50%",
              "&:hover": {
                backgroundColor: submittingComment
                  ? "color-mix(in srgb, var(--font-tertiary) 70%, var(--surface) 30%)"
                  : "color-mix(in srgb, var(--success-500) 85%, black 15%)",
              },
              "&.Mui-disabled": {
                backgroundColor:
                  "color-mix(in srgb, var(--font-tertiary) 70%, var(--surface) 30%)",
              },
              boxShadow: "none",
              transition: "background-color 0.2s",
            }}
          >
            <IconWrapper
              icon={submittingComment ? "mdi:loading" : "mdi:send"}
              size={20}
              color="var(--font-light)"
            />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
