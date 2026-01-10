"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  Typography,
  Autocomplete,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Tag } from "@/lib/services/community.service";

interface CreateThreadDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; body: string; tag_ids: number[] }) => Promise<void>;
  availableTags: Tag[];
}

export function CreateThreadDialog({
  open,
  onClose,
  onSubmit,
  availableTags,
}: CreateThreadDialogProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setBody("");
      setSelectedTags([]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        tag_ids: selectedTags.map((tag) => tag.id),
      });
      onClose();
    } catch (error) {
      // Silently handle thread creation error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:forum" size={24} color="#2563eb" />
          <Typography variant="h6" fontWeight={600}>
            Create New Thread
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {/* Title */}
          <TextField
            label="Title"
            placeholder="What's your question or discussion topic?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
          />

          {/* Body */}
          <TextField
            label="Description"
            placeholder="Provide more details about your question..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            fullWidth
            multiline
            rows={8}
            required
          />

          {/* Tags */}
          <Autocomplete
            multiple
            options={availableTags}
            getOptionLabel={(option) => option.name}
            value={selectedTags}
            onChange={(_, newValue) => setSelectedTags(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Select relevant tags..."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  {...getTagProps({ index })}
                  size="small"
                  sx={{
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                  }}
                />
              ))
            }
          />

          <Typography variant="caption" color="text.secondary">
            💡 Tip: Add relevant tags to help others find your thread easily.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!title.trim() || !body.trim() || submitting}
          startIcon={<IconWrapper icon="mdi:send" />}
        >
          {submitting ? "Creating..." : "Create Thread"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

