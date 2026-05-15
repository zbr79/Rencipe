import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mealId } = body;

    if (!userId || !mealId) {
      return NextResponse.json({ error: "userId and mealId are required" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/saved/meals/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, mealId }),
    });

    if (!response.ok) {
      throw new Error("Failed to save meal");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}