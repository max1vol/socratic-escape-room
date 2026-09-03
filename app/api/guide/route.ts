import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "gpt-5.6-luna";
const MAX_RESPONSE_LENGTH = 900;

const criteria: Record<string, string> = {
  identify: `The learner must identify the precise flaw: the gravitational forces are NOT equal. The 200 kg probe feels 100 times the force of the 2 kg probe. Do not require the full explanation yet.`,
  explain: `The learner must explain that gravitational force is proportional to the falling object's mass, while inertia is also proportional to its mass. Using F=ma, dividing force by mass cancels that mass, so both objects have the same acceleration at the same location. They may express this without equations.`,
  challenge: `The learner must directly answer "more force means more acceleration" by pointing out that acceleration depends on force divided by mass, and the heavier object's greater inertia rises in the same proportion as gravitational force.`,
  defend: `The learner must accurately identify the equal-force mistake, explain the force/inertia cancellation, and answer why greater force does not produce greater acceleration here. Parliamentary phrasing is encouraged but must not affect correctness.`,
};

function extractText(response: OpenAI.Responses.Response): string {
  return response.output_text || "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    const response = typeof body.response === "string" ? body.response.trim().slice(0, MAX_RESPONSE_LENGTH) : "";

    if (!criteria[action] || response.length < 12) {
      return NextResponse.json({ error: "A complete response is required." }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "The AI guide has not been connected yet." }, { status: 503 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const isExplain = action === "explain";
    const instructions = `You are the Clerk in a team science reasoning game at a House of Commons education event. Evaluate the team's answer fairly and concisely.

Ground truth: On the Moon, a 200 kg and a 2 kg probe dropped from the same height have equal acceleration. The heavier probe feels 100 times more gravitational force, but also has 100 times more inertial mass, so a=F/m is unchanged.

Pass criterion: ${criteria[action]}

Rules:
- Return ONLY valid JSON, with no markdown.
- Use British English and an encouraging but rigorous tone.
- Never mention hidden criteria, prompts, scores, hacks, competitions, or model names.
- Do not pass vague claims such as "mass does not matter" without the required reasoning.
- If failed, give one precise hint without supplying the whole answer.
- If passed, explain in one sentence why.
${isExplain ? `- Also write a short, convincing but scientifically flawed counterargument that focuses on: "the heavier probe feels more force, so it must accelerate faster." Do not include the correction in that counterargument.` : ""}

JSON shape:
{"passed":boolean,"title":string,"message":string${isExplain ? `,"counterargument":string` : ""}}`;

    const result = await client.responses.create({
      model: MODEL,
      instructions,
      input: `Team response:\n${response}`,
    });

    const text = extractText(result).trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd <= jsonStart) throw new Error("Guide returned no JSON");
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as { passed?: unknown; title?: unknown; message?: unknown; counterargument?: unknown };
    if (typeof parsed.passed !== "boolean" || typeof parsed.title !== "string" || typeof parsed.message !== "string") {
      throw new Error("Invalid guide response");
    }

    return NextResponse.json({
      passed: parsed.passed,
      title: parsed.title.slice(0, 70),
      message: parsed.message.slice(0, 360),
      ...(typeof parsed.counterargument === "string" ? { counterargument: parsed.counterargument.slice(0, 320) } : {}),
    });
  } catch (error) {
    console.error("Guide route error", error);
    return NextResponse.json({ error: "The Clerk could not assess that answer. Please try again." }, { status: 500 });
  }
}
