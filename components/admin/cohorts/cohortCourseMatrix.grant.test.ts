import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Assigning a PAID course to a batch is refused unless an admin grants it on purpose. The matrix
 * used to show "Couldn't update that assignment." and nothing else - the reason, and the way out,
 * were both invisible. These pin the wiring: the refusal code opens a question, the answer retries
 * with the grant, and any other failure shows the server's own message.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("granting a paid course from the cohort matrix", () => {
  const src = () => read("components/admin/cohorts/CohortCourseMatrix.tsx");

  it("asks instead of dead-ending when the backend says the course needs a grant", () => {
    const s = src();
    expect(s).toContain("response.data?.code === PAID_COURSE_NEEDS_GRANT");
    expect(s).toContain("setGrantAsk({ cohort, course })");
    expect(read("lib/services/admin/admin-cohorts.service.ts")).toContain(
      'PAID_COURSE_NEEDS_GRANT = "paid_course_requires_grant"',
    );
  });

  it("retries with an explicit grant only after the admin confirms", () => {
    const s = src();
    expect(s).toContain("void toggle(ask.cohort, ask.course, true)");
    expect(s).toContain("...(grantPaidAccess ? { grant_paid_access: true } : {})");
    // Never loops back into the question on the granted retry.
    expect(s).toContain("!grantPaidAccess && response?.status === 400");
  });

  it("tells the admin who gets it", () => {
    const s = src();
    expect(s).toContain("and to anyone who joins the batch later");
    expect(s).toContain("Learners");
  });

  it("shows the server's reason for any other failure", () => {
    expect(src()).toContain('serverMessage || "Couldn\'t update that assignment."');
  });
});
