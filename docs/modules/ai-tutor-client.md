# AI Tutor — client architecture

The browser side of the live voice tutor. Written 2026-08-17 against `app/ai-tutor/`,
`components/ai-tutor/`, `lib/hooks/useRealtimeTutor.ts` and
`lib/services/ai-tutor.service.ts` at initial release.

The backend contract is documented in `ai-linc-backend/docs/modules/ai-tutor.md`. Why this
replaces rather than extends the older voice surface is in
`ai-linc-backend/docs/audits/ai-voice-stack-rca-2026-08-17.md`.

---

## The shape

**The browser talks directly to OpenAI over WebRTC.** Django mints a short-lived credential
and then stays out of the way. That is what makes this feel immediate instead of like the
mock interviewer, where every turn was a serial chain of blocking HTTP calls.

```
1. POST /ai-tutor/api/sessions/       → { session, client_secret, question_pool, quota }
2. new RTCPeerConnection()
   pc.ontrack        → a single DETACHED Audio() element (see trap 1)
   getUserMedia      → pc.addTrack
   createDataChannel("oai-events")
3. POST https://api.openai.com/v1/realtime/calls
     Content-Type: application/sdp
     Authorization: Bearer <client_secret>
     body: offer.sdp
   ← SDP answer, plus a `Location: /v1/realtime/calls/rtc_xxx` header
4. POST /ai-tutor/api/sessions/<id>/connected/   { call_id }
5. events flow over the data channel; batches flow to Django every ~60s
```

Step 4 matters more than it looks. That call id is what lets the server hang the session up
out of band. Without it an overrunning session can only be marked dead in the database.

---

## Files

| Path | Role |
|---|---|
| `app/ai-tutor/page.tsx` | Dashboard |
| `app/ai-tutor/session/[id]/page.tsx` | The live room |
| `app/ai-tutor/session/[id]/recap/page.tsx` | Recap |
| `lib/hooks/useRealtimeTutor.ts` | The transport. Owns the connection end to end. |
| `lib/services/ai-tutor.service.ts` | REST client and types |
| `components/ai-tutor/shared/surfaces.tsx` | `TutorSurface`, `TutorTintSurface`, `TutorSectionHeading`, `TutorStat`, `ChipToggle` |
| `components/ai-tutor/dashboard/TopicComposer.tsx` | "What do you want to learn today?", with a rotating placeholder |
| `components/ai-tutor/dashboard/MinutesPanel.tsx` | Quota ring, first in the rail |
| `components/ai-tutor/dashboard/CapabilityPanel.tsx` | "Things you can say". Never hides. |
| `components/ai-tutor/dashboard/ProgressPanel.tsx` | Lifetime totals as rail rows |
| `components/ai-tutor/dashboard/NotesPanel.tsx` | Kept flashcards, grouped by topic, answers hidden |
| `components/ai-tutor/recap/RecapFlashcards.tsx` | The lesson's cards as a self-graded deck |
| `components/ai-tutor/recap/RecapArtifacts.tsx` | Canvas cards as a filmstrip |
| `components/ai-tutor/recap/RecapTranscript.tsx` | Collapsed, searchable transcript |
| `components/ai-tutor/room/roomTokens.ts` | The room's dark palette, in one place |
| `components/ai-tutor/room/ConversationPanel.tsx` | Read back what was said, mid-lesson |
| `components/ai-tutor/room/Strands.tsx` | React Bits' Strands (WebGL via `ogl`), vendored |
| `components/ai-tutor/room/TutorVoice.tsx` | The audio-reactive presence: Strands driven by whoever is talking |
| `components/ai-tutor/room/CanvasStage.tsx` | The tutor's stage and its card types |
| `components/ai-tutor/room/TutorDiagram.tsx` | Structured diagrams as on-brand SVG |
| `components/ai-tutor/room/LessonPlanRail.tsx` | The agenda with progress |
| `components/ai-tutor/room/QuizOverlay.tsx` | Mid-lesson check |
| `components/ai-tutor/room/IdePanel.tsx` | Monaco plus the live-commentary loop |

`components/layout/MainLayout.tsx` gained a `hideAppBar` prop for the room. The global app bar
is white and was rendering as a bright strip across the top of a black full-bleed page; the room
supplies its own header with a back button and a timer, so the bar was contributing the visual
break and nothing else. Use it only where the page still gives the learner a way out — while it
is hidden, notifications, streak and profile are unreachable.

