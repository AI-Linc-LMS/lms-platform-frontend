/**
 * What the live quiz's difficulty banner says about the NEXT question.
 *
 * The engine serves difficulty on a ladder (backend `adaptive_quiz/irt/ladder.py`): two answers in
 * a row the same way move the level one step - two rights, one level harder; two misses, one
 * easier - measured from the question just answered. The banner used to promise "Answer correctly
 * -> steps up toward Hard · miss one -> eases toward Easy" whatever the engine was doing, including
 * when the quiz had no harder question left to give. It now says what will actually happen.
 */

export const LADDER_LEVELS = ["Easy", "Medium", "Hard"] as const;
export type LadderLevel = (typeof LADDER_LEVELS)[number];

function rank(level: string | null | undefined): number {
  const i = LADDER_LEVELS.indexOf((level ?? "") as LadderLevel);
  return i < 0 ? 1 : i; // the bank treats anything unknown as Medium
}

export type LadderMove = { dir: "up" | "down"; level: LadderLevel };

export type LadderLine =
  /** The learner earned `wanted` for this question, but the quiz has none left at that level, so
   *  it is `served` instead. */
  | { kind: "outOfLevel"; wanted: LadderLevel; served: LadderLevel }
  /** This answer decides a move: one more right (or miss) in the current run moves the level. */
  | { kind: "next"; move: LadderMove }
  /** The standing rule from this level: `n` in a row either way, where there is a level to go to.
   *  `gone` is a neighbouring level the quiz has no questions left at - said instead of promised. */
  | { kind: "rule"; n: number; up: LadderLevel | null; down: LadderLevel | null; gone: LadderLevel[] };

/**
 * @param served      the current question's level (`difficulty_label`)
 * @param wanted      the level the learner had earned for it (`wanted_level`)
 * @param streak      the run so far (`streak`: +k rights / -k misses in a row since the last move)
 * @param n           how long a run moves the level (`streak_to_move`)
 * @param levelsLeft  the levels the bank can still serve after this question (`levels_left`);
 *                    absent = unknown, and every neighbouring level is assumed available
 * @returns null when the server did not send the ladder (it predates it): say nothing, rather
 *          than state a rule the engine serving this question does not follow.
 */
export function ladderLine(
  served: string,
  wanted: string | null | undefined,
  streak: number | null | undefined,
  n: number | null | undefined,
  levelsLeft?: readonly string[] | null,
): LadderLine | null {
  if (!n || n < 1) return null;
  const here = rank(served);
  const earned = wanted ? rank(wanted) : here;
  if (earned !== here) return { kind: "outOfLevel", wanted: LADDER_LEVELS[earned], served: LADDER_LEVELS[here] };

  const left = (level: LadderLevel) => !levelsLeft || levelsLeft.includes(level);
  const above = here < LADDER_LEVELS.length - 1 ? LADDER_LEVELS[here + 1] : null;
  const below = here > 0 ? LADDER_LEVELS[here - 1] : null;
  const up = above && left(above) ? above : null;
  const down = below && left(below) ? below : null;
  const gone = [above, below].filter((l): l is LadderLevel => !!l && !left(l));

  const run = streak ?? 0;
  if (up && run === n - 1 && run > 0) return { kind: "next", move: { dir: "up", level: up } };
  if (down && run === -(n - 1) && run < 0) return { kind: "next", move: { dir: "down", level: down } };
  return { kind: "rule", n, up, down, gone };
}
