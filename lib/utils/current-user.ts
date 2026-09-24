import Cookies from "js-cookie";

/**
 * The `user_id` claim from the access token, or null when signed out.
 *
 * It is the one place in the app that answers "which learner is this?" without a React context.
 * Any PER-VIEWER key written to browser storage needs it - a collapsed panel, a remembered tab -
 * and a second copy of the decode would be a second thing to get wrong.
 *
 * It exists because of a real incident: a browser-storage key scoped to the TENANT alone was
 * shared by every account that ever signed in on that browser, and one learner's details were
 * shown to the next. Learner data no longer goes into browser storage at all (see
 * `profile-cache.ts`), but the UI conveniences that legitimately remain there still have to be
 * told apart per person.
 */
export function currentUserId(): string | null {
  try {
    const token = Cookies.get("access_token");
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      ),
    );
    const id = json.user_id ?? json.userId ?? json.sub ?? null;
    return id === null || id === undefined ? null : String(id);
  } catch {
    return null;
  }
}
