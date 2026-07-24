"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { getUserDisplayName } from "@/lib/utils/user-utils";
import {
  getLinkedInPostText,
  getLinkedInAddToProfileUrl,
  openLinkedInPopup,
  blobToBase64,
  boldHeadline,
  CERTIFICATE_MIN_COMPLETION,
} from "@/lib/services/certificate-share.service";
import { DynamicCertificate } from "@/components/certificate/DynamicCertificate";
import { buildCourseCompletionCertificate } from "@/lib/certificate/copy";
import { buildCertificateBranding, finalizeBranding } from "@/lib/certificate/client-branding";
import { certificateElementToPngBlob } from "@/lib/utils/certificate-export.utils";

export interface UseCertificateActionsOptions {
  courseTitle: string;
  certificateAvailable?: boolean;
  /** Uploaded admin certificate template URL from S3. */
  uploadedTemplateUrl?: string | null;
  /** Overall course completion percentage (0–100). */
  completionPercentage?: number;
  /** Score to show in the LinkedIn post (e.g. "92%"). */
  score?: string;
  /** Minimum completion % required to claim. Defaults to the global 80% constant. */
  minCompletion?: number;
  /** Issuing organization name for the LinkedIn "Add to Profile" credential. */
  organizationName?: string;
  /** Verified LinkedIn numeric company id, if the tenant maps to a company page. */
  organizationId?: string | number | null;
  /** Course description woven into the LinkedIn post so it reflects the real course. */
  courseDescription?: string;
  /** Optional async source of an AI-generated post (e.g. the adaptive backend).
   *  When it resolves to text, it's used instead of the local template; on null/error
   *  the local template is used. Cached for the component's lifetime. */
  generatePost?: () => Promise<string | null>;
  /** Optional async source of a verifiable credential (id + public verify URL).
   *  Used as the LinkedIn "Add to Profile" credential URL/id (the professional, public
   *  credential link). Pre-fetched once the learner is eligible so the popup opens
   *  inside the click gesture. Falls back to the page URL when absent. */
  getCredential?: () => Promise<{ credentialId: string; verifyUrl: string } | null>;
}

export interface UseCertificateActions {
  /** Admin made a certificate available for this course. */
  available: boolean;
  /** Certificate content is built (user signed in + a course title is present). */
  ready: boolean;
  /** Eligible to download/share (available + ready + completion >= threshold). */
  canClaim: boolean;
  /** Effective minimum completion threshold. */
  minPct: number;
  downloading: boolean;
  sharing: boolean;
  /** Signed-in user (consumers use it for disabled state). */
  hasUser: boolean;
  downloadCertificate: () => Promise<void>;
  shareOnLinkedIn: () => Promise<void>;
  addToLinkedInProfile: () => void;
  /** Hidden certificate canvas + share dialog. Render once in the consumer. */
  portal: ReactNode;
}

/**
 * All certificate download + LinkedIn share logic, shared by the legacy
 * `CertificateButtons` (big buttons) and the adaptive-journey `CertificateCard`
 * (compact pills) so both stay in sync. Renders the off-screen certificate it
 * rasterizes and the LinkedIn "copy image + caption" dialog via `portal`.
 */
