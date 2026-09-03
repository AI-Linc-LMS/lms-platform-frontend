"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Paper, Tooltip, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { DeleteConfirmationModal } from "@/components/admin/assessment/DeleteConfirmationModal";
import {
  AssessmentBreadcrumb,
  AssessmentDataTable,
  AssessmentEmptyState,
  AssessmentSectionHero,
  AssessmentTableSkeleton,
  SegmentedTabs,
  StatStrip,
  StatusChip,
  type AssessmentColumn,
} from "@/components/admin/assessment/shared";
import {
  AUTO_GRADEABLE,
  deleteProject,
  listProjects,
  ProjectInUseError,
  RUNTIME_LABELS,
  type AdminProjectTemplate,
} from "@/lib/services/admin/admin-projects.service";

/**
 * The project brief library.
 *
 * A brief is authored once here and referenced by any number of assessments, the way coding
 * problems are. That is why the hidden grader lives on the brief and never in an assessment
 * payload — one home, one place to get the secrecy right.
 *
 * The column that earns its place is "Verified". An auto-graded brief whose reference solution
 * has never passed its own harness cannot be put on an assessment at all, and this is where an
 * author finds out before a cohort does.
 */

type TabKey = "all" | "unverified" | "archived";

function verificationChip(t: AdminProjectTemplate) {
  if (t.tier === "rubric") {
    return <StatusChip label="Rubric-marked" tone="ai" icon="mdi:account-eye-outline" />;
  }
  const status = t.verification?.status;
  if (status === "passed") {
    const { passed, total } = t.verification ?? {};
    return (
      <StatusChip
        label={total ? `Verified ${passed}/${total}` : "Verified"}
        tone="success"
        icon="mdi:shield-check-outline"
      />
    );
  }
  if (status === "failed") {
    return <StatusChip label="Failed its own checks" tone="error" icon="mdi:shield-alert-outline" />;
  }
  return <StatusChip label="Not verified" tone="warning" icon="mdi:shield-off-outline" />;
}

