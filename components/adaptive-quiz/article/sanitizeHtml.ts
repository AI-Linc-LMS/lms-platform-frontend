/**
 * Dependency-free HTML sanitizer for AI-generated article bodies.
 *
 * The content comes from our own backend AI (admin-triggered, not user input),
 * but we still never render it raw: strip script/style/iframe-style elements,
 * inline event handlers, and javascript: URLs via the browser's DOMParser.
 * (For stronger guarantees, swap in DOMPurify — kept dependency-free here.)
 */
const BLOCKED_TAGS = ["script", "iframe", "object", "embed", "link", "meta", "base", "form", "style"];

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || !html) return html || "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(BLOCKED_TAGS.join(",")).forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on")) el.removeAttribute(attr.name);
      else if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}
