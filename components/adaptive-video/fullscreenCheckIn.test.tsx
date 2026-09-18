import { describe, expect, it } from "vitest";
import { toEmbedUrl } from "@/lib/utils/video-embed";

/**
 * A check-in has to be answerable without leaving full screen.
 *
 * Reported as "quiz questions embedded in videos are not visible in full-screen mode, forcing
 * learners to exit full screen to answer and causing the video to resume unexpectedly".
 *
 * The cause is which ELEMENT goes fullscreen. Vimeo's own button fullscreens the iframe, and the
 * check-in overlay is that iframe's sibling - so the browser paints the iframe alone and the
 * overlay is nowhere. The companion hides that button and fullscreens the player BOX instead, which
 * is the overlay's parent.
 */

/** The transformation VideoCompanion applies to the embed before handing it to the iframe. */
function companionEmbed(playUrl: string, source?: string) {
  const raw = toEmbedUrl(playUrl, source);
  return /player\.vimeo\.com\//.test(raw)
    ? `${raw}${raw.includes("?") ? "&" : "?"}fullscreen=0`
    : raw;
}

describe("in-video check-ins in full screen", () => {
  it("takes Vimeo's own fullscreen button away", () => {
    // That button is the one that hides the check-in, because it fullscreens the iframe.
    expect(companionEmbed("https://vimeo.com/123456789")).toContain("fullscreen=0");
  });

  it("keeps the unlisted-video hash intact when it does", () => {
    const embed = companionEmbed("https://vimeo.com/123456789/abcdef");
    expect(embed).toContain("h=abcdef");
    expect(embed).toContain("fullscreen=0");
    // One query string, not two.
    expect(embed.split("?").length).toBe(2);
  });

  it("leaves a non-Vimeo embed alone", () => {
    // YouTube and a direct file are not the reported case, and appending a Vimeo-only parameter
    // to someone else's player is how you break the video that was working.
    expect(companionEmbed("https://www.youtube.com/watch?v=abc123")).not.toContain("fullscreen=0");
    expect(companionEmbed("https://cdn.example.com/lesson.mp4")).not.toContain("fullscreen=0");
  });
});
