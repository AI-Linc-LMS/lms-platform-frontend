/** Data shape used for building LinkedIn post text */
export interface CertificatePostData {
  name: string;
  course: string;
  score: string;
  certificateUrl: string;
}

const CERTIFICATE_IMAGE_EXTENSIONS = [".jpeg", ".jpg", ".png"] as const;

/** Build hashtags from course name + client name + standard tags */
export function getHashtags(courseTitle: string, clientName: string): string {
  const courseWords = (courseTitle || "")
    .split(/[\s&-]+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length > 2);
  const clientTag = clientName ? "#" + clientName.replace(/\s+/g, "") : "";
  const tags = [
    ...courseWords.map((w) => "#" + w),
    clientTag,
    "#SkillBuilding",
    "#LearningExperience",
    "#ProfessionalGrowth",
    "#Certificate",
  ].filter(Boolean);
  return [...new Set(tags)].join(" ");
}

/** Convert string to Unicode mathematical bold so it appears bold when pasted as plain text. */
export function toBoldUnicode(str: string): string {
  return str
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d400 + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d41a + (code - 97));
      if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ce + (code - 48));
      return c;
    })
    .join("");
}

/** Build the post text that will be copied to clipboard (LinkedIn does not pre-fill from URL). */
export function getLinkedInPostText(
  data: CertificatePostData,
  clientInfo: { name?: string } | null
): string {
  const clientName = clientInfo?.name ?? "";
  const hashtags = getHashtags(data.course || "", clientName);
  const firstLine =
    "I'm happy to share that I have successfully completed a 4-month training program with " +
    clientName +
    " 🎓";
  return [
    toBoldUnicode(firstLine),
    "",
    "The program was designed to strengthen Quantitative Aptitude while also focusing on Professional Skills such as communication, confidence, and workplace etiquette. With trainers aligned throughout the journey, the sessions were structured, interactive, and practice-oriented, helping me steadily improve my skills and mindset.",
    "",
    "Thankful to the " +
      clientName +
      " team and trainers for their guidance, consistency, and encouragement. This experience has been a valuable step in my professional development, and I look forward to applying these learnings in the future 🚀",
    "",
    hashtags,
  ]
    .join("\n")
    .trim();
}

/** Convert a Blob to base64 data URL string. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64 ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** LinkedIn share URL. Only accepts url (required); LinkedIn does not pre-fill post text from summary. */
export function getLinkedInShareUrl(_pageUrl: string): string {
  return "https://www.linkedin.com/sharing/share-offsite/";
}

/** Minimum course completion percentage required to claim certificate (download/share). */
export const CERTIFICATE_MIN_COMPLETION = 80;

/** Normalize course name for image path: no whitespace, lowercase (matches API). */
export function normalizeCourseNameToPath(courseName: string): string {
  return (courseName || "").trim().replace(/\s+/g, "").toLowerCase();
}

/** Check if certificate image exists under public/images (served at /images/). */
export async function checkCertificateImageInPublicImages(
  courseTitle: string
): Promise<boolean> {
  const trimmed = courseTitle?.trim();
  if (!trimmed) return false;

  const normalized = normalizeCourseNameToPath(trimmed);

  const tryUrl = (pathSegment: string, ext: string) => {
    const url = `/images/${pathSegment}${ext}`;
    return fetch(url, { method: "HEAD" }).then((r) => r.ok);
  };

  for (const ext of CERTIFICATE_IMAGE_EXTENSIONS) {
    if (await tryUrl(normalized, ext)) return true;
  }

  const encodedTitle = encodeURIComponent(trimmed);
  for (const ext of CERTIFICATE_IMAGE_EXTENSIONS) {
    if (await tryUrl(encodedTitle, ext)) return true;
  }

  return false;
}

export const certificateShareService = {
  getHashtags,
  toBoldUnicode,
  getLinkedInPostText,
  blobToBase64,
  getLinkedInShareUrl,
  CERTIFICATE_MIN_COMPLETION,
  normalizeCourseNameToPath,
  checkCertificateImageInPublicImages,
};
