import { describe, expect, it } from "vitest";
import { embedCaveat, supportsCheckIns, toEmbedUrl } from "./video-embed";

describe("pasted YouTube links", () => {
  it("converts a watch URL, which cannot be framed", () => {
    // This is what a person copies out of the address bar, and what the builder stores.
    expect(toEmbedUrl("https://www.youtube.com/watch?v=ApSbjuVHAR8", "external")).toContain(
      "youtube.com/embed/ApSbjuVHAR8",
    );
  });

  it("handles a missing scheme", () => {
    expect(toEmbedUrl("www.youtube.com/watch?v=ApSbjuVHAR8", "external")).toContain(
      "youtube.com/embed/ApSbjuVHAR8",
    );
  });

  it("handles youtu.be short links", () => {
    expect(toEmbedUrl("https://youtu.be/ApSbjuVHAR8", "external")).toContain(
      "youtube.com/embed/ApSbjuVHAR8",
    );
  });

  it("handles shorts and live", () => {
    expect(toEmbedUrl("https://www.youtube.com/shorts/abc123", "external")).toContain(
      "/embed/abc123",
    );
    expect(toEmbedUrl("https://www.youtube.com/live/abc123", "external")).toContain(
      "/embed/abc123",
    );
  });

  it("keeps a start timestamp", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=X&t=90", "external")).toContain("start=90");
  });

  it("leaves an already-embeddable URL alone", () => {
    expect(toEmbedUrl("https://www.youtube.com/embed/ApSbjuVHAR8", "external")).toContain(
      "/embed/ApSbjuVHAR8",
    );
  });
});

describe("pasted Vimeo links", () => {
  it("converts a plain vimeo.com link", () => {
    expect(toEmbedUrl("https://vimeo.com/920338266", "external")).toContain(
      "player.vimeo.com/video/920338266",
    );
  });

  it("keeps the unlisted hash", () => {
    expect(toEmbedUrl("https://vimeo.com/920338266/abc123", "external")).toContain("h=abc123");
  });

  it("leaves a player.vimeo.com URL alone", () => {
    const out = toEmbedUrl("https://player.vimeo.com/video/920338266", "external");
    expect(out).toContain("player.vimeo.com/video/920338266");
  });
});

describe("everything else", () => {
  it("passes an unrecognised URL through", () => {
    // A direct file, or a provider we do not know. Guessing would break the case that worked.
    const mp4 = "https://cdn.example.com/lesson.mp4";
    expect(toEmbedUrl(mp4, "external")).toBe(mp4);
  });

  it("returns empty for nothing", () => {
    expect(toEmbedUrl("", "external")).toBe("");
    expect(toEmbedUrl("   ", "none")).toBe("");
  });

  it("does not throw on junk", () => {
    expect(() => toEmbedUrl("not a url at all", "external")).not.toThrow();
  });

  it("adds the Vimeo player options to a catalog URL", () => {
    expect(toEmbedUrl("https://player.vimeo.com/video/1", "catalog")).toContain("title=0");
  });
});

describe("check-ins", () => {
  it("are only possible for catalog videos", () => {
    // They are built from a transcript, and a pasted link has none.
    expect(supportsCheckIns("catalog")).toBe(true);
    expect(supportsCheckIns("external")).toBe(false);
    expect(supportsCheckIns(undefined)).toBe(false);
  });
});

describe("SharePoint / OneDrive", () => {
  const SHARE =
    "https://tisteps-my.sharepoint.com/:v:/g/personal/prashanth_g_impacteers_com/IQD8kok0pWTsTJ3H?nav=eyJhIjoxfQ&e=ooXP81";

  it("asks for the embeddable player instead of the viewer page", () => {
    // The share link is a web viewer that sends frame-ancestors, so a browser refuses to frame
    // it at all — "refused to connect", with nothing the page can catch.
    expect(toEmbedUrl(SHARE, "external")).toContain("action=embedview");
  });

  it("keeps the sharing token, which is what authorises the file", () => {
    const out = toEmbedUrl(SHARE, "external");
    expect(out).toContain("e=ooXP81");
    expect(out).toContain("IQD8kok0pWTsTJ3H");
  });

  it("does not stack a second action param", () => {
    const already = `${SHARE}&action=embedview`;
    expect(toEmbedUrl(already, "external").match(/action=embedview/g)).toHaveLength(1);
  });

  it("warns that conversion does not grant access", () => {
    // The bug that works for whoever set it up is the worst kind to ship.
    expect(embedCaveat(SHARE)).toMatch(/Anyone with the link/i);
  });
});

describe("other common paste sources", () => {
  it("converts a Google Drive viewer link to /preview", () => {
    expect(toEmbedUrl("https://drive.google.com/file/d/ABC123/view?usp=sharing", "external")).toBe(
      "https://drive.google.com/file/d/ABC123/preview",
    );
  });

  it("converts a Loom share link", () => {
    expect(toEmbedUrl("https://www.loom.com/share/abc123", "external")).toBe(
      "https://www.loom.com/embed/abc123",
    );
  });

  it("turns a Dropbox preview into the file itself", () => {
    const out = toEmbedUrl("https://www.dropbox.com/s/x/lesson.mp4?dl=0", "external");
    expect(out).toContain("raw=1");
    expect(out).not.toContain("dl=0");
  });

  it("warns about Zoom recordings, which cannot be embedded at all", () => {
    expect(embedCaveat("https://us02web.zoom.us/rec/share/abc")).toMatch(/passcode|catalog/i);
  });

  it("says nothing about a link with no known caveat", () => {
    expect(embedCaveat("https://www.youtube.com/watch?v=X")).toBeNull();
    expect(embedCaveat("")).toBeNull();
  });
});