export default function ProjectLibraryPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<AdminProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [pendingDelete, setPendingDelete] = useState<AdminProjectTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await listProjects());
    } catch {
      showToast("Could not load the project library.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const unverified = useMemo(
    () => projects.filter((p) => p.tier === "auto" && p.verification?.status !== "passed"),
    [projects]
  );

  const rows = useMemo(() => {
    if (tab === "unverified") return unverified;
    if (tab === "archived") return projects.filter((p) => !p.is_active);
    return projects.filter((p) => p.is_active);
  }, [projects, unverified, tab]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProject(pendingDelete.id);
      showToast(`"${pendingDelete.title}" was deleted.`, "success");
      setPendingDelete(null);
      await load();
    } catch (err) {
      showToast(
        err instanceof ProjectInUseError
          ? "Learners are already working on this project, so it cannot be deleted. Archive it instead — their work stays intact."
          : "Could not delete this project.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns: AssessmentColumn<AdminProjectTemplate>[] = [
    {
      key: "title",
      header: "Project",
      minWidth: 240,
      render: (p) => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: "var(--font-primary)" }}>
            {p.title}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "var(--font-secondary)" }}>
            {Object.keys(p.starter_files || {}).length} starter file
            {Object.keys(p.starter_files || {}).length === 1 ? "" : "s"}
          </Typography>
        </Box>
      ),
    },
    {
      key: "runtime",
      header: "Stack",
      hideBelow: "sm",
      render: (p) => (
        <StatusChip
          label={RUNTIME_LABELS[p.runtime] ?? p.runtime}
          tone="info"
          icon={p.runtime === "python" ? "mdi:language-python" : "mdi:language-html5"}
        />
      ),
    },
    {
      key: "verification",
      header: "Verified",
      minWidth: 170,
      render: verificationChip,
    },
    {
      key: "max_marks",
      header: "Marks",
      align: "right",
      hideBelow: "sm",
      render: (p) => (
        <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{p.max_marks}</Typography>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 96,
      render: (p) => (
        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
          <Tooltip title="Edit">
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/projects/${p.id}`);
              }}
              sx={{ minWidth: 32, p: 0.5, color: "var(--accent-indigo)" }}
            >
              <IconWrapper icon="mdi:pencil-outline" size={18} />
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setPendingDelete(p);
              }}
              sx={{ minWidth: 32, p: 0.5, color: "var(--error-500)" }}
            >
              <IconWrapper icon="mdi:trash-can-outline" size={18} />
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <AssessmentBreadcrumb
          segments={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Assessments", href: "/admin/assessment" },
            { label: "Projects" },
          ]}
        />

        <AssessmentSectionHero
          chapter="ASSESSMENTS"
          title="Project library"
          subtitle="Build-something briefs a cohort works on over days, in the browser. Write one here, then add it to an assessment as a Project section."
          accent="violet"
          icon="mdi:hammer-wrench"
          rightSlot={
            <Button
              variant="contained"
              startIcon={<IconWrapper icon="mdi:plus" size={18} />}
              onClick={() => router.push("/admin/projects/new")}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo)" },
              }}
            >
              New project
            </Button>
          }
        />

        <Box sx={{ mt: 3 }}>
          <StatStrip
            items={[
              { label: "Projects", value: projects.length, icon: "mdi:hammer-wrench", tone: "var(--accent-indigo)" },
              {
                label: "Auto-graded",
                value: projects.filter((p) => p.tier === "auto").length,
                icon: "mdi:robot-outline",
                tone: "var(--accent-teal)",
              },
              {
                label: "Rubric-marked",
                value: projects.filter((p) => p.tier === "rubric").length,
                icon: "mdi:account-eye-outline",
                tone: "var(--ai-pink)",
              },
              {
                label: "Need verifying",
                value: unverified.length,
                icon: "mdi:shield-off-outline",
                tone: unverified.length ? "var(--warning-500)" : "var(--font-secondary)",
              },
            ]}
          />
        </Box>

        {unverified.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderRadius: 2,
              border: "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--warning-500) 8%, var(--surface) 92%)",
            }}
          >
            <IconWrapper icon="mdi:shield-off-outline" size={20} />
            <Typography sx={{ fontSize: 13, color: "var(--font-primary)" }}>
              <strong>
                {unverified.length} auto-graded project{unverified.length === 1 ? "" : "s"}
              </strong>{" "}
              {unverified.length === 1 ? "has" : "have"} not been verified yet. Until a project&apos;s own
              solution passes its own checks, it cannot be added to an assessment — that is what stops a
              cohort being set something unsolvable.
            </Typography>
          </Paper>
        )}

        <Box sx={{ mt: 3 }}>
          <SegmentedTabs
            tabs={[
              { value: "all" as TabKey, label: "Active", icon: "mdi:hammer-wrench", count: projects.filter((p) => p.is_active).length },
              { value: "unverified" as TabKey, label: "Need verifying", icon: "mdi:shield-off-outline", count: unverified.length },
              { value: "archived" as TabKey, label: "Archived", icon: "mdi:archive-outline", count: projects.filter((p) => !p.is_active).length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          {loading ? (
            <AssessmentTableSkeleton />
          ) : (
            <AssessmentDataTable
              columns={columns}
              rows={rows}
              rowKey={(p) => p.id}
              onRowClick={(p) => router.push(`/admin/projects/${p.id}`)}
              emptyState={
                <AssessmentEmptyState
                  icon="mdi:hammer-wrench"
                  title={
                    tab === "unverified"
                      ? "Every auto-graded project is verified"
                      : tab === "archived"
                      ? "Nothing archived"
                      : "No projects yet"
                  }
                  description={
                    tab === "all"
                      ? "A project is a brief the learner builds in the browser — an HTML/CSS/JS page, or a Python program — with a live preview as they type."
                      : undefined
                  }
                  action={
                    tab === "all" ? (
                      <Button
                        variant="contained"
                        startIcon={<IconWrapper icon="mdi:plus" size={18} />}
                        onClick={() => router.push("/admin/projects/new")}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        Create the first one
                      </Button>
                    ) : undefined
                  }
                />
              }
            />
          )}
        </Box>
      </Box>

      <DeleteConfirmationModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={
          pendingDelete
            ? `Delete "${pendingDelete.title}"? Assessments that use it will lose the section.`
            : "Delete this project?"
        }
      />
    </MainLayout>
  );
}
