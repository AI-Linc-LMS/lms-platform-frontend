import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import type { Certificate } from "@/lib/services/certificate.service";

export interface CertificateDetail {
  name: string;
  course: string;
  score: string;
  imageUrl: string;
  certificate_url: string;
  issued_at?: string;
}

async function fetchCertificatesWithAuth(cookieHeader: string | null): Promise<Certificate[]> {
  const url = `${config.apiBaseUrl}/api/clients/${config.clientId}/user-available-certificates/`;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (cookieHeader) headers["Cookie"] = cookieHeader;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) {
    return NextResponse.json({ error: "Invalid certificate ID" }, { status: 400 });
  }

  const cookieHeader = request.headers.get("cookie");
  const certificates = await fetchCertificatesWithAuth(cookieHeader);
  const cert = certificates.find((c) => c.id === idNum);

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const detail: CertificateDetail = {
    name: (cert as Certificate & { student_name?: string }).student_name ?? "Certificate recipient",
    course: cert.course_title,
    score: (cert as Certificate & { score?: string }).score ?? "100%",
    imageUrl: cert.certificate_url,
    certificate_url: cert.certificate_url,
    issued_at: cert.issued_at,
  };

  return NextResponse.json(detail);
}
