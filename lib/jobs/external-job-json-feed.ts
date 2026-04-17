/**
 * Complete pipeline: raw JSON records from `public/jobs/*.json` → mapped JobV2 objects.
 *
 * Sections (top to bottom):
 *  1. Record type + listing_source constant
 *  2. Text cleanup / heuristic inference (summary, highlights, sidebar, skills, experience, salary)
 *  3. Company-logo inference (ATS slug → Google s2 favicons)
 *  4. Record → JobV2 mapper
 *  5. Fetch + hydrate
 */

import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "../config";
import { replaceExternalJsonFeedJobs } from "./external-json-jobs-store";
import { fetchAndMapJobScraperJobs } from "./job-scraper-feed";
import { syntheticIdFromApplyLink } from "./synthetic-job-id";

export { syntheticIdFromApplyLink } from "./synthetic-job-id";

// ═══════════════════════════════════════════════════════════════════════════
// 1. Record type
// ═══════════════════════════════════════════════════════════════════════════

/** Raw shape from public/jobs/*.json (scraper / offline enrich). */
export interface ExternalJobJsonRecord {
  job_title: string;
  company_name: string;
  company_logo?: string;
  rating?: string;
  reviews?: string;
  experience?: string;
  salary?: string;
  location?: string;
  job_description?: string;
  tags?: string[];
  job_post_date?: string;
  application_deadline?: string;
  job_url?: string;
  direct_apply_url?: string;
  peek_keyword?: string;
  peek_location?: string;
  source_platform?: string;
  validation_reason?: string;
  enriched_at?: string;
  ai_summary?: string;
  ai_highlights?: string[];
}

export const EXTERNAL_JSON_JOB_LISTING_SOURCE = "external_json" as const;

// ═══════════════════════════════════════════════════════════════════════════
// 2. Text cleanup & heuristic inference
// ═══════════════════════════════════════════════════════════════════════════

function deconcatenateWords(text: string): string {
  let s = text.replace(/\s+/g, " ").trim();
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  s = s.replace(/([A-Z]{2,})([A-Z][a-z])/g, "$1 $2");
  return s.replace(/\s{2,}/g, " ").trim();
}

