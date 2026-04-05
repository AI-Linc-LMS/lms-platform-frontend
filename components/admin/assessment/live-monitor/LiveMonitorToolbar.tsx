"use client";

import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface LiveMonitorToolbarProps {
  title: string;
  roomName?: string;
  search: string;
  onSearchChange: (v: string) => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  page: number;
  totalPages: number;
  filteredCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onMuteAllAudio: () => void;
  onRefreshParticipants?: () => void;
  refreshing?: boolean;
}

export function LiveMonitorToolbar({
  title,
  roomName,
  search,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  page,
  totalPages,
  filteredCount,
  totalCount,
  onPageChange,
  onMuteAllAudio,
  onRefreshParticipants,
  refreshing,
}: LiveMonitorToolbarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        gap: 2,
        mb: 2,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ minWidth: 0, flex: "1 1 200px" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a" }}>
          Live proctoring
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#64748b", mt: 0.5 }}
          noWrap
          title={roomName ? `${title} · ${roomName}` : title}
        >
          {title}
          {roomName ? (
            <Box
              component="span"
              sx={{ ml: 1, color: "#94a3b8", fontSize: "0.75rem" }}
            >
              · {roomName}
            </Box>
          ) : null}
        </Typography>
      </Box>

      <TextField
        size="small"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: { xs: "100%", sm: 220 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconWrapper icon="mdi:magnify" size={18} color="#94a3b8" />
            </InputAdornment>
          ),
        }}
      />

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="live-monitor-page-size">Per page</InputLabel>
        <Select
          labelId="live-monitor-page-size"
          label="Per page"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[12, 24, 48, 96].map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          {filteredCount} / {totalCount} students
        </Typography>
        {onRefreshParticipants && (
          <Tooltip title="Refresh participant list (API)">
            <span>
              <IconButton
                size="small"
                onClick={onRefreshParticipants}
                disabled={refreshing}
                aria-label="Refresh participants"
              >
                {refreshing ? (
                  <IconWrapper icon="mdi:loading" size={20} />
                ) : (
                  <IconWrapper icon="mdi:refresh" size={20} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={onMuteAllAudio}
          startIcon={<IconWrapper icon="mdi:volume-mute" size={18} />}
        >
          Mute all audio
        </Button>
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", md: "auto" } }}>
          <Button
            size="small"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Page {page} / {totalPages}
          </Typography>
          <Button
            size="small"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}
