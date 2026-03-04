import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit");
    
    let url = `${BACKEND_URL}/recipes`;
    if (limit) {
      url += `?limit=${limit}`;
    }

    const response = await fetch(url);

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
