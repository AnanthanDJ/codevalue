import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { fetchRepoFiles } from "@/lib/github";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, orgId } = await req.json();
    const code = await fetchRepoFiles(repoUrl);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `You are a senior software engineer analyzing a codebase for inefficiencies.

Analyze the following code and return EXACTLY 4 findings in this JSON format and nothing else, no markdown, no explanation, just raw JSON:

[
  {
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
${code}`,
        },
      ],
    });

    const text = completion.choices[0].message.content ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const findings = JSON.parse(cleaned);

    const supabase = await createSupabaseServer();

    const rows = findings.map((f: any) => ({
      org_id: orgId,
      title: f.title,
      category: f.category,
      description: f.description,
      estimated_impact: f.estimatedImpact,
      estimated_earnings: f.estimatedEarnings,
      file: f.file,
      difficulty: f.difficulty,
      status: "open",
    }));

    const { error } = await supabase.from("findings").insert(rows);
    if (error) throw error;

    return NextResponse.json({ success: true, count: rows.length });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
