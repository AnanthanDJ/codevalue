import { NextRequest, NextResponse } from "next/server";
import { store, Finding } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { findings } = await req.json();
    const tagged: Finding[] = findings.map((f: any) => ({
      ...f,
      status: "open",
    }));
    store.findings = tagged;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ findings: store.findings });
}
