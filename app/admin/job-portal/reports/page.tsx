"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import {
  jobPortalV2AdminService,
  getApiErrorMessage,
  type WeeklyReportResponse,
  type ApplicationStatus,
} from "@/lib/job-portal-v2";
import { useToast } from "@/components/common/Toast";

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState("");
  const [report, setReport] = useState<WeeklyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [exportStatus, setExportStatus] = useState<ApplicationStatus | "">("");
  const [exporting, setExporting] = useState(false);

  const fetchReport = () => {
    if (!weekStart) return;
    setLoading(true);
    setError(null);
    jobPortalV2AdminService
      .getWeeklyReport(weekStart)
      .then(setReport)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await jobPortalV2AdminService.exportCsv({
        date_from: exportDateFrom || undefined,
        date_to: exportDateTo || undefined,
        status: exportStatus || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-portal-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Export downloaded", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: "auto" }}>
      <Button
        component={Link}
        href="/admin/job-portal"
        startIcon={<ArrowLeft size={18} />}
        sx={{
          mb: 2,
          color: "text.secondary",
          textTransform: "none",
          "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
        }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Reports
      </Typography>

      {/* Weekly Report */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Weekly Report
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
          <TextField
            label="Week start (YYYY-MM-DD)"
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 220 }}
          />
          <Button
            variant="contained"
            onClick={fetchReport}
            disabled={!weekStart || loading}
            sx={{
              backgroundColor: "#6366f1",
              textTransform: "none",
              "&:hover": { backgroundColor: "#4f46e5" },
            }}
          >
            {loading ? "Loading..." : "Load report"}
          </Button>
        </Box>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {report && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Week: {report.week_start} to {report.week_end}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 2,
                mt: 2,
              }}
            >
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  New applications
                </Typography>
                <Typography variant="h6">{report.new_applications}</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  New JDs published
                </Typography>
                <Typography variant="h6">{report.new_jds_published}</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Shortlisted
                </Typography>
                <Typography variant="h6">
                  {report.status_changes?.shortlisted ?? 0}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Rejected
                </Typography>
                <Typography variant="h6">
                  {report.status_changes?.rejected ?? 0}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Selected
                </Typography>
                <Typography variant="h6">
                  {report.status_changes?.selected ?? 0}
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Export CSV */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Export CSV
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}>
          <TextField
            label="Date from (YYYY-MM-DD)"
            type="date"
            value={exportDateFrom}
            onChange={(e) => setExportDateFrom(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Date to (YYYY-MM-DD)"
            type="date"
            value={exportDateTo}
            onChange={(e) => setExportDateTo(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <FormControl size="small">
            <InputLabel>Status filter</InputLabel>
            <Select
              value={exportStatus}
              label="Status filter"
              onChange={(e) =>
                setExportStatus(e.target.value as ApplicationStatus | "")
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="applied">Applied</MenuItem>
              <MenuItem value="shortlisted">Shortlisted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="selected">Selected</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={exporting}
            sx={{
              backgroundColor: "#6366f1",
              textTransform: "none",
              alignSelf: "flex-start",
              "&:hover": { backgroundColor: "#4f46e5" },
            }}
          >
            {exporting ? "Exporting..." : "Download CSV"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
