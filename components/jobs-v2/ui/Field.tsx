"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  Box,
  CircularProgress,
  InputBase,
  MenuItem,
  Select,
  Switch,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatBytes } from "@/lib/jobs-v2/format";
import { statusOptions, type StatusKind } from "@/lib/jobs-v2/status";
import { CTL_H, J, MOTION, R, SHADOW, TYPE, focusRing, srOnly } from "./jobsTokens";

/* ==========================================================================
 * Shared field plumbing.
 *
 * Every export here takes `label`, `required`, `error`, `helper`, `disabled` and `id`, and
 * every one wires `aria-required`, `aria-invalid` and `aria-describedby` to real nodes.
 * Error state is VISUAL — a red border plus a message with `role="alert"` below the control —
 * never a toast. That is the fix for "Please answer all required questions" fired at a form
 * with no indication of which field is wrong.
 * ======================================================================== */

export interface BaseFieldProps {
  label?: string;
  required?: boolean;
  /** A message. Truthy means the control is invalid. */
  error?: string | null;
  helper?: string;
  disabled?: boolean;
  id?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

function useFieldIds(explicit?: string) {
  const auto = useId();
  const id = explicit ?? `jf-${auto.replace(/:/g, "")}`;
  return { id, helperId: `${id}-helper`, errorId: `${id}-error` };
}

function describedBy(
  helper: string | undefined,
  error: string | null | undefined,
  helperId: string,
  errorId: string,
): string | undefined {
  const parts = [error ? errorId : null, helper ? helperId : null].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

/** The chrome every control in the module shares. */
export function controlSx(opts: {
  error?: boolean;
  disabled?: boolean;
  dense?: boolean;
  multiline?: boolean;
}): SxProps<Theme> {
  const { error, disabled, dense, multiline } = opts;
  return {
    width: "100%",
    minHeight: multiline
      ? undefined
      : { xs: CTL_H.touch, sm: dense ? CTL_H.dense : CTL_H.base },
    px: 1.5,
    py: multiline ? 1.25 : 0,
    borderRadius: R.ctl,
    border: `1px solid ${error ? J.dangerBd : J.hairline}`,
    bgcolor: disabled ? J.surface3 : J.surface,
    color: disabled ? J.ink4 : J.ink,
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: 1.5,
    transition: `border-color ${MOTION.ctl}ms ${MOTION.ease}, box-shadow ${MOTION.ctl}ms ${MOTION.ease}`,
    "&:hover": { borderColor: disabled ? J.hairline : error ? J.dangerFg : J.hairlineStrong },
    "&.Mui-focused": { borderColor: error ? J.dangerFg : J.azure },
    "& input::placeholder, & textarea::placeholder": { color: J.ink4, opacity: 1 },
    "& input, & textarea": { p: 0, color: "inherit" },
    "& input:disabled, & textarea:disabled": { WebkitTextFillColor: J.ink4, color: J.ink4 },
    ...focusRing,
    "&:focus-within": { boxShadow: "var(--j-focus-ring)" },
  };
}

/**
 * MUI's Select passes `notched` down to whatever it is given as `input`. `InputBase` does not
 * consume it, so React forwards it to the DOM and warns on every render. Swallowing it here is
 * cheaper than adopting the outlined input we are replacing.
 */
type BareInputProps = React.ComponentProps<typeof InputBase> & { notched?: boolean };

function BareInput(props: BareInputProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { notched: _notched, ...rest } = props;
  return <InputBase {...rest} />;
}

/** The `*` legend a form renders once. A bare red asterisk explains nothing on its own. */
export function RequiredLegend({ sx }: { sx?: SxProps<Theme> }) {
  const { t } = useTranslation("common");
  return (
    <Typography sx={[{ ...TYPE.small, color: J.ink3 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {t("jobsV2.form.requiredLegend")}
    </Typography>
  );
}

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label?: string;
  required?: boolean;
  }) {
  const { t } = useTranslation("common");
  if (!label) return null;
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      sx={{ ...TYPE.label, display: "block", mb: 0.75, color: J.ink2 }}
    >
      {label}
      {required && (
        <>
          <Box component="span" aria-hidden sx={{ color: J.dangerFg, ml: 0.25 }}>
            *
          </Box>
          <Box component="span" sx={srOnly}>
            {t("jobsV2.form.required")}
          </Box>
        </>
      )}
    </Typography>
  );
}

function FieldMessages({
  helper,
  error,
  helperId,
  errorId,
}: {
  helper?: string;
  error?: string | null;
  helperId: string;
  errorId: string;
}) {
  return (
    <>
      {error ? (
        <Typography id={errorId} role="alert" sx={{ ...TYPE.small, color: J.dangerFg, mt: 0.75 }}>
          {error}
        </Typography>
      ) : null}
      {helper ? (
        <Typography id={helperId} sx={{ ...TYPE.small, color: J.ink3, mt: 0.75 }}>
          {helper}
        </Typography>
      ) : null}
    </>
  );
}

/* ==========================================================================
 * JField — the wrapper for a control the kit does not provide.
 * ======================================================================== */

export interface JFieldProps extends BaseFieldProps {
  /** The id of the control this label points at. */
  htmlFor?: string;
  children: ReactNode;
  /** Render as a fieldset/legend instead of a label — for radio and checkbox sets. */
  as?: "field" | "group";
}

export function JField({
  label,
  required,
  error,
  helper,
  htmlFor,
  id,
  children,
  as = "field",
  fullWidth = true,
  sx,
  ...rest
}: JFieldProps) {
  const ids = useFieldIds(htmlFor ?? id);
  const { t } = useTranslation("common");

  const body = (
    <>
      {as === "group" ? (
        label ? (
          <Typography
            component="legend"
            sx={{ ...TYPE.label, display: "block", mb: 0.75, color: J.ink2, p: 0 }}
          >
            {label}
            {required && (
              <>
                <Box component="span" aria-hidden sx={{ color: J.dangerFg, ml: 0.25 }}>
                  *
                </Box>
                <Box component="span" sx={srOnly}>
                  {t("jobsV2.form.required")}
                </Box>
              </>
            )}
          </Typography>
        ) : null
      ) : (
        <FieldLabel htmlFor={ids.id} label={label} required={required} />
      )}
      {children}
      <FieldMessages helper={helper} error={error} helperId={ids.helperId} errorId={ids.errorId} />
    </>
  );

  return (
    <Box
      {...rest}
      component={as === "group" ? "fieldset" : "div"}
      sx={[
        { width: fullWidth ? "100%" : "auto", minWidth: 0, border: 0, m: 0, p: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {body}
    </Box>
  );
}

/* ==========================================================================
 * JTextField / JTextArea
 * ======================================================================== */

export interface JTextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel" | "number" | "password" | "date";
  startIcon?: string;
  endIcon?: ReactNode;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  name?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "email" | "url" | "tel" | "numeric" | "decimal" | "search";
  min?: string | number;
  max?: string | number;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
  /** Show a live "120 / 500" counter. */
  showCount?: boolean;
  dense?: boolean;
}

export function JTextField({
  label,
  required,
  error,
  helper,
  disabled,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  startIcon,
  endIcon,
  multiline,
  rows = 4,
  maxLength,
  name,
  autoFocus,
  autoComplete,
  inputMode,
  min,
  max,
  onBlur,
  onKeyDown,
  inputRef,
  showCount,
  dense,
  fullWidth = true,
  sx,
  ...rest
}: JTextFieldProps) {
  const ids = useFieldIds(id);
  return (
    <Box
      {...rest}
      sx={[{ width: fullWidth ? "100%" : "auto", minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <FieldLabel htmlFor={ids.id} label={label} required={required} />
      <InputBase
        id={ids.id}
        name={name}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange(e.target.value)
        }
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        type={multiline ? undefined : type}
        multiline={multiline}
        minRows={multiline ? rows : undefined}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        inputRef={inputRef}
        inputProps={{
          maxLength,
          inputMode,
          min,
          max,
          "aria-required": required || undefined,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy(helper, error, ids.helperId, ids.errorId),
        }}
        startAdornment={
          startIcon ? (
            <Box sx={{ display: "inline-flex", color: J.ink3, mr: 1, flexShrink: 0 }}>
              <IconWrapper icon={startIcon} size={18} />
            </Box>
          ) : undefined
        }
        endAdornment={
          endIcon ? (
            <Box sx={{ display: "inline-flex", color: J.ink3, ml: 1, flexShrink: 0 }}>{endIcon}</Box>
          ) : undefined
        }
        sx={controlSx({ error: Boolean(error), disabled, dense, multiline })}
      />
      {showCount && maxLength !== undefined && (
        <Typography
          sx={{ ...TYPE.micro, mt: 0.5, textAlign: "end", color: J.ink4 }}
          aria-live="polite"
        >
          {value.length} / {maxLength}
        </Typography>
      )}
      <FieldMessages helper={helper} error={error} helperId={ids.helperId} errorId={ids.errorId} />
    </Box>
  );
}

export interface JTextAreaProps extends Omit<JTextFieldProps, "multiline" | "type"> {
  /** Grow with the content instead of scrolling. */
  autoResize?: boolean;
}

export function JTextArea({ rows = 4, autoResize, ...props }: JTextAreaProps) {
  return <JTextField {...props} multiline rows={autoResize ? rows : rows} />;
}

/* ==========================================================================
 * JSelect
 * ======================================================================== */

export interface JSelectOption {
  value: string;
  /** Already translated. `renderValue` shows THIS, never the raw value. */
  label: string;
  icon?: string;
  /** A colour token for the option's glyph. */
  tone?: string;
  disabled?: boolean;
}

export interface JSelectProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: JSelectOption[];
  placeholder?: string;
  renderValue?: (value: string) => ReactNode;
  dense?: boolean;
  name?: string;
  /** Show a spinner inside this control alone while its own request is in flight. */
  busy?: boolean;
  "aria-label"?: string;
}

export function JSelect({
  label,
  required,
  error,
  helper,
  disabled,
  id,
  value,
  onChange,
  options,
  placeholder,
  renderValue,
  dense,
  name,
  busy,
  fullWidth = true,
  sx,
  ...rest
}: JSelectProps) {
  const ids = useFieldIds(id);
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  // The default renderValue is the option's LABEL, never the raw value. This is the fix for the
  // Experience control that read "0-1" closed and "0-1 years" open.
  const render = (raw: unknown) => {
    const key = String(raw ?? "");
    if (renderValue) return renderValue(key);
    const option = byValue.get(key);
    // The empty string is a legitimate VALUE, not only "nothing chosen": the board's sort
    // offers `""` as "Most recent" and the admin filters offer it as "Any status". Treating
    // every falsy value as the placeholder is what rendered those controls blank — a select
    // showing nothing at all, next to a list whose first item was selected. The option wins
    // whenever one exists; the placeholder is the fallback for a value nothing matches.
    if (!option) {
      if (!key) return <Box component="span" sx={{ color: J.ink4 }}>{placeholder ?? ""}</Box>;
      return key;
    }
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
        {option.icon && (
          <Box sx={{ display: "inline-flex", color: option.tone ?? J.ink3, flexShrink: 0 }}>
            <IconWrapper icon={option.icon} size={16} />
          </Box>
        )}
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {option.label}
        </Box>
      </Box>
    );
  };

  return (
    <Box
      {...rest}
      sx={[{ width: fullWidth ? "100%" : "auto", minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <FieldLabel htmlFor={ids.id} label={label} required={required} />
      <Select
        id={ids.id}
        name={name}
        value={value}
        displayEmpty
        disabled={disabled}
        onChange={(event) => onChange(String(event.target.value))}
        renderValue={render}
        input={<BareInput sx={controlSx({ error: Boolean(error), disabled, dense })} />}
        inputProps={{
          "aria-required": required || undefined,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy(helper, error, ids.helperId, ids.errorId),
          "aria-label": rest["aria-label"] ?? label,
        }}
        IconComponent={(iconProps) => (
          <Box
            {...iconProps}
            sx={{ display: "inline-flex", color: J.ink3, mr: 1, pointerEvents: "none" }}
          >
            {busy ? (
              <CircularProgress size={16} thickness={4} sx={{ color: J.azure }} />
            ) : (
              <IconWrapper icon="mdi:chevron-down" size={18} />
            )}
          </Box>
        )}
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 0.5,
              borderRadius: R.inner,
              border: `1px solid ${J.hairline}`,
              bgcolor: J.surface,
              boxShadow: SHADOW.overlay,
              backgroundImage: "none",
              "& .MuiMenuItem-root": {
                fontSize: "0.875rem",
                color: J.ink,
                minHeight: 40,
                gap: 1,
                "&.Mui-selected": { bgcolor: J.azureSoft, color: J.azureDeep },
                "&.Mui-selected:hover": { bgcolor: J.azureSoft },
                "&:hover": { bgcolor: J.surface2 },
              },
            },
          },
        }}
      >
        {placeholder !== undefined && !byValue.has("") && (
          <MenuItem value="">
            <Box component="span" sx={{ color: J.ink4 }}>
              {placeholder}
            </Box>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.icon && (
              <Box sx={{ display: "inline-flex", color: option.tone ?? J.ink3 }}>
                <IconWrapper icon={option.icon} size={16} />
              </Box>
            )}
            {option.label}
          </MenuItem>
        ))}
      </Select>
      <FieldMessages helper={helper} error={error} helperId={ids.helperId} errorId={ids.errorId} />
    </Box>
  );
}

/* ==========================================================================
 * StatusSelect — the ONLY editable status control.
 *
 * It looks visibly different from a StatusPill (chevron, control height, hairline border), so a
 * reader can tell at a glance which statuses they can change and which are read-outs.
 * ======================================================================== */

export interface StatusSelectProps extends BaseFieldProps {
  kind: StatusKind;
  value: string;
  onChange: (value: string) => void;
  /** An inline spinner on THIS control alone while its own request is in flight. */
  busy?: boolean;
  /** Desktop-only 32px height. Still gets a 44px hit area via a transparent inset. */
  dense?: boolean;
  "aria-label"?: string;
}

export function StatusSelect({
  kind,
  value,
  onChange,
  busy,
  dense,
  sx,
  ...rest
}: StatusSelectProps) {
  const { t } = useTranslation("common");
  const options = useMemo<JSelectOption[]>(
    () =>
      statusOptions(kind).map(({ value: v, tone }) => ({
        value: v,
        label: t(tone.labelKey) as string,
        icon: tone.icon,
        tone: tone.fg,
      })),
    [kind, t],
  );

  return (
    <JSelect
      {...rest}
      value={value}
      onChange={onChange}
      options={options}
      dense={dense}
      busy={busy}
      sx={[
        dense
          ? {
              // The dense variant is desktop-only, so it still has to clear 44px for a finger.
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                insetInline: 0,
                top: "50%",
                transform: "translateY(-50%)",
                height: CTL_H.touch,
                pointerEvents: "none",
              },
            }
          : null,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}

/* ==========================================================================
 * JRadioGroup / JCheckGroup — real fieldsets, real keyboard support.
 * ======================================================================== */

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface JRadioGroupProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: ChoiceOption[];
  orientation?: "vertical" | "horizontal";
  name?: string;
}

export function JRadioGroup({
  label,
  required,
  error,
  helper,
  disabled,
  id,
  value,
  onChange,
  options,
  orientation = "vertical",
  name,
  sx,
  ...rest
}: JRadioGroupProps) {
  const ids = useFieldIds(id);
  const groupName = name ?? ids.id;

  return (
    <JField
      {...rest}
      as="group"
      label={label}
      required={required}
      error={error}
      helper={helper}
      htmlFor={ids.id}
      sx={sx}
    >
      <Box
        role="radiogroup"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(helper, error, ids.helperId, ids.errorId)}
        sx={{
          display: "flex",
          flexDirection: orientation === "horizontal" ? "row" : "column",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {options.map((option) => {
          const checked = option.value === value;
          const optionDisabled = disabled || option.disabled;
          return (
            <Box
              component="label"
              key={option.value}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.25,
                minHeight: CTL_H.touch,
                px: 1.5,
                py: 1,
                borderRadius: R.ctl,
                border: `1px solid ${checked ? J.azureBorder : error ? J.dangerBd : J.hairline}`,
                bgcolor: checked ? J.azureSoft : optionDisabled ? J.surface3 : J.surface,
                color: optionDisabled ? J.ink4 : J.ink,
                cursor: optionDisabled ? "not-allowed" : "pointer",
                transition: `border-color ${MOTION.micro}ms ${MOTION.ease}, background-color ${MOTION.micro}ms ${MOTION.ease}`,
                "&:hover": optionDisabled ? undefined : { borderColor: J.azureBorder },
                "&:focus-within": { boxShadow: "var(--j-focus-ring)" },
              }}
            >
              <Box
                component="input"
                type="radio"
                name={groupName}
                value={option.value}
                checked={checked}
                disabled={optionDisabled}
                onChange={() => onChange(option.value)}
                sx={{ ...srOnly }}
              />
              <Box
                aria-hidden
                sx={{
                  width: 18,
                  height: 18,
                  mt: "1px",
                  flexShrink: 0,
                  borderRadius: "50%",
                  border: `2px solid ${checked ? J.azure : J.hairlineStrong}`,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {checked && (
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: J.azure }} />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ ...TYPE.bodyStrong, color: "inherit" }}>{option.label}</Typography>
                {option.description && (
                  <Typography sx={{ ...TYPE.small, mt: 0.25 }}>{option.description}</Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </JField>
  );
}

export interface JCheckGroupProps extends BaseFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: ChoiceOption[];
  orientation?: "vertical" | "horizontal";
  name?: string;
}

export function JCheckGroup({
  label,
  required,
  error,
  helper,
  disabled,
  id,
  values,
  onChange,
  options,
  orientation = "vertical",
  name,
  sx,
  ...rest
}: JCheckGroupProps) {
  const ids = useFieldIds(id);
  const groupName = name ?? ids.id;

  const toggle = (optionValue: string) => {
    const next = values.includes(optionValue)
      ? values.filter((v) => v !== optionValue)
      : [...values, optionValue];
    onChange(next);
  };

  return (
    <JField
      {...rest}
      as="group"
      label={label}
      required={required}
      error={error}
      helper={helper}
      htmlFor={ids.id}
      sx={sx}
    >
      <Box
        role="group"
        aria-describedby={describedBy(helper, error, ids.helperId, ids.errorId)}
        sx={{
          display: "flex",
          flexDirection: orientation === "horizontal" ? "row" : "column",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {options.map((option) => {
          const checked = values.includes(option.value);
          const optionDisabled = disabled || option.disabled;
          return (
            <Box
              component="label"
              key={option.value}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.25,
                minHeight: CTL_H.touch,
                px: 1.5,
                py: 1,
                borderRadius: R.ctl,
                border: `1px solid ${checked ? J.azureBorder : error ? J.dangerBd : J.hairline}`,
                bgcolor: checked ? J.azureSoft : optionDisabled ? J.surface3 : J.surface,
                color: optionDisabled ? J.ink4 : J.ink,
                cursor: optionDisabled ? "not-allowed" : "pointer",
                transition: `border-color ${MOTION.micro}ms ${MOTION.ease}, background-color ${MOTION.micro}ms ${MOTION.ease}`,
                "&:hover": optionDisabled ? undefined : { borderColor: J.azureBorder },
                "&:focus-within": { boxShadow: "var(--j-focus-ring)" },
              }}
            >
              <Box
                component="input"
                type="checkbox"
                name={groupName}
                value={option.value}
                checked={checked}
                disabled={optionDisabled}
                onChange={() => toggle(option.value)}
                sx={{ ...srOnly }}
              />
              <Box
                aria-hidden
                sx={{
                  width: 18,
                  height: 18,
                  mt: "1px",
                  flexShrink: 0,
                  borderRadius: "4px",
                  border: `2px solid ${checked ? J.azure : J.hairlineStrong}`,
                  bgcolor: checked ? J.azure : "transparent",
                  color: J.surface,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {checked && <IconWrapper icon="mdi:check" size={12} />}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ ...TYPE.bodyStrong, color: "inherit" }}>{option.label}</Typography>
                {option.description && (
                  <Typography sx={{ ...TYPE.small, mt: 0.25 }}>{option.description}</Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </JField>
  );
}

/* ==========================================================================
 * JDatePicker — a native date input in the kit's chrome. No date library
 * (section 10: no new dependencies), and the native picker is the one control
 * every mobile keyboard already knows how to drive.
 * ======================================================================== */

export interface JDatePickerProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** ISO yyyy-mm-dd. */
  min?: string;
  max?: string;
  name?: string;
}

export function JDatePicker({ min, max, ...props }: JDatePickerProps) {
  return <JTextField {...props} type="date" min={min} max={max} />;
}

/* ==========================================================================
 * JFileDrop
 *
 * Drag state is REACT STATE, never `e.currentTarget.style.borderColor`. The imperative
 * mutation permanently outranks `sx`, which is why the green success border never renders in
 * the shipped apply flow. A rejected type or size produces the `error` state with a specific
 * message — never silence.
 * ======================================================================== */

export type FileDropState = "idle" | "uploading" | "success" | "error";

export interface JFileDropProps {
  accept?: string;
  maxBytes?: number;
  /** The chosen file, or a previously uploaded one. */
  value?: { name: string; size?: number } | null;
  onFile: (file: File) => void;
  onClear?: () => void;
  label: string;
  hint?: string;
  /** The upload lifecycle. Drag-over is internal. */
  state?: FileDropState;
  /** The message shown in the `error` state. */
  error?: string | null;
  disabled?: boolean;
  id?: string;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

function extensionMatches(accept: string | undefined, file: File): boolean {
  if (!accept) return true;
  const patterns = accept
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (!patterns.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some((p) => {
    if (p.startsWith(".")) return name.endsWith(p);
    if (p.endsWith("/*")) return type.startsWith(p.slice(0, -1));
    return type === p;
  });
}

export function JFileDrop({
  accept,
  maxBytes,
  value,
  onFile,
  onClear,
  label,
  hint,
  state = "idle",
  error,
  disabled,
  id,
  sx,
  ...rest
}: JFileDropProps) {
  const { t } = useTranslation("common");
  const ids = useFieldIds(id);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const message = error ?? localError;
  const visual: FileDropState | "dragover" = dragging
    ? "dragover"
    : message
      ? "error"
      : state;

  const accept_ = accept;
  const validate = useCallback(
    (file: File): string | null => {
      if (!extensionMatches(accept_, file)) {
        return t("jobsV2.file.errorType", { accept: accept_ }) as string;
      }
      if (maxBytes !== undefined && file.size > maxBytes) {
        return t("jobsV2.file.errorSize", { max: formatBytes(maxBytes) }) as string;
      }
      return null;
    },
    [accept_, maxBytes, t],
  );

  const take = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      const problem = validate(file);
      if (problem) {
        setLocalError(problem);
        return;
      }
      setLocalError(null);
      onFile(file);
    },
    [onFile, validate],
  );

  const chrome = (() => {
    switch (visual) {
      case "dragover":
        return { border: `2px dashed ${J.azure}`, bgcolor: J.azureSoft };
      case "uploading":
        return { border: `2px dashed ${J.hairlineStrong}`, bgcolor: J.surface2 };
      case "success":
        return { border: `2px solid ${J.successBd}`, bgcolor: J.successBg };
      case "error":
        return { border: `2px dashed ${J.dangerBd}`, bgcolor: J.dangerBg };
      default:
        return { border: `2px dashed ${J.hairline}`, bgcolor: J.surface };
    }
  })();

  return (
    <Box {...rest} sx={[{ width: "100%" }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(e: React.DragEvent) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          setDragging(false);
          if (disabled) return;
          take(e.dataTransfer?.files?.[0]);
        }}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 1,
          minHeight: { xs: 120, md: 156 },
          p: 2,
          borderRadius: R.inner,
          cursor: visual === "uploading" ? "wait" : disabled ? "not-allowed" : "default",
          transition: `border-color ${MOTION.surface}ms ${MOTION.ease}, background-color ${MOTION.surface}ms ${MOTION.ease}`,
          ...chrome,
        }}
      >
        <Box
          component="input"
          ref={inputRef}
          id={ids.id}
          type="file"
          accept={accept}
          disabled={disabled || visual === "uploading"}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            take(e.target.files?.[0]);
            // Allow re-selecting the same file after a clear.
            e.target.value = "";
          }}
          sx={srOnly}
        />
        {visual === "uploading" ? (
          <>
            <CircularProgress size={22} thickness={4} sx={{ color: J.azure }} />
            <Typography sx={{ ...TYPE.bodyStrong }}>{t("jobsV2.file.uploading")}</Typography>
          </>
        ) : visual === "success" && value ? (
          <>
            <Box sx={{ color: J.successFg, display: "inline-flex" }}>
              <IconWrapper icon="mdi:file-check-outline" size={28} />
            </Box>
            <Typography sx={{ ...TYPE.bodyStrong }} title={value.name}>
              {value.name}
            </Typography>
            {value.size !== undefined && (
              <Typography sx={TYPE.micro}>{formatBytes(value.size)}</Typography>
            )}
            {onClear && (
              <Box
                component="button"
                type="button"
                onClick={() => {
                  setLocalError(null);
                  onClear();
                }}
                sx={{
                  mt: 0.5,
                  px: 1.5,
                  minHeight: CTL_H.touch,
                  borderRadius: R.ctl,
                  border: `1px solid ${J.hairline}`,
                  bgcolor: J.surface,
                  color: J.ink2,
                  font: "inherit",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  ...focusRing,
                }}
              >
                {t("jobsV2.file.remove")}
              </Box>
            )}
          </>
        ) : (
          <>
            <Box sx={{ color: visual === "error" ? J.dangerFg : J.ink3, display: "inline-flex" }}>
              <IconWrapper icon="mdi:tray-arrow-up" size={28} />
            </Box>
            <Typography component="label" htmlFor={ids.id} sx={{ ...TYPE.bodyStrong, cursor: "pointer" }}>
              {label}
            </Typography>
            {hint && <Typography sx={TYPE.small}>{hint}</Typography>}
            <Box
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              sx={{
                mt: 0.5,
                px: 1.75,
                minHeight: CTL_H.touch,
                borderRadius: R.ctl,
                border: `1px solid ${J.hairline}`,
                bgcolor: J.surface,
                color: J.ink,
                font: "inherit",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                ...focusRing,
              }}
            >
              {t("jobsV2.file.browse")}
            </Box>
          </>
        )}
      </Box>
      {message && (
        <Typography id={ids.errorId} role="alert" sx={{ ...TYPE.small, color: J.dangerFg, mt: 0.75 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}

/* ==========================================================================
 * JSwitch
 * ======================================================================== */

export interface JSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  id?: string;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

export function JSwitch({
  label,
  checked,
  onChange,
  description,
  disabled,
  id,
  sx,
  ...rest
}: JSwitchProps) {
  const ids = useFieldIds(id);
  return (
    <Box
      {...rest}
      sx={[
        {
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          minHeight: CTL_H.touch,
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Switch
        id={ids.id}
        checked={checked}
        disabled={disabled}
        onChange={(_, next) => onChange(next)}
        inputProps={{
          "aria-describedby": description ? ids.helperId : undefined,
        }}
        sx={{
          mt: 0.25,
          "& .MuiSwitch-switchBase.Mui-checked": { color: J.surface },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            bgcolor: J.azure,
            opacity: 1,
          },
          "& .MuiSwitch-track": { bgcolor: J.hairlineStrong, opacity: 1 },
          "& .MuiSwitch-thumb": { bgcolor: J.surface, boxShadow: SHADOW.raise },
          "& .MuiSwitch-switchBase.Mui-focusVisible + .MuiSwitch-track": {
            boxShadow: "var(--j-focus-ring)",
          },
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography component="label" htmlFor={ids.id} sx={{ ...TYPE.bodyStrong, cursor: "pointer" }}>
          {label}
        </Typography>
        {description && (
          <Typography id={ids.helperId} sx={{ ...TYPE.small, mt: 0.25 }}>
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/** Focus and scroll the first invalid control in a form. Used on every submit. */
export function focusFirstError(container: HTMLElement | null) {
  if (!container) return;
  const node = container.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
  if (!node) return;
  node.scrollIntoView({ block: "center", behavior: "smooth" });
  node.focus({ preventScroll: true });
}
