"use client";

import { memo, useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface MCQOption {
  id: string;
  text: string;
}

interface MCQQuestionModalProps {
  open: boolean;
  options: MCQOption[];
  multiSelect: boolean;
  spokenIntro?: string;
  onSubmit: (selected: { ids: string[]; labels: string[] }) => void;
}

function MCQQuestionModalComponent({
  open,
  options,
  multiSelect,
  spokenIntro,
  onSubmit,
}: MCQQuestionModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) setSelectedIds([]);
  }, [open, options]);

  const toggleId = (id: string) => {
    if (multiSelect) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleSubmit = () => {
    const labels = options
      .filter((o) => selectedIds.includes(o.id))
      .map((o) => o.text);
    onSubmit({ ids: selectedIds, labels });
  };

  if (!options || options.length === 0) return null;

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: "var(--card-bg)",
          color: "var(--font-primary-dark)",
        },
      }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconWrapper icon="mdi:format-list-checks" size={22} color="var(--accent-indigo)" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Quick Multiple Choice
          </Typography>
          {multiSelect && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: "var(--surface-indigo-light)",
                color: "var(--accent-indigo)",
                fontSize: "0.7rem",
                fontWeight: 600,
              }}
            >
              SELECT ALL THAT APPLY
            </Box>
          )}
        </Box>

        {spokenIntro && (
          <Typography
            variant="body2"
            sx={{
              color: "var(--font-primary-dark)",
              lineHeight: 1.55,
              backgroundColor: "var(--surface)",
              p: 1.5,
              borderRadius: 2,
              border: "1px solid var(--border-default)",
            }}
          >
            {spokenIntro}
          </Typography>
        )}

        {multiSelect ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {options.map((opt) => (
              <FormControlLabel
                key={opt.id}
                control={
                  <Checkbox
                    checked={selectedIds.includes(opt.id)}
                    onChange={() => toggleId(opt.id)}
                  />
                }
                label={opt.text}
                sx={{
                  m: 0,
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: selectedIds.includes(opt.id)
                    ? "var(--accent-indigo)"
                    : "var(--border-default)",
                  backgroundColor: selectedIds.includes(opt.id)
                    ? "var(--surface-indigo-light)"
                    : "transparent",
                  transition: "all 0.15s ease",
                }}
              />
            ))}
          </Box>
        ) : (
          <RadioGroup
            value={selectedIds[0] || ""}
            onChange={(_, v) => toggleId(v)}
            sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
          >
            {options.map((opt) => (
              <FormControlLabel
                key={opt.id}
                value={opt.id}
                control={<Radio />}
                label={opt.text}
                sx={{
                  m: 0,
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: selectedIds.includes(opt.id)
                    ? "var(--accent-indigo)"
                    : "var(--border-default)",
                  backgroundColor: selectedIds.includes(opt.id)
                    ? "var(--surface-indigo-light)"
                    : "transparent",
                  transition: "all 0.15s ease",
                }}
              />
            ))}
          </RadioGroup>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, pt: 1 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={selectedIds.length === 0}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "var(--accent-indigo)",
              "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
            }}
          >
            Submit Answer
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

export const MCQQuestionModal = memo(MCQQuestionModalComponent);
MCQQuestionModal.displayName = "MCQQuestionModal";
