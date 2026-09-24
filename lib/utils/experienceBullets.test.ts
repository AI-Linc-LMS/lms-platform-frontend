import { describe, expect, it } from "vitest";

import {
  MAX_POINT_LENGTH,
  MAX_POINTS,
  bulletsToDescription,
  bulletsWithinLimits,
  experienceBullets,
  looksLikeAList,
  splitIntoBullets,
} from "./experienceBullets";

/**
 * The rule that turns a legacy experience description into bullet points.
 *
 * Every multi-line case below is a real production description (read-only sample of the 68
 * non-empty ones, 2026-09-24) with company, product and place names replaced. The shapes are
 * untouched: the markers, the tabs after them, the hard wraps a PDF paste leaves mid-sentence,
 * the dashes that are prose and the dashes that are list markers.
 */

describe("the reporter's two entries", () => {
  it("splits a run of inline bullets into one point each", () => {
    expect(
      splitIntoBullets(
        "• Managed product timelines… • Engaged with clients… • Created product walkthroughs…",
      ),
    ).toEqual(["Managed product timelines…", "Engaged with clients…", "Created product walkthroughs…"]);
  });

  it("drops the typed marker instead of printing it beside the template's own", () => {
    expect(
      splitIntoBullets(
        "• Managed product timelines, coordinating releases across teams. \n" +
          "• Engaged with clients to identify pain points. \n" +
          "• Created product walkthroughs and feature videos.",
      ),
    ).toEqual([
      "Managed product timelines, coordinating releases across teams.",
      "Engaged with clients to identify pain points.",
      "Created product walkthroughs and feature videos.",
    ]);
  });

  it("keeps an ampersand as an ampersand", () => {
    expect(splitIntoBullets("• Segmented health & wellness (FMCG) markets")).toEqual([
      "Segmented health & wellness (FMCG) markets",
    ]);
  });
});

describe("text pasted from a PDF resume", () => {
  it("joins a bullet's wrapped second line back onto it, and keeps header lines apart", () => {
    expect(
      splitIntoBullets(
        "Acme Analytics\nData Analyst Intern\nFeb 2026– Jun 2026\nBangalore, India\n" +
          "• Cleaned and analyzed 5,000+ operational records using SQL, Python, and Excel to prepare accurate data for reporting\n" +
          "and business analysis.\n" +
          "• Built 3 interactive Power BI dashboards, reducing reporting time by 30% and manual effort\n" +
          "by 40%.",
      ),
    ).toEqual([
      "Acme Analytics",
      "Data Analyst Intern",
      "Feb 2026– Jun 2026",
      "Bangalore, India",
      "Cleaned and analyzed 5,000+ operational records using SQL, Python, and Excel to prepare accurate data for reporting and business analysis.",
      "Built 3 interactive Power BI dashboards, reducing reporting time by 30% and manual effort by 40%.",
    ]);
  });

  it("joins a wrap that starts with a capital, when the bullet above it is unfinished", () => {
    expect(
      splitIntoBullets(
        "• Managing data extraction & analysis using SQL tools like\n" +
          "PostgreSQL, MySQL and Redshift with 90% focus on\n" +
          "writing, query optimization and ensuring data accuracy.\n" +
          "• Designing data models for conversion and funnel metrics.",
      ),
    ).toEqual([
      "Managing data extraction & analysis using SQL tools like PostgreSQL, MySQL and Redshift with 90% focus on writing, query optimization and ensuring data accuracy.",
      "Designing data models for conversion and funnel metrics.",
    ]);
  });

  it("keeps a hard-wrapped prose paragraph as ONE point, not three fragments", () => {
    expect(
      splitIntoBullets(
        "Creative software engineer offering 3 years of experience. Enthusiastic\n" +
          "about developing forward-thinking solutions to tomorrow's productivity\n" +
          "problems. Resourceful and adaptable approach to challenges",
      ),
    ).toEqual([
      "Creative software engineer offering 3 years of experience. Enthusiastic about developing forward-thinking solutions to tomorrow's productivity problems. Resourceful and adaptable approach to challenges",
    ]);
  });

  it("joins across a line that ends on 'or' even when the next one is capitalised", () => {
    expect(
      splitIntoBullets("Seeking roles as a Java Backend Developer or\nJunior Java Full-Stack Developer."),
    ).toEqual(["Seeking roles as a Java Backend Developer or Junior Java Full-Stack Developer."]);
  });
});

