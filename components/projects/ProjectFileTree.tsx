"use client";

import { Box, List, ListItemButton, ListItemText, Tooltip, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { isEditable } from "@/lib/services/project-workspace.service";

/**
 * The project's files. Read-only ones are shown rather than hidden: a learner needs to read the
 * fixture or config a brief hands them, they just may not change it.
 *
 * The lock here is an affordance only. The server re-applies `editable_paths` on every save, so a
 * client that ignores this cannot actually write to a protected path.
 */

interface ProjectFileTreeProps {
  files: Record<string, string>;
  editablePaths: string[];
  activePath: string;
  onSelect: (path: string) => void;
}

export default function ProjectFileTree({
  files, editablePaths, activePath, onSelect,
}: ProjectFileTreeProps) {
  const paths = Object.keys(files).sort();

  return (
    <Box sx={{ height: "100%", overflow: "auto", borderRight: 1, borderColor: "divider" }}>
      <Typography
        variant="caption"
        sx={{ display: "block", px: 1.5, py: 0.75, color: "text.secondary",
              borderBottom: 1, borderColor: "divider" }}
      >
        Files
      </Typography>
      <List dense disablePadding>
        {paths.map((path) => {
          const editable = isEditable(path, editablePaths);
          return (
            <ListItemButton
              key={path}
              selected={path === activePath}
              onClick={() => onSelect(path)}
              sx={{ py: 0.4 }}
            >
              <ListItemText
                primary={path}
                primaryTypographyProps={{
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 12.5,
                  color: editable ? "text.primary" : "text.secondary",
                }}
              />
              {!editable && (
                <Tooltip title="Provided by the brief - you can read this, but not change it">
                  <LockOutlinedIcon sx={{ fontSize: 14, color: "text.disabled", ml: 0.5 }} />
                </Tooltip>
              )}
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
