import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepNumber: string }> }
) {
  try {
    const { id, stepNumber } = await params;
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/recipes/${id}/steps/${stepNumber}/upload-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload step image");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error uploading step image:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
