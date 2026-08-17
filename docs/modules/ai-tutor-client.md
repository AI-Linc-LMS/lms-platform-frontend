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
   pc.ontrack        → a single long-lived <audio> element
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
| `components/ai-tutor/shared/surfaces.tsx` | `TutorSurface`, `TutorSectionHeading`, `TutorStat`, `ChipToggle` |
| `components/ai-tutor/dashboard/TopicComposer.tsx` | "What do you want to learn today?" |
| `components/ai-tutor/room/TutorBlob.tsx` | The audio-reactive presence |
| `components/ai-tutor/room/CanvasStage.tsx` | The tutor's stage and its card types |
| `components/ai-tutor/room/TutorDiagram.tsx` | Structured diagrams as on-brand SVG |
| `components/ai-tutor/room/LessonPlanRail.tsx` | The agenda with progress |
| `components/ai-tutor/room/QuizOverlay.tsx` | Mid-lesson check |
| `components/ai-tutor/room/IdePanel.tsx` | Monaco plus the live-commentary loop |

Wiring touched: `components/layout/Sidebar.tsx` (nav item + `learn` section),
`lib/hooks/useCameraRouteGuard.ts` (see below), `locales/{en,ar}/common.json`.

Authentication needs no registration: `proxy.ts` already guards every non-public route.

---

## Three things that will bite whoever changes this next

### 1. `useCameraRouteGuard` will mute the tutor if you forget it

`lib/utils/cameraUtils.ts::stopAllMediaTracks` does not only stop cameras. It walks **every
`<audio>` element** and stops the tracks on its `srcObject` — which is exactly how a remote
WebRTC stream is attached. So a route missing from `ALLOWED_CAMERA_ROUTES` loses the
microphone *and* the tutor's own voice, with the mic permission already granted. To a learner
that reads as "it's broken".

The guard is mounted globally in `app/layout.tsx` and fires on **every pathname change**,
scheduling teardown at +50ms and again at +150ms. Two consequences:

- `/ai-tutor/session` is in the allowlist, with a trailing-segment pattern so sub-routes are
  covered too.
- **The session URL never changes mid-lesson.** The room lives at
  `/ai-tutor/session/new?topic=…` for the whole session rather than being rewritten to the
  real session id, because a `router.replace` would trigger the guard and tear the audio down.
  Session state is in React, never in the router.

### 2. The blob must not go through React state

`TutorBlob` is canvas 2D and reads its amplitude through a `getLevels()` getter ref inside its
own rAF loop. Two `AnalyserNode`s — one on the microphone, one on the remote track — write to
a plain object in `useRealtimeTutor`.

Canvas 2D rather than WebGL deliberately: a shader loop next to a live audio encode is a real
thermal and battery cost on the mid-range Android phones many of these learners use, and the
visual gain over a well-drawn 2D blob is small. Putting an amplitude in React state would
re-render sixty times a second during an encode.

The blob answers to whichever voice is active, which is what makes it read as a conversation
rather than a speaker.

### 3. Audio must start inside the user gesture

iOS Safari refuses to play audio not initiated by a real interaction, and does so silently.
`start()` therefore does all of this in one task: creates the `<audio>` element, appends it,
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
| `response.output_audio_transcript.delta` | Live caption |
| `conversation.item.input_audio_transcription.completed` | Queue a learner turn |
| `response.done` | Tool calls, usage, queue the tutor's turn |
| `response.cancelled` | Barge-in confirmed |

Barge-in is mostly handled server-side by `semantic_vad`. The one thing the client must do is
send `output_audio_buffer.clear` on `speech_started`, to drop audio already buffered locally.
Without it the tutor keeps talking for another beat after being interrupted, which is the
difference between "it listens" and "it talks over me".

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

## The dashboard, and why it is never empty

The requirement was that the page must look filled, including on a first visit. The approach
is not filler but honest fallbacks, and **one composition rather than two pages**.

That last point is a lesson the student dashboard already learned: it used to fork into a
separate railless layout for learners with no courses, and the fork turned out to be redundant
because panels already self-hide. So there is no zero-state variant here.

| Panel | On a first visit |
|---|---|
| Topic composer | Complete. Curated quick-start chips, not personalised ones. |
| Minutes ring | Complete, from the quota call. |
| Pick up where you left off | **Self-hides.** |
| Because of what you're studying | Falls through enrolled courses → weak skills → roadmap next-steps → hides. |
| Browse by track | Always present. 56 seeded topics across 7 tracks, with track filters. |
| Your progress | Always present. Zeros are honest and the strip stays dense. |
| Things you kept | **Self-hides.** |

Everything arrives in one `GET /dashboard/` call. Six round trips would each compete for those
four request slots.

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
