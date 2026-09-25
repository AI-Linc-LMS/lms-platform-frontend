import { describe, expect, it } from "vitest";
import { companionOwnsFullscreen, toCompanionEmbedUrl } from "@/lib/utils/video-embed";

/**
 * A check-in has to be answerable without leaving full screen - and that is the ONLY reason the
 * companion has a full-screen button of its own.
 *
 * Reported first as "quiz questions embedded in videos are not visible in full-screen mode,
 * forcing learners to exit full screen to answer and causing the video to resume unexpectedly".
 * The cause is which ELEMENT goes fullscreen. Vimeo's own button fullscreens the iframe, and the
 * check-in overlay is that iframe's sibling - so the browser paints the iframe alone and the
 * overlay is nowhere. The companion hides that button and fullscreens the player BOX instead,
 * which is the overlay's parent.
 *
 * Reported again as "the full-screen button remains visible even when the control bar is hidden".
 * Half of that was where ours lived (fullscreenControlBar.test.tsx); the other half is that ours
 * was drawn over EVERY provider - including the ones whose own button we cannot take away, and
 * whose players never tell this page whether the video is playing, so a bar on the player's clock
 * had no clock. This file pins the rule that decides which providers get ours at all.
 */
const catalog = { canOverlay: true };
const external = { canOverlay: false };

describe("in-video check-ins in full screen", () => {
  it("takes Vimeo's own fullscreen button away on a video that carries check-ins", () => {
    // That button is the one that hides the check-in, because it fullscreens the iframe.
    expect(toCompanionEmbedUrl("https://vimeo.com/123456789", "external", catalog)).toContain("fullscreen=0");
    expect(companionOwnsFullscreen("https://player.vimeo.com/video/1", catalog)).toBe(true);
  });

  it("keeps the unlisted-video hash intact when it does", () => {
    const embed = toCompanionEmbedUrl("https://vimeo.com/123456789/abcdef", "external", catalog);
    expect(embed).toContain("h=abcdef");
    expect(embed).toContain("fullscreen=0");
    // One query string, not two.
    expect(embed.split("?").length).toBe(2);
  });

  it("leaves a non-Vimeo embed alone", () => {
    // YouTube and a direct file are not the reported case, and appending a Vimeo-only parameter
    // to someone else's player is how you break the video that was working.
    expect(toCompanionEmbedUrl("https://www.youtube.com/watch?v=abc123", "external", catalog)).not.toContain(
      "fullscreen=0",
    );
    expect(toCompanionEmbedUrl("https://cdn.example.com/lesson.mp4", "external", catalog)).not.toContain(
      "fullscreen=0",
    );
  });

  it("leaves Vimeo's own button in place where there is no overlay to protect", () => {
    // An externally-hosted video has no transcript, so it has no check-ins and no 60s checkpoint:
    // nothing is ever painted over it, and the provider fullscreening its own iframe hides nothing.
    // Taking its button away and not replacing it would leave the learner with no fullscreen at all.
    expect(companionOwnsFullscreen("https://player.vimeo.com/video/1", external)).toBe(false);
    expect(toCompanionEmbedUrl("https://vimeo.com/123456789", "external", external)).not.toContain("fullscreen=0");
  });

  it("never claims fullscreen on a provider whose button we cannot take away", () => {
    // Each of these keeps its own control whatever we append, so ours would be a second one - and
    // none of them reports play/pause to this page, so ours could never go down with the player's.
    const elsewhere = [
      "https://www.youtube.com/watch?v=abc123",
      "https://youtu.be/abc123",
      "https://tisteps-my.sharepoint.com/:v:/g/personal/someone_impacteers_com/IQD8kok0pWTsTJ3H?e=ooXP81",
      "https://drive.google.com/file/d/ABC123/view",
      "https://www.dropbox.com/s/x/lesson.mp4?dl=0",
      "https://www.loom.com/share/abc123",
      "https://cdn.example.com/lesson.mp4",
    ];
    for (const url of elsewhere) {
      // Even with overlays in hand: we cannot strip their button, so we do not add ours.
      expect(companionOwnsFullscreen(toCompanionEmbedUrl(url, "external", catalog), catalog)).toBe(false);
    }
  });
});
