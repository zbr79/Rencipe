import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "../../../utils/errorMessage";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

export async function PATCH(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/auth/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Auth profile API error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Profile update failed") }, { status: 500 });
  }
}
