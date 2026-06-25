import { ImageResponse } from "next/og";
import { fetchCredentialServer } from "./credential-data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Verified credential";

// Rich OG image LinkedIn (and others) show when the credential URL is added as a
// media link or shared — a clean, branded "Verified Credential" card.
export default async function Image({ params }: { params: Promise<{ credentialId: string }> }) {
  const { credentialId } = await params;
  const cred = await fetchCredentialServer(credentialId);
  const recipient = cred?.recipient_name || "Learner";
  const course = cred?.course_title || "Course Completion";
  const issuer = cred?.issuer_name || "AI Linc";
  const id = cred?.credential_id || credentialId;

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
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)",
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
            ✓ Verified Credential
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 12 }}>This certifies that</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{recipient}</div>
          <div style={{ fontSize: 28, opacity: 0.85, margin: "18px 0 6px" }}>has successfully completed</div>
          <div style={{ fontSize: 46, fontWeight: 700, color: "#fde68a" }}>{course}</div>
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
