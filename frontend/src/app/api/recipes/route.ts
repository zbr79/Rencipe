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
    const backendUrl = new URL(`${BACKEND_URL}/recipes`);

    for (const key of ["limit", "trash"]) {
      const value = searchParams.get(key);
      if (value) backendUrl.searchParams.set(key, value);
    }

    const response = await fetch(backendUrl.toString(), {
      headers: forwardHeaders(request),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recipes from backend");
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

    const response = await fetch(`${BACKEND_URL}/recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...forwardHeaders(request) },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || "Failed to create recipe" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error creating recipe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
