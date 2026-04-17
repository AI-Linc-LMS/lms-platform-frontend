/**
 * Validates `public/jobs/external-jobs-feed.json` is a JSON array (same file the app fetches in dev/prod).
 * Run: node scripts/validate-external-job-json-feed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "public", "jobs", "external-jobs-feed.json");

if (!fs.existsSync(src)) {
  console.error("Missing:", src);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(src, "utf8"));
if (!Array.isArray(data)) {
  console.error("Expected JSON array");
  process.exit(1);
}
console.log("External job JSON feed records:", data.length);
