"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export function ShareDialog({ open, onClose, url, title }: ShareDialogProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select the input. The user can Ctrl+C manually.
      const input = document.getElementById("share-url-input") as HTMLInputElement | null;
      input?.select();
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      // user cancelled or share rejected - no-op
    }
  };

  const targets = [
    {
      key: "twitter",
      label: "X / Twitter",
      icon: "mdi:twitter",
      color: "#1da1f2",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: "mdi:linkedin",
      color: "#0a66c2",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: "mdi:whatsapp",
      color: "#25d366",
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      key: "email",
      label: "Email",
      icon: "mdi:email-outline",
      color: "#6b7280",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
    },
  ];

  const content = (
      <>
        <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
          {targets.map((t) => (
            <Tooltip key={t.key} title={t.label}>
              <Box
                component="a"
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: { xs: 52, sm: "auto" },
                  py: 1.5,
                  borderRadius: "10px",
                  border: "1px solid var(--border-default)",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: t.color,
                    backgroundColor: `${t.color}10`,
                  },
                }}
              >
                <IconWrapper icon={t.icon} size={22} color={t.color} />
              </Box>
            </Tooltip>
          ))}
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "stretch" }}>
          <TextField
            id="share-url-input"
            value={url}
            size="small"
            fullWidth
            InputProps={{
              readOnly: true,
              sx: {
                fontFamily: "monospace",
                fontSize: { xs: "0.8rem", sm: "0.78rem" },
                minHeight: { xs: 44, sm: "auto" },
              },
            }}
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button
            onClick={handleCopy}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              minWidth: { xs: 84, sm: 96 },
              minHeight: { xs: 44, sm: "auto" },
              flexShrink: 0,
              boxShadow: "none",
            }}
            startIcon={
              <IconWrapper
                icon={copied ? "mdi:check" : "mdi:content-copy"}
                size={15}
              />
            }
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </Box>

        {canNativeShare && (
          <Button
            fullWidth
            variant="text"
            onClick={handleNativeShare}
            startIcon={<IconWrapper icon="mdi:export-variant" size={16} />}
            sx={{ mt: 1.5, textTransform: "none", fontWeight: 600, minHeight: { xs: 44, sm: "auto" } }}
          >
            More options…
          </Button>
        )}
      </>
  );

  // A bottom sheet on a phone; on desktop the small centred dialog it always was, unchanged.
  if (isPhone) {
    return (
      <ResponsiveDialog open={open} onClose={onClose} maxWidth="xs" title="Share this post" data-testid="share-sheet">
        <Box sx={{ pt: 1 }}>{content}</Box>
      </ResponsiveDialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "14px", border: "1px solid var(--border-default)" },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <IconWrapper icon="mdi:share-variant" size={20} color="var(--accent-indigo)" />
          <Typography variant="subtitle1" fontWeight={700}>
            Share this post
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ ml: "auto" }}>
            <IconWrapper icon="mdi:close" size={18} color="var(--font-secondary)" />
          </IconButton>
        </Box>
        {content}
      </DialogContent>
    </Dialog>
  );
}
