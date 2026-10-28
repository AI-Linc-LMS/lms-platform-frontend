/** The fields the join decision reads. `StudentLiveSession` and the shared card's data both satisfy it. */
export interface JoinLinkFields {
  is_google_meet?: boolean;
  join_link?: string | null;
  zoom_join_url?: string | null;
  my_join_link?: string | null;
}

/**
 * The link THIS student opens for a session, decided in one place.
 *
 * The personal link first, the shared one otherwise. The backend issues a personal link only
 * for sessions whose roster it registered with Zoom under the addresses this platform knows,
 * and that link is what makes attendance match on the address rather than on whatever display
 * name the student typed into Zoom. Opening the shared link instead still works - Zoom shows a
 * registration form - but the student has to type an address, and attendance then depends on
 * what they typed.
 *
 * The learner page's hero button and its calendar exports each had their own copy of this
 * decision and neither knew about the personal link, so a student who clicked "Join now" from
 * the hero got the shared link while the card below it offered the personal one.
 *
 * A student without a personal link must still get into their own class: null, undefined and
 * blank all fall through to the shared link. Being locked out is a far worse failure than being
 * matched on a display name.
 */
export function learnerJoinUrl(s: JoinLinkFields): string {
  if (s.is_google_meet) return s.join_link?.trim() || "";
  return s.my_join_link?.trim() || s.zoom_join_url?.trim() || s.join_link?.trim() || "";
}
