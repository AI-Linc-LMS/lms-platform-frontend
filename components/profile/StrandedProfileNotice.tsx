"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertTitle, Box, Button, Chip, Stack } from "@mui/material";

/**
 * Edits an older build left in this browser and never got onto the server.
 *
 * The profile page used to write every edit to `localStorage` before it tried the server, and
 * when the server refused it said "Profile saved locally". Some learners therefore have real,
 * unsaved work sitting on a device, believing it is on their account. Removing the cache without
 * looking would destroy exactly the data the cache was hiding.
 *
 * So it is shown, and the learner decides. It is NEVER merged into the profile on its own: a
 * tenant-keyed version of this cache once merged one learner's name, phone and date of birth into
 * another account on a shared browser, and pressing Save wrote it for real. Offering is safe
 * where merging was not - nothing changes until someone reads it and says yes.
 *
 * Either answer ends with the key removed, so this appears once.
 */

export interface StrandedProfileNoticeProps {
  /** Field name -> the value found in this browser, already filtered to what differs. */
  fields: Array<{ key: string; label: string; value: string }>;
  onSave: () => Promise<void>;
  onDiscard: () => void;
}

export function StrandedProfileNotice({ fields, onSave, onDiscard }: StrandedProfileNoticeProps) {
  const { t } = useTranslation("common");
  const [busy, setBusy] = useState(false);

  if (!fields.length) return null;

  return (
    <Alert
      severity="warning"
      variant="outlined"
      sx={{ mb: 2.5, borderRadius: 3, alignItems: "flex-start" }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>{t("profile.strandedTitle")}</AlertTitle>
      <Box sx={{ fontSize: "0.875rem", mb: 1.5 }}>{t("profile.strandedBody")}</Box>
      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
        {fields.map((f) => (
          <Chip
            key={f.key}
            size="small"
            label={`${f.label}: ${f.value}`}
            sx={{ maxWidth: "100%" }}
          />
        ))}
      </Stack>
      <Stack direction="row" gap={1} flexWrap="wrap">
        <Button
          size="small"
          variant="contained"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave();
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("profile.strandedSave")}
        </Button>
        <Button size="small" variant="text" disabled={busy} onClick={onDiscard}>
          {t("profile.strandedDiscard")}
        </Button>
      </Stack>
    </Alert>
  );
}
