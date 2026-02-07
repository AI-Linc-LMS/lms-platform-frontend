import { headers, notFound } from "next/navigation";
import type { Metadata } from "next";
import { Box, Typography, Paper } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";

export interface CertificateMeta {
  name: string;
  course: string;
  score: string;
  imageUrl: string;
}

async function getCertificate(id: string): Promise<CertificateMeta | null> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;
  const cookieHeader = headersList.get("cookie") ?? "";

  const res = await fetch(`${baseUrl}/api/certificates/${id}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    name: data.name ?? "Certificate recipient",
    course: data.course ?? "",
    score: data.score ?? "100%",
    imageUrl: data.imageUrl ?? "",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cert = await getCertificate(id);
  if (!cert) {
    return { title: "Certificate not found" };
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;

  return {
    title: `${cert.name} completed ${cert.course}`,
    description: `I just completed ${cert.course} with a score of ${cert.score}.`,
    openGraph: {
      title: `${cert.name} completed ${cert.course} 🎉`,
      description: `Score: ${cert.score}\nProud to share my achievement!`,
      url: `${baseUrl}/certificates/${id}`,
      images: cert.imageUrl
        ? [
            {
              url: cert.imageUrl,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
  };
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cert = await getCertificate(id);

  if (!cert) {
    notFound();
  }

  return (
    <MainLayout>
      <Box sx={{ py: 4, px: 2, maxWidth: 900, mx: "auto" }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          {cert.name} completed {cert.course}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Score: {cert.score}
        </Typography>
        {cert.imageUrl && (
          <Paper
            elevation={2}
            sx={{
              overflow: "hidden",
              borderRadius: 2,
              "& img": { width: "100%", height: "auto", display: "block" },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cert.imageUrl}
              alt={`Certificate for ${cert.course}`}
              width={1200}
              height={630}
            />
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
}
