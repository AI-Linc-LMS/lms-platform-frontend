# Frontend tests

```bash
npm test          # once
npm run test:watch
```

`vitest` + `@testing-library/react`, jsdom environment. Playwright still owns `e2e/` and is a
separate runner (`npm run test:e2e`); vitest deliberately excludes that directory.

## What to test here

This suite exists because of specific defects that reached production, not as an abstract goal.
Each one was cheap to have caught and expensive to find the way we found it:

| what shipped broken | the test that would have caught it |
|---|---|
| 2,187 profiles rendering as an email address or the literal "User" | `lib/utils/user-utils.test.ts` |
| a success animation rendered *underneath* a spinner with a higher z-index | `components/common/SuccessTick.test.tsx` |
| a SAR price about to be rendered with a rupee sign | `lib/utils/money.test.ts` |

The pattern worth continuing: **pure functions and rendering contracts**, not whole pages. A test
that mounts a route and mocks twelve services costs more to maintain than the bug it prevents.

## Two properties, from experience

**Write the test so it fails for the right reason.** Before trusting a new test, break the thing it
guards and watch it fail. Every test in here was verified that way — reintroducing the two real
production bugs fails three of them.

**Don't assert on implementation.** `getByRole("status")` survives a refactor; a class name does
not. The z-index assertion is the deliberate exception: it is a stated contract precisely because
nothing recorded it last time and the tick spent a release invisible.
