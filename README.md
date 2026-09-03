# Socratic Escape Room

A mobile-first shared-device reasoning game for a House of Commons education event. Teams tackle four different cases, with every round testing a different skill:

1. **Spot** — vote privately, then identify a deliberately flawed AI claim.
2. **Explain** — build a correct answer as a spoken reasoning relay.
3. **Challenge** — withstand an AI counterargument in a team huddle.
4. **Defend** — assign parliamentary roles and deliver a timed defence with an interruption.

## Content

The app includes 96 authored questions: two alternatives for every combination of KS2/KS3, six subject areas, and four round types. The browser stores previously used question IDs in local storage and selects unseen cases until the relevant pool is exhausted. Public question data never contains the private answer or marking rubric.

Subjects: Science, Maths & logic, History, Geography, Computing, and Parliament & society. The default room uses a KS3 subject mix.

## AI guide

`app/api/guide/route.ts` uses the server-side `gpt-5.6-luna` model. It receives a question ID and the team's response, retrieves the private reference answer on the server, and returns a strict structured verdict. The prompt accepts equivalent reasoning, rejects vague conclusions and prompt-injection attempts, and gives one focused hint rather than revealing the full answer after a failed attempt.

The browser never receives `OPENAI_API_KEY` or the private answer keys.

## Run locally

1. Copy `.env.example` to `.env.local` and add `OPENAI_API_KEY`.
2. Run `npm install`.
3. Run `npm run dev`.

Run `npm test` for linting, a production build, and question-bank integrity checks.

## Deploy

The repository is connected to Vercel. Add `OPENAI_API_KEY` to the Vercel project and push `main`; Vercel deploys the update automatically.
