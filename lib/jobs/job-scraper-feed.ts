import axios from "axios";
import { config } from "../config";
import type { JobV2 } from "../services/jobs-v2.service";
import {
  replaceExternalJsonFeedJobs,
  syncExternalJsonJobFavoriteFlags,
} from "./external-json-jobs-store";
import { syntheticIdFromApplyLink } from "./synthetic-job-id";

const JOB_SCRAPER_LISTING = "job_scraper" as const;

type JobScraperApiJob = Record<string, unknown>;

function parseKeySkills(raw: unknown): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  const s = String(raw).trim();
  if (!s) return undefined;
  return s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
}

function normalizeHttpUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    return new URL(t).href;
  } catch {
    if (/^https?:\/\//i.test(t)) return null;
    try {
      return new URL(`https://${t}`).href;
    } catch {
      return null;
    }
  }
}

/**
 * Maps a row from GET /api/jobs (JobRecordSerializer) into {@link JobV2}.
 * Uses the same synthetic negative ids as the legacy static JSON feed (dedupe by apply URL).
 */
export function mapJobScraperRecordToJobV2(row: JobScraperApiJob): JobV2 | null {
  const rawApply = (row.direct_apply_url || row.url || "") as string;
  const applyLink = typeof rawApply === "string" ? normalizeHttpUrl(rawApply) : null;
  if (!applyLink) return null;

  const id = syntheticIdFromApplyLink(applyLink);
  const title = String(row.title ?? "").trim() || "Job opening";
  const company = String(row.company ?? "").trim() || "Company";
  const description = String(row.description ?? "").trim() || undefined;

  const logoRaw = row.company_logo ?? row.company_logo_url;
  const company_logo =
    typeof logoRaw === "string" && logoRaw.trim() ? logoRaw.trim() : undefined;

  let created_at: string | undefined;
  if (row.created_at) {
    const d = new Date(String(row.created_at));
    if (!Number.isNaN(d.getTime())) created_at = d.toISOString();
  }

  return {
    id,
    job_title: title,
    company_name: company,
    company_logo,
    company_info: String(row.about_company ?? "").trim() || undefined,
    job_description: description,
    role_process: String(row.role_process ?? "").trim() || undefined,
    location: String(row.location ?? "").trim() || undefined,
    years_of_experience: String(row.experience ?? "").trim() || undefined,
    salary: row.salary != null ? String(row.salary).trim() || undefined : undefined,
    apply_link: applyLink,
    industry_type: String(row.industry ?? "").trim() || undefined,
    department: String(row.department ?? "").trim() || undefined,
    education: String(row.education ?? "").trim() || undefined,
    role_category: String(row.role_category ?? "").trim() || undefined,
    key_skills: parseKeySkills(row.key_skills),
    created_at,
    application_deadline: String(row.closing_date ?? "").trim() || undefined,
    status: "active",
    is_published: true,
    eligible_to_apply: true,
    is_favourited: false,
    has_applied: false,
    job_type: "Full-time",
    listing_source: JOB_SCRAPER_LISTING,
  };
}

export type FetchJobScraperOptions = {
  search?: string;
  location?: string;
  /** Max pages to pull (100 jobs/page). Default 30. */
  maxPages?: number;
};

/**
 * Paginates GET /api/jobs on the job-scraper service and fills the external job store.
 */
export async function fetchAndMapJobScraperJobs(
  opts?: FetchJobScraperOptions
): Promise<JobV2[]> {
  const base = config.jobScraperApiUrl?.trim();
  if (!base) {
    replaceExternalJsonFeedJobs([]);
    return [];
  }

  const keyword = opts?.search?.trim() ?? "";
  const location = opts?.location?.trim() ?? "";
  const limit = 100;
  const maxPages = Math.min(50, Math.max(1, opts?.maxPages ?? 30));

  const aggregated: JobV2[] = [];
  const seen = new Set<string>();

  const client = axios.create({
    baseURL: base,
    timeout: 90_000,
    headers: { Accept: "application/json" },
  });

  for (let page = 1; page <= maxPages; page++) {
    const res = await client.get<{
      success?: boolean;
      jobs?: JobScraperApiJob[];
      has_next?: boolean;
    }>("/api/jobs", {
      params: {
        page,
        limit,
        ...(keyword ? { keyword } : {}),
        ...(location ? { location } : {}),
        sort: "rank",
      },
    });

    const data = res.data;
    if (!data?.success || !Array.isArray(data.jobs)) break;

    for (const row of data.jobs) {
      const job = mapJobScraperRecordToJobV2(row);
      if (!job?.apply_link) continue;
      const k = job.apply_link.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      aggregated.push(job);
    }

    if (!data.has_next) break;
  }

  const withFav = syncExternalJsonJobFavoriteFlags(aggregated);
  replaceExternalJsonFeedJobs(withFav);
  return withFav;
}
