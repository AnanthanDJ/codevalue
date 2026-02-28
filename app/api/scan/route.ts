import { NextRequest, NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { fetchRepoFiles } from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl) {
      return NextResponse.json({ error: "No repo URL provided" }, { status: 400 });
    }

    const code = await fetchRepoFiles(repoUrl);

    const prompt = `
You are a senior software engineer analyzing a codebase for inefficiencies.

Analyze the following code and return EXACTLY 4 findings in this JSON format and nothing else, no markdown, no explanation, just raw JSON:

[
  {
    "id": "1",
    "title": "Short title of the issue",
    "category": "one of: Performance | Automation | Security | Code Quality",
    "description": "2-3 sentence explanation of the problem",
    "estimatedImpact": "Specific measurable impact e.g. reduces API response time by ~40%",
    "estimatedEarnings": "a realistic monthly dollar value between $50 and $400",
    "file": "the file path where this issue exists",
    "difficulty": "one of: Easy | Medium | Hard"
  }
]

Here is the code:
${code}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleaned = text.replace(/```json|```/g, "").trim();
    const findings = JSON.parse(cleaned);

    return NextResponse.json({ findings });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
