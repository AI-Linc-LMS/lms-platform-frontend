"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import {
  jobPortalV2AdminService,
  getApiErrorMessage,
  JOB_PORTAL_PAGE_SIZE,
  type Application,
  type ApplicationStatus,
} from "@/lib/job-portal-v2";
import {
  ApplicationRow,
  BulkStatusUpdateBar,
  EmptyState,
  ErrorAlert,
  JobPortalPagination,
} from "@/components/job-portal-v2";
import { useToast } from "@/components/common/Toast";

export default function AdminApplicationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const jdId = parseInt(String(searchParams.get("jdId")), 10);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const status = (searchParams.get("status") as ApplicationStatus | null) || "";

  const [applications, setApplications] = useState<Application[]>([]);
  const [count, setCount] = useState(0);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total: 0,
    limit: JOB_PORTAL_PAGE_SIZE,
    has_next: false,
    has_previous: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>("shortlisted");
  const [updating, setUpdating] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) p.set(key, value);
        else p.delete(key);
      });
      router.push(`/admin/job-portal/applications?${p.toString()}`);
    },
    [router, searchParams]
  );

  const fetchApplications = useCallback(async () => {
    if (isNaN(jdId)) return;
    try {
      setLoading(true);
      setError(null);
      const res = await jobPortalV2AdminService.getApplications(jdId, {
        page,
        limit: JOB_PORTAL_PAGE_SIZE,
        status: status || undefined,
      });
      setApplications(res.applications ?? []);
      setCount(res.count ?? 0);
      setPagination(
        res.pagination ?? {
          current_page: page,
          total_pages: 1,
          total: res.count ?? 0,
          limit: JOB_PORTAL_PAGE_SIZE,
          has_next: false,
          has_previous: false,
        }
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [jdId, page, status]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleSelect = (appId: number, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(appId);
      else next.delete(appId);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(applications.map((a) => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleStatusChange = async (appId: number, newStatus: ApplicationStatus) => {
    try {
      await jobPortalV2AdminService.updateApplicationStatus(jdId, appId, newStatus);
      fetchApplications();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) return;
    try {
      setUpdating(true);
      await jobPortalV2AdminService.bulkUpdateStatus({
        application_ids: Array.from(selectedIds),
        status: bulkStatus,
      });
      showToast("Status updated", "success");
      setSelectedIds(new Set());
      fetchApplications();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setUpdating(false);
    }
  };

  if (isNaN(jdId)) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Invalid job ID. Use ?jdId=123</Typography>
        <Button component={Link} href="/admin/job-portal/jobs">
          Back to Job List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: "auto" }}>
      <Button
        component={Link}
        href={`/admin/job-portal/job?id=${jdId}`}
        startIcon={<ArrowLeft size={18} />}
        sx={{
          mb: 2,
          color: "text.secondary",
          textTransform: "none",
          "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
        }}
      >
        Back to job
      </Button>

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Applications
      </Typography>

      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status filter</InputLabel>
          <Select
            value={status}
            label="Status filter"
            onChange={(e) =>
              updateParams({ status: e.target.value as ApplicationStatus, page: "1" })
            }
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="applied">Applied</MenuItem>
            <MenuItem value="shortlisted">Shortlisted</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="selected">Selected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <ErrorAlert
          message={error}
          backLink={`/admin/job-portal/job?id=${jdId}`}
          backLabel="Back to job"
        />
      )}

      {loading ? (
        <LinearProgress sx={{ width: "100%", height: 2, borderRadius: 1 }} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon="mdi:file-document-outline"
          title="No applications"
          description="Applications will appear here when students apply"
        />
      ) : (
        <>
          <BulkStatusUpdateBar
            selectedCount={selectedIds.size}
            selectedStatus={bulkStatus}
            onStatusChange={setBulkStatus}
            onApply={handleBulkUpdate}
            onClearSelection={() => setSelectedIds(new Set())}
            isUpdating={updating}
          />

          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        applications.length > 0 &&
                        applications.every((a) => selectedIds.has(a.id))
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Resume</TableCell>
                  <TableCell>Applied</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    application={app}
                    selected={selectedIds.has(app.id)}
                    onSelect={(s) => handleSelect(app.id, s)}
                    onStatusChange={(s) => handleStatusChange(app.id, s)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <JobPortalPagination
            pagination={pagination}
            itemLabel="applications"
            onPageChange={(p) => updateParams({ page: String(p) })}
          />
        </>
      )}
    </Box>
  );
}
