"use client";

import { useTranslation } from "react-i18next";
import {
  FloatingToolPanels,
  type FloatingToolPanelsProps,
} from "@/components/tools/FloatingToolPanels";

export type AssessmentFloatingToolsProps = Omit<
  FloatingToolPanelsProps,
  "notepadStorageKey" | "notepadRestrictClipboard" | "notepadHint" | "assessmentContext"
> & {
  slug: string;
};

/** Assessment attempt: floating calculator + scratch notepad (locked clipboard). */
export function AssessmentFloatingTools({ slug, ...rest }: AssessmentFloatingToolsProps) {
  const { t } = useTranslation("common");
  return (
    <FloatingToolPanels
      {...rest}
      notepadStorageKey={`assessment-notepad:${slug}`}
      notepadRestrictClipboard
      notepadHint={t("tools.scratchHint")}
      assessmentContext
    />
  );
}
