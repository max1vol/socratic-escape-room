import { readFile } from "node:fs/promises";

const body = await readFile(".next/server/app/api/questions.body", "utf8");
const questions = JSON.parse(body);
const groups = new Map();

for (const question of questions) {
  const key = [question.level, question.subject, question.round].join(":");
  groups.set(key, (groups.get(key) || 0) + 1);
}

const checks = {
  total: questions.length === 96,
  uniqueIds: new Set(questions.map((question) => question.id)).size === 96,
  everyCombination: groups.size === 48 && [...groups.values()].every((count) => count === 2),
  noPrivateAnswers: questions.every((question) => !("answer" in question) && !("criteria" in question)),
};

for (const [name, passed] of Object.entries(checks)) {
  if (!passed) throw new Error(`Question-bank check failed: ${name}`);
}

console.log("Question bank: 96 unique public cases, two per subject/level/round; answer keys remain private.");
