import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "../../utils/errorMessage";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const authorization = request.headers.get("authorization");
    const response = await fetch(`${BACKEND_URL}/saved?userId=${userId}`, {
      headers: authorization ? { Authorization: authorization } : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return NextResponse.json(
        { error: error?.error || "Failed to fetch saved items from backend" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("API error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Saved items fetch failed") }, { status: 500 });
  }
}