Wiring touched: `components/layout/Sidebar.tsx` (nav item + `learn` section),
`lib/hooks/useCameraRouteGuard.ts` (see below), `locales/{en,ar}/common.json`, and
`lib/setup/featureCatalogue.ts` — which gains an `ai_voice_tutor` entry so a tenant admin can
actually enable it in the setup wizard. The pre-existing `ai_tutor` entry was relabelled
"AI tutor (text)" to make the distinction visible, since it describes the older chat box.

Authentication needs no registration: `proxy.ts` already guards every non-public route.

---

## Three things that will bite whoever changes this next

### 0. Tool calls dispatch on `function_call_arguments.done`, not `response.done`

`response.done` arrives only after the whole turn finishes. Dispatching from it means a
diagram the tutor requested mid-sentence lands on the canvas seconds *after* it stopped
describing it, which is exactly the dead-air problem this architecture exists to avoid.

So: `conversation.item.added` populates a `call_id → name` map (the arguments-done event
carries the id and arguments but not reliably the name), dispatch happens on
`response.function_call_arguments.done`, and `response.done` remains only as a
dedupe-by-`call_id` backstop for a dropped event.

Related: **`response.output_audio.delta` does not fire on WebRTC.** The tutor's audio
travels as RTP on the media track, so the authoritative "it is making sound" signals are
`output_audio_buffer.started` / `.stopped` / `.cleared`. The transcript delta is a secondary
trigger for the case where audio begins before any text arrives.

### 1. `useCameraRouteGuard` will mute the tutor if you forget it

`lib/utils/cameraUtils.ts::stopAllMediaTracks` does not only stop cameras. It walks **every
`<audio>` element** and stops the tracks on its `srcObject` — which is exactly how a remote
WebRTC stream is attached. So a route missing from `ALLOWED_CAMERA_ROUTES` loses the
microphone *and* the tutor's own voice, with the mic permission already granted. To a learner
that reads as "it's broken".

The guard is mounted globally in `app/layout.tsx` and fires on **every pathname change**,
scheduling teardown at +50ms and again at +150ms. Three consequences:

- The remote audio element is **detached** — created with `new Audio()` and never appended.
  `querySelectorAll` cannot see it, and `play()` works fine on a detached element. This is
  the primary defence; the allowlist is the secondary one.
- `/ai-tutor/session` is in the allowlist anyway, with a trailing-segment pattern so
  sub-routes are covered, so the intent is documented and a future refactor that re-attaches
  the element does not silently break voice.
- **The session URL never changes mid-lesson.** The room lives at
  `/ai-tutor/session/new?topic=…` for the whole session rather than being rewritten to the
  real session id, because a `router.replace` would trigger the guard and tear the audio down.
  Session state is in React, never in the router.

### 2. `fitSingleRibbon` is not optional on Strands

The shader's taper envelope is `pow(cos(uv.x * PI * 1.3), taper)`, and `uv.x` spans
`±aspect/2` before `uScale` divides it. In a roughly square box that cosine fades once and you
get one ribbon. In a wide banner it oscillates, the envelope **tiles**, and the effect renders
as a row of repeating lens shapes — which reads as a rendering bug, not a design. The vendored
copy adds `fitSingleRibbon`, which computes `uScale` from the aspect ratio on every resize.

It is worth knowing why the constant is what it is. The first version floored `uScale` at
`1.32 * aspect`, i.e. exactly `1 / (2 * 0.3846)` where `0.3846` is the envelope's zero
crossing. That removed the tiling but put the zero crossing marginally *outside* the viewport,
so the ribbon still carried luminance where it met the left and right edges and read as a beam
that had been cropped. It is now `(aspect * RIBBON_FILL) / (2 * TAPER_ZERO)` with
`RIBBON_FILL = 0.82`, which leaves the taper room to actually reach zero inside the frame. It
is also an absolute rather than a floor: `Math.max` against the caller's `scale` re-introduced
the crop in any container narrower than about 4:3.

The palettes in `TutorVoice.tsx` each lead with a near-white and fall through lavender to a
cooler indigo or cyan. A single-hue palette renders flat no matter how much glow is applied,
because the shader distributes a palette *along* the strand (`uv.x * 0.30` plus a per-strand
offset) — more entries is more visible colour, not a different colour.

### 3. The voice visual must not go through React state

The tutor's presence is **React Bits' `Strands`** (WebGL, via the already-present `ogl`),
vendored at `components/ai-tutor/room/Strands.tsx` and driven by
`components/ai-tutor/room/TutorVoice.tsx`.

