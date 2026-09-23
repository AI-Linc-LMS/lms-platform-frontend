/**
 * The photo is stored inside the resume, so its size IS the resume's size.
 *
 * Before this, `readAsDataURL` put whatever was chosen straight onto `basicInfo.photo`. Base64
 * costs about a third more than the bytes it encodes, so an ordinary phone photo landed as
 * megabytes and the learner met it as "This resume is too large to save" - a message about the
 * resume, from an action that was about the photo. The Western template exists to show a photo,
 * so this was the ordinary path, not an edge case.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PHOTO_BYTES, dataUrlBytes, prepareResumePhoto } from "./photoUpload";

/** A File whose FileReader result is a data URL of roughly `kb` kilobytes. */
function imageFile(kb: number, type = "image/jpeg"): File {
  const payload = "A".repeat(Math.ceil((kb * 1024 * 4) / 3));
  const file = new File(["x"], "photo.jpg", { type });
  // jsdom's FileReader would hand back the literal "x"; the size is the whole point here.
  vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (
    this: FileReader,
  ) {
    Object.defineProperty(this, "result", { value: `data:${type};base64,${payload}`, configurable: true });
    this.onload?.({} as ProgressEvent<FileReader>);
  });
  return file;
}

/** No canvas in jsdom, so a downscale either is stubbed or reports that it cannot run. */
function stubCanvas(resultKb: number | null) {
  // `getContext` is overloaded per context id, so the spy is typed through `unknown`.
  const context = resultKb === null ? null : { drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: "" };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as ReturnType<HTMLCanvasElement["getContext"]>,
  );
  if (resultKb !== null) {
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      `data:image/jpeg;base64,${"B".repeat(Math.ceil((resultKb * 1024 * 4) / 3))}`,
    );
  }
  // An Image that reports a size and loads immediately.
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = 3000;
    height = 4000;
    set src(_v: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", FakeImage);
}

describe("preparing a photo for a resume", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shrinks an ordinary phone photo down to something a resume can hold", async () => {
    stubCanvas(60);
    const result = await prepareResumePhoto(imageFile(3000)); // a 3MB photo
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(dataUrlBytes(result.dataUrl)).toBeLessThan(MAX_PHOTO_BYTES);
    // Materially smaller than what was chosen, not merely under the cap by luck.
    expect(dataUrlBytes(result.dataUrl)).toBeLessThan(200 * 1024);
  });

  it("refuses a photo that is still too large, so the message can name the photo", async () => {
    // A browser that cannot downscale: the size check still has to hold.
    stubCanvas(null);
    const result = await prepareResumePhoto(imageFile(3000));
    expect(result).toEqual({ ok: false, reason: "tooLarge" });
  });

  it("keeps a small photo as it is rather than re-encoding it larger", async () => {
    stubCanvas(90); // a JPEG re-encode that would be BIGGER than the original
    const result = await prepareResumePhoto(imageFile(20, "image/png"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataUrl).toContain("image/png");
  });

  it("rejects a file that is not an image at all", async () => {
    const pdf = new File(["x"], "cv.pdf", { type: "application/pdf" });
    expect(await prepareResumePhoto(pdf)).toEqual({ ok: false, reason: "notAnImage" });
  });

  it("reports an unreadable file instead of throwing", async () => {
    vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function (this: FileReader) {
      this.onerror?.({} as ProgressEvent<FileReader>);
    });
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    expect(await prepareResumePhoto(file)).toEqual({ ok: false, reason: "unreadable" });
  });

  it("survives a browser that cannot decode the image", async () => {
    stubCanvas(60);
    class BrokenImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 0;
      height = 0;
      set src(_v: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal("Image", BrokenImage);
    // Small enough to pass on its own bytes; the point is that it resolves rather than hanging.
    const result = await prepareResumePhoto(imageFile(40));
    expect(result.ok).toBe(true);
  });

  it("counts the bytes a data URL actually costs, not its string length", () => {
    // 4 base64 chars encode 3 bytes; a naive length check overstates by a third.
    expect(dataUrlBytes("data:image/png;base64," + "A".repeat(4000))).toBe(3000);
  });
});
