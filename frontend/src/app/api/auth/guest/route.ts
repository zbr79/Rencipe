import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function POST() {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Guest API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
