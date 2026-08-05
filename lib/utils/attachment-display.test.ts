import { describe, expect, it } from "vitest";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_MB,
  attachmentLook,
  formatFileSize,
} from "./attachment-display";

describe("attachmentLook", () => {
  it("uses the kind the server derived", () => {
    expect(attachmentLook({ kind: "slides" }).label).toBe("Slides");
    expect(attachmentLook({ kind: "pdf" }).label).toBe("PDF");
  });

  it("falls back to the extension when the server sent no kind", () => {
    expect(attachmentLook({ extension: "pptx" }).label).toBe("Slides");
    expect(attachmentLook({ extension: ".docx" }).label).toBe("Document");
  });

  it("falls back to the filename when there is neither", () => {
    expect(attachmentLook({ original_name: "week-3-notes.pdf" }).label).toBe("PDF");
  });

  it("never returns undefined for an unknown type", () => {
    // A row that cannot be rendered is worse than a generic icon: the whole handout list
    // would throw on one odd file.
    const look = attachmentLook({ kind: "hologram", extension: "zzz" });
    expect(look.icon).toBeTruthy();
    expect(look.accent).toBeTruthy();
    expect(look.label).toBe("File");
  });

  it("survives an entirely empty row", () => {
    expect(attachmentLook({}).label).toBe("File");
  });

  it("is case-insensitive about extensions", () => {
    expect(attachmentLook({ original_name: "DECK.PPTX" }).label).toBe("Slides");
  });
});

describe("formatFileSize", () => {
  it("says nothing rather than '0 B' when the size is unknown", () => {
    // Servers omit size_bytes on older rows; "0 B" would read as an empty file.
    expect(formatFileSize(undefined)).toBe("");
    expect(formatFileSize(0)).toBe("");
  });

  it("scales through B, KB and MB", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("drops the decimal above 10MB", () => {
    expect(formatFileSize(14.2 * 1024 * 1024)).toBe("14 MB");
  });
});

describe("the upload contract", () => {
  it("advertises exactly the extensions the server allows", () => {
    // Drifting from the server list means either a picker that offers files it will reject,
    // or one that hides files it would have taken.
    expect(ATTACHMENT_ACCEPT.split(",").sort()).toEqual(
      [
        ".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx",
        ".txt", ".csv", ".png", ".jpg", ".jpeg",
      ].sort(),
    );
  });

  it("matches the server's course-attachment cap", () => {
    expect(ATTACHMENT_MAX_MB).toBe(50);
  });
});
