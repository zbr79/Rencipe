import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

function forwardHeaders(request: NextRequest) {
  const headers: Record<string, string> = {};
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  return headers;
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${BACKEND_URL}/recipes/${id}/restore`, {
      method: "PATCH",
      headers: forwardHeaders(request),
    });

    return backendJson(response);
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
