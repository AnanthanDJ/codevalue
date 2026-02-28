import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const engineer = store.engineers[id];
  if (!engineer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ engineer });
}
