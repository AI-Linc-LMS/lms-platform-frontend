import type { Metadata } from "next";
import { fetchCredentialServer } from "./credential-data";
import { CredentialView } from "./CredentialView";

interface PageProps {
  params: Promise<{ credentialId: string }>;
}

// Server-rendered metadata so LinkedIn / crawlers unfurl the credential with a
// rich title + description + the certificate OG image (opengraph-image.tsx).
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { credentialId } = await params;
  const cred = await fetchCredentialServer(credentialId);
  if (!cred || !cred.verified) {
    return { title: "Credential not found", robots: { index: false } };
  }
  const title = `${cred.course_title} — Verified Credential`;
  const description = `${cred.recipient_name} has successfully completed ${cred.course_title}, issued by ${cred.issuer_name}. Verify credential ${cred.credential_id}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CredentialPage({ params }: PageProps) {
  const { credentialId } = await params;
  return <CredentialView credentialId={credentialId} />;
}
