"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Thread } from "@/lib/services/community.service";

interface EditThreadDialogProps {
  open: boolean;
  thread: Pick<Thread, "id" | "title" | "body"> | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; body: string }) => Promise<void> | void;
}

export function EditThreadDialog({
  open,
  thread,
  busy = false,
  onClose,
  onSubmit,
}: EditThreadDialogProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (open && thread) {
      setTitle(thread.title || "");
      setBody(thread.body || "");
    }
  }, [open, thread]);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    await onSubmit({ title: title.trim(), body: body.trim() });
  };

  const dirty =
    thread &&
    (title.trim() !== (thread.title || "").trim() ||
      body.trim() !== (thread.body || "").trim());

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 700 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "var(--surface-indigo-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:pencil-outline" size={20} color="var(--accent-indigo)" />
        </Box>
        Edit post
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: "var(--font-primary-dark)", display: "block", mb: 0.5 }}
        >
          Title
        </Typography>
        <TextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          size="small"
          placeholder="Post title"
          sx={{ mb: 2 }}
        />
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: "var(--font-primary-dark)", display: "block", mb: 0.5 }}
        >
          Body
        </Typography>
        <TextField
          value={body}
          onChange={(e) => setBody(e.target.value)}
          fullWidth
          multiline
          rows={8}
          size="small"
          placeholder="What's on your mind?"
        />
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1, color: "var(--font-tertiary)" }}
        >
          Edits are visible to all members. The original post date is unchanged.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={busy}
          sx={{ textTransform: "none", color: "var(--font-secondary)" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={busy || !title.trim() || !body.trim() || !dirty}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "var(--accent-indigo)",
            color: "var(--font-light)",
            "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
            "&.Mui-disabled": {
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 35%, var(--surface) 65%)",
              color: "var(--font-secondary)",
            },
          }}
        >
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
