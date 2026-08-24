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
import { CertificateArtwork } from "@/components/certificate/CertificateArtwork";
import { buildCourseCompletionCertificate } from "@/lib/certificate/copy";
import { buildCertificateBranding, finalizeBranding } from "@/lib/certificate/client-branding";
import { certificateElementToPngBlob } from "@/lib/utils/certificate-export.utils";
import type { CertificateRenderPayload } from "@/lib/certificates/types";

export interface UseCertificateActionsOptions {
  courseTitle: string;
  certificateAvailable?: boolean;
  /**
   * @deprecated An uploaded template is no longer a URL the browser draws on.
   * It is a `kind="upload"` design carried inside the server's render payload
   * (`renderPayload.design.backgroundUrl` + `fieldPlacements`), so pass
   * `renderPayload` instead. Accepted and ignored only so callers that have not
   * migrated still compile.
   */
  uploadedTemplateUrl?: string | null;
  /**
   * The server's render payload for the credential this learner actually holds.
   * When present the hook rasterises the real artwork from it, which is the only
   * way the downloaded PNG matches what the verify page shows.
   */
  renderPayload?: CertificateRenderPayload | null;
  /**
   * Server-supplied eligibility. Pass it when the caller has already asked the
   * backend (e.g. it claimed the credential itself). Leave it undefined and the
   * hook decides from whether `getCredential` actually returns a credential.
   *
   * What this must NEVER be again is a percentage compared in the browser. That
   * is how the old gate worked, and it meant the rules for who gets a
   * certificate lived in two places that drifted: a learner could be shown a
   * download button the backend would then refuse to issue for.
   */
  eligible?: boolean;
  /**
   * The already-resolved credential, when the caller claimed it itself. Takes
   * precedence over anything `getCredential` returns, so a page that has the
   * credential in hand never fires a second claim just to learn its verify URL.
   */
  credential?: { credentialId: string; verifyUrl: string } | null;
  /**
   * Overall course completion percentage (0-100).
   *
   * The hook no longer reads it at all: it is kept on the options so the two
   * consumers that still pass it keep compiling, and as a marker of what this
   * value must never be used for again. It used to BE the eligibility gate.
   */
  completionPercentage?: number;
  /** Score to show in the LinkedIn post (e.g. "92%"). */
  score?: string;
  /** Minimum completion % required, for the "complete N% to unlock" hint only.
   *  Defaults to the global 80% constant. Never used as a gate. */
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
  /** Eligible to download/share. Server-decided: the backend either issued this
   *  learner a credential or it did not. */
  canClaim: boolean;
  /** True while the hook is still asking the backend whether a credential
   *  exists, so a consumer can show a spinner instead of a "not eligible" hint
   *  it may have to take back a moment later. */
  checking: boolean;
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
    renderPayload,
    eligible,
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

  /**
   * Something to rasterise: either the server's render payload (the real
   * credential, identical to what /credentials/<id> shows) or the locally built
   * legacy content for callers still on DynamicCertificate.
   */
  const artworkReady = renderPayload != null || certificateContent != null;

  /**
   * Eligibility is the BACKEND's answer, never a percentage compared here.
   *
   * The old gate was `completionPercentage >= minPct`, which put the awarding
   * rules in the browser next to a second, authoritative copy on the server.
   * They drifted: a learner sitting on 80% of a course whose tenant had raised
   * the threshold saw an enabled Download button that then failed, and a
   * learner the backend HAD issued to saw a locked one because the progress
   * number on that page was stale. Now the only question asked is "did the
   * server give this person a credential", and the answer comes from the server.
   */
  const serverEligible = eligible ?? (opts.credential ?? credential) != null;
  const canClaim = certificateAvailable === true && serverEligible && artworkReady;

  // Resolve the credential as soon as the module is switched on, so the LinkedIn
  // "Add to Profile" popup (opened synchronously on click) carries the real public
  // credential URL - and so `canClaim` above has an answer to read. Issuance is an
  // idempotent get_or_create and is itself gated, so asking for a credential the
  // learner has not earned is a refusal, not a wrongly-minted certificate.
  //
  // NOTE: getCredential is held in a ref and kept OUT of the effect deps - it's an
  // inline arrow that changes identity every render, which would otherwise re-run
  // the effect and cancel the in-flight setCredential before it lands.
  const issuingRef = useRef(false);
  const getCredentialRef = useRef(getCredential);
  getCredentialRef.current = getCredential;
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    const fn = getCredentialRef.current;
    if (
      certificateAvailable !== true ||
      eligible === false ||
      !fn ||
      credential ||
      issuingRef.current
    ) {
      return;
    }
    issuingRef.current = true;
    setChecking(true);
    fn()
      .then((c) => {
        if (c) setCredential(c);
      })
      .catch(() => {
        /* the server said no: canClaim stays false and the UI stays locked */
      })
      .finally(() => {
        issuingRef.current = false;
        setChecking(false);
      });
  }, [certificateAvailable, eligible, credential]);

  // A caller that resolved the credential itself (it claimed on page load) wins
  // over anything this hook fetched, and feeds the same LinkedIn URL builder.
  const effectiveCredential = opts.credential ?? credential;

  const safeName = (s: string) => (s || "").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");

  /**
   * One capture path for every certificate: rasterise the node this hook renders
   * off-screen.
   *
   * There used to be a second path that POSTed the recipient's name and a
   * template URL to /api/certificate/generate, an UNAUTHENTICATED node-canvas
   * route that would draw any name onto any image it was pointed at. It was a
   * forgery service with a native module bundled into a serverless function,
   * and it is gone. A template is a data spec now, so the browser renders the
   * same artwork the verify page does and the bytes always agree.
   */
  const captureBlob = async (): Promise<Blob> => {
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
      showToast("Your certificate is not ready yet.", "warning");
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
      showToast("Your certificate is not ready yet.", "warning");
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
      showToast("Your certificate is not ready yet.", "warning");
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
    if (effectiveCredential) {
      openLinkedInPopup(buildUrl(effectiveCredential));
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
    if (!effectiveCredential) return;
    try {
      await navigator.clipboard.writeText(effectiveCredential.verifyUrl);
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
      {renderPayload || certificateContent ? (
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
          {/* The server payload wins whenever there is one: the download must be
              byte-for-byte the certificate the public verify page renders, and
              the locally-built DynamicCertificate is a different drawing. */}
          {renderPayload ? (
            <CertificateArtwork ref={certRef} payload={renderPayload} />
          ) : certificateContent ? (
            <DynamicCertificate ref={certRef} content={certificateContent} />
          ) : null}
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

          {effectiveCredential && (
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
                {effectiveCredential.verifyUrl}
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
          {effectiveCredential && (
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
    ready: artworkReady,
    canClaim,
    checking,
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
