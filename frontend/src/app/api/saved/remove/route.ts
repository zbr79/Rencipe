import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "../../../utils/errorMessage";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recipeId } = body;

    if (!userId || !recipeId) {
      return NextResponse.json({ error: "userId and recipeId are required" }, { status: 400 });
    }

    const authorization = request.headers.get("authorization");
    const response = await fetch(`${BACKEND_URL}/saved/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify({ userId, recipeId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return NextResponse.json(
        { error: error?.error || "Failed to remove saved recipe" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("API error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Could not remove saved recipe") }, { status: 500 });
  }
}
