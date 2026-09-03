import OpenAI, { toFile } from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "gpt-transcribe";
const MAX_AUDIO_BYTES = 4_000_000;
const MAX_TRANSCRIPT_LENGTH = 1_600;

function fileExtension(type: string) {
  if (type.includes("mp4")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  return "webm";
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      return NextResponse.json({ error: "An audio recording is required." }, { status: 415 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "An audio recording is required." }, { status: 400 });
    }
    if (!audio.type.startsWith("audio/")) {
      return NextResponse.json({ error: "That recording format is not supported." }, { status: 415 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "That recording is too long. Try a shorter answer." }, { status: 413 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Dictation has not been connected yet." }, { status: 503 });
    }

    const bytes = new Uint8Array(await audio.arrayBuffer());
    const upload = await toFile(bytes, `answer.${fileExtension(audio.type)}`, { type: audio.type });
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await client.audio.transcriptions.create({
      file: upload,
      model: MODEL,
      language: "en",
      prompt: "A concise educational reasoning answer in British English. Preserve scientific, mathematical, historical, geographical, computing, and parliamentary terms accurately.",
    });
    const text = transcription.text.trim().slice(0, MAX_TRANSCRIPT_LENGTH);

    if (!text) {
      return NextResponse.json({ error: "No speech was detected. Please try again." }, { status: 422 });
    }

    return NextResponse.json(
      { text },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Transcription route error", error);
    return NextResponse.json({ error: "That recording could not be transcribed. Please try again." }, { status: 500 });
  }
}
