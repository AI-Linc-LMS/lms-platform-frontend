"use client";

import { useEffect, useState } from "react";
import { currenciesService, type CurrencyOption } from "@/lib/services/currencies.service";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/common/LoadingButton";
import { formatMoney } from "@/lib/utils/money";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";

/**
 * Set what learners pay to enrol in an adaptive course.
 *
 * A dialog rather than another toolbar pill: a price needs a number, and the toolbar is already
 * carrying seven pills. It also gives the two things a toggle cannot — room to explain that
 * turning a course paid does NOT charge the students already in it, and somewhere to put the
 * "connect Razorpay first" message without losing what the admin typed.
 */

/**
 * Loaded from the server, never hard-coded. The backend validator and this list are the same
 * table, so the dropdown cannot offer a currency the server would reject — which would let an
 * admin create a course nobody can buy.
 */

export function CoursePricingDialog({
  open,
  course,
  onClose,
  onSaved,
}: {
  open: boolean;
  course: {
    id: number;
    is_paid: boolean;
    price: string | null;
    currency: string;
    auto_enroll: boolean;
    /** Catalog master. It has no tenant to collect the money, so it can never be priced. */
    is_template?: boolean;
    title?: string;
  };
  onClose: () => void;
  onSaved: (patch: { is_paid: boolean; price: string | null; currency: string }) => void;
}) {
  const router = useRouter();
  const [isPaid, setIsPaid] = useState(course.is_paid);
  const [price, setPrice] = useState(course.price ?? "");
  const [currency, setCurrency] = useState(course.currency || "INR");
  const [saving, setSaving] = useState(false);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [currencyFrozen, setCurrencyFrozen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsUrl, setSettingsUrl] = useState<string | null>(null);
  const [grandfathered, setGrandfathered] = useState<number | null>(null);

  // Re-seed each time it opens, so a cancelled edit does not persist into the next visit.
  useEffect(() => {
    if (!open) return;
    void currenciesService.list().then(setCurrencies).catch(() => setCurrencies([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setIsPaid(course.is_paid);
    setPrice(course.price ?? "");
    setCurrency(course.currency || "INR");
    setError(null);
    setSettingsUrl(null);
    setGrandfathered(null);
  }, [open, course.is_paid, course.price, course.currency]);

  const numericPrice = Number(price);
  const priceValid = price.trim() !== "" && Number.isFinite(numericPrice) && numericPrice >= 1;
  // Checked client-side so the admin gets a sentence instead of a bounced request — but the
  // server enforces all three independently, and its wording wins if one still gets through.
  const blockedByAutoEnroll = isPaid && course.auto_enroll;
  /**
   * A catalog template can never be priced, so say so BEFORE the admin fills anything in.
   *
   * The dialog used to accept a price and a currency and only refuse on Save — the server was
   * right to refuse, but the admin had already made every decision the form asks for. Worse, the
   * message named a rule rather than the next step, so the natural conclusion was "templates are
   * broken" rather than "price the tenant's copy".
   */
  const isTemplate = course.is_template === true;
  const canSave = !saving && !isTemplate && (!isPaid || (priceValid && !blockedByAutoEnroll));

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSettingsUrl(null);
    try {
      const res = await adminAdaptiveCourseService.updateCourse(course.id, {
        is_paid: isPaid,
        // Turning paid off clears the price server-side too; sending null keeps the two in step.
        price: isPaid ? String(numericPrice) : null,
        currency,
      });
      const patch = {
        is_paid: res.is_paid,
        price: res.price,
        currency: res.currency || currency,
      };
      onSaved(patch);

      // Only surfaced when it is non-zero AND this was the transition to paid. A toast is a bad
      // place for "N people keep free access" — it is the one consequence an admin must not miss.
      if (res.grandfathered_students && res.grandfathered_students > 0) {
        setGrandfathered(res.grandfathered_students);
      } else {
        onClose();
      }
    } catch (e: unknown) {
      const resp = (e as { response?: { status?: number; data?: Record<string, unknown> } })?.response;
      const detail = typeof resp?.data?.detail === "string" ? resp.data.detail : null;
      if (resp?.status === 409 && detail && /currency/i.test(detail)) {
        // Frozen because money already moved against this course — not a Razorpay problem.
        setCurrencyFrozen(true);
        setCurrency(course.currency || "INR");
        setError(detail);
        return;
      }
      if (resp?.status === 409) {
        const url = typeof resp.data?.settings_url === "string" ? resp.data.settings_url : null;
        // Only an in-app path is trusted — this URL comes off the wire.
        setSettingsUrl(url && url.startsWith("/") ? url : "/admin/settings");
      }
      setError(detail ?? "Couldn't save pricing.");
    } finally {
      setSaving(false);
    }
  }

  if (grandfathered !== null) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Pricing saved</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <strong>
              {grandfathered} student{grandfathered === 1 ? "" : "s"} already enrolled
            </strong>{" "}
            keep their access for free. The price applies to new enrolments only — nobody is
            charged retroactively, and nobody was removed.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Course pricing</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {settingsUrl && (
            <Alert
              severity="warning"
              icon={<Icon icon="mdi:credit-card-off-outline" width={20} />}
              sx={{ borderRadius: 2 }}
              action={
                <Button size="small" onClick={() => router.push(settingsUrl)}>
                  Connect Razorpay
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          {error && !settingsUrl && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700 }}>Paid course</Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "var(--font-secondary)" }}>
                Learners must buy this course before they can enrol. Students already enrolled keep
                their access for free.
              </Typography>
            </Box>
            <Switch
              checked={isPaid && !isTemplate}
              disabled={saving || isTemplate}
              onChange={(e) => setIsPaid(e.target.checked)}
            />
          </Box>

          {isTemplate && (
            <Alert severity="info" sx={{ borderRadius: 2, fontSize: "0.85rem" }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", mb: 0.5 }}>
                This is a catalog template
              </Typography>
              A template is the master copy. It is mapped into each institution and is never shown
              to learners directly, so there is no institution here to collect the payment.
              <Box sx={{ mt: 1 }}>
                Price the institution&apos;s own copy instead — open{" "}
                <strong>{course.title || "this course"}</strong> from that institution&apos;s course
                list, not from the catalog.
              </Box>
            </Alert>
          )}

          <Collapse in={isPaid && !isTemplate} unmountOnExit>
            <Stack spacing={2}>
              {blockedByAutoEnroll && (
                <Alert severity="warning" sx={{ borderRadius: 2, fontSize: "0.83rem" }}>
                  <strong>Auto-enroll is on.</strong> It gives this course to every student of your
                  institution for free, so it cannot be combined with a price. Turn auto-enroll off
                  in the toolbar first.
                </Alert>
              )}
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Price"
                value={price}
                disabled={saving}
                // Validated on blur/save, never clamped per keystroke — clamping destroys a
                // decimal the moment someone types "12." on the way to "12.50".
                onChange={(e) => setPrice(e.target.value)}
                inputProps={{ min: 1, step: "0.01" }}
                error={price.trim() !== "" && !priceValid}
                helperText={
                  price.trim() !== "" && !priceValid
                    ? "Enter an amount of at least 1."
                    : "What a learner pays once, for permanent access."
                }
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
              <TextField
                select
                fullWidth
                size="small"
                label="Currency"
                value={currency}
                disabled={saving || currencyFrozen || currencies.length === 0}
                onChange={(e) => setCurrency(e.target.value)}
                helperText={
                  currencyFrozen
                    ? "Locked: this course already has payment activity. Re-pricing in another currency means a new course."
                    : "Your Razorpay account must be enabled for the currency you choose."
                }
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              >
                {(currencies.length ? currencies : [{ code: currency, name: currency, symbol: "", decimals: 2 }]).map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.symbol ? `${c.symbol} ` : ""}{c.code} — {c.name}
                  </MenuItem>
                ))}
              </TextField>
              {priceValid && (
                <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)" }}>
                  Learners will see{" "}
                  <strong style={{ color: "var(--font-primary)" }}>
                    {formatMoney(numericPrice, currency)}
                  </strong>{" "}
                  on the course card.
                </Typography>
              )}
            </Stack>
          </Collapse>

          {!isPaid && course.is_paid && (
            <Alert severity="info" sx={{ borderRadius: 2, fontSize: "0.83rem" }}>
              Making this course free clears its price. Past purchases stay on record and nobody is
              refunded automatically.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={saving}
          loadingText="Saving"
          disabled={!canSave}
          onClick={() => void handleSave()}
          sx={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
