import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6000";

type RouteContext = {
  params: Promise<{ segments?: string[] }>;
};

function forwardHeaders(request: NextRequest) {
  const headers: Record<string, string> = {};
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  return headers;
}

function jsonHeaders(request: NextRequest) {
  return { "Content-Type": "application/json", ...forwardHeaders(request) };
}

function backendCommentUrl(segments: string[]) {
  return `${BACKEND_URL}/comments/${segments.map(encodeURIComponent).join("/")}`;
}

function invalidCommentRoute() {
  return NextResponse.json({ error: "Invalid comment route" }, { status: 400 });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { segments = [] } = await context.params;
    if (segments.length !== 2) return invalidCommentRoute();

    const response = await fetch(backendCommentUrl(segments), {
      headers: forwardHeaders(request),
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Comments API error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to fetch comments") }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { segments = [] } = await context.params;
    const isCreateComment = segments.length === 2 && (segments[0] === "recipe" || segments[0] === "meal");
    const isUpvoteComment = segments.length === 2 && segments[1] === "upvote";
    if (!isCreateComment && !isUpvoteComment) return invalidCommentRoute();

    const body = isCreateComment ? await request.json() : undefined;
    const response = await fetch(backendCommentUrl(segments), {
      method: "POST",
      headers: isCreateComment ? jsonHeaders(request) : forwardHeaders(request),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Comments API error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update comment") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { segments = [] } = await context.params;
    if (segments.length !== 1) return invalidCommentRoute();

    const response = await fetch(backendCommentUrl(segments), {
      method: "DELETE",
      headers: forwardHeaders(request),
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Comments API error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "Failed to delete comment") }, { status: 500 });
  }
}