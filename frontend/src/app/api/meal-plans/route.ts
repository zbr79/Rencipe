import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

function forwardHeaders(request: NextRequest) {
  const headers: Record<string, string> = {};
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const trash = searchParams.get("trash");
    const kind = searchParams.get("kind");
    const visibility = searchParams.get("visibility");

    if (!userId && visibility !== "public") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const backendUrl = new URL(`${BACKEND_URL}/meal-plans`);
    if (userId) backendUrl.searchParams.set("userId", userId);
    if (trash) backendUrl.searchParams.set("trash", trash);
    if (kind) backendUrl.searchParams.set("kind", kind);
    if (visibility) backendUrl.searchParams.set("visibility", visibility);

    const response = await fetch(backendUrl.toString(), {
      headers: forwardHeaders(request),
    });

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
    const { userId, kind = "meal", numberOfPeople, numberOfDays, mealTypes, name, people, isPublic, recipes } = body;

    if (kind !== "meal") {
      return NextResponse.json({ error: "Plans are currently disabled" }, { status: 410 });
    }

    if (!userId || numberOfPeople === undefined) {
      return NextResponse.json(
        { error: "userId and numberOfPeople are required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/meal-plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...forwardHeaders(request) },
      body: JSON.stringify({ userId, kind, numberOfPeople, numberOfDays, mealTypes, name, people, isPublic, recipes }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.error || "Failed to create meal" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
