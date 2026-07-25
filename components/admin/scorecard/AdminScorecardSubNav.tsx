"use client";

import { useRouter, usePathname } from "next/navigation";
import { Box, Paper, Tab, Tabs } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export type AdminScorecardTabKey = "scorecard" | "skills" | "badges" | "config";

interface AdminScorecardSubNavProps {
  /** Currently active tab. */
  active: AdminScorecardTabKey;
  /**
   * Called when the user picks one of the in-page tabs (scorecard / config) on the
   * parent /admin/scorecard page. Not called for skills / badges - those navigate.
   * Omit on standalone pages (skills, badges).
   */
  onLocalTabChange?: (next: "scorecard" | "config") => void;
}

const TABS: ReadonlyArray<{
  key: AdminScorecardTabKey;
  label: string;
  icon: string;
  /** Route to push when clicked. If null, handled via onLocalTabChange. */
  route: string | null;
}> = [
  {
    key: "scorecard",
    label: "Student Scorecard",
    icon: "mdi:chart-box-outline",
    route: null,
  },
  {
    key: "skills",
    label: "Skills",
    icon: "mdi:lightbulb-on-outline",
    route: "/admin/scorecard/skills",
  },
  {
    key: "badges",
    label: "Badges",
    icon: "mdi:trophy-award",
    route: "/admin/scorecard/badges",
  },
  {
    key: "config",
    label: "Configuration",
    icon: "mdi:cog-outline",
    route: null,
  },
];

/**
 * Tabbed sub-navigation shared by the three admin scorecard pages:
 *   - /admin/scorecard               (scorecard + config - local state)
 *   - /admin/scorecard/skills        (separate route)
 *   - /admin/scorecard/badges        (separate route)
 *
 * Keeps the four destinations discoverable from any of them.
 */
export function AdminScorecardSubNav({ active, onLocalTabChange }: AdminScorecardSubNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (_: unknown, value: AdminScorecardTabKey) => {
    const tab = TABS.find((t) => t.key === value);
    if (!tab) return;

    if (tab.route) {
      // Don't push if we're already on this route
      if (pathname !== tab.route) router.push(tab.route);
      return;
    }

    // Local tabs (scorecard, config) - only valid when the parent provided a handler.
    if (onLocalTabChange) {
      onLocalTabChange(value as "scorecard" | "config");
      return;
    }

    // We're on a standalone page (skills/badges) and the user clicked a local tab -
    // route back to /admin/scorecard, preserving the intended sub-tab via query.
    router.push(`/admin/scorecard?view=${value}`);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "var(--card-bg)",
        overflow: "hidden",
        boxShadow:
          "0 4px 24px color-mix(in srgb, var(--font-primary) 14%, transparent)",
      }}
    >
      <Tabs
        value={active}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          px: 1,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            minHeight: 56,
            fontSize: "0.9rem",
          },
          "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
          "& .MuiTabs-flexContainer": { gap: 0 },
        }}
      >
        {TABS.map((t) => (
          <Tab
            key={t.key}
            value={t.key}
            label={t.label}
            icon={
              <Box sx={{ display: "inline-flex", mr: 0.5 }}>
                <IconWrapper icon={t.icon} size={20} />
              </Box>
            }
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Paper>
  );
}
