import type { Metadata } from "next";
import { credentialSubject, fetchCredentialServer } from "./credential-data";
import { CredentialView } from "./CredentialView";

interface PageProps {
  params: Promise<{ credentialId: string }>;
}

// Server-rendered metadata so LinkedIn and other crawlers unfurl the credential
// with a real title, description and the OG card in opengraph-image.tsx.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { credentialId } = await params;
  const cred = await fetchCredentialServer(credentialId);
  if (!cred) {
    return { title: "Credential not found", robots: { index: false } };
  }

  const subject = credentialSubject(cred);
  const issuer = cred.issuer?.name || "";

  // A revoked credential still has to resolve: the link is already on someone's
  // profile and a 404 reads as a broken site rather than as a withdrawal. It is
  // marked noindex so search engines stop surfacing it as an achievement.
  if (cred.status === "revoked") {
    const title = subject ? `${subject} - Revoked credential` : "Revoked credential";
    return {
      title,
      description: `Credential ${cred.credential_id} was issued by ${issuer} and has since been revoked. It is no longer valid.`,
      robots: { index: false },
    };
  }

  const title = subject ? `${subject} - Verified Credential` : "Verified Credential";
  const description = `${cred.recipient_name} earned ${subject}, issued by ${issuer}. Verify credential ${cred.credential_id}.`;
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
