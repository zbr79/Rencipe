import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "../../../utils/errorMessage";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: authorization ? { Authorization: authorization } : {},
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Auth me API error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Could not load account") }, { status: 500 });
  }
}