describe("markers", () => {
  it("reads a lead sentence and then tab-separated bullets", () => {
    expect(
      splitIntoBullets(
        "Developed and delivered core modules of a warehouse management system.\n" +
          "•\tImplemented optimized solutions, reducing production issues by 30%.\n" +
          "•\tMentored a team of 5 junior developers",
      ),
    ).toEqual([
      "Developed and delivered core modules of a warehouse management system.",
      "Implemented optimized solutions, reducing production issues by 30%.",
      "Mentored a team of 5 junior developers",
    ]);
  });

  it("accepts a bullet glyph with no space after it", () => {
    expect(
      splitIntoBullets("• Own automation strategy across two product streams.\n•This removed a licensing dependency."),
    ).toEqual(["Own automation strategy across two product streams.", "This removed a licensing dependency."]);
  });

  it("reads ● bullets under an unmarked first line", () => {
    expect(
      splitIntoBullets(
        "Developed backend REST APIs using Node.js. \n● Built React.js frontend features. \n● Collaborated with the engineering team.",
      ),
    ).toEqual([
      "Developed backend REST APIs using Node.js.",
      "Built React.js frontend features.",
      "Collaborated with the engineering team.",
    ]);
  });

  it("reads hyphen, asterisk and numbered lists", () => {
    expect(splitIntoBullets("- Built a ticketing system\n- Designed REST APIs")).toEqual([
      "Built a ticketing system",
      "Designed REST APIs",
    ]);
    expect(splitIntoBullets("* Built X\n* Led Y")).toEqual(["Built X", "Led Y"]);
    expect(splitIntoBullets("1. Built X\n2) Led Y")).toEqual(["Built X", "Led Y"]);
  });

  it("reads Word's Symbol-font bullet, which pastes as a private-use character", () => {
    const wordBullet = String.fromCharCode(0xf0b7);
    expect(splitIntoBullets(`${wordBullet}\tBuilt X\n${wordBullet}\tLed Y`)).toEqual(["Built X", "Led Y"]);
  });

  it("attaches the text to a marker that sat alone on its line", () => {
    expect(splitIntoBullets("•\nBuilt dashboards for sales.\n•\nLed the migration.")).toEqual([
      "Built dashboards for sales.",
      "Led the migration.",
    ]);
  });

  it("strips a single leading marker from a one-line description", () => {
    expect(splitIntoBullets("• Worked with senior developers to reproduce defects before launch.")).toEqual([
      "Worked with senior developers to reproduce defects before launch.",
    ]);
  });
});

describe("hyphens", () => {
  it("splits a hyphen list that was flattened onto one line", () => {
    expect(
      splitIntoBullets(
        "- Designed server-side applications using C#, ASP.NET Core, and Web API for enhanced performance - Optimized REST APIs for high-traffic backend systems - Created a scalable microservices architecture",
      ),
    ).toEqual([
      "Designed server-side applications using C#, ASP.NET Core, and Web API for enhanced performance",
      "Optimized REST APIs for high-traffic backend systems",
      "Created a scalable microservices architecture",
    ]);
  });

  it("splits sentences that were separated by '. - '", () => {
    expect(
      splitIntoBullets(
        "Developed backend modules using Spring Boot, JPA, and Java. - Engineered REST APIs for transaction systems. - Designed microservices for booking applications.",
      ),
    ).toEqual([
      "Developed backend modules using Spring Boot, JPA, and Java.",
      "Engineered REST APIs for transaction systems.",
      "Designed microservices for booking applications.",
    ]);
  });

  it("leaves a dash that is prose alone", () => {
    expect(
      splitIntoBullets(
        "Project: CIS - Customer Information System - Tech Stack: COBOL, JCL, DB2\nSupported the insurance lifecycle by maintaining mainframe applications",
      ),
    ).toEqual([
      "Project: CIS - Customer Information System - Tech Stack: COBOL, JCL, DB2",
      "Supported the insurance lifecycle by maintaining mainframe applications",
    ]);
    expect(splitIntoBullets("Cut weekly regression effort from 20 hours to 2 hours - a 90% reduction")).toEqual([
      "Cut weekly regression effort from 20 hours to 2 hours - a 90% reduction",
    ]);
    expect(splitIntoBullets("Guest Technical Host – Industry Cohort Program")).toEqual([
      "Guest Technical Host – Industry Cohort Program",
    ]);
  });

  it("does not take one prose dash inside a hyphen bullet for a second bullet", () => {
    expect(splitIntoBullets("- Built dashboards for the Finance - Revenue team")).toEqual([
      "Built dashboards for the Finance - Revenue team",
    ]);
  });
});

