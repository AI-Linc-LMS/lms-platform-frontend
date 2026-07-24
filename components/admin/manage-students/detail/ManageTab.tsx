"use client";

import {
  Box,
  Typography,
  Avatar,
  Chip,
  Switch,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import type { StudentDetail } from "@/lib/services/admin/admin-student.service";
import { CourseManagementCard } from "@/components/admin/manage-students/CourseManagementCard";
import { ADAPTIVE, formatDate } from "./shared";
import { InfoButton, RiskCriteriaContent } from "@/components/common/InfoPopover";

interface ManageTabProps {
  student: StudentDetail;
  studentId: number;
  editing: boolean;
  formData: { first_name: string; last_name: string; email: string };
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onFormChange: (field: string, value: string) => void;
  onToggleActive: () => void;
  onEnrollmentChange: () => void;
}

function Panel({
  title,
  icon,
  accent = ADAPTIVE.indigo,
  action,
  children,
}: {
  title: string;
  icon: string;
  accent?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, md: 2.5 },
          py: 1.75,
          borderBottom: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `color-mix(in srgb, ${accent} 14%, transparent)`,
          }}
        >
          <IconWrapper icon={icon} size={19} color={accent} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", flex: 1 }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>{children}</Box>
    </Box>
  );
}

function MetaRow({
  label,
  value,
  info,
}: {
  label: string;
  value: React.ReactNode;
  info?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, py: 0.9 }}>
      <Typography
        sx={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--font-secondary)",
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.86rem",
            fontWeight: 600,
            color: "var(--font-primary)",
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </Typography>
        {info}
      </Box>
    </Box>
  );
}

export function ManageTab({
  student,
  studentId,
  editing,
  formData,
  saving,
  onEdit,
  onCancel,
  onSave,
  onFormChange,
  onToggleActive,
  onEnrollmentChange,
}: ManageTabProps) {
  const pi = student.personal_info;
  const name = `${pi.first_name} ${pi.last_name}`.trim() || pi.username;
  const initials =
    `${pi.first_name?.[0] || ""}${pi.last_name?.[0] || ""}`.toUpperCase() ||
    pi.username?.[0]?.toUpperCase() ||
    "?";

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
      {/* Left: Account */}
      <Box sx={{ width: { xs: "100%", md: 360 }, flexShrink: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <Panel title="Account" icon="mdi:account-circle-outline">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar
              src={pi.profile_pic_url || undefined}
              sx={{
                width: 56,
                height: 56,
                fontWeight: 800,
                fontSize: "1.2rem",
                background: ADAPTIVE.gradient,
                color: "#fff",
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, color: "var(--font-primary)", lineHeight: 1.2 }}>
                {name}
              </Typography>
              <Chip
                size="small"
                label={pi.is_active ? "Active" : "Inactive"}
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  color: pi.is_active ? ADAPTIVE.green : "#94a3b8",
                  bgcolor: pi.is_active
                    ? "color-mix(in srgb, #10b981 14%, transparent)"
                    : "color-mix(in srgb, #94a3b8 16%, transparent)",
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ borderColor: "color-mix(in srgb, var(--border-default) 70%, transparent)" }} />

          <Box sx={{ "& > *:not(:last-child)": { borderBottom: "1px dashed color-mix(in srgb, var(--border-default) 60%, transparent)" } }}>
            <MetaRow label="Username" value={pi.username} />
            <MetaRow label="Enrolled on" value={formatDate(pi.date_joined)} />
            <MetaRow
              label="Last login"
              value={
                pi.last_login ? (
                  formatDate(pi.last_login)
                ) : (
                  <Box component="span" sx={{ color: "#b45309" }}>Never logged in</Box>
                )
              }
              info={
                !pi.last_login ? (
                  <InfoButton ariaLabel="How activity signals work">
                    <RiskCriteriaContent />
                  </InfoButton>
                ) : undefined
              }
            />
          </Box>
        </Panel>

        {/* Account status toggle */}
        <Panel
          title="Account status"
          icon="mdi:shield-account-outline"
          accent={pi.is_active ? ADAPTIVE.green : ADAPTIVE.red}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              p: 2,
              borderRadius: 2.5,
              border: `1px solid ${pi.is_active ? "color-mix(in srgb, #10b981 40%, transparent)" : "color-mix(in srgb, #ef4444 40%, transparent)"}`,
              bgcolor: pi.is_active
                ? "color-mix(in srgb, #10b981 8%, transparent)"
                : "color-mix(in srgb, #ef4444 8%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <Switch
                checked={pi.is_active ?? false}
                onChange={onToggleActive}
                disabled={saving}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: ADAPTIVE.green },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: ADAPTIVE.green },
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.9rem" }}>
                  {pi.is_active ? "Active" : "Inactive"}
                </Typography>
                <Typography sx={{ fontSize: "0.76rem", color: "var(--font-secondary)" }}>
                  {pi.is_active ? "Student can access the platform" : "Access is disabled"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Panel>
      </Box>

      {/* Right: editable info + course management */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <Panel
          title="Personal information"
          icon="mdi:card-account-details-outline"
          action={
            !editing ? (
              <Button
                size="small"
                startIcon={<IconWrapper icon="mdi:pencil" size={16} />}
                onClick={onEdit}
                sx={{ color: ADAPTIVE.indigo, fontWeight: 700, textTransform: "none" }}
              >
                Edit
              </Button>
            ) : undefined
          }
        >
          {editing ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <TextField
                  label="First name"
                  value={formData.first_name}
                  onChange={(e) => onFormChange("first_name", e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Last name"
                  value={formData.last_name}
                  onChange={(e) => onFormChange("last_name", e.target.value)}
                  fullWidth
                  size="small"
                />
              </Box>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => onFormChange("email", e.target.value)}
                fullWidth
                size="small"
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <LoadingButton
                  variant="contained"
                  onClick={onSave}
                  loading={saving}
                  loadingText="Saving…"
                  size="small"
                  sx={{ bgcolor: ADAPTIVE.indigo, textTransform: "none", fontWeight: 700 }}
                >
                  Save
                </LoadingButton>
                <Button variant="outlined" onClick={onCancel} size="small" sx={{ textTransform: "none" }}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {[
                { label: "First name", value: pi.first_name || "-" },
                { label: "Last name", value: pi.last_name || "-" },
                { label: "Email", value: pi.email || "-" },
              ].map((f) => (
                <Box key={f.label}>
                  <Typography
                    sx={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--font-secondary)",
                    }}
                  >
                    {f.label}
                  </Typography>
                  <Typography sx={{ color: "var(--font-primary)", mt: 0.5, wordBreak: "break-word" }}>
                    {f.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Panel>

        <CourseManagementCard
          studentId={studentId}
          enrolledCourseIds={student.enrolled_courses.map((c) => c.id)}
          onEnrollmentChange={onEnrollmentChange}
        />
      </Box>
    </Box>
  );
}
