import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Build upstream URL for the job list. Prefer JOB_SCRAPER_JOBS_LIST_URL when the
 * endpoint is not base + path (e.g. nested route).
 */
function resolveUpstreamJobsUrl(req: NextRequest): string | null {
  const full = process.env.JOB_SCRAPER_JOBS_LIST_URL?.trim();
  if (full) {
    const u = new URL(full);
    req.nextUrl.searchParams.forEach((v, k) => {
      if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    });
    return u.toString();
  }

  const base = process.env.JOB_SCRAPER_API_URL?.trim();
  if (!base) return null;

  // Django: jobs.views.scrape_live_json → serves live_scrape/scrape_unique.json as JSON
  const path = (process.env.JOB_SCRAPER_JOBS_PATH ?? "api/scrape-live/json")
    .trim()
    .replace(/^\/+/, "");
  const u = new URL(path, base.endsWith("/") ? base : `${base}/`);
  req.nextUrl.searchParams.forEach((v, k) => {
    if (!u.searchParams.has(k)) u.searchParams.set(k, v);
  });
  return u.toString();
}

export async function GET(req: NextRequest) {
  const target = resolveUpstreamJobsUrl(req);
  if (!target) {
    return NextResponse.json(
      {
        detail:
          "Job scraper not configured. Set JOB_SCRAPER_API_URL + JOB_SCRAPER_JOBS_PATH, or JOB_SCRAPER_JOBS_LIST_URL.",
      },
      { status: 501 }
    );
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.JOB_SCRAPER_API_KEY?.trim();
  if (key) headers.Authorization = `Bearer ${key}`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 45_000);

  try {
    const res = await fetch(target, {
      headers,
      cache: "no-store",
      signal: ac.signal,
    });
    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          detail: `Upstream returned ${res.status}`,
          hint:
            res.status === 404
              ? "Check JOB_SCRAPER_JOBS_PATH: unique jobs JSON is at api/scrape-live/json (see Django jobs.views.scrape_live_json)."
              : undefined,
          upstream: text.slice(0, 1200),
        },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      return NextResponse.json({ detail: "Upstream returned non-JSON" }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ detail: msg }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
