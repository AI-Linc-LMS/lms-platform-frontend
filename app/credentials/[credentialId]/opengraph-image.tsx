import { ImageResponse } from "next/og";
import { credentialSubject, fetchCredentialServer } from "./credential-data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Verified credential";

/**
 * The card LinkedIn (and Slack, and iMessage) render when the credential URL is
 * shared or attached as media.
 *
 * This deliberately does NOT try to reproduce the certificate artwork. Satori,
 * which backs next/og, supports a small subset of CSS and none of the SVG the
 * guilloche and seal are drawn with, so an attempted copy would unfurl as a
 * broken approximation of the real thing. A clean branded card that agrees with
 * the page is the honest option.
 */
export default async function Image({ params }: { params: Promise<{ credentialId: string }> }) {
  const { credentialId } = await params;
  const cred = await fetchCredentialServer(credentialId);
  const recipient = cred?.recipient_name || "Learner";
  const subject = cred ? credentialSubject(cred) : "Certificate";
  const issuer = cred?.issuer?.name || "AI Linc";
  const id = cred?.credential_id || credentialId;
  const revoked = cred?.status === "revoked";

  // A revoked credential unfurls as revoked. Anything else would let a
  // withdrawn certificate keep advertising itself as an achievement in every
  // feed it was ever pasted into.
  const background = revoked
    ? "linear-gradient(135deg, #3f3f46 0%, #52525b 55%, #71717a 100%)"
    : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2, opacity: 0.95 }}>{issuer}</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(255,255,255,0.18)",
              padding: "10px 22px",
              borderRadius: 999,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {revoked ? "Revoked credential" : "✓ Verified Credential"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 12 }}>
            {revoked ? "This credential was issued to" : "This certifies that"}
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{recipient}</div>
          <div style={{ fontSize: 28, opacity: 0.85, margin: "18px 0 6px" }}>
            {revoked ? "and has since been revoked" : "for"}
          </div>
          <div style={{ fontSize: 46, fontWeight: 700, color: revoked ? "#e4e4e7" : "#fde68a" }}>
            {subject}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 24, opacity: 0.9 }}>
          <div>Credential ID: {id}</div>
          <div>Verify at this link</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
