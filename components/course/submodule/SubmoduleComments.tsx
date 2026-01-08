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
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
        backgroundColor: "#ece5dd",
        backgroundImage:
          'url(\'data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 100 0 L 0 0 0 100" fill="none" stroke="%23d4d4d4" stroke-width="0.5" opacity="0.3"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grid)" /%3E%3C/svg%3E\')',
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
            backgroundColor: "rgba(0,0,0,0.2)",
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
            <IconWrapper icon="mdi:comment-outline" size={48} color="#9ca3af" />
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 2 }}>
              No comments yet
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af", mt: 0.5 }}>
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
                    backgroundColor: "#6366f1",
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
                      color: "#667781",
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
                      backgroundColor: isCurrentUser ? "#dcf8c6" : "#ffffff",
                      borderRadius: "0 7.5px 7.5px 7.5px",
                      padding: "6px 7px 4px 9px",
                      boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
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
                          ? "transparent #dcf8c6 transparent transparent"
                          : "transparent #ffffff transparent transparent",
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#111b21",
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
                          color: "#667781",
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
                          color="#53bdeb"
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
          backgroundColor: "#f0f2f5",
          borderTop: "1px solid #e9edef",
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
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-root": {
                  fontSize: "0.9375rem",
                  borderRadius: "21.5px",
                  "& fieldset": {
                    borderColor: "#e9edef",
                    borderWidth: "1px",
                  },
                  "&:hover fieldset": {
                    borderColor: "#d1d7db",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#d1d7db",
                    borderWidth: "1px",
                  },
                  "& textarea": {
                    padding: "9px 12px",
                    "&::placeholder": {
                      color: "#667781",
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
              backgroundColor: submittingComment ? "#8696a0" : "#25d366",
              minWidth: 48,
              width: 48,
              height: 48,
              borderRadius: "50%",
              "&:hover": {
                backgroundColor: submittingComment ? "#8696a0" : "#20ba5a",
              },
              "&:disabled": {
                backgroundColor: "#8696a0",
              },
              boxShadow: "none",
              transition: "background-color 0.2s",
            }}
          >
            <IconWrapper
              icon={submittingComment ? "mdi:loading" : "mdi:send"}
              size={20}
              color="#ffffff"
            />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
