import axios from "axios";
import { config } from "../config";
import type { JobV2 } from "../services/jobs-v2.service";
import { parseFirstValidDateIso } from "../utils/format-job-description";
import {
  getExternalJobById,
  mergeExternalJsonFeedJobs,
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

function parseKeyPoints(raw: unknown): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    const out = raw
      .flatMap((x) => String(x).split(/\n+/))
      .map((s) => s.trim())
      .filter(Boolean);
    return out.length ? out : undefined;
  }
  const s = String(raw).trim();
  if (!s) return undefined;
  const byNl = s.split(/\n+/).map((t) => t.trim()).filter(Boolean);
  if (byNl.length > 1) return byNl;
  const byBullet = s.split(/\s*[•·]\s*/).map((t) => t.trim()).filter(Boolean);
  if (byBullet.length > 1) return byBullet;
  const bySemi = s.split(/\s*;\s*/).map((t) => t.trim()).filter(Boolean);
  if (bySemi.length > 1 && bySemi.length <= 20) return bySemi;
  return [s];
}

function strField(raw: unknown): string | undefined {
  const s = String(raw ?? "").trim();
  return s.length ? s : undefined;
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

/** Strip ATS noise often concatenated into a single title field (Category / Posted / Job ID). */
function sanitizeScraperJobTitle(raw: string): string {
  let t = raw.replace(/\s{2,}/g, " ").trim();
  if (!t) return t;
  const cutPatterns = [
    /\s+Category:\s*/i,
    /\s+Posted:\s*/i,
    /\s+Job ID:\s*/i,
    /\s+Apply by\s+/i,
  ];
  let end = t.length;
  for (const re of cutPatterns) {
    const m = re.exec(t);
    if (m && m.index != null && m.index >= 24) {
      end = Math.min(end, m.index);
    }
  }
  if (end < t.length) {
    t = t.slice(0, end).trim();
  }
  const maxLen = 120;
  if (t.length > maxLen) {
    const slice = t.slice(0, maxLen);
    const lastSpace = slice.lastIndexOf(" ");
    t = (lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trim() + "…";
  }
  return t || raw.trim();
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
  const rawTitle = String(row.title ?? "").trim();
  const title = rawTitle ? sanitizeScraperJobTitle(rawTitle) : "Job opening";
  const company = String(row.company ?? "").trim() || "Company";
  const description = String(row.description ?? "").trim() || undefined;

  const logoRaw = row.company_logo ?? row.company_logo_url;
  const company_logo =
    typeof logoRaw === "string" && logoRaw.trim() ? logoRaw.trim() : undefined;

  const created_at = parseFirstValidDateIso(
    row.posted_at,
    row.created_at,
    row.last_seen_at,
    row.updated_at
  );

  const keyPoints = parseKeyPoints(row.key_points);
  const requirements = strField(row.requirements);
  const jobBenefits = strField(row.job_benefits);
  const scraperSource = strField(row.source);

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
    ...(scraperSource ? { scraper_source: scraperSource } : {}),
    ...(requirements ? { scraper_requirements: requirements } : {}),
    ...(jobBenefits ? { scraper_job_benefits: jobBenefits } : {}),
    ...(keyPoints?.length ? { scraper_key_points: keyPoints } : {}),
  };
}

export type JobScraperListResult = {
  jobs: JobV2[];
  /** Total rows matching keyword/location on the scraper (before client-side filters). */
  total: number;
  has_next: boolean;
  page: number;
  limit: number;
};

export type FetchJobScraperOptions = {
  search?: string;
  location?: string;
  /** 1-based scraper list page. Default 1. */
  page?: number;
  /** Page size for GET /api/jobs (clamped 1–100). Default 100. */
  limit?: number;
  /**
   * How many consecutive scraper pages to fetch in one call (default 1).
   * Use a small number for admin bulk loads or cold-start detail resolution.
   */
  maxPages?: number;
  /**
   * When true (default), external store is replaced with this call’s jobs only.
   * When false, jobs are merged into the store (paged browse / hydrate-by-scan).
   */
  replaceStore?: boolean;
};

type ScraperListResponse = {
  success?: boolean;
  jobs?: JobScraperApiJob[];
  has_next?: boolean;
  total?: number;
  page?: number;
  limit?: number;
};

/**
 * Fetches GET /api/jobs on the job-scraper service (one or more pages) and updates the external job store.
 */
export async function fetchAndMapJobScraperJobs(
  opts?: FetchJobScraperOptions
): Promise<JobScraperListResult> {
  const empty = (): JobScraperListResult => ({
    jobs: [],
    total: 0,
    has_next: false,
    page: opts?.page ?? 1,
    limit: opts?.limit ?? 100,
  });

  const base = config.jobScraperApiUrl?.trim();
  if (!base) {
    replaceExternalJsonFeedJobs([]);
    return empty();
  }

  const keyword = opts?.search?.trim() ?? "";
  const location = opts?.location?.trim() ?? "";
  const startPage = Math.max(1, opts?.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts?.limit ?? 100));
  const maxPages = Math.min(50, Math.max(1, opts?.maxPages ?? 1));
  const replaceStore = opts?.replaceStore !== false;

  const aggregated: JobV2[] = [];
  const seen = new Set<string>();

  const client = axios.create({
    baseURL: base,
    timeout: 90_000,
    headers: { Accept: "application/json" },
  });

  let total = 0;
  let has_next = false;
  let lastPage = startPage;

  for (let i = 0; i < maxPages; i++) {
    const page = startPage + i;
    lastPage = page;
    const res = await client.get<ScraperListResponse>("/api/jobs", {
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
    if (typeof data.total === "number") total = data.total;

    for (const row of data.jobs) {
      const job = mapJobScraperRecordToJobV2(row);
      if (!job?.apply_link) continue;
      const k = job.apply_link.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      aggregated.push(job);
    }

    has_next = Boolean(data.has_next);
    if (!has_next) break;
  }

  const withFav = syncExternalJsonJobFavoriteFlags(aggregated);
  if (replaceStore) replaceExternalJsonFeedJobs(withFav);
  else mergeExternalJsonFeedJobs(withFav);

  return {
    jobs: withFav,
    total,
    has_next,
    page: lastPage,
    limit,
  };
}

const HYDRATE_SCAN_MAX_PAGES = 25;

/**
 * Walks scraper list pages until the synthetic id appears in the store (or list ends).
 * Merges each page into the external store so {@link getExternalJobById} can resolve.
 */
export async function hydrateExternalJobFromScraperById(
  syntheticId: number,
  opts?: { search?: string; location?: string }
): Promise<JobV2 | null> {
  const hit = getExternalJobById(syntheticId);
  if (hit) return hit;

  const base = config.jobScraperApiUrl?.trim();
  if (!base) return null;

  for (let p = 1; p <= HYDRATE_SCAN_MAX_PAGES; p++) {
    const { has_next } = await fetchAndMapJobScraperJobs({
      search: opts?.search,
      location: opts?.location,
      page: p,
      limit: 100,
      maxPages: 1,
      replaceStore: false,
    });
    const found = getExternalJobById(syntheticId);
    if (found) return found;
    if (!has_next) break;
  }
  return getExternalJobById(syntheticId) ?? null;
}
