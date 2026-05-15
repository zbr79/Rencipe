import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/weekly-plans?userId=${userId}`);

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error fetching scheduled plans:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => null);
    return NextResponse.json({ error: "Plans are currently disabled" }, { status: 410 });
  } catch (err: any) {
    console.error("Error creating scheduled plan:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
