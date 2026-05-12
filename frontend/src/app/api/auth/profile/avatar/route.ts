import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

function forwardHeaders(request: NextRequest): Record<string, string> {
  const authorization = request.headers.get("authorization");
  return authorization ? { Authorization: authorization } : {};
}

async function backendJson(response: Response) {
  const text = await response.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/auth/profile/avatar`, {
      method: "POST",
      headers: forwardHeaders(request),
      body: formData,
    });

    return backendJson(response);
  } catch (error: any) {
    console.error("Error uploading profile avatar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}