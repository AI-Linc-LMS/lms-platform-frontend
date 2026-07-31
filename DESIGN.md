# DESIGN.md

Design source of truth for the AI Linc learning platform. Written during the auth
surface redesign (`feat/auth-redesign`), scoped so the rest of the product can adopt it
incrementally.

**The memorable thing:** anyone can learn anything from scratch and get somewhere,
on a path that is theirs. The product should feel like a serious instrument for that,
not a course catalogue with a login form in front of it.

---

## 1. The constraint that shapes everything

This is a white-label platform, but **not** in the way the code suggests at first glance.

`lib/theme/normalizeThemeSettings.ts:144` ends with `Object.assign(merged, FIXED_MIDNIGHT_HYPER)`,
which stamps one fixed violet palette over every tenant's stored `theme_settings`. Color
customization is off platform-wide. `/admin/branding` is a redirect stub that says so.

What actually varies per tenant:

| Varies | Fixed for everyone |
|---|---|
| Logo (`resolveClientLogoUrl`) | Every color token |
| Hero image (`login_img_url`) | Type scale, spacing, radius, motion |
| Slogan text + its typography override | Component structure |
| Font family (allowlisted imports) | |

So the design does not need to survive an arbitrary brand hue. It needs to survive an
**arbitrary logo and an arbitrary uploaded image**, which is the failure we can see on
staging today: a small tenant image blown up to 720px wide, pixelated, with dark text
laid over it and no scrim.

**Design rule that follows:** tenant assets are accents inside a composition that is
already good without them. Never let an uploaded asset carry the quality of the screen.

---

## 2. Identity: match the dashboard, do not invent a second one

The student dashboard (`components/dashboard/v2/*`) and `components/common/ModulePageHeader.tsx`
already define the product's visual identity: a dark violet to indigo surface with a warm
pink accent, sitting on a light canvas. The auth screens currently share none of it, so
signing in feels like a different product from the one you land in.

Authoritative values, taken from the shipped dashboard rather than the token file, because
the two disagree (`--primary-500` is `#a855f7`, dashboard violet is `#7c3aed`):

```
ink            #0f172a   headings, primary text on light
ink-muted      #475569   secondary text
ink-faint      #64748b   hints, helper text
canvas         #fbfbfd   page background, never pure white
surface        #ffffff   raised surface on canvas
hairline       #e6e8ef   1px borders, the only separator we use
violet         #7c3aed   THE accent
violet-deep    #5b21b6   pressed / gradient stop on dark surfaces
pink           #ec4899   secondary accent, dark surfaces only
night          #140b2b   dark brand panel base
night-2        #1e1040   dark brand panel gradient stop
```

These live as literal constants in `components/auth/layout/authTokens.ts`, not as new CSS
custom properties. Adding a new `--var` requires registering it in `CAMEL_TO_CSS`,
`DEFAULT_THEME_FLAT`, `ALLOWED_THEME_KEYS` and the Python serializer, or it is silently
dropped. Static constants avoid that whole chain.

**The accent budget is three.** Violet appears as: the primary button, the focus ring, and
links. Nowhere else. No violet borders, no violet backgrounds, no violet icons. If a fourth
use appears, one of the first three was wrong.

---

## 3. What we are deleting, and why

The current auth screen carries five of the most recognisable AI-generated-design signals
of 2026. All five go.

| Deleted | Where it lives now | Why |
|---|---|---|
| Gradient CTA `linear-gradient(135deg, --primary-400, --primary-600)` | copy-pasted 8 times across 4 pages | Its light half fails WCAG AA on white text at 15px. Disabled state measures 2.13:1. |
| 4px colored top strip on the card | `AuthLeftPanel.tsx:38` | The colored edge strip is the single most reliable AI tell. It is decoration wearing the costume of semantic state. |
| The card itself | `AuthLeftPanel.tsx:16-40` | Border plus shadow plus 20px radius doing the job hierarchy should do. Borderless is the 2026 default: whitespace first, lightness shift second, border only if both fail. |
| Glassmorphism variant (`backdrop-filter: blur(12px)`) | `AuthLeftPanel.tsx:42-67` | 2021 Apple cosplay, on every slop checklist. |
| Five blurred floating blobs | `AuthRightPanelDefault.tsx` default branch | The v0/Cursor signature background. |

Replacement principle: **depth comes from a surface ladder and 1px hairlines, never from
drop shadows or gradients.** canvas `#fbfbfd` → surface `#ffffff` → hairline `#e6e8ef`.

