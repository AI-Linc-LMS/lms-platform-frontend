import type { CertificateBranding, CertificateContent, CertificateVariant } from "./types";
import { generateCertificateId } from "./certificate-id";

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