describe("prose and plain lines", () => {
  it("never splits a paragraph at its full stops", () => {
    const paragraph =
      "Assisted in the development of web applications using Java, HTML, and CSS. Participated in debugging, testing, and code optimization. Also gained exposure to Machine Learning concepts.";
    expect(splitIntoBullets(paragraph)).toEqual([paragraph]);
  });

  it("reads one plain line per point when each line is its own sentence", () => {
    expect(
      splitIntoBullets(
        "Ensured timely GST filing & compliance for multiple clients\nCompleted 4 audit assignments within the timeline\nSupported statutory audits and financial reporting",
      ),
    ).toEqual([
      "Ensured timely GST filing & compliance for multiple clients",
      "Completed 4 audit assignments within the timeline",
      "Supported statutory audits and financial reporting",
    ]);
  });

  it("does not glue lines together for a writer who starts every line in lowercase", () => {
    expect(
      splitIntoBullets("onboarding more than 150 vendors for the platform\nworking on bank reconciliation\nbilling through SAP"),
    ).toEqual([
      "onboarding more than 150 vendors for the platform",
      "working on bank reconciliation",
      "billing through SAP",
    ]);
  });

  it("treats a blank line as the end of a point", () => {
    expect(
      splitIntoBullets("I was selected for a 4-week internship in C++.\n\nThis will help me strengthen my coding skills."),
    ).toEqual(["I was selected for a 4-week internship in C++.", "This will help me strengthen my coding skills."]);
  });

  it("keeps an unmarked closing sentence apart from the finished bullet above it", () => {
    expect(
      splitIntoBullets(
        "- Handled concurrent updates using optimistic locking.\nLed backend architecture decisions, reducing costs by ~50%.\n\nGuest Technical Host – Industry Cohort Program\n- Led live sessions on backend fundamentals.",
      ),
    ).toEqual([
      "Handled concurrent updates using optimistic locking.",
      "Led backend architecture decisions, reducing costs by ~50%.",
      "Guest Technical Host – Industry Cohort Program",
      "Led live sessions on backend fundamentals.",
    ]);
  });

  it("handles Windows line endings and empty input", () => {
    expect(splitIntoBullets("Built X.\r\nLed Y.")).toEqual(["Built X.", "Led Y."]);
    expect(splitIntoBullets("")).toEqual([]);
    expect(splitIntoBullets("   \n  ")).toEqual([]);
    expect(splitIntoBullets(null)).toEqual([]);
  });
});

describe("nothing but markers and whitespace is ever removed", () => {
  const MARKERS = /[\s•●▪◦‣➢➤►\-*]/g;
  const cases = [
    "Acme Analytics\nData Analyst Intern\n• Cleaned records for reporting\nand business analysis.\n• Built dashboards",
    "- Designed APIs for performance - Optimized REST APIs - Created microservices",
    "Project: CIS - Customer Information System - Tech Stack: COBOL\nSupported the lifecycle",
    "Creative engineer. Enthusiastic\nabout solutions to productivity\nproblems.",
    "R&D <Button> components & \"quoted\" text; 5s → 1.2s (~67%)",
  ];
  it.each(cases)("keeps every other character, in order: %s", (input) => {
    const before = input.replace(MARKERS, "");
    const after = splitIntoBullets(input).join("").replace(MARKERS, "");
    expect(after).toBe(before);
  });
});

describe("experienceBullets", () => {
  it("prefers the stored points", () => {
    expect(experienceBullets({ highlights: ["Built X", "  Led Y  ", ""], description: "ignored" })).toEqual([
      "Built X",
      "Led Y",
    ]);
  });

  it("falls back to the text for an entry saved before points existed", () => {
    expect(experienceBullets({ description: "• Built X\n• Led Y" })).toEqual(["Built X", "Led Y"]);
  });

  it("falls back to the text when the stored list is empty but the text is not", () => {
    expect(experienceBullets({ highlights: [], description: "Built X" })).toEqual(["Built X"]);
  });

  it("ignores a stored value that is not a list of strings", () => {
    expect(experienceBullets({ highlights: "Built X", description: "Led Y" })).toEqual(["Led Y"]);
    expect(experienceBullets({ highlights: [3, null, "Built X"] })).toEqual(["Built X"]);
    expect(experienceBullets(undefined)).toEqual([]);
  });
});

