import { NextResponse } from "next/server";
import { apiStrategies } from "../../../../lib/platform-api-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const strategy = apiStrategies.find((item) => item.id === id);

  if (!strategy) {
    return NextResponse.json(
      {
        error: "Strategy not found",
        id,
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json({
    data: strategy,
    meta: {
      source: "mock-api",
      timestamp: new Date().toISOString(),
    },
  });
}