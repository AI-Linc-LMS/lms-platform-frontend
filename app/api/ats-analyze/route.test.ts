/**
 * The ATS check sends the resume to a model as text. Resume lines are stored as HTML, so it used
 * to send "Segmented health &amp; wellness" and "<b>Led</b>" - the model was asked to judge the
 * grammar and keywords of markup. `document` is hidden for the call, because the route runs on the
 * server, where the sanitiser has no DOM and takes its regex path.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { SAMPLE_RESUME_DATA } from "@/components/profile/resume/sampleResumeData";
import type { ResumeData } from "@/components/profile/resume/types";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("POST /api/ats-analyze", () => {
  it("sends the model the words of each line, not their HTML", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{"overallScore":70,"atsScore":70}' } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const resumeData: ResumeData = {
      ...SAMPLE_RESUME_DATA,
      basicInfo: { ...SAMPLE_RESUME_DATA.basicInfo, summary: "<b>Led</b> R&amp;D for 3 years" },
      workExperience: [
        { ...SAMPLE_RESUME_DATA.workExperience[0], description: ["Segmented health &amp; wellness markets"] },
      ],
    };
    vi.stubGlobal("document", undefined);
    const res = await POST(
      new Request("http://localhost/api/ats-analyze", {
        method: "POST",
        body: JSON.stringify({ resumeData, light: true }),
      }) as never,
    );
    expect(res.status).toBe(200);

    const prompt: string = JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content;
    expect(prompt).toContain("Summary: Led R&D for 3 years");
    expect(prompt).toContain("• Segmented health & wellness markets");
    expect(prompt).not.toContain("&amp;");
    expect(prompt).not.toContain("<b>");
  });
});
