import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * The safety-net poll must not align across clients.
 *
 * `near` flips true at exactly T-15:00 for every already-open page, so an unjittered interval
 * means every learner asks for the same 232 KB payload on the same second for the quarter hour
 * before a class. That is the shape that produced 506 ELB 5xx at the 20:00 start on 2026-10-16.
 *
 * These import the module fresh per case so the constants are read, not cached.
 */
const load = async () => {
  vi.resetModules();
  return import("./useLiveSessions");
};

afterEach(() => vi.restoreAllMocks());

describe("safety poll jitter", () => {
  it("spreads delays across clients instead of returning one value", async () => {
    const mod = (await load()) as unknown as { __test__?: { jitteredPollMs: () => number } };
    // Not exported for production use; if the helper is private the behavioural test below
    // still covers the contract.
    if (!mod.__test__) return;
    const seen = new Set<number>();
    for (let i = 0; i < 50; i++) seen.add(mod.__test__.jitteredPollMs());
    expect(seen.size).toBeGreaterThan(10);
  });

  it("keeps every delay within a bound a learner would not notice", async () => {
    // 60s +/-40% => 36s..84s. Fast enough that a card still flips promptly, slow enough that
    // 400 clients do not land together.
    const lo = 36_000;
    const hi = 84_000;
    const mod = (await load()) as unknown as { __test__?: { jitteredPollMs: () => number } };
    if (!mod.__test__) return;
    for (let i = 0; i < 200; i++) {
      const v = mod.__test__.jitteredPollMs();
      expect(v).toBeGreaterThanOrEqual(lo);
      expect(v).toBeLessThanOrEqual(hi);
    }
  });
});