export function useCertificateActions(opts: UseCertificateActionsOptions): UseCertificateActions {
  const {
    courseTitle,
    certificateAvailable,
    uploadedTemplateUrl,
    completionPercentage = 0,
    score = "100%",
    minCompletion,
    organizationName,
    organizationId,
    courseDescription,
    generatePost,
    getCredential,
  } = opts;

  const { user } = useAuth();
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  const certRef = useRef<HTMLDivElement>(null);
  // AI post is fetched once per component lifetime (avoids re-hitting OpenAI on re-share).
  const aiPostRef = useRef<string | null>(null);
  // Verifiable credential (id + public verify URL), pre-issued once eligible.
  const [credential, setCredential] = useState<{ credentialId: string; verifyUrl: string } | null>(null);

  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePostText, setSharePostText] = useState("");
  const [shareCertificateBlob, setShareCertificateBlob] = useState<Blob | null>(null);
  const [shareImageObjectUrl, setShareImageObjectUrl] = useState<string | null>(null);
  const [copyBothStep, setCopyBothStep] = useState<"image" | "message">("image");

  const certificateContent = useMemo(() => {
    if (!user || !courseTitle?.trim()) return null;
    const branding = finalizeBranding(buildCertificateBranding(clientInfo));
    return buildCourseCompletionCertificate({
      recipientName: getUserDisplayName(user),
      courseTitle: courseTitle.trim(),
      branding,
    });
  }, [user, courseTitle, clientInfo]);

  const minPct = minCompletion ?? CERTIFICATE_MIN_COMPLETION;
  const canClaim =
    certificateAvailable === true && completionPercentage >= minPct && certificateContent != null;

  // Pre-issue the credential as soon as the learner is eligible, so the LinkedIn
  // "Add to Profile" popup (opened synchronously on click) carries the real public
  // credential URL. Idempotent on the backend; a single request in flight.
  // NOTE: getCredential is held in a ref and kept OUT of the effect deps - it's an
  // inline arrow that changes identity every render, which would otherwise re-run
  // the effect and cancel the in-flight setCredential before it lands.
  const issuingRef = useRef(false);
  const getCredentialRef = useRef(getCredential);
  getCredentialRef.current = getCredential;
  useEffect(() => {
    const fn = getCredentialRef.current;
    if (!canClaim || !fn || credential || issuingRef.current) return;
    issuingRef.current = true;
    fn()
      .then((c) => {
        if (c) setCredential(c);
      })
      .catch(() => {
        /* fall back to the page URL */
      })
      .finally(() => {
        issuingRef.current = false;
      });
  }, [canClaim, credential]);

  const safeName = (s: string) => (s || "").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");

  const captureBlob = async (): Promise<Blob> => {
    if (uploadedTemplateUrl && user) {
      const response = await fetch("/api/certificate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: getUserDisplayName(user),
          templateUrl: uploadedTemplateUrl,
          courseName: courseTitle,
          issuerName: clientInfo?.name || "",
          structuredTrainingSubject: courseTitle,
        }),
      });
      if (!response.ok) {
        let message = "Failed to generate personalized certificate";
        try {
          const data = (await response.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // ignore JSON parse failures
        }
        throw new Error(message);
      }
      return response.blob();
    }

    const el = certRef.current;
    if (!el) throw new Error("Certificate is not ready");
    return certificateElementToPngBlob(el);
  };

  const downloadCertificate = async () => {
    if (!user) {
      showToast("Please login to download certificate", "error");
      return;
    }
    if (!canClaim) {
      showToast(`Complete ${minPct}% of the course to download the certificate.`, "warning");
      return;
    }
    try {
      setDownloading(true);
      const blob = await captureBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${safeName(getUserDisplayName(user))}-${safeName(courseTitle)}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Certificate downloaded successfully!", "success");
    } catch (error: unknown) {
      console.error("Download error:", error);
      showToast(error instanceof Error ? error.message : "Failed to download certificate", "error");
    } finally {
      setDownloading(false);
    }
  };

  const shareOnLinkedIn = async () => {
    if (!user) {
      showToast("Please login to share certificate", "error");
      return;
    }
    if (!canClaim) {
      showToast(`Complete ${minPct}% of the course to share your certificate.`, "warning");
      return;
    }

    const pageUrl = typeof window !== "undefined" ? window.location.href : "";
    const fallbackPost = () =>
      getLinkedInPostText(
        {
          name: getUserDisplayName(user),
          course: courseTitle ?? "",
          score: score ?? "100%",
          certificateUrl: pageUrl,
          courseDescription,
        },
        clientInfo,
      );

    const fetchAiPost = async (): Promise<string | null> => {
      if (aiPostRef.current) return aiPostRef.current;
      if (!generatePost) return null;
      const text = await generatePost().catch(() => null);
      if (text && text.trim()) aiPostRef.current = text.trim();
      return aiPostRef.current;
    };

    setSharing(true);
    try {
      // Generate the AI post while the certificate image is being captured.
      const [blob, aiText] = await Promise.all([captureBlob(), fetchAiPost()]);
      const postText = aiText ? boldHeadline(aiText) : fallbackPost();
      setShareCertificateBlob(blob);
      setShareImageObjectUrl(URL.createObjectURL(blob));
      try {
        await navigator.clipboard.writeText(postText);
        showToast("Message copied! Paste (Ctrl+V or Cmd+V) in LinkedIn.", "success");
      } catch {
        showToast('Could not copy. Use "Copy message" below.', "warning");
      }
      setSharePostText(postText);
      setShareDialogOpen(true);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Failed to prepare share", "error");
    } finally {
      setSharing(false);
    }
  };

  const addToLinkedInProfile = () => {
    if (!user) {
      showToast("Please login to add this certificate to LinkedIn", "error");
      return;
    }
    if (!canClaim) {
      showToast(
        `Complete ${minPct}% of the course to add this certificate to your LinkedIn profile.`,
        "warning",
      );
      return;
    }
    const buildUrl = (cred: { credentialId: string; verifyUrl: string } | null) => {
      const now = new Date();
      // Prefer the public, verifiable credential URL/id; fall back to the page URL.
      return getLinkedInAddToProfileUrl({
        certificationName: courseTitle || "Course Completion",
        organizationName: organizationName || clientInfo?.name || "",
        organizationId: organizationId ?? null,
        issueYear: now.getFullYear(),
        issueMonth: now.getMonth() + 1,
        certUrl: cred?.verifyUrl || (typeof window !== "undefined" ? window.location.href : undefined),
        certId: cred?.credentialId || certificateContent?.certificateId,
      });
    };

    // Common case: credential already pre-issued - open straight away.
    if (credential) {
      openLinkedInPopup(buildUrl(credential));
      return;
    }

    // Not issued yet (e.g. a very fast click): open the popup synchronously inside
    // this click gesture (so it isn't blocked), then point it at the credential URL
    // once issuance resolves - never the wrong /adaptive-courses URL if we can help it.
    const fn = getCredentialRef.current;
    if (!fn || typeof window === "undefined") {
      openLinkedInPopup(buildUrl(null));
      return;
    }
    const w = 600;
    const h = 700;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top = Math.max(0, (window.screen.height - h) / 2);
    const win = window.open("about:blank", "LinkedIn", `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`);
    fn()
      .then((c) => {
        if (c) setCredential(c);
        const url = buildUrl(c ?? null);
        if (win) win.location.href = url;
        else openLinkedInPopup(url);
      })
      .catch(() => {
        const url = buildUrl(null);
        if (win) win.location.href = url;
        else openLinkedInPopup(url);
      });
  };

  const closeShareDialog = () => {
    if (shareImageObjectUrl) {
      URL.revokeObjectURL(shareImageObjectUrl);
      setShareImageObjectUrl(null);
    }
    setShareCertificateBlob(null);
    setCopyBothStep("image");
    setShareDialogOpen(false);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(sharePostText);
      showToast("Message copied! Paste (Ctrl+V or Cmd+V) in LinkedIn.", "success");
    } catch {
      showToast("Could not copy. Select the text above and copy manually.", "warning");
    }
  };

  const copyCredentialLink = async () => {
    if (!credential) return;
    try {
      await navigator.clipboard.writeText(credential.verifyUrl);
      showToast('Credential link copied! Add it via "Add media → Link" in LinkedIn.', "success");
    } catch {
      showToast("Could not copy the link.", "warning");
    }
  };

  const copyImageToClipboard = async (blob: Blob): Promise<boolean> => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return true;
    } catch {
      try {
        const base64 = await blobToBase64(blob);
        const html = `<img src="data:image/png;base64,${base64}" alt="Certificate" />`;
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
            "text/html": new Blob([html], { type: "text/html" }),
          }),
        ]);
        return true;
      } catch {
        return false;
      }
    }
  };

  const copyImage = async () => {
    if (!shareCertificateBlob) return;
    if (await copyImageToClipboard(shareCertificateBlob)) {
      showToast("Certificate image copied! Paste (Ctrl+V or Cmd+V) in your LinkedIn post.", "success");
    } else {
      showToast(
        "Could not copy image. Please use Download Certificate, then add the file in LinkedIn.",
        "warning",
      );
    }
  };

  const copyImageAndMessage = async () => {
    if (!shareCertificateBlob || !sharePostText) return;
    if (copyBothStep === "image") {
      if (!(await copyImageToClipboard(shareCertificateBlob))) {
        showToast('Could not copy image. Use "Copy image" and "Copy message" separately.', "warning");
        return;
      }
      setCopyBothStep("message");
      showToast("Image copied! Paste in LinkedIn, then click the button again to copy your caption.", "success");
    } else {
      try {
        await navigator.clipboard.writeText(sharePostText);
        setCopyBothStep("image");
        showToast("Caption copied! Paste again in your LinkedIn post.", "success");
      } catch {
        showToast('Could not copy. Use "Copy message" instead.', "warning");
      }
    }
  };

  const portal = (
    <>
      {certificateContent ? (
        <Box
          sx={{
            position: "fixed",
            left: -14000,
            top: 0,
            width: 1200,
            height: 675,
            pointerEvents: "none",
            zIndex: -5,
            overflow: "visible",
          }}
          aria-hidden
        >
          <DynamicCertificate ref={certRef} content={certificateContent} />
        </Box>
      ) : null}

      <Dialog open={shareDialogOpen} onClose={closeShareDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add to your LinkedIn post</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Open LinkedIn and start a new post. Click &quot;Copy image and message&quot; to copy the image,
            paste (Ctrl+V or Cmd+V) in the post, then click the same button again to copy your caption and
            paste again.
          </Typography>
          {shareImageObjectUrl && (
            <Box sx={{ mb: 2, borderRadius: 1, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shareImageObjectUrl} alt="Certificate preview" style={{ width: "100%", height: "auto", display: "block" }} />
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Message to paste:
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: "action.hover",
              borderRadius: 1,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: "0.875rem",
              maxHeight: 220,
              overflow: "auto",
            }}
          >
            {sharePostText}
          </Box>

          {credential && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Verifiable credential link - LinkedIn can&apos;t auto-fill media, so paste this under
                &quot;Add media → Link&quot; to attach the certificate, or it appears as &quot;Show
                credential&quot; on your profile:
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 1.25,
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontSize: "0.8rem",
                }}
              >
                {credential.verifyUrl}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
          <Button onClick={closeShareDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={copyMessage} variant="outlined" size="small">
            Copy message
          </Button>
          {credential && (
            <Button onClick={copyCredentialLink} variant="outlined" size="small">
              Copy credential link
            </Button>
          )}
          {shareCertificateBlob && (
            <Button onClick={copyImage} variant="outlined" size="small">
              Copy image
            </Button>
          )}
          {shareCertificateBlob && sharePostText && (
            <Button onClick={copyImageAndMessage} variant="outlined" size="small">
              {copyBothStep === "image" ? "Copy image and message" : "Copy caption (paste image first)"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );

  return {
    available: certificateAvailable === true,
    ready: certificateContent != null,
    canClaim,
    minPct,
    downloading,
    sharing,
    hasUser: !!user,
    downloadCertificate,
    shareOnLinkedIn,
    addToLinkedInProfile,
    portal,
  };
}
