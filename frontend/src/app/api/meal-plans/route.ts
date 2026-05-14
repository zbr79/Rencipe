import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const trash = searchParams.get("trash");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const backendUrl = new URL(`${BACKEND_URL}/meal-plans`);
    backendUrl.searchParams.set("userId", userId);
    if (trash) backendUrl.searchParams.set("trash", trash);

    const response = await fetch(backendUrl.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch plans from backend");
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
    const { userId, kind = "mealPlan", numberOfPeople, numberOfDays, mealTypes, name } = body;

    if (!userId || numberOfPeople === undefined) {
      return NextResponse.json(
        { error: "userId and numberOfPeople are required" },
        { status: 400 }
      );
    }

    if (kind === "mealPlan" && (numberOfDays === undefined || !mealTypes)) {
      return NextResponse.json(
        { error: "numberOfDays and mealTypes are required for plans" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/meal-plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, kind, numberOfPeople, numberOfDays, mealTypes, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create plan");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
