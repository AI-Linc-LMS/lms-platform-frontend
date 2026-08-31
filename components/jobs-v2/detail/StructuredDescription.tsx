"use client";

import { useMemo, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import RichHtml from "@/components/common/RichHtml";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import {
  resolveJobContent,
  isContentEmpty,
  stackOverlap,
  cleanList,
  STACK_MERGE_THRESHOLD,
  type JobContent,
} from "@/lib/jobs-v2/content";
import { foldToken, normaliseDescription } from "@/lib/jobs-v2/format";
import {
  J,
  TYPE,
  JCard,
  SectionHeader,
  SkillChip,
  BulletList,
  HighlightStrip,
  HighlightRule,
  jobHighlights,
} from "@/components/jobs-v2/ui";

/* ==========================================================================
 * The answer to "the about-the-job description is very plain".
 *
 * The root cause is not styling. `job_scraper/services/enrichment.py` already asks the model for
 * a summary, a Responsibilities block and a Requirements block, and then glues them into one
 * `job_description` string that this page rendered as `pre-wrap` inside a single card. **We
 * generate structure and destroy it at the boundary.** So most of the fix is *stop flattening*,
 * which is why it carries no invention risk: every word below is a word we were already storing.
 *
 * The typographic rules that actually make it not-plain, and that a future edit must keep:
 *
 *   - **Exactly one paragraph of prose per card.** Everything else is a list or a label/value
 *     pair. A confident two-sentence opening instead of a wall does most of the work.
 *   - Section headers sit **on the canvas**, not inside the card they label, so the page reads
 *     as a stack of labelled objects rather than as one document.
 *   - Measure is capped (68ch for the lead, 72ch for `<Prose>`). A 900px pane at 15px runs ~110
 *     characters, which is the real reason a paragraphed JD still reads as a wall.
 *   - Bullets are a 1x8px accent rule or a glyph, never a disc.
 *
 * Nothing here decides which shape the row is in — `resolveJobContent` does that once, and
 * `origin` is the only thing this file branches on. A legacy flat blob with markers is parsed at
 * render time into the same section shapes, which is what makes ~486 published jobs look
 * structured before a single backend phase lands. A parse is not a generation.
 * ======================================================================== */

/** HTML, or plain text the shipped page rendered with `pre-wrap` and three dead `sx` rules. */
const LOOKS_LIKE_HTML = /<\/?[a-z][\s\S]*>/i;

/**
 * The one prose renderer on this page. HTML goes through the app's existing **sanitising**
 * renderer (spec 10.7 forbids a markdown library); plain text keeps its own line breaks.
 */
export function Prose({ text, sx }: { text: string; sx?: SxProps<Theme> }) {
  if (LOOKS_LIKE_HTML.test(text)) {
    // The `& p / & ul, & ol / & li` rules that sat dead in the shipped `sx` — on a `pre-wrap`
    // Typography that can never contain an element — live inside RichHtml, where they apply.
    return (
      <RichHtml
        html={text}
        sx={[{ ...TYPE.prose, "& :first-of-type": { mt: 0 } }, ...(Array.isArray(sx) ? sx : [sx])]}
      />
    );
  }
  return (
    <Typography
      sx={[{ ...TYPE.prose, whiteSpace: "pre-wrap" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {text}
    </Typography>
  );
}

/* ==========================================================================
 * A section: header on the canvas, content in one card.
 * ======================================================================== */

function Section({
  icon,
  title,
  description,
  children,
  headingId,
}: {
  icon: string;
  title: string;
  description?: string;
  children: ReactNode;
  headingId?: string;
}) {
  return (
    <Box component="section" aria-labelledby={headingId} sx={{ mb: 3, minWidth: 0 }}>
      <SectionHeader icon={icon} title={title} description={description} id={headingId} />
      <JCard>{children}</JCard>
    </Box>
  );
}

/* ==========================================================================
 * Selection process — `role_process`, which receives `interview_process` as `- ` lines.
 * ======================================================================== */

/**
 * `role_process` is a free textarea an admin types into, so it is a list on some rows and a
 * paragraph on others. Splitting a paragraph into "stages" would invent a boundary nobody wrote,
 * so we only treat it as a list when the author actually marked one: two or more lines, at least
 * two of which carry a bullet or a number.
 */
export function processSteps(value: string | null | undefined): string[] | null {
  if (!value) return null;
  const normalised = normaliseDescription(String(value));
  if (!normalised) return null;
  const lines = normalised
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;
  const marked = lines.filter((line) => /^(?:[-–—*•·]\s+|\d{1,2}[.)]\s+)/.test(line));
  if (marked.length < 2) return null;
  return cleanList(marked.length === lines.length ? lines : marked);
}

/* ==========================================================================
 * StructuredDescription
 * ======================================================================== */

export interface StructuredDescriptionProps {
  job: JobV2;
  /**
   * The learner's own skills, folded. A matched chip renders `SkillChip selected` and sorts
   * first. Empty means we do not know them, and then nothing is promoted — never a "0 matches".
   */
  learnerTokens?: ReadonlySet<string>;
  /**
   * The eligibility gate table, rendered BELOW the requirement bullets: it is the shortlisting
   * gate, not part of the pitch. Its summary lives at the top of the page, above everything.
   */
  eligibility?: ReactNode;
  /** Rendered instead of the sections when there is genuinely nothing to show. */
  sparse?: ReactNode;
  sx?: SxProps<Theme>;
}

export function StructuredDescription({
  job,
  learnerTokens,
  eligibility,
  sparse,
  sx,
}: StructuredDescriptionProps) {
  const { t } = useTranslation("common");

  // ONE decision point for the four shapes. Never branch on `job.role_summary` here.
  const content: JobContent = useMemo(() => resolveJobContent(job), [job]);
  // `jobHighlights` resolves its own strings through the i18n singleton, so it stays pure and
  // callable from a non-component (it is unit-tested that way in `jobsLogic.test.ts`).
  const highlights = useMemo(() => jobHighlights(job), [job]);

  /**
   * Skills render ONCE. The shipped page concatenated `mandatory_skills` and `key_skills`, which
   * the admin edit form makes identical, so every skill appeared twice.
   */
  const skills = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of [...(job.mandatory_skills ?? []), ...(job.key_skills ?? [])]) {
      const value = String(raw ?? "").trim();
      if (!value) continue;
      const token = foldToken(value);
      if (!token || seen.has(token)) continue;
      seen.add(token);
      out.push(value);
    }
    return out;
  }, [job.mandatory_skills, job.key_skills]);

  /**
   * `tech_stack` and the skill lists frequently say the same thing. Above the threshold they
   * become ONE merged section — this page has already been burned once by rendering two lists
   * that turned out identical.
   */
  const { mergedSkills, separateStack } = useMemo(() => {
    const skillTokens = new Set(skills.map(foldToken));
    const stack = content.techStack;
    if (!stack.length) return { mergedSkills: skills, separateStack: [] as string[] };
    if (stackOverlap(stack, skillTokens) > STACK_MERGE_THRESHOLD) {
      const merged = [...skills];
      for (const item of stack) {
        const token = foldToken(item);
        if (token && !skillTokens.has(token)) {
          skillTokens.add(token);
          merged.push(item);
        }
      }
      return { mergedSkills: merged, separateStack: [] as string[] };
    }
    return { mergedSkills: skills, separateStack: stack };
  }, [skills, content.techStack]);

  /** Matched first, and visually promoted — the shipped card ranked but never showed it. */
  const orderSkills = (list: string[]) => {
    if (!learnerTokens || learnerTokens.size === 0) return list.map((label) => ({ label, matched: false }));
    const rows = list.map((label) => ({ label, matched: learnerTokens.has(foldToken(label)) }));
    return [...rows.filter((r) => r.matched), ...rows.filter((r) => !r.matched)];
  };

  /**
   * A tinted chip is a colour-only signal, which a colour-blind reader and a screen reader both
   * miss. One line says what the tint means — and it renders only when there is actually a match,
   * so it is never a claim about a profile we do not know. **Never a percentage**: a score built
   * from two unweighted string lists is a number the learner cannot check or act on, whereas a
   * named skill is both.
   */
  const anyMatch =
    Boolean(learnerTokens?.size) &&
    [...mergedSkills, ...separateStack].some((label) => learnerTokens?.has(foldToken(label)));

  const steps = useMemo(() => processSteps(job.role_process), [job.role_process]);
  const hasSkills = mergedSkills.length > 0 || separateStack.length > 0;

  /**
   * The lead paragraph. For a structured or parsed row it is the summary and carries FULL ink at
   * a 68ch measure — it is the opening, and a washed-out first paragraph is half of what "plain"
   * means. For a `"flat"` row it is the whole blob, which stays on the ordinary prose rung
   * exactly as it renders today: making a 4000-character wall darker does not make it lighter.
   */
  const flat = content.origin === "flat";
  const lead = flat ? content.flat ?? "" : content.roleSummary;

  const nothingAtAll =
    isContentEmpty(content) && !hasSkills && !steps && !job.role_process && !job.company_info;

  if (nothingAtAll) {
    return <Box sx={sx}>{sparse ?? null}</Box>;
  }

  return (
    <Box sx={[{ minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {/* ---- 1 + 2. About this role, and the computed highlights --------- */}
      {(lead || highlights.length > 0) && (
        <Section
          icon="mdi:text-box-outline"
          title={t("jobsV2.detail.aboutRole", { defaultValue: "About this role" }) as string}
          headingId="jobs-about-role"
        >
          {lead && <Prose text={lead} sx={flat ? undefined : { color: J.ink, maxWidth: "68ch" }} />}
          {highlights.length > 0 && (
            <>
              {lead && <HighlightRule />}
              {/* Computed in code from fields we already hold — a model asked for "highlights"
                  writes marketing copy, and a function cannot. */}
              <HighlightStrip items={highlights} data-tour-id="jobs-highlights" />
            </>
          )}
        </Section>
      )}

      {/* ---- 3. What you'll do ------------------------------------------- */}
      {content.responsibilities.length > 0 && (
        <Section
          icon="mdi:checkbox-multiple-marked-outline"
          title={t("jobsV2.detail.whatYoullDo", { defaultValue: "What you'll do" }) as string}
          headingId="jobs-responsibilities"
        >
          <BulletList
            items={content.responsibilities}
            variant="rule"
            max={8}
            ariaLabel={t("jobsV2.detail.whatYoullDo", { defaultValue: "What you'll do" }) as string}
          />
        </Section>
      )}

      {/* ---- 4. What they're looking for ---------------------------------
          Two blocks in ONE card. The "Good to have" half disappears entirely when
          `requirements_good` is empty, which is ~60% of rows — and the two lists are disjoint by
          construction, so a UI that renders both can never show the same item twice. */}
      {(content.requirementsMust.length > 0 || content.requirementsGood.length > 0) && (
        <Section
          icon="mdi:clipboard-text-search-outline"
          title={
            t("jobsV2.detail.lookingFor", { defaultValue: "What they're looking for" }) as string
          }
          headingId="jobs-requirements"
        >
          {content.requirementsMust.length > 0 && (
            <Box sx={{ mb: content.requirementsGood.length > 0 ? 2.5 : 0 }}>
              <Typography sx={{ ...TYPE.label, mb: 1 }}>
                {t("jobsV2.detail.mustHave", { defaultValue: "Must have" })}
              </Typography>
              <BulletList
                items={content.requirementsMust}
                variant="check"
                max={8}
                ariaLabel={t("jobsV2.detail.mustHave", { defaultValue: "Must have" }) as string}
              />
            </Box>
          )}
          {content.requirementsGood.length > 0 && (
            <Box>
              <Typography sx={{ ...TYPE.label, mb: 1 }}>
                {t("jobsV2.detail.goodToHave", { defaultValue: "Good to have" })}
              </Typography>
              {/* Muted, because a nice-to-have that reads as loud as a must-have is how a
                  qualified student talks themselves out of applying. */}
              <BulletList
                items={content.requirementsGood}
                variant="plus"
                tone="muted"
                max={6}
                ariaLabel={t("jobsV2.detail.goodToHave", { defaultValue: "Good to have" }) as string}
              />
            </Box>
          )}
        </Section>
      )}

      {/* ---- 5. Skills and stack ----------------------------------------- */}
      {hasSkills && (
        <Section
          icon="mdi:tag-multiple-outline"
          title={t("jobsV2.detail.skillsAndStack", { defaultValue: "Skills and stack" }) as string}
          headingId="jobs-skills"
        >
          {anyMatch && (
            <Typography sx={{ ...TYPE.micro, mb: 1.25 }}>
              {t("jobsV2.detail.skillsMatchHint", {
                defaultValue: "Highlighted skills are already on your profile.",
              })}
            </Typography>
          )}
          {mergedSkills.length > 0 && (
            <Box sx={{ mb: separateStack.length > 0 ? 2.5 : 0 }}>
              {separateStack.length > 0 && (
                <Typography sx={{ ...TYPE.label, mb: 1 }}>
                  {t("jobsV2.detail.keySkills", { defaultValue: "Key skills" })}
                </Typography>
              )}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {orderSkills(mergedSkills).map(({ label, matched }) => (
                  <SkillChip key={label} selected={matched}>
                    {label}
                  </SkillChip>
                ))}
              </Box>
            </Box>
          )}
          {separateStack.length > 0 && (
            <Box>
              <Typography sx={{ ...TYPE.label, mb: 1 }}>
                {t("jobsV2.detail.techStack", { defaultValue: "Tech stack" })}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {orderSkills(separateStack).map(({ label, matched }) => (
                  <SkillChip key={label} selected={matched}>
                    {label}
                  </SkillChip>
                ))}
              </Box>
            </Box>
          )}
        </Section>
      )}

      {/* ---- 6. Eligibility, the gate table ------------------------------- */}
      {eligibility}

      {/* ---- 7. Selection process ----------------------------------------
          None of the five boards we benchmarked offers this. It is almost always empty today and
          becomes populated once `interview_process` lands in `role_process`. */}
      {job.role_process && (
        <Section
          icon="mdi:format-list-numbered"
          title={
            t("jobsV2.detail.selectionProcess", { defaultValue: "Selection process" }) as string
          }
          headingId="jobs-process"
        >
          {steps ? (
            <BulletList
              items={steps}
              variant="numbered"
              ariaLabel={
                t("jobsV2.detail.selectionProcess", { defaultValue: "Selection process" }) as string
              }
            />
          ) : (
            <Prose text={job.role_process} />
          )}
        </Section>
      )}

      {/* ---- 8. Perks and benefits ---------------------------------------
          Concretely enumerated benefits only. Absent on ~85% of rows, and a section that would
          render an empty list omits itself rather than printing "None specified". */}
      {content.perks.length > 0 && (
        <Section
          icon="mdi:gift-outline"
          title={t("jobsV2.detail.perks", { defaultValue: "Perks and benefits" }) as string}
          headingId="jobs-perks"
        >
          <BulletList
            items={content.perks}
            variant="rule"
            ariaLabel={t("jobsV2.detail.perks", { defaultValue: "Perks and benefits" }) as string}
          />
        </Section>
      )}
    </Box>
  );
}
