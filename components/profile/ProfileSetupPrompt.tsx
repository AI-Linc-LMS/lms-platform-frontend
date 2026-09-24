"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { MuiTelInput } from "mui-tel-input";
import { useTranslation } from "react-i18next";
import { CountrySelect } from "@/components/profile/CountrySelect";
import { FieldLabel } from "@/components/profile/FieldLabel";
import { PHONE } from "@/components/common/mobile/phone";
import { useProfileGate } from "@/lib/contexts/ProfileGateContext";
import { profileService } from "@/lib/services/profile.service";
import {
  validateMandatoryProfile,
  type MandatoryProfileField,
} from "@/lib/schemas/profile.schema";

/**
 * Asks for the fields Resume, Jobs and Interview need, ON THE WAY IN, instead of leaving it to a
 * card on the dashboard.
 *
 * The report this answers: "if these are compulsory for interviews, jobs, then why not take these
 * information at the start upon entering". The dashboard card had been telling learners they were
 * 60% of the way to unlocking three modules while nothing had ever asked them for the other 40%.
 *
 * ## Why this prompts and does not block
 *
 * 13,481 of 13,776 active learners on production are missing at least one of these fields —
 * 97.9%. A gate that had to be cleared before the product opened would, on the morning it
 * shipped, wall almost every existing account out of the course they are enrolled in, for a
 * reason that has nothing to do with the course. So:
 *
 * - **Unmissable**: a modal over whatever page they land on, not a card competing with eight
 *   others in a rail.
 * - **Repeatable**: "Not now" is remembered for the SESSION, in `sessionStorage`. It comes back
 *   tomorrow. A permanent dismissal would make this a one-shot that most people click past.
 * - **Never a wall**: Escape, the backdrop and "Not now" all close it, and nothing about
 *   learning depends on it. The HARD requirement stays where the learner can see the point of
 *   it — applying for a job, starting an interview, generating a resume — and it is enforced by
 *   the API (`accounts/gates.HasCompleteProfile`), not by this dialog.
 *
 * ## Why it can be silent
 *
 * Not every institution runs Jobs or Interviews. A field that is compulsory because of Jobs must
 * not be compulsory for a tenant with Jobs switched off, so the copy names only the modules the
 * tenant actually has, and the prompt is skipped entirely when it has none.
 *
 * Skipped-entirely is a safety valve, not a live case: the resume builder has no per-tenant
 * switch (`navModel.ts` always shows it), so every real institution has at least that one. What
 * changes in the field is the SENTENCE — the five tenants holding 9,645 learners that run
 * neither Jobs nor Interview ask for these fields in exchange for Resume, and say so.
 */

const PROMPT_SKIPPED_KEY = "profile-setup-prompt:skipped";

const FIELD_IDS: Record<string, string> = {
  first_name: "setup-first-name",
  last_name: "setup-last-name",
  phone_number: "setup-phone-number",
  date_of_birth: "setup-date-of-birth",
  country: "setup-country",
};

const FIELD_ICONS: Record<string, string> = {
  first_name: "mdi:account",
  last_name: "mdi:account-outline",
  phone_number: "mdi:phone",
  date_of_birth: "mdi:calendar",
  country: "mdi:earth",
};

const MODULE_LABEL_KEYS: Record<string, string> = {
  resume: "profileSetup.moduleResume",
  jobs: "profileSetup.moduleJobs",
  interview: "profileSetup.moduleInterview",
};

type Draft = Record<MandatoryProfileField, string>;

const EMPTY_DRAFT: Draft = {
  first_name: "",
  last_name: "",
  phone_number: "",
  date_of_birth: "",
  country: "",
};

function wasSkippedThisSession(): boolean {
  try {
    return sessionStorage.getItem(PROMPT_SKIPPED_KEY) === "1";
  } catch {
    // Private mode, or storage blocked. Showing the prompt is the safe failure: it is
    // dismissable, and the alternative is a learner who can never be asked.
    return false;
  }
}

