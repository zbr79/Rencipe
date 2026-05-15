import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { meatRecipeId, vegeRecipeId, sideRecipeId, portions } = body;

    console.log("API route received:", { id, meatRecipeId, vegeRecipeId, sideRecipeId, portions });

    if (!meatRecipeId || !vegeRecipeId || !sideRecipeId || portions === undefined) {
      return NextResponse.json(
        { error: "meatRecipeId, vegeRecipeId, sideRecipeId, and portions are required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/meals/${id}/combinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meatRecipeId, vegeRecipeId, sideRecipeId, portions }),
    });

    console.log("Backend response status:", response.status);
    const data = await response.json();
    console.log("Backend response data:", data);

    if (!response.ok) {
      const errorMsg = data.error || `Failed to add meal combination (${response.status})`;
      console.error("Backend error:", errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