describe("bulletsToDescription", () => {
  it("writes one point per line for readers that predate the list", () => {
    expect(bulletsToDescription(["Built X", " ", "Led  Y "])).toBe("Built X\nLed Y");
  });

  it("round-trips through the legacy splitter for ordinary points", () => {
    const points = ["Built dashboards for sales.", "Led the migration to AWS", "Cut costs by 40%"];
    expect(splitIntoBullets(bulletsToDescription(points))).toEqual(points);
  });
});

describe("looksLikeAList", () => {
  it("is true for pasted lines or a marker, false for one plain sentence", () => {
    expect(looksLikeAList("Built X\nLed Y")).toBe(true);
    expect(looksLikeAList("• Built X")).toBe(true);
    expect(looksLikeAList("Built X • Led Y")).toBe(true);
    expect(looksLikeAList("Built X and led Y")).toBe(false);
    expect(looksLikeAList("end-to-end testing")).toBe(false);
  });
});

describe("review follow-ups: meaning is never changed", () => {
  it("keeps '>' when it means 'more than', instead of dropping it as a marker", () => {
    expect(splitIntoBullets("> 99% uptime across 3 regions")).toEqual(["> 99% uptime across 3 regions"]);
    expect(splitIntoBullets("• Kept the API up\n> 99% uptime")).toEqual(["Kept the API up > 99% uptime"]);
  });

  it("does not glue a heading onto the bullet above it", () => {
    expect(
      splitIntoBullets("• Handled client escalations\nKey Achievements\n• Won the regional sales award"),
    ).toEqual(["Handled client escalations", "Key Achievements", "Won the regional sales award"]);
    expect(splitIntoBullets("• Built the ETL jobs\nRoles and Responsibilities:\n• Led the team")).toEqual([
      "Built the ETL jobs",
      "Roles and Responsibilities:",
      "Led the team",
    ]);
  });

  it("still joins a capitalised wrap that is not a heading", () => {
    // "team" is lowercase, so the line is the rest of the bullet, not a title.
    expect(splitIntoBullets("• Worked with the Data\nEngineering team on the pipeline")).toEqual([
      "Worked with the Data Engineering team on the pipeline",
    ]);
    // A full stop at the end is a sentence, not a heading.
    expect(splitIntoBullets("• Finalist in the national Deep\nRacer Competition.")).toEqual([
      "Finalist in the national Deep Racer Competition.",
    ]);
  });

  it("documents the trade-off: a short wrap capitalised throughout reads as a heading", () => {
    expect(splitIntoBullets("• Partnered with the Global\nMarketing Team")).toEqual([
      "Partnered with the Global",
      "Marketing Team",
    ]);
  });

  it("does not split a list of tools separated by bullets", () => {
    expect(splitIntoBullets("Tech stack: React • Node • SQL")).toEqual(["Tech stack: React • Node • SQL"]);
  });

  it("never splits inside brackets", () => {
    expect(splitIntoBullets("Built dashboards (React • D3) for the sales team")).toEqual([
      "Built dashboards (React • D3) for the sales team",
    ]);
    expect(
      splitIntoBullets("• Built dashboards (React • D3) for sales • Led the migration to AWS"),
    ).toEqual(["Built dashboards (React • D3) for sales", "Led the migration to AWS"]);
  });

  it("still splits a run of phrases, with or without a leading bullet", () => {
    expect(splitIntoBullets("Managed product timelines • Engaged with clients • Created walkthroughs")).toEqual([
      "Managed product timelines",
      "Engaged with clients",
      "Created walkthroughs",
    ]);
    expect(splitIntoBullets("• Led the migration • Mentoring")).toEqual(["Led the migration", "Mentoring"]);
  });
});

describe("bulletsWithinLimits", () => {
  it("accepts the caps exactly and refuses one past either", () => {
    expect(bulletsWithinLimits(Array.from({ length: MAX_POINTS }, (_, i) => `Point ${i}`))).toBe(true);
    expect(bulletsWithinLimits(Array.from({ length: MAX_POINTS + 1 }, (_, i) => `Point ${i}`))).toBe(false);
    expect(bulletsWithinLimits(["x".repeat(MAX_POINT_LENGTH)])).toBe(true);
    expect(bulletsWithinLimits(["x".repeat(MAX_POINT_LENGTH + 1)])).toBe(false);
  });

  it("counts what is sent: blank points are dropped and ends are trimmed", () => {
    expect(bulletsWithinLimits([...Array.from({ length: MAX_POINTS }, () => "Point"), "", "  "])).toBe(true);
    expect(bulletsWithinLimits([`  ${"x".repeat(MAX_POINT_LENGTH)}  `])).toBe(true);
  });
});

