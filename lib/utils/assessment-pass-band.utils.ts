export type PassBandFieldErrors = {
  lower?: string;
  upper?: string;
};

/**
 * Validates pass band inputs. Empty values are allowed unless certificate is on
 * (then both are required). Returns per-field messages for inline display.
 */
export function getPassBandFieldErrors(
  lowerRaw: string,
  upperRaw: string,
  certificateAvailable: boolean
): PassBandFieldErrors {
  const errors: PassBandFieldErrors = {};
  const lt = String(lowerRaw ?? "").trim();
  const ut = String(upperRaw ?? "").trim();

  if (certificateAvailable) {
    if (lt === "") {
      errors.lower = "Required when certificate is available.";
    }
    if (ut === "") {
      errors.upper = "Required when certificate is available.";
    }
  }

  const parseNum = (raw: string): number | null | "bad" => {
    const t = String(raw ?? "").trim();
    if (t === "") return null;
    const n = Number(t.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100) return "bad";
    return n;
  };

  const lParsed = parseNum(lowerRaw);
  const uParsed = parseNum(upperRaw);

  if (lParsed === "bad") {
    errors.lower = errors.lower ?? "Enter a valid number between 0 and 100.";
  }
  if (uParsed === "bad") {
    errors.upper = errors.upper ?? "Enter a valid number between 0 and 100.";
  }

  const ln = typeof lParsed === "number" ? lParsed : null;
  const un = typeof uParsed === "number" ? uParsed : null;
  if (ln != null && un != null && ln > un) {
    errors.upper =
      errors.upper ??
      "Must be greater than or equal to the lower threshold.";
  }

  return errors;
}