---

## 4. Typography

Typeface stays **Satoshi** (`--font-family-primary`, already loaded). It is a good grotesk
with real character in the geometric forms, and switching would break the tenant font
override allowlist for no gain.

**Three weights only: 400, 500, 600. There is no 700 in this system.** Emphasis comes from
size, spacing and color. Bold-as-emphasis is what makes a screen look generic.

Tracking tightens as size grows, which is the single highest-leverage typographic move
available and it costs nothing:

| Role | Size / line-height | Weight | Tracking |
|---|---|---|---|
| Display (brand panel headline) | 44px / 1.06 | 500 | -1.4px |
| Page title ("Welcome back") | 30px / 1.15 | 600 | -0.6px |
| Section | 20px / 1.3 | 600 | -0.3px |
| Body | 15px / 1.5 | 400 | 0 |
| Label (above inputs) | 13px / 1.4 | 500 | 0 |
| Eyebrow / meta | 12px / 1.4 | 500 | +0.4px |

The opposing directions, negative on display and positive on the eyebrow tier, do the
hierarchy work a second typeface would otherwise be hired for.

**Arabic:** never apply `letterSpacing` or `textTransform: uppercase` to translated strings.
Letter-spacing disconnects the cursive joins in Arabic script and uppercase is a no-op.
The eyebrow tier must drop its tracking under `[dir="rtl"]`.

---

## 5. Layout and composition

Two panels on desktop, stacked on mobile. The split is **52 / 48 favouring the form**, not
50/50, so the form column reads as the subject of the page rather than a twin.

**Form side (left, canvas `#fbfbfd`)**

- Single column, `max-width: 400px`, left-aligned internally, optically centered in its
  panel with the content block sitting slightly above true center.
- No card, no border, no shadow. The canvas-to-surface shift and whitespace do the work.
- Vertical rhythm on a 4px base: 8 / 12 / 16 / 24 / 32 / 48.
- Small tenant logo top-left of the form column at 28px tall, so mobile users see the brand
  even when the dark panel is not on screen. This is what fixes the branding loss.

**Brand side (right, dark)**

- Base is a `night → night-2` surface with a soft violet radial at the lower-left, matching
  `ModulePageHeader`'s treatment so auth and the app agree.
- Carries the promise in one display line plus one supporting sentence, both translator-safe.
- Tenant hero image, when `login_img_url` is set, sits **behind** that at low opacity with a
  scrim and `object-fit: cover`, plus a slight blur. A 400px-wide upload can no longer wreck
  the screen, which is the actual failure mode on staging today.
- Tenant logo renders through a plain `<img>`, never `next/image`. Admin-supplied SVGs and
  unoptimizable hosts get silently dropped by the optimizer.

**Mobile**

- The shell must not use `height: 100vh` + `overflow: hidden`. That combination is why the
  brand panel is currently unreachable on phones, and `100vh` also collides with the iOS
  Safari address bar. Use `min-height: 100dvh` and let the page scroll.
- The dark panel becomes a compact 96px header carrying the logo and the product name, with
  the form below it.

---

## 6. Controls

**Inputs**

- Border drawn as `box-shadow: 0 0 0 1px hairline` on a transparent background, not a CSS
  border. Focus replaces the shadow with the ring, so focus causes zero layout shift.
- 44px tall, 8px radius, 16px text on mobile (below 16px, iOS Safari zooms the viewport on
  focus).
- **`minHeight: 44` is not enough.** MUI ships `padding: 16.5px 14px` on
  `.MuiOutlinedInput-input`, which is taller than 44px on its own, so `minHeight` never
  binds and fields render at 54.6px. Set `padding: 11px 14px` on the input explicitly.
  Same trap on buttons: `py: 1.25` makes the content taller than `minHeight`, giving 46.3px.
- **The helper row is always rendered**, with its line box pinned (`minHeight: 17`,
  `fontSize: 12`, `lineHeight: 17px`). Rendering it only on error dropped the submit button
  22.8px at the exact moment a user clicked it. Pinning `minHeight` alone is not enough
  either: an unpinned line box inherits the parent strut and puts 7px of the shift back.
- Persistent visible label above the field. Placeholder is never the label.
- Email, phone and one-time codes are LTR data even inside an RTL page and need explicit
  `dir="ltr"` on their containers.

**Focus ring, the one detail that matters most**

