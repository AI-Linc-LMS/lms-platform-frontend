export type CertificateVariant =
  | "course_completion"
  | "assessment_participation"
  | "assessment_appreciation";

export interface CertificateBranding {
  issuerDisplayName: string;
  logoUrl: string;
  signatureImageUrl: string;
  signatoryName: string;
  signatoryTitle: string;
  /** Accent for sidebar glow / seal (hex). */
  accentColor: string;
}

/**
 * All text and branding needed to render a certificate.
 * `subjectName` is the course or assessment title shown in the body.
 */
export interface CertificateContent {
  variant: CertificateVariant;
  recipientName: string;
  headlineTitle: string;
  /** Intro line before the recipient name, e.g. "This is to certify that" */
  preamble: string;
  /** Main achievement sentence; may include placeholders — use bodySegments for rich line */
  bodyLead: string;
  /** Optional segments after lead: plain / bold pairs for emphasis */
  bodySegments?: Array<{ text: string; bold?: boolean }>;
  subjectName: string;
  issuedOn: Date;
  certificateId: string;
  /** Shown top-left, e.g. "DATE: 29 May, 2024" */
  dateLabelPrefix?: string;
  branding: CertificateBranding;
  /** e.g. "92%" for appreciation variant */
  scoreText?: string;
}