Upstream reads its props through a ref reassigned on every render, so animating a prop means
re-rendering at frame rate. That is unusable here: this sits beside a live WebRTC encode and a
Monaco instance. The vendored copy therefore adds a **`liveRef`** prop that its internal rAF
loop reads directly, so audio-driven values never touch React. `TutorVoice` renders when the
*phase* changes — five or six times a minute — and not once in between.

Two other changes from upstream, both noted in the file: a `ResizeObserver` alongside the
window listener (the transport bar and the IDE panel resize this element without the window
changing), and a `paused` prop that holds a still frame for `prefers-reduced-motion` rather
than unmounting, so resuming is instant.

`TutorVoice` maps phase to a look: violet while the tutor talks, **pink while the learner
does**, fast low-amplitude churn for thinking, desaturated grey when the session ends. Riding
both audio levels is what makes the screen read as a conversation rather than a speaker with a
visualiser attached. Smoothing is asymmetric — snap up on an onset so a syllable lands, ease
down so it does not flicker between words.

### 4. Audio must start inside the user gesture

iOS Safari refuses to play audio not initiated by a real interaction, and does so silently.
`start()` therefore does all of this in one task: creates the detached `Audio()` element,
calls `getUserMedia`, and calls `play()` on the remote element in `ontrack`. Splitting any of
it across an await boundary that yields to the user loses the gesture and produces the
"permission granted but silent" failure the older stack fought for months.

---

## `useRealtimeTutor`

```
idle → starting → connecting → listening ⇄ student-speaking ⇄ thinking ⇄ speaking
                      ↓                              ↓
                   failed                      ending → ended
```

`phase` drives the blob, the status label and the caption. Everything that changes at audio
rate is a ref.

### Events consumed

| Event | Effect |
|---|---|
| `session.created` | Arm the UI |
| `input_audio_buffer.speech_started` | Phase → student-speaking, **send `output_audio_buffer.clear`** |
| `input_audio_buffer.speech_stopped` | Phase → thinking |
| `output_audio_buffer.started` | Phase → speaking (the authoritative signal on WebRTC) |
| `output_audio_buffer.stopped` / `.cleared` | Phase → listening |
| `response.output_audio_transcript.delta` | Live caption, and a secondary speaking trigger |
| `conversation.item.input_audio_transcription.completed` | Queue a learner turn |
| `conversation.item.added` | Record `call_id → tool name` |
| `response.function_call_arguments.done` | **Dispatch the tool** |
| `response.done` | Usage, queue the tutor's turn, dedupe backstop for tool calls |
| `response.cancelled` | Barge-in confirmed |

Barge-in is mostly handled server-side by `semantic_vad`. The one thing the client must do is
send `output_audio_buffer.clear` on `speech_started`, to drop audio already buffered locally.
Without it the tutor keeps talking for another beat after being interrupted, which is the
difference between "it listens" and "it talks over me".

### The response gate

`response.create` on a conversation that already has a response in flight is rejected with
*"Conversation already has an active response in progress"*, and because that arrives as a plain
`error` event it surfaced to the learner as a banner mid-lesson. It happened constantly for an
honest reason: a tool result and a quiz grade both want to make the tutor say something, and the
tutor is very often still talking.

So nothing sends `response.create` directly. `requestResponse()` sends it only when
`responseActiveRef` is false and otherwise sets a one-deep queue that `releaseResponseGate()`
drains on `response.done` / `response.cancelled`. One deep on purpose: three tool results
arriving during one long answer should produce one reaction, not three consecutive monologues.

Two details that matter. The gate is set optimistically *before* sending, or two results landing
in the same tick both see `false` and both send. And the `error` handler re-queues on an
"active response" message rather than surfacing it, because OpenAI can start a response we were
never told about, which leaves the gate stale no matter how careful the local bookkeeping is.
The gate is also cleared in `teardownTransport`, since a stuck `true` across a reconnect would
mean the tutor never spoke again after one.

### Tool dispatch

Client-resolved tools return in the same tick, so the tutor keeps talking through them:
`show_slide`, `show_code`, `show_diagram`, `highlight`, `clear_canvas`, `update_lesson_plan`,
`open_ide`, `read_student_code`, `request_code_run`, `show_quiz`.

Backend tools await `apiClient`: `show_image`, `save_note`. Both return an honest negative
(`{ok: false, reason}`) rather than throwing, so the model can say something sensible instead
of apologising.

Results go back as `conversation.item.create` with a `function_call_output`, followed by
`response.create`.

### Why `request_code_run` is not a backend tool

