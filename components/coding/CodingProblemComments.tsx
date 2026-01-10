"use client";

import { Box, Typography, TextField, Button, Avatar, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";

interface CodingProblemCommentsProps {
  comments: any[];
  newComment: string;
  submittingComment: boolean;
  loading: boolean;
  onCommentChange: (value: string) => void;
  onSubmitComment: () => void;
}

export function CodingProblemComments({
  comments,
  newComment,
  submittingComment,
  loading,
  onCommentChange,
  onSubmitComment,
}: CodingProblemCommentsProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 0 ? "Just now" : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
        });
      }
    }
  };

  if (loading) {
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
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        height: "100%",
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
          gap: 2,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f3f4f6",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#d1d5db",
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "#9ca3af",
            },
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
            <IconWrapper icon="mdi:comment-outline" size={48} color="#9ca3af" />
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 2, fontWeight: 500 }}>
              No comments yet
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af", mt: 0.5 }}>
              Be the first to share your thoughts
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
                  gap: 1.5,
                  alignItems: "flex-start",
                }}
              >
                {/* Avatar */}
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
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    backgroundColor: "#6366f1",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {isCurrentUser
                    ? user?.user_name?.[0]?.toUpperCase() || "Y"
                    : comment.user_profile?.user_name?.[0]?.toUpperCase() || "U"}
                </Avatar>

                {/* Comment Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "#111827",
                        fontSize: "0.875rem",
                      }}
                    >
                      {isCurrentUser
                        ? user?.user_name || "You"
                        : comment.user_profile?.user_name || "Anonymous"}
                    </Typography>
                    {comment.created_at && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#9ca3af",
                          fontSize: "0.75rem",
                        }}
                      >
                        {formatTime(comment.created_at)}
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#374151",
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {comment.text || comment.comment || comment.body || ""}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Comment Input */}
      <Box
        sx={{
          p: 2,
          backgroundColor: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Add a comment..."
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
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-root": {
                  fontSize: "0.875rem",
                  "& fieldset": {
                    borderColor: "#e5e7eb",
                  },
                  "&:hover fieldset": {
                    borderColor: "#d1d5db",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6366f1",
                    borderWidth: "1px",
                  },
                },
              }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={onSubmitComment}
            disabled={!newComment.trim() || submittingComment}
            startIcon={
              submittingComment ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:send" size={18} />
              )
            }
            sx={{
              bgcolor: "#6366f1",
              "&:hover": { bgcolor: "#4f46e5" },
              "&:disabled": { bgcolor: "#9ca3af" },
              minWidth: 100,
              height: 40,
            }}
          >
            {submittingComment ? "Posting..." : "Post"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

