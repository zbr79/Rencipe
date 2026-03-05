import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/meal-plans?userId=${userId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch meal plans from backend");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, numberOfPeople, numberOfDays, mealTypes, name } = body;

    if (!userId || numberOfPeople === undefined || numberOfDays === undefined || !mealTypes) {
      return NextResponse.json(
        { error: "userId, numberOfPeople, numberOfDays, and mealTypes are required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/meal-plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, numberOfPeople, numberOfDays, mealTypes, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create meal plan");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
