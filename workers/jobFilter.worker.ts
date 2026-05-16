// IMPORTANT: this file runs in a Web Worker (no React, no hooks)

import { jobPostedWithin, locationMatchesFilter } from "../lib/jobs/job-filters-shared";

self.onmessage = (event) => {
  const { jobs, filters, searchQuery } = event.data;

  let result = jobs;

  if (filters?.location) {
    result = result.filter((j: any) =>
      locationMatchesFilter(j._location, filters.location)
    );
  }

  if (filters?.posted_within) {
    result = result.filter((j: any) =>
      jobPostedWithin(j._postedAtIso, filters.posted_within)
    );
  }

  if (filters?.job_type) {
    const type = filters.job_type.toLowerCase();
    result = result.filter((j: any) => j._jobType === type);
  }

  if (filters?.skills?.length) {
    const skills = filters.skills.map((s: string) => s.toLowerCase());
    result = result.filter((j: any) =>
      j._tags.some((tag: string) =>
        skills.some((skill: string) => tag.includes(skill))
      )
    );
  }

  const q = searchQuery?.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (j: any) =>
        j._title.includes(q) ||
        j._company.includes(q) ||
        j._description.includes(q) ||
        j._tags.some((t: string) => t.includes(q))
    );
  }

  self.postMessage(result);
};
