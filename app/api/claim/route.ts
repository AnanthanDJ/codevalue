import { NextRequest, NextResponse } from "next/server";
import { store, Finding } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { findingId, engineerId } = await req.json();

    if (!findingId || !engineerId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const engineer = store.engineers[engineerId];
    if (!engineer) {
      return NextResponse.json({ error: "Engineer not found" }, { status: 404 });
    }

    const finding = store.findings.find((f) => f.id === findingId);
    if (!finding) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    if (finding.status !== "open") {
      return NextResponse.json({ error: "Finding already claimed" }, { status: 409 });
    }

    finding.status = "claimed";
    finding.claimedBy = engineerId;
    engineer.claimed.push(finding);

    return NextResponse.json({ success: true, finding, engineer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