Judge0 is called synchronously with a long read timeout, and the platform serves every request
from four gunicorn slots. A model-triggered run in the tool path would mean up to thirty
seconds of silence *and* a quarter of the platform's request capacity held open. So the tool
returns instantly, the browser runs the code on its own timeline, and the output is injected
back with `tellTutor`.

### Why `show_quiz` is not a backend tool

The pool is pre-warmed at session start and carries **no answer key**. Grading is a separate
POST keyed on the question id. If the tool round-tripped, the correct answer would sit in the
network tab before the learner answered.

---

## The live-coding loop

`IdePanel` pushes the editor buffer only when all three hold:

1. Watch mode is on (a visible toggle, because some people want to think in silence).
2. The learner has paused for `IDLE_PUSH_MS` (2500ms).
3. The buffer changed by at least `MIN_CHANGE_CHARS` (12) since the last push.

A tutor that talks over your typing is more irritating than one that waits, and pushing every
keystroke would also be expensive. `read_student_code` lets the model pull the buffer on
demand instead, which covers the case where it wants to look without being told.

---

## The room is dark; the rest of the module is light

The session room is the only dark surface in the learner app, and it is dark for a reason
rather than for style. The room is not a page of content, it is a place you talk to something:
the dark ground lets the ribbon carry real luminance (violet and cyan at full saturation are
garish on the light canvas, which is why `DESIGN.md` restricts them to brand surfaces), and it
removes competing elements so attention lands on the voice and on whatever it just put up.

Consequences worth knowing:

- Every surface in the room imports from `room/roomTokens.ts` rather than using
  `--font-secondary` / `--border-default` / `--card-bg`. Those tokens only have light values in
  this app. The coding panel is the cautionary tale: it was styled with them and rendered a
  white header strip across the top of a black screen.
- The ribbon **owns the stage** until the first canvas card arrives, then animates down to a
  band so the material gets the space. Captions scale with it, because while the stage is empty
  the captions *are* the content.
- The quiz modal is dark too. It was light on the theory that it sits *above* the room rather
  than inside it, which turned out to read as a different application opening on top of the
  lesson. It also echoes the tutor's live caption under the verdict, because otherwise the
  learner is being spoken to while looking at a modal that shows no sign of having heard them.
- The side dock holds **one** panel: the editor or the conversation, never both. Two 470px
  panels plus the canvas does not fit on a laptop, and letting them toggle independently meant
  closing the editor could reveal a conversation panel the learner had forgotten was open.
- The transport bar reserves right-hand padding for the fixed support FAB, which otherwise sits
  on top of "End session".
- **Strands appears only here.** It was briefly on the dashboard composer and was removed: the
  ribbon is the tutor's voice, so decoration that looks like a live readout while nothing is
  talking is worse than no decoration.

## The dashboard, and why it is never empty

The requirement was that the page must look filled, including on a first visit. The approach
is not filler but honest fallbacks, and **one composition rather than two pages**.

That last point is a lesson the student dashboard already learned: it used to fork into a
separate railless layout for learners with no courses, and the fork turned out to be redundant
because panels already self-hide. So there is no zero-state variant here.

The layout is the student dashboard's: content column plus a fixed 360px right rail
(`minmax(0, 1fr) 360px`, matching `components/dashboard/v2/DashboardV2.tsx`). The first version
was a single full-width column of neutral cards, which meant the module's colour stopped at the
bottom of the header and everything below it was white on white. The rail carries
`TutorTintSurface` panels instead, tinted toward the **same** violet the header uses rather
than introducing a second hue.

`TutorTintSurface` has three tints: `violet` and `indigo` are washes that keep text on the
normal contrast ladder, and `deep` is the header's own gradient and therefore requires white
text. Use it for the rail and for a page's single call to action, never for a list — six tinted
cards in a row is not colour, it is noise.

| Panel | Column | On a first visit |
|---|---|---|
| Topic composer | Header | Complete. Curated quick-start chips, rotating placeholder. |
| Pick up where you left off | Content | **Self-hides.** |
| Because of what you're studying | Content | Falls through enrolled courses → weak skills → roadmap next-steps → hides. |
| Browse by track | Content | Always present. 56 seeded topics across 7 tracks, with track filters. |
| "You have not had a lesson yet" | Content | **Only** on a first visit, so the column has a floor once everything above it hides. |
| Minutes ring | Rail | Complete, from the quota call. Shows "Unlimited" for staff, who bypass the reservation. |
| Things you can say | Rail | **Always present, never hides.** This is what keeps the rail full for an account with no history. |
| Your progress | Rail | Always present. Zeros are honest. |
| Things you kept | Rail | **Self-hides.** |

