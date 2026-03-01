import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("POST /api/drafts - body:", body);
    console.log("API_URL:", API_URL);

    const response = await fetch(`${API_URL}/drafts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Backend response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("Backend error:", error);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("authorId");

    console.log("GET /api/drafts - authorId:", authorId);

    if (!authorId) {
      return NextResponse.json(
        { error: "authorId is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/drafts?authorId=${authorId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Backend response status:", response.status);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ draft: null });
      }
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("authorId");

    console.log("DELETE /api/drafts - authorId:", authorId);

    if (!authorId) {
      return NextResponse.json(
        { error: "authorId is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/drafts?authorId=${authorId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Backend response status:", response.status);

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    return NextResponse.json({ message: "draft deleted successfully" });
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