```
box-shadow: 0 0 0 2px #fbfbfd, 0 0 0 4px #7c3aed;
```

The inner canvas-colored buffer ring is the trick: it guarantees separation from whatever
sits behind the control. Currently the entire auth surface defines `focus-visible` exactly
once, on the signup instructor toggle. Every interactive element gets this.

**Buttons**

- Primary: solid `violet`, white text, 8px radius, 44px tall, weight 500. No gradient.
- 8px radius on everything. Pills (`9999px`) are reserved for toggles only. Rejecting the
  pill CTA is most of what separates a 2026 screen from a 2021 one.
- The loading state keeps the verb: "Signing in…", never a bare spinner. `LoadingButton`
  already blocks interaction with `pointerEvents` rather than `disabled`, deliberately, so
  the label stays legible. Keep that.

**Errors**

- Inline and field-anchored, wired with `aria-describedby` plus a live region. Toasts are
  for system failures only, never for "wrong password".
- Never wipe the email when the password is wrong.
- Color alone fails AA. Every error carries text.

---

## 7. Motion

- Entrances 200ms, overlays 300ms, easing `cubic-bezier(.175,.885,.32,1.1)`, entering at
  `scale(0.96)`. Everything else is still.
- Nothing on this screen animates on load except the form column, once, on first paint.
- `prefers-reduced-motion` is already honoured by `SuccessTick` and the 300ms shortened hold
  in `auth-context`. Any new motion must respect it the same way.

---

## 8. Load-bearing logic the redesign must not break

Discovered during the audit. These are not style choices, they are fought-for fixes:

1. **Never put `overflow: hidden` on an ancestor of the Google button.** A clipping plus
   rounded ancestor breaks click hit-testing on the cross-origin GSI iframe: the button
   renders and silently stops responding. `AuthLeftPanel.tsx:23-27`.
2. **Keep the login redirect-hold ordering.** `setHoldAutoRedirect(true)` is raised *before*
   `await login()`, and the redirect effect bails on
   `celebrating || holdAutoRedirect || isRedirecting`. Setting it after the await is always
   too late.
3. **Navigate with `router.replace`, never `window.location.href` or a delayed timeout.**
   The old 500ms pattern caused a second full-document navigation, the white flash and the
   double shimmer.
4. **The celebration tick belongs to `AuthProvider`**, as a sibling of `{children}`, so it
   survives the login page unmounting mid-navigation.
5. **Tenant logos stay plain `<img>`.**
6. **`app/(auth)/loading.tsx` must exist**, or auth routes fall through to the root loader
   and flash the full app chrome at a logged-out visitor.
7. **Keep `OtpDigitInput`'s input semantics** (sequential entry, backspace-borrow,
   paste-fills-all, `autoComplete="one-time-code"` on slot 0 only).
8. **Render correctly in three states:** `clientInfoLoading` skeleton, `FALLBACK_CLIENT_INFO`
   (backend down, no logo), and the hero variant versus the plain variant.

---

## 9. Known defects this redesign fixes

- Mobile shows zero tenant branding, because the shell clips it. `AuthLayoutShell.tsx:14-20`.
- Gradient CTA fails AA; its disabled state measures 2.13:1. All four pages.
- `focus-visible` is defined once across the entire auth surface.
- The password visibility toggle has no accessible name on any of its three instances, and
  misses the 44px touch target.
- Two hardcoded brand gradients that ignore the token system: the `--accent-pink` strip
  (`AuthLeftPanel.tsx:38`) and the orange to pink slogan highlight (`authBrandStyles.ts:12`).
- The signup Google button reads "Sign in with Google" directly above a divider reading
  "Or sign up with email".
- The slogan highlight is keyed on the literal English words `"the"` and `"world"`, so it
  does nothing in Arabic and nothing for any tenant-authored slogan.

## 10. Known defects this redesign does NOT fix

Flagged, out of scope, worth their own branch:

- Arabic is unreachable for a logged-out visitor: no language switcher exists on any auth
  page, and the stored language is never restored on reload (`I18nProvider` is a passthrough).
- RTL is half-wired. `stylis-plugin-rtl` is absent, so MUI physical properties never flip.
- `OtpDigitInput` strips Arabic-Indic digits (`/\D/g` without the `u` flag) while the Arabic
  locale itself uses ٠١٢٣.
- The signup name regex `^[a-zA-Z\s]+$` rejects Arabic names outright.
- All ~25 Yup validation messages are hardcoded English.
