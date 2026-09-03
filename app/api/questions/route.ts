import { NextResponse } from "next/server";
import { publicQuestions } from "../../../lib/question-bank";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(publicQuestions(), {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
