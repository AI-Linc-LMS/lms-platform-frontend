/**
 * Certificate copy builders. Organization name, logo, accent color, and slug subtitle are mapped
 * from tenant ClientInfo in `client-branding.ts` (buildCertificateBranding / finalizeBranding).
 */
import type { CertificateBranding, CertificateContent, CertificateVariant } from "./types";
import { generateCertificateId } from "./certificate-id";
import { scoreToPercent } from "./pass-band";

function baseContent(
  variant: CertificateVariant,
  partial: Omit<
    CertificateContent,
    "variant" | "branding" | "certificateId" | "issuedOn"
  > &
    Partial<Pick<CertificateContent, "certificateId" | "issuedOn">>,
  branding: CertificateBranding
): CertificateContent {
  return {
    variant,
    issuedOn: partial.issuedOn ?? new Date(),
    certificateId: partial.certificateId ?? generateCertificateId(),
    dateLabelPrefix: partial.dateLabelPrefix ?? "DATE:",
    preamble: partial.preamble,
    headlineTitle: partial.headlineTitle,
    bodyLead: partial.bodyLead,
    bodySegments: partial.bodySegments,
    subjectName: partial.subjectName,
    recipientName: partial.recipientName,
    scoreText: partial.scoreText,
    credentialLines: partial.credentialLines,
    branding,
  };
}

export function buildCourseCompletionCertificate(
  args: {
    recipientName: string;
    courseTitle: string;
    branding: CertificateBranding;
    issuedOn?: Date;
    certificateId?: string;
  }
): CertificateContent {
  const { recipientName, courseTitle, branding, issuedOn, certificateId } = args;
  return baseContent(
    "course_completion",
    {
      recipientName,
      subjectName: courseTitle,
      headlineTitle: "Certificate of completion",
      preamble: "This is to certify that",
      bodyLead: "has successfully completed the training program",
      bodySegments: [
        { text: courseTitle, bold: true },
        { text: " offered by ", bold: false },
        { text: branding.issuerDisplayName, bold: true },
        { text: ".", bold: false },
      ],
      issuedOn,
      certificateId,
    },
    branding
  );
}

export function buildAssessmentParticipationCertificate(
  args: {
    recipientName: string;
    assessmentTitle: string;
    branding: CertificateBranding;
    issuedOn?: Date;
    certificateId?: string;
  }
): CertificateContent {
  const { recipientName, assessmentTitle, branding, issuedOn, certificateId } = args;
  return baseContent(
    "assessment_participation",
    {
      recipientName,
      subjectName: assessmentTitle,
      headlineTitle: "Certificate of participation",
      preamble: "This acknowledges that",
      bodyLead: "has successfully participated in the assessment",
      bodySegments: [
        { text: assessmentTitle, bold: true },
        { text: " conducted by ", bold: false },
        { text: branding.issuerDisplayName, bold: true },
        { text: ".", bold: false },
      ],
      issuedOn,
      certificateId,
    },
    branding
  );
}

export function buildAssessmentAppreciationCertificate(
  args: {
    recipientName: string;
    assessmentTitle: string;
    branding: CertificateBranding;
    scoreText: string;
    issuedOn?: Date;
    certificateId?: string;
  }
): CertificateContent {
  const { recipientName, assessmentTitle, branding, scoreText, issuedOn, certificateId } =
    args;
  return baseContent(
    "assessment_appreciation",
    {
      recipientName,
      subjectName: assessmentTitle,
      scoreText,
      headlineTitle: "Certificate of achievement",
      preamble: "This is to certify that",
      bodyLead: "has demonstrated outstanding performance on the assessment",
      bodySegments: [
        { text: assessmentTitle, bold: true },
        { text: ` with a score of ${scoreText}, offered by `, bold: false },
        { text: branding.issuerDisplayName, bold: true },
        { text: ".", bold: false },
      ],
      issuedOn,
      certificateId,
    },
    branding
  );
}

function formatAssessmentResultCredentialLines(args: {
  accuracyPercent: number;
  percentile?: number | null;
  attemptedQuestions: number;
  totalQuestions: number;
  timeTakenMinutes?: number | null;
}): string[] {
  const lines: string[] = [];
  const acc = Math.round(Number(args.accuracyPercent) || 0);
  lines.push(`Accuracy: ${acc}%`);
  if (args.percentile != null && !Number.isNaN(Number(args.percentile))) {
    lines.push(`Percentile: ${Math.round(Number(args.percentile))}`);
  }
  const att = args.attemptedQuestions ?? 0;
  const tot = args.totalQuestions ?? 0;
  if (tot > 0) {
    lines.push(`Questions attempted: ${att} / ${tot}`);
  }
  const mins = args.timeTakenMinutes;
  if (mins != null && Number(mins) > 0) {
    lines.push(`Time taken: ${Math.round(Number(mins))} min`);
  }
  return lines;
}

/**
 * Learner-facing certificate on the assessment result page: includes score and summary stats.
 * Signature image and signatory copy come from client branding when configured.
 */
export function buildAssessmentResultCertificate(args: {
  recipientName: string;
  assessmentTitle: string;
  branding: CertificateBranding;
  score: number;
  maximumMarks: number;
  accuracyPercent: number;
  percentile?: number | null;
  attemptedQuestions: number;
  totalQuestions: number;
  timeTakenMinutes?: number | null;
  /** When true, uses achievement headline and copy (same thresholds as appreciation band). */
  inAppreciationBand: boolean;
  issuedOn?: Date;
  certificateId?: string;
}): CertificateContent {
  const {
    recipientName,
    assessmentTitle,
    branding,
    score,
    maximumMarks,
    accuracyPercent,
    percentile,
    attemptedQuestions,
    totalQuestions,
    timeTakenMinutes,
    inAppreciationBand,
    issuedOn,
    certificateId,
  } = args;

  const pct = scoreToPercent(score, maximumMarks);
  const pctRounded = Math.round(pct);
  const max = Number(maximumMarks) || 0;
  const scoreText =
    max > 0 ? `${score} / ${max} (${pctRounded}%)` : `${pctRounded}%`;

  const credentialLines = formatAssessmentResultCredentialLines({
    accuracyPercent,
    percentile,
    attemptedQuestions,
    totalQuestions,
    timeTakenMinutes,
  });

  if (inAppreciationBand) {
    return baseContent(
      "assessment_result",
      {
        recipientName,
        subjectName: assessmentTitle,
        scoreText,
        credentialLines,
        headlineTitle: "Certificate of achievement",
        preamble: "This is to certify that",
        bodyLead: "has demonstrated outstanding performance on the assessment",
        bodySegments: [
          { text: assessmentTitle, bold: true },
          { text: ` with a score of ${scoreText}, offered by `, bold: false },
          { text: branding.issuerDisplayName, bold: true },
          { text: ".", bold: false },
        ],
        issuedOn,
        certificateId,
      },
      branding
    );
  }

  return baseContent(
    "assessment_result",
    {
      recipientName,
      subjectName: assessmentTitle,
      scoreText,
      credentialLines,
      headlineTitle: "Certificate of completion",
      preamble: "This is to certify that",
      bodyLead: "has successfully completed the assessment",
      bodySegments: [
        { text: assessmentTitle, bold: true },
        {
          text: ` with a recorded score of ${scoreText}, offered by `,
          bold: false,
        },
        { text: branding.issuerDisplayName, bold: true },
        { text: ".", bold: false },
      ],
      issuedOn,
      certificateId,
    },
    branding
  );
}