Everything arrives in one `GET /dashboard/` call. Six round trips would each compete for those
four request slots.

---

## The recap page

A voice lesson has no scrollback, so this page is the artifact. The order is the order somebody
actually wants after a lesson ends: how it went, what to test yourself on, what was on screen,
the quiz results, and only then the raw transcript.

The first version inverted that. The transcript rendered open and unbounded in a 420px scroll
box and was by a wide margin the tallest thing on the page; the flashcards the session had just
generated were not shown at all (the endpoint did not return them, and now does, as `notes`);
the artifacts were returned and thrown away; the concepts grid was a fixed three columns, so
four concepts left a conspicuous hole; and there was no navigation back to the module.

Two things worth keeping:

- `RecapFlashcards` is a **deck**, not a list. It shows one card at a time, hides the answer
  until asked, and is self-graded — there is no way to auto-grade a spoken-concept answer, and a
  fake grader is worse than an honest one. `NotesPanel` on the dashboard is the browsing view of
  the same data and is deliberately a different component.
- `RecapTranscript` opens **closed**, behind a turn count, with a filter. The most common reason
  to open a transcript is to find one specific thing that was said.

---

## Reading the conversation mid-lesson

`useRealtimeTutor` keeps a `transcript` array in React state, separate from
`pendingTurnsRef`. They look redundant and are not: `pendingTurnsRef` is a write-behind queue
that is spliced empty on every flush, so it can never be shown to anybody.

Turns are committed to `transcript` when they complete — the learner's on
`input_audio_transcription.completed`, the tutor's on `response.done`. The tutor's in-flight
sentence is passed separately as `liveCaption` and rendered as a pending turn, because streaming
it into the list would duplicate the caption and make the panel jitter for the whole lesson.
Capped at 200 turns; anything older lives in the recap.

---

## Diagrams

Mermaid is **not** a dependency and was not added. It costs a large lazy chunk and its default
visual language fights a fixed violet system that forbids drop shadows and caps type weight at
600.

Instead the model emits a structured spec — `kind` plus `nodes` and `edges` — and
`TutorDiagram` renders it as our own SVG. Five kinds (`flow`, `layers`, `compare`, `timeline`,
`tree`) cover the large majority of what a tutor actually draws, they render instantly, and
the model cannot emit something unrenderable.

---

## Design-system compliance

Per `DESIGN.md`:

- **Weights 400/500/600 only.** No 700+ on any new surface.
- **No drop shadows.** Depth from the surface ladder and 1px hairlines; hover moves the
  border rather than lifting.
- **8px radius**, pills reserved for toggles (the level and duration chips, the track filters,
  the watch-mode switch).
- **Focus ring** `0 0 0 2px var(--canvas), 0 0 0 4px var(--ai-violet)` on every interactive
  element.
- **The accent budget is three.** This was the rule most at risk here: the blob, the canvas
  and the quiz all want to be the accent. Only the blob and the primary action carry violet;
  every panel stays on the neutral ladder, which is what makes the one live thing on the page
  read as live.
- Existing tokens reused: `--ai-violet`, `--ai-pink`, `--canvas`, `--radius-card`,
  `--font-mono`.

`prefers-reduced-motion` collapses the blob's animation to a near-static state rather than
disabling the canvas.

---

## Known limitations

1. **`run_code` needs the `adaptive_quiz` feature.** It calls the existing throttled
   `POST /adaptive-quiz/api/run-snippet/`. A tenant with AI Tutor but not adaptive courses
   gets a graceful "could not run that". The fix is a dedicated backend run endpoint.
2. **Restrictive networks.** OpenAI's SDP answer offers only host candidates on port 3478 with
   no TURN relay, so a network permitting only 80/443 outbound will fail. The room surfaces
   this as an explicit "some networks block voice calls" state with a suggestion to try a
   hotspot, rather than an indefinite spinner. A pre-flight connectivity check before the mic
   prompt is the obvious next step.
3. **The `Location` header depends on CORS exposure.** If OpenAI stops exposing it to browser
   JS, `call_id` arrives empty and the server loses its hangup ability. The session still
   works; the fallback is the session id from `session.created`.
4. **No device-check screen yet.** The mock interview has one
   (`app/mock-interview/[id]/device-check/page.tsx`) and it is the right pattern to copy for
   both the mic test and the connectivity pre-flight.