function polishDescription(text: string): string {
  if (!text?.trim()) return text;
  return text
    .replace(/,\s*including([A-Z])/g, ", including $1")
    .replace(/including([A-Z])/g, "including $1")
    .replace(/\bwith headquarter\b/gi, "with headquarters")
    .replace(/\bheadquarter\b/gi, "headquarters")
    .replace(/\bTheBusiness\b/g, "The Business")
    .replace(/\bTheAnalyst\b/g, "The Analyst")
    .replace(/\bTheEngineer\b/g, "The Engineer")
    .replace(/\bTheDeveloper\b/g, "The Developer")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sentencesFrom(text: string): string[] {
  return deconcatenateWords(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

function buildHeuristicSummary(description: string, title: string): string {
  const cleaned = polishDescription(deconcatenateWords(description));
  if (!cleaned) return `Role: ${deconcatenateWords(title)}. See the full description below for details.`;
  let pool = sentencesFrom(cleaned);
  if (pool.length === 0) return cleaned;
  const maxChars = 900;
  while (pool.length > 1 && pool.join(" ").length > maxChars) pool = pool.slice(0, -1);
  let out = pool.join(" ");
  if (out.length > maxChars) out = pool[0] ?? cleaned;
  return out || cleaned;
}

function buildHeuristicHighlights(description: string, title: string): string[] {
  const cleaned = polishDescription(deconcatenateWords(description));
  const sentences = sentencesFrom(cleaned);
  const bullets: string[] = [];

  for (const s of sentences) {
    if (bullets.length >= 6) break;
    if (s.length <= 320) { bullets.push(s); continue; }
    const chunks = s.split(/;\s+/).map((c) => c.trim()).filter((c) => c.length > 20);
    if (chunks.length > 1) {
      for (const c of chunks) {
        if (bullets.length >= 6) break;
        bullets.push(c.length > 320 ? `${c.slice(0, 317)}…` : c);
      }
    } else {
      bullets.push(`${s.slice(0, 317)}…`);
    }
  }

  if (bullets.length < 3 && cleaned.length > 40) {
    const chunks = cleaned.split(/[,;]\s+/).filter((c) => c.length > 30 && c.length < 400);
    for (const c of chunks) {
      if (bullets.length >= 6) break;
      if (!bullets.some((b) => b.slice(0, 40) === c.slice(0, 40))) bullets.push(c);
    }
  }
  if (bullets.length === 0) bullets.push(`Focus area: ${deconcatenateWords(title)}`);
  return bullets.slice(0, 6);
}

function buildHeuristicRoleProcess(description: string, title: string): string {
  return buildHeuristicHighlights(description, title).map((h, i) => `${i + 1}. ${h}`).join("\n\n");
}

// --- Sidebar field inference ---

function guessIndustry(title: string, desc: string): string {
  const t = `${title} ${desc}`.toLowerCase();
  if (/python|java|engineer|developer|software|devops|cloud|aws|kubernetes|ios|android/.test(t)) return "IT / Technology";
  if (/sales|bdr|sdr|marketing|account executive/.test(t)) return "Sales & Marketing";
  if (/nurse|clinical|health|patient|medical/.test(t)) return "Healthcare";
  if (/finance|accountant|revenue|payroll/.test(t)) return "Finance & Accounting";
  if (/hr|people|recruit|talent/.test(t)) return "Human Resources";
  if (/project manager|program manager|operations manager/.test(t)) return "Operations";
  return "General";
}

function guessDepartment(title: string): string {
  const t = title.toLowerCase();
  if (/engineer|developer|software|devops|architect|technical/.test(t)) return "Engineering";
  if (/sales|bdr|sdr|account/.test(t)) return "Sales";
  if (/marketing|content|brand/.test(t)) return "Marketing";
  if (/project|program|pm\b/.test(t)) return "Project / Program Management";
  if (/operations|ops\b/.test(t)) return "Operations";
  return "General";
}

function inferSidebarFields(title: string, description: string, location?: string) {
  const desc = polishDescription(deconcatenateWords(description));
  const ttl = deconcatenateWords(title);
  const sents = sentencesFrom(desc);
  const blurb = `${ttl} — ${(sents.slice(0, 2).join(" ") || desc)}`.trim();
  return {
    industry_type: guessIndustry(ttl, desc),
    department: guessDepartment(ttl),
    employment_type: /remote|home based|work from home/i.test(location ?? "") ? "Remote" : "Full-time",
    role_category: guessIndustry(ttl, desc).split("/")[0]?.trim() || "Professional",
    education: "See employer listing",
    company_info: blurb,
  };
}

function inferExperienceFromDescription(text: string): string | undefined {
  const t = text.replace(/\s+/g, " ");
  const m1 = t.match(/(\d+)\s*[-–—]\s*(\d+)\s*(?:years?|yrs?\.?)(?:\s+of\s+)?(?:experience|exp\.?)?/i);
  if (m1) return `${m1[1]}-${m1[2]} years`;
  const m2 = t.match(/(\d+)\s*\+\s*(?:years?|yrs?\.?)/i);
  if (m2) return `${m2[1]}+ years`;
  const m3 = t.match(/(?:minimum|at least|min\.?)\s*(\d+)\s*(?:years?|yrs?\.?)(?:\s+of\s+)?(?:experience|exp\.?)?/i);
  if (m3) return `${m3[1]}+ years`;
  const m4 = t.match(/(\d+)\s*(?:to|[-–])\s*(\d+)\s*(?:years?|yrs?\.?)/i);
  if (m4) return `${m4[1]}-${m4[2]} years`;
  const m5 = t.match(/(\d+)\s*(?:years?|yrs?\.?)\s+(?:of\s+)?(?:relevant\s+)?experience/i);
  if (m5) return `${m5[1]}+ years`;
  return undefined;
}

function inferSalaryFromDescription(text: string): string | undefined {
  const t = text.replace(/\s+/g, " ");
  const lpa = t.match(/\b(?:₹|Rs\.?|INR|inr)\s*([\d.,]+)\s*(?:[-–]\s*([\d.,]+))?\s*(?:LPA|lpa|lakhs?)\b/i);
  if (lpa) {
    const a = lpa[1]?.replace(/,/g, "") ?? "";
    const b = lpa[2]?.replace(/,/g, "");
    return b ? `${a}-${b} LPA` : `${a} LPA`;
  }
  const usdK = t.match(/\$\s*([\d,]+)\s*(?:[-–]\s*\$?\s*([\d,]+))?\s*(?:k|K)(?:\s*\/\s*(?:yr|year))?\b/);
  if (usdK) {
    const a = usdK[1]?.replace(/,/g, "") ?? "";
    const b = usdK[2]?.replace(/,/g, "");
    return b ? `$${a}k-$${b}k` : `$${a}k`;
  }
  const usdRange = t.match(/\$\s*([\d,]+)\s*[-–]\s*\$?\s*([\d,]+)(?:\s*\/\s*(?:yr|year))?\b/i);
  if (usdRange) return `$${usdRange[1]}-$${usdRange[2]}`;
  if (/\bcompetitive\s+(?:salary|compensation|pay|package)\b/i.test(t)) return "Competitive";
  if (/\b(?:salary|compensation)\s+is\s+competitive\b/i.test(t)) return "Competitive";
  return undefined;
}

// --- Key-skill chip inference ---

const TITLE_STOP = new Set([
  "the","and","for","with","our","are","was","has","had","job","role","new","all",
  "any","can","who","you","your","this","that","from","into","over","full","time",
  "part","based","senior","junior","mid","level","staff","lead","principal","opening",
  "needed","hire","hiring","team","work","remote","hybrid","onsite","uae","usa","uk",
  "dubai","abudhabi","riyadh","india","noida","bangalore","mumbai","delhi","gurgaon",
  "worldwide","home","global","multiple","locations","years","year","exp","experience",
]);

const SKILL_HINTS: [RegExp, string[]][] = [
  [/salesforce|sfdc|\bsoql\b|\bapex\b|lightning|einstein\s*analytics/i, ["Salesforce", "CRM"]],
  [/servicenow|\bsnow\b(?!\s*flake)/i, ["ServiceNow", "ITSM"]],
  [/workday\b/i, ["Workday", "HCM"]],
  [/business\s*analyst|\brequirements\b.*\b(analyst|engineer)/i, ["Business Analysis", "Requirements"]],
  [/systems?\s*analyst|solution\s*architect|enterprise\s*architect/i, ["Systems Analysis", "Architecture"]],
  [/data\s*scientist|machine\s*learning|\bml\b|deep\s*learning|pytorch|tensorflow|keras/i, ["Machine Learning", "Python"]],
  [/data\s*analyst|bi\s*developer|power\s*bi|tableau|looker/i, ["SQL", "Data Analysis", "Power BI"]],
  [/database\s*admin|\bdba\b|postgres|postgresql|mysql|mongodb|oracle\s*db/i, ["SQL", "Database"]],
  [/qa\s*engineer|quality\s*assurance|test\s*automation|selenium|cypress|jest/i, ["QA", "Test Automation"]],
  [/site\s*reliability|\bsre\b/i, ["SRE", "Kubernetes"]],
  [/cyber\s*security|information\s*security|\biam\b|soc\b|penetration/i, ["Security", "IAM"]],
  [/blockchain|solidity|web3|ethereum/i, ["Blockchain", "Solidity"]],
  [/devops|kubernetes|\bk8s\b|terraform|ansible|jenkins|ci\/cd|gitlab/i, ["DevOps", "Kubernetes", "CI/CD"]],
  [/cloud\s*engineer|cloud\s*architect/i, ["Cloud", "AWS"]],
  [/software\s*engineer|full[\s-]*stack|backend\s*engineer|frontend\s*engineer/i, ["Software Engineering"]],
  [/ios\b|swift\b|objc/i, ["iOS", "Swift"]],
  [/android|kotlin/i, ["Android", "Kotlin"]],
  [/react\.?js|\bnext\.js\b|\bnextjs\b/i, ["React", "JavaScript"]],
  [/angular\b/i, ["Angular", "TypeScript"]],
  [/vue\.?js|\bvue\b/i, ["Vue", "JavaScript"]],
  [/node\.?js|\bexpress\b/i, ["Node", "JavaScript"]],
  [/java(?!script)/i, ["Java"]],
  [/golang|\bgo\s+developer|\bgo\s+engineer/i, ["Go"]],
  [/rust\b/i, ["Rust"]],
  [/c\+\+|\bc#\b|\.net\b|dotnet/i, ["C#", ".NET"]],
  [/ruby\b|rails\b/i, ["Ruby", "Rails"]],
  [/php\b|laravel|symfony/i, ["PHP"]],
  [/python\b|django|flask|fastapi/i, ["Python"]],
  [/javascript|\bjs\b(?!\w)/i, ["JavaScript"]],
  [/typescript/i, ["TypeScript"]],
  [/aws\b|amazon\s*web/i, ["AWS"]],
  [/azure\b/i, ["Azure"]],
  [/gcp|google\s*cloud/i, ["GCP"]],
  [/snowflake\b/i, ["Snowflake"]],
  [/databricks|spark\b|hive\b|airflow/i, ["Spark", "Python"]],
  [/sap\b|s\/4hana|abap/i, ["SAP"]],
  [/netsuite|workiva|quickbooks/i, ["ERP", "Finance"]],
  [/nurse|rn\b|clinical|patient\s*care|nicu|icu\b/i, ["Nursing", "Clinical"]],
  [/physician|doctor|md\b|surgeon/i, ["Medicine", "Clinical"]],
  [/pharmacist|pharmacy/i, ["Pharmacy"]],
  [/teacher|instructor|professor|curriculum/i, ["Education", "Teaching"]],
  [/lawyer|attorney|legal\s*counsel|paralegal/i, ["Legal"]],
  [/accountant|cpa\b|bookkeeper|payroll|revenue\s*recognition/i, ["Accounting", "Finance"]],
  [/financial\s*analyst|fp&a|investment\s*bank/i, ["Finance", "Excel"]],
  [/recruiter|talent\s*acquisition|hrbp|human\s*resources/i, ["HR", "Recruiting"]],
  [/chef|cook\b|culinary|kitchen/i, ["Culinary", "Operations"]],
  [/driver|logistics|warehouse|supply\s*chain|procurement/i, ["Logistics", "Operations"]],
  [/electrician|electrical\s*engineer|hvac|plumber|construction/i, ["Skilled Trades", "Construction"]],
  [/civil\s*engineer|structural/i, ["Civil Engineering"]],
  [/graphic\s*design|illustrator|photoshop|indesign/i, ["Graphic Design", "Adobe"]],
  [/copywriter|content\s*writer|seo|sem\b/i, ["Content", "Marketing"]],
  [/social\s*media|community\s*manager/i, ["Social Media", "Marketing"]],
  [/product\s*manager|\bproduct\b.*owner/i, ["Product Management"]],
  [/project\s*manager|\bpmo\b/i, ["Project Management"]],
  [/program\s*manager/i, ["Program Management"]],
  [/scrum\s*master|agile\s*coach/i, ["Agile", "Scrum"]],
  [/customer\s*success|account\s*manager|client\s*relations/i, ["Customer Success", "Sales"]],
  [/account\s*executive|\bbdr\b|\bsdr\b|inside\s*sales/i, ["Sales"]],
  [/figma|sketch\b|ui\/ux|user\s*experience|interaction\s*design/i, ["UI/UX", "Figma"]],
  [/research\s*scientist|postdoc|laboratory/i, ["Research", "Analysis"]],
  [/support\s*engineer|help\s*desk|it\s*support|desktop\s*support/i, ["IT Support"]],
  [/network\s*engineer|ccna|ccnp|cisco/i, ["Networking", "Cisco"]],
];

const SKILL_POOL = [
  "Python","JavaScript","TypeScript","Java","Rust","Go","C#",".NET","React",
  "Next.js","Vue","Angular","Node","Node.js","Express","AWS","Azure","GCP",
  "Salesforce","ServiceNow","Workday","SOQL","Apex","SQL","PostgreSQL","MongoDB",
  "Snowflake","Databricks","Tableau","Power BI","Excel","Kubernetes","Docker",
  "Terraform","Ansible","Jenkins","CI/CD","REST API","GraphQL","gRPC","Kafka",
  "Redis","Elasticsearch","iOS","Android","Swift","Kotlin","Flutter","React Native",
  "Project Management","Agile","Scrum","Business Analysis","CRM","ERP","Marketing",
  "Sales","Operations","Finance","HR","Legal","Education","Remote","SAP","Figma",
  "UI/UX","Security","Blockchain","Machine Learning","Data Analysis","QA","SRE","Networking",
];

function inferKeySkillsFromJsonJob(title: string, description: string, location?: string): string[] {
  const combined = `${title} ${description}`;
  const text = combined.toLowerCase();
  const seen = new Set<string>();
  const ordered: string[] = [];
  const push = (label: string) => { const k = label.trim(); if (!k || seen.has(k)) return; seen.add(k); ordered.push(k); };

  for (const [re, labels] of SKILL_HINTS) if (re.test(combined)) for (const l of labels) push(l);

  for (const k of SKILL_POOL) {
    if (ordered.length >= 8) break;
    const low = k.toLowerCase();
    if (low === "java") { if (/java(?!script)/i.test(combined)) push(k); continue; }
    if (low === "go") { if (/\bgo\b(?=[\s,.)]|$)/i.test(combined) || /\bgolang\b/i.test(text)) push(k); continue; }
    if (text.includes(low)) push(k);
  }

  if (ordered.length < 4) {
    const raw = title.replace(/[[\]()]/g, " ").replace(/[/|,:+&]/g, " ");
    for (const w of raw.split(/\s+/).map((w) => w.trim()).filter((w) => w.length >= 3 && !TITLE_STOP.has(w.toLowerCase()))) {
      if (ordered.length >= 8) break;
      push(w.replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }

  if (ordered.length < 3) {
    const side = inferSidebarFields(title, description, location);
    const ind = side.industry_type?.split("/")[0]?.trim();
    if (ind && ind !== "General") push(ind);
    if (side.department && side.department !== "General") push(side.department);
  }

  if (ordered.length < 3 && description.trim()) {
    const snippet = description.slice(0, 500).toLowerCase();
    for (const [needle, label] of [
      ["stakeholder","Stakeholders"],["compliance","Compliance"],["budget","Budgeting"],
      ["forecast","Forecasting"],["negotiat","Negotiation"],["presentation","Presentations"],
      ["roadmap","Roadmapping"],["analytics","Analytics"],
    ] as const) {
      if (ordered.length >= 3) break;
      if (snippet.includes(needle)) push(label);
    }
  }

  return ordered.slice(0, 8);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Company-logo inference  (ATS board slug → Google s2 favicons)
// ═══════════════════════════════════════════════════════════════════════════

const SLUG_TO_DOMAIN: Record<string, string> = {
  cfsenergy: "cfs.energy", dept: "deptagency.com", truebill: "rocketmoney.com",
  nutrafol: "nutrafol.com", successacademycharterschool: "successacademies.org",
  galaxydigitalservices: "galaxy.com", komodohealth: "komodohealth.com",
  parachutehealth: "parachutehealth.com", careeredge: "careerteam.com",
  signerscareers: "signersnational.com", brandtechplus: "thebrandtechgroup.com",
  manychat: "manychat.com", seamlessai: "seamless.ai", foodics: "foodics.com",
  "d2b-1": "d2b.com", "two95-international-inc-3": "two95.com",
  "two95-international-inc": "two95.com", "prominence-advisors": "prominence.com",
  reworkssolutions: "reworkssolutions.com",
};

function faviconUrl(dns: string): string | undefined {
  try {
    const host = new URL(dns.startsWith("http") ? dns : `https://${dns}`).hostname.toLowerCase();
    return host.includes(".") ? `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(host)}` : undefined;
  } catch { return undefined; }
}

function inferCompanyLogoUrl(applyLink: string): string | undefined {
  try {
    const u = new URL(applyLink);
    const host = u.hostname.toLowerCase();
    const parts = u.pathname.split("/").filter(Boolean);

    // Greenhouse / Lever
    let slug: string | undefined;
    if (host.includes("greenhouse.io") && parts[0] && parts[0] !== "jobs") slug = parts[0].toLowerCase();
    if (host === "jobs.lever.co" || host.endsWith(".lever.co")) { const s = parts[0]; if (s?.length > 1) slug = s.toLowerCase(); }
    if (slug) return faviconUrl(SLUG_TO_DOMAIN[slug] ?? `${slug}.com`);

    // Workable
    if (host.includes("workable.com")) {
      const j = parts.indexOf("j");
      const org = j > 0 ? parts[j - 1] : parts[0];
      if (org && org !== "apply") { const k = org.toLowerCase(); const s = k.replace(/-\d+$/, ""); return faviconUrl(SLUG_TO_DOMAIN[k] ?? SLUG_TO_DOMAIN[s] ?? `${s}.com`); }
    }

    // SmartRecruiters
    if (host.includes("smartrecruiters.com")) {
      const seg = parts[0]?.toLowerCase();
      if (seg && SLUG_TO_DOMAIN[seg]) return faviconUrl(SLUG_TO_DOMAIN[seg]);
      if (seg && /^[a-z]{2,24}$/i.test(seg)) { const g = faviconUrl(`${seg}.com`); if (g) return g; }
      return faviconUrl(host);
    }

    return host.includes(".") ? faviconUrl(host) : undefined;
  } catch { return undefined; }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Record → JobV2 mapper
// ═══════════════════════════════════════════════════════════════════════════

const NOT_SPECIFIED = /^not\s*specified$/i;

export function normalizeApplyLinkUrl(record: ExternalJobJsonRecord): string | null {
  const raw = (record.direct_apply_url || record.job_url || "").trim();
  if (!raw) return null;
  try { return new URL(raw).toString(); } catch { return raw; }
}

function normalizeNotSpecified(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const t = value.trim();
  return (!t || NOT_SPECIFIED.test(t)) ? undefined : t;
}

function parseToIso(input: string | undefined): string | undefined {
  if (!input?.trim()) return undefined;
  const t = input.trim();
  let d = new Date(t);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) { d = new Date(`${t}T12:00:00.000Z`); if (!Number.isNaN(d.getTime())) return d.toISOString(); }
  const slash = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const a = parseInt(slash[1], 10), b = parseInt(slash[2], 10), y = parseInt(slash[3], 10);
    const month = a > 12 ? b : a, day = a > 12 ? a : b;
    d = new Date(Date.UTC(y, month - 1, day, 12, 0, 0));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return undefined;
}

function postDateToCreatedAt(jobPostDate?: string, enrichedAt?: string): string | undefined {
  const primary = parseToIso(jobPostDate);
  if (primary) return primary;
  if (!enrichedAt?.trim()) return undefined;
  return parseToIso(enrichedAt.trim().split("T")[0]) ?? (() => { const d = new Date(enrichedAt.trim()); return Number.isNaN(d.getTime()) ? undefined : d.toISOString(); })();
}

export function deriveEmployerFromUrl(applyLink: string, fallbackCompany: string): string {
  try {
    const u = new URL(applyLink);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.replace(/\/+$/, "");
    const humanize = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();

    if (host === "jobs.lever.co" || host.endsWith(".lever.co")) { const seg = path.split("/").filter(Boolean)[0]; if (seg?.length > 1) return humanize(seg); }
    if (host.includes("greenhouse.io")) { const parts = path.split("/").filter(Boolean); const idx = parts.indexOf("jobs"); const board = idx > 0 ? parts[idx - 1] : parts[0]; if (board && board !== "jobs") return humanize(board); }
    if (host.includes("workable.com")) { const parts = path.split("/").filter(Boolean); const org = parts[parts.indexOf("apply") + 1] || parts[0]; if (org && org !== "j") return humanize(org.replace(/-\d+$/, "")); }
    if (host.includes("myworkdayjobs.com")) { const ji = path.lastIndexOf("/job/"); if (ji !== -1) { const tp = (path.slice(ji + 5).split("/").pop() || "").replace(/_[A-Z0-9]+$/, "").replace(/_/g, " ").trim(); if (tp.length > 3) return tp; } }
  } catch { /* fall through */ }
  return fallbackCompany.trim() || "Company";
}

function polishJobTitle(title: string): string {
  let t = title.replace(/\s{2,}/g, " ").trim();
  const opens = (t.match(/\(/g) ?? []).length;
  const closes = (t.match(/\)/g) ?? []).length;
  if (opens > closes) t += ")".repeat(opens - closes);
  return t;
}

function cleanJobTitle(title: string, applyLink: string): string {
  const t = title.trim();
  if (t.length < 80 && !t.includes("myworkdayjobs.com") && !t.includes("wd10.")) return t || "Job opening";
  try {
    const u = new URL(applyLink);
    if (u.hostname.includes("myworkdayjobs.com")) {
      const ji = u.pathname.lastIndexOf("/job/");
      if (ji !== -1) { const tp = (u.pathname.slice(ji + 5).split("/").pop() || "").replace(/_[A-Z0-9]+$/, "").replace(/_/g, " ").trim(); if (tp.length > 3) return tp; }
    }
  } catch { /* noop */ }
  return "Job opening";
}

export function mapExternalJsonRecordToJobV2(record: ExternalJobJsonRecord): JobV2 | null {
  const applyLink = normalizeApplyLinkUrl(record);
  if (!applyLink) {
    if (process.env.NODE_ENV === "development") console.warn("[external-job-json] Skipping row without apply/job URL", record.job_title);
    return null;
  }

  const title = polishJobTitle(cleanJobTitle(record.job_title ?? "", applyLink));
  const company = deriveEmployerFromUrl(applyLink, (record.company_name ?? "").trim());
  const description = polishDescription(deconcatenateWords((record.job_description ?? "").trim()));
  const id = syntheticIdFromApplyLink(applyLink);
  const keySkills = inferKeySkillsFromJsonJob(title, description, record.location?.trim());

  const aiSummary = typeof record.ai_summary === "string" ? record.ai_summary.trim() : "";
  const aiHighlights = Array.isArray(record.ai_highlights)
    ? record.ai_highlights.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const summary = aiSummary || buildHeuristicSummary(description, title);
  const highlights = aiHighlights.length > 0 ? aiHighlights : buildHeuristicHighlights(description, title);
  const role_process = description.length > 40 ? buildHeuristicRoleProcess(description, title) : undefined;
  const side = inferSidebarFields(title, description, record.location);

  return {
    id,
    job_title: title,
    company_name: company,
    company_logo: record.company_logo?.trim() || inferCompanyLogoUrl(applyLink) || undefined,
    job_description: description || undefined,
    ai_summary: summary,
    ai_highlights: highlights,
    ...(role_process ? { role_process } : {}),
    industry_type: side.industry_type,
    department: side.department,
    employment_type: side.employment_type,
    role_category: side.role_category,
    education: side.education,
    company_info: side.company_info,
    location: record.location?.trim() || undefined,
    years_of_experience: normalizeNotSpecified(record.experience) ?? inferExperienceFromDescription(description),
    salary: normalizeNotSpecified(record.salary) ?? inferSalaryFromDescription(description),
    apply_link: applyLink,
    tags: undefined,
    key_skills: keySkills,
    created_at: postDateToCreatedAt(record.job_post_date, record.enriched_at),
    application_deadline: record.application_deadline?.trim() || undefined,
    status: "active",
    is_published: true,
    eligible_to_apply: true,
    is_favourited: false,
    has_applied: false,
    job_type: "Full-time",
    listing_source: EXTERNAL_JSON_JOB_LISTING_SOURCE,
  };
}

export function mapExternalJsonRecordsToJobV2List(records: ExternalJobJsonRecord[]): JobV2[] {
  const seen = new Set<string>();
  const out: JobV2[] = [];
  for (const r of records) {
    const job = mapExternalJsonRecordToJobV2(r);
    if (!job?.apply_link) continue;
    const key = job.apply_link.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Fetch + hydrate
// ═══════════════════════════════════════════════════════════════════════════

export type FetchExternalJsonJobsOptions = {
  search?: string;
  location?: string;
};

/**
 * Loads merged “external” listings: job-scraper service when
 * `NEXT_PUBLIC_JOB_SCRAPER_API_URL` is set; otherwise clears the store.
 */
export async function fetchAndMapExternalJsonJobs(
  opts?: FetchExternalJsonJobsOptions
): Promise<JobV2[]> {
  if (!config.jobScraperApiUrl?.trim()) {
    replaceExternalJsonFeedJobs([]);
    return [];
  }
  return fetchAndMapJobScraperJobs({
    search: opts?.search,
    location: opts?.location,
  });
}
