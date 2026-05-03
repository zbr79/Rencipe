import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recipeId } = body;

    if (!userId || !recipeId) {
      return NextResponse.json({ error: "userId and recipeId are required" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/favorites/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, recipeId }),
    });

    if (!response.ok) {
      throw new Error("Failed to remove favorite");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
