# Socratic Escape Room

A mobile-first team science challenge created for a House of Commons education event. Players must spot a deliberately flawed AI claim, explain the correct physics, withstand an AI objection, and deliver a timed parliamentary-style defence.

## Run locally

1. Copy `.env.example` to `.env.local` and add an OpenAI API key.
2. Run `npm install`.
3. Run `npm run dev`.

The browser never receives the API key. All guide requests run through the server route in `app/api/guide/route.ts` using `gpt-5.6-luna`.

## Deploy

Add `OPENAI_API_KEY` to the Vercel project's environment variables, then deploy the repository.
