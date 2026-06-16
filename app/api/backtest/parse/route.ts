import { NextResponse } from "next/server";
import { parseBacktestText } from "../../../../lib/backtest-parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "No file uploaded.",
        },
        {
          status: 400,
        }
      );
    }

    const text = await file.text();
    const metrics = parseBacktestText(file.name, text);

    return NextResponse.json({
      success: true,
      message: "Backtest file parsed successfully.",
      data: {
        fileName: file.name,
        fileSize: file.size,
        metrics,
      },
      meta: {
        workflow: "backtest-parse",
        source: "file-parser",
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Backtest parsing failed.",
      },
      {
        status: 400,
      }
    );
  }
}