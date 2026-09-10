import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "../../../../utils/errorMessage";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

function forwardHeaders(request: NextRequest): Record<string, string> {
  const authorization = request.headers.get("authorization");
  return authorization ? { Authorization: authorization } : {};
}

async function backendJson(response: Response) {
  const text = await response.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  return NextResponse.json(data, { status: response.status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/recipes/${id}/upload-image`, {
      method: "POST",
      headers: forwardHeaders(request),
      body: formData,
    });

    return backendJson(response);
  } catch (error: unknown) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Recipe image upload failed") }, { status: 500 });
  }
}
