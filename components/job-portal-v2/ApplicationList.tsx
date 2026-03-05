"use client";

import { useState } from "react";
import {
  TableRow,
  TableCell,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  Link,
  Box,
  Button,
  InputLabel,
  Typography,
} from "@mui/material";
import { memo } from "react";
import { StatusBadge } from "./StatusBadge";
import type { Application, ApplicationStatus } from "@/lib/job-portal-v2";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "rejected",
  "selected",
];

/** Single application row in admin applications table */
interface ApplicationRowProps {
  application: Application;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onStatusChange: (status: ApplicationStatus) => Promise<void>;
}

export const ApplicationRow = memo(function ApplicationRow({
  application,
  selected,
  onSelect,
  onStatusChange,
}: ApplicationRowProps) {
  const [updating, setUpdating] = useState(false);
  const status = (application.status ?? "applied") as ApplicationStatus;

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (newStatus === status) return;
    try {
      setUpdating(true);
      await onStatusChange(newStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <TableRow>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={(e) => onSelect(e.target.checked)} />
      </TableCell>
      <TableCell>{application.applicant_name}</TableCell>
      <TableCell>{application.applicant_email}</TableCell>
      <TableCell>
        <FormControl size="small" sx={{ minWidth: 120 }} disabled={updating}>
          <Select
            value={status}
            onChange={(e) =>
              handleStatusChange(e.target.value as ApplicationStatus)
            }
            sx={{ fontSize: "0.875rem", height: 32 }}
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </TableCell>
      <TableCell>
        {application.resume_url ? (
          <Link
            href={application.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontSize: "0.875rem" }}
          >
            Resume
          </Link>
        ) : (
          <span style={{ color: "#9ca3af" }}>—</span>
        )}
      </TableCell>
      <TableCell>
        {new Date(application.applied_at).toLocaleDateString()}
      </TableCell>
    </TableRow>
  );
});

/** Bar for bulk status update when rows are selected */
interface BulkStatusUpdateBarProps {
  selectedCount: number;
  selectedStatus: ApplicationStatus;
  onStatusChange: (status: ApplicationStatus) => void;
  onApply: () => void;
  onClearSelection: () => void;
  isUpdating?: boolean;
}

export const BulkStatusUpdateBar = memo(function BulkStatusUpdateBar({
  selectedCount,
  selectedStatus,
  onStatusChange,
  onApply,
  onClearSelection,
  isUpdating = false,
}: BulkStatusUpdateBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        backgroundColor: "rgba(99, 102, 241, 0.08)",
        borderRadius: 2,
        mb: 2,
      }}
    >
      <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
        {selectedCount} selected
      </Typography>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Update to</InputLabel>
        <Select
          value={selectedStatus}
          label="Update to"
          onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
        >
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="contained"
        size="small"
        onClick={onApply}
        disabled={isUpdating}
        sx={{
          backgroundColor: "#6366f1",
          textTransform: "none",
          "&:hover": { backgroundColor: "#4f46e5" },
        }}
      >
        {isUpdating ? "Updating..." : "Apply"}
      </Button>
      <Button size="small" onClick={onClearSelection} sx={{ textTransform: "none" }}>
        Clear selection
      </Button>
    </Box>
  );
});
