# Socratic Escape Room

A mobile-first reasoning game for a House of Commons education event. It works for one player or a team sharing a device, with every round testing a different skill:

1. **Spot** — identify the exact flaw in a deliberately convincing AI claim.
2. **Explain** — build a complete, easy-to-follow chain of reasoning.
3. **Challenge** — answer the strongest part of an AI counterargument.
4. **Defend** — deliver a timed parliamentary-style case and answer the opposition.

Spot, Explain, and Challenge each use one question screen and one response. Defend has one briefing followed by the timed speech. The back button preserves answers and verdicts, and team mode adds short speaking cues without adding hand-off screens.

## Content

The app includes 96 authored questions: two alternatives for every combination of KS2/KS3, six subject areas, and four round types. The browser stores previously used question IDs in local storage and selects unseen cases until the relevant pool is exhausted. Public question data never contains the private answer or marking rubric.

Subjects: Science, Maths & logic, History, Geography, Computing, and Parliament & society. The default room uses a KS3 subject mix.

## AI guide

`app/api/guide/route.ts` uses the server-side `gpt-5.6-luna` model. It receives a question ID and the team's response, retrieves the private reference answer on the server, and returns a strict structured verdict. The prompt accepts equivalent reasoning, rejects vague conclusions and prompt-injection attempts, and gives one focused hint rather than revealing the full answer after a failed attempt.

The browser never receives `OPENAI_API_KEY` or the private answer keys.

Every answer box also includes optional dictation. The browser records only after the player taps the microphone, then sends the completed audio clip to `app/api/transcribe/route.ts`. That server-only route uses OpenAI's `gpt-transcribe` speech-recognition model and returns text to the same editable answer box. The app does not save recordings.

## Interaction feedback

Short CC0 interface sounds from Kenney accompany taps and verdicts, with an always-visible mute control. `web-haptics` provides brief mobile haptics (including its iOS Safari fallback), and `canvas-confetti` marks passed rounds and the final unlock. Confetti automatically respects reduced-motion preferences.

## Run locally

1. Copy `.env.example` to `.env.local` and add `OPENAI_API_KEY`.
2. Run `npm install`.
3. Run `npm run dev`.

Run `npm test` for linting, a production build, and question-bank integrity checks.

## Deploy

The repository is connected to Vercel. Add `OPENAI_API_KEY` to the Vercel project and push `main`; Vercel deploys the update automatically.
