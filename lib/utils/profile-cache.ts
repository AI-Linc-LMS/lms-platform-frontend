import { config } from "@/lib/config";
import { currentUserId } from "@/lib/utils/current-user";

/**
 * What is left of the local profile cache: the means to GET RID of it.
 *
 * The line this file now draws
 * ----------------------------
 * **Learner data** - anything a learner typed that belongs to their record: name, phone, date of
 * birth, bio, experience, education, a resume's section arrangement - lives on the server and
 * nowhere else. A **per-viewer UI convenience** - a collapsed panel, a remembered tab - may live
 * in browser storage, because losing it costs nothing and it is not anybody's record.
 *
 * Why the cache is gone
 * ---------------------
 * The profile page used to write the learner's edits to `localStorage` BEFORE it tried the
 * server, and merge that copy back over the API profile on the next load. When the save failed
 * the learner was told "Profile saved locally", as an *info* toast, and the merge made the data
 * keep looking saved for as long as they stayed in that browser. The server never had it. Open
 * the app on a phone, or clear site data, and the work was simply gone - and nothing had ever
 * said so.
 *
 * Why it existed at all
 * ---------------------
 * It was keyed by tenant alone (`user_profile_extra_<clientId>`), which meant one browser had
 * one profile cache shared by every account that signed in on it: a new account saw the previous
 * person's name, phone and date of birth merged into its empty fields, the community page built
 * post authors from the same blob, and pressing Save wrote that data to the new account for real.
 * The fix at the time was to key it per user and clear it on logout. Not writing learner data to
 * the browser at all is the same defence, taken to its conclusion.
 *
 * What is still here
 * ------------------
 * Blobs written by earlier builds are still sitting on learners' devices, and some of them hold
 * edits that never reached the server. They are NEVER merged into a profile - that is the
 * incident above - but they are not thrown away silently either: the profile page reads one,
 * shows the learner what is in it, and offers to save it or discard it. Both answers end with
 * the key removed.
 */

const PREFIX = "user_profile_extra";

/** Every key an earlier build could have written a learner's own data to. */
const LEGACY_LEARNER_DATA_KEYS = [
  // The resume builder's draft, written by a build before the resume was a server document.
  "resumeData",
];
const LEGACY_LEARNER_DATA_PREFIXES = [
  PREFIX,
  // A resume's section arrangement, keyed by TENANT - so it was shared by every learner on a
  // browser, the very bug the profile cache was re-keyed to fix. It lives on ResumeDocument.layout.
  "resume_layout_v1_",
];

/** Null when we cannot identify the learner - in which case nothing is read or removed. */
function strandedKey(): string | null {
  const uid = currentUserId();
  return uid ? `${PREFIX}_${config.clientId}_u${uid}` : null;
}

/**
 * The stranded edits of the signed-in learner, if any: data an earlier build wrote here and
 * never got onto the server.
 *
 * Only ever OFFERED to the learner, never merged. Returns null when there is nothing, when we
 * cannot tell who is signed in, or when storage is unavailable.
 */
export function readStrandedProfile<T extends object>(): Partial<T> | null {
  if (typeof window === "undefined") return null;
  const key = strandedKey();
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<T>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return Object.keys(parsed).length ? parsed : null;
  } catch {
    return null;
  }
}

/** Forget the signed-in learner's stranded edits. Called once they have answered for them. */
export function discardStrandedProfile(): void {
  if (typeof window === "undefined") return;
  try {
    const key = strandedKey();
    if (key) localStorage.removeItem(key);
  } catch {
    // storage unavailable
  }
}

/**
 * Called on logout. Sweeps every key any build ever wrote learner data to, for every account,
 * because logging out on a shared machine must not leave someone's details recoverable.
 */
export function purgeLearnerStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_LEARNER_DATA_KEYS) localStorage.removeItem(key);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && LEGACY_LEARNER_DATA_PREFIXES.some((p) => k.startsWith(p))) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // storage unavailable
  }
}