export function ProfileSetupPrompt() {
  const { t } = useTranslation("common");
  const { status, completion, gateApplies, refresh } = useProfileGate();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<MandatoryProfileField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // The fields to ask for: the server's own outstanding list, in the server's order, so this and
  // the dashboard card and the API can never name different fields.
  const outstanding = useMemo(
    () =>
      (completion?.required_fields ?? []).filter(
        (f) => !f.filled && f.field in EMPTY_DRAFT,
      ),
    [completion],
  );

  const unlocks = useMemo(
    () =>
      (completion?.gated_modules ?? [])
        .map((m) => MODULE_LABEL_KEYS[m])
        .filter(Boolean)
        .map((key) => t(key)),
    [completion, t],
  );

  const shouldAsk =
    status === "ready" &&
    completion !== null &&
    !completion.is_complete &&
    !completion.exempt &&
    gateApplies &&
    outstanding.length > 0;

  useEffect(() => {
    if (!shouldAsk) return;
    if (wasSkippedThisSession()) return;
    setOpen(true);
  }, [shouldAsk]);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(PROMPT_SKIPPED_KEY, "1");
    } catch {
      // Unwritable storage means it asks again on the next page. Annoying, never blocking.
    }
  };

  const set = (field: MandatoryProfileField, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const asked = new Set(outstanding.map((f) => f.field));
    // Only what was ASKED is validated for emptiness: a learner missing just a country must not
    // be told their date of birth is required when this dialog never showed the field.
    const problems = validateMandatoryProfile(draft, asked);
    if (Object.keys(problems).length > 0) {
      setErrors(problems);
      return;
    }
    setErrors({});
    setSaveError(null);
    setSaving(true);
    try {
      // Only the fields this dialog collected. A full-profile body would overwrite everything
      // else on the row with the blanks this component never loaded.
      const body: Partial<Record<MandatoryProfileField, string>> = {};
      for (const field of asked) {
        const key = field as MandatoryProfileField;
        const value = draft[key].trim();
        if (value) body[key] = value;
      }
      await profileService.updateUserProfile(body);
      await refresh();
      setOpen(false);
    } catch (error) {
      const data =
        (error as { response?: { data?: Record<string, unknown> } })?.response?.data ?? {};
      const perField: Partial<Record<MandatoryProfileField, string>> = {};
      let generic: string | null = null;
      for (const key of Object.keys(data)) {
        const value = (data as Record<string, unknown>)[key];
        const message = Array.isArray(value) ? value[0] : value;
        if (typeof message !== "string") continue;
        if (key in EMPTY_DRAFT) perField[key as MandatoryProfileField] = message;
        else generic = message;
      }
      setErrors(perField);
      setSaveError(
        Object.keys(perField).length > 0
          ? null
          : generic ?? t("profileSetup.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!shouldAsk) return null;

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            // A phone at 360px: the default 32px dialog margin leaves 296px for a country
            // picker and a date field. Full-bleed with a small inset instead, and only here —
            // an `xs` value would shrink the desktop dialog too.
            [PHONE]: { borderRadius: 3, m: 1.5, width: "calc(100% - 24px)", maxWidth: "none" },
          },
        },
        backdrop: { sx: { backdropFilter: "blur(3px)", bgcolor: "rgba(15,23,42,0.55)" } },
      }}
      aria-labelledby="profile-setup-prompt-title"
    >
      <Box sx={{ p: 3, [PHONE]: { p: 2 } }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            mb: 1.75,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background:
              "linear-gradient(135deg, var(--module-tile-from, #7c3aed), var(--module-tile-to, #ec4899))",
          }}
        >
          <Icon icon="mdi:account-check-outline" width={22} />
        </Box>

        <Typography
          id="profile-setup-prompt-title"
          sx={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--font-primary)" }}
        >
          {t("profileSetup.title")}
        </Typography>
        <Typography
          sx={{ color: "var(--font-secondary)", mt: 0.75, fontSize: "0.85rem", lineHeight: 1.55 }}
        >
          {unlocks.length > 0
            ? t("profileSetup.body", { modules: unlocks.join(", ") })
            : t("profileSetup.bodyGeneric")}
        </Typography>

        <Stack spacing={2} sx={{ mt: 2.5 }}>
          {outstanding.map((f) => {
            const field = f.field as MandatoryProfileField;
            const id = FIELD_IDS[field];
            return (
              <Box key={field}>
                <FieldLabel
                  icon={FIELD_ICONS[field]}
                  label={f.label}
                  htmlFor={id}
                  required
                />
                {field === "phone_number" ? (
                  <MuiTelInput
                    id={id}
                    value={draft.phone_number}
                    defaultCountry="IN"
                    // The server stores E.164; MuiTelInput emits a spaced value. Stripped here
                    // for the same reason the profile form strips it here: at save time it is
                    // one line further from the input and easy to lose.
                    onChange={(v) => set("phone_number", (v || "").replace(/\s+/g, ""))}
                    fullWidth
                    size="small"
                    required
                    error={Boolean(errors.phone_number)}
                    helperText={errors.phone_number}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 }, [PHONE]: { "& .MuiOutlinedInput-input": { minHeight: 28 } } }}
                  />
                ) : field === "country" ? (
                  <CountrySelect
                    id={id}
                    value={draft.country}
                    onChange={(name) => set("country", name)}
                    label=""
                    required
                    error={Boolean(errors.country)}
                    helperText={errors.country}
                  />
                ) : (
                  <TextField
                    id={id}
                    value={draft[field]}
                    onChange={(e) => set(field, e.target.value)}
                    type={field === "date_of_birth" ? "date" : "text"}
                    fullWidth
                    size="small"
                    required
                    error={Boolean(errors[field])}
                    helperText={errors[field]}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 }, [PHONE]: { "& .MuiOutlinedInput-input": { minHeight: 28 } } }}
                  />
                )}
              </Box>
            );
          })}
        </Stack>

        {saveError && (
          <Typography sx={{ mt: 1.5, fontSize: "0.8rem", color: "var(--error-600, #ae0606)" }}>
            {saveError}
          </Typography>
        )}

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 3, [PHONE]: { flexDirection: "column-reverse", gap: 1 } }}
        >
          <Button
            onClick={close}
            disabled={saving}
            data-testid="profile-setup-skip"
            sx={{
              flex: 1,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              color: "var(--font-secondary)",
              [PHONE]: { minHeight: 44, width: "100%" },
            }}
          >
            {t("profileSetup.notNow")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            data-testid="profile-setup-save"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              flex: 2,
              py: 1.1,
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
              color: "#fff",
              background:
                "linear-gradient(135deg, var(--module-cta-from, #7c3aed), var(--module-cta-to, #ec4899))",
              "&.Mui-disabled": { color: "rgba(255,255,255,0.7)" },
              [PHONE]: { minHeight: 44, width: "100%" },
            }}
          >
            {t("profileSetup.save")}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
