import { NextResponse } from "next/server";
import {
  addStrategySubmission,
  listStrategySubmissions,
} from "../../../lib/platform-repository";
import { parseBacktestText } from "../../../lib/backtest-parser";

export async function GET() {
  const submissions = await listStrategySubmissions();

  return NextResponse.json({
    data: submissions,
    meta: {
      count: submissions.length,
      source: "file-store",
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const file = formData.get("file");
      let fileName: string | null = null;
      let parsedMetrics = null;

      if (file instanceof File) {
        fileName = file.name;
        const text = await file.text();
        parsedMetrics = parseBacktestText(file.name, text);
      }

      const submission = await addStrategySubmission({
        strategyName: String(formData.get("strategyName") ?? ""),
        assetClass: String(formData.get("assetClass") ?? ""),
        timeframe: String(formData.get("timeframe") ?? ""),
        riskProfile: String(formData.get("riskProfile") ?? ""),
        maxDrawdown: String(formData.get("maxDrawdown") ?? ""),
        monthlyTarget: String(formData.get("monthlyTarget") ?? ""),
        fileName,
        parsedMetrics,
      });

      return NextResponse.json(
        {
          success: true,
          message: parsedMetrics
            ? "Strategy submission saved with parsed backtest metrics."
            : "Strategy submission saved and moved to admin review queue.",
          data: submission,
          meta: {
            workflow: "strategy-submission",
            source: "file-store",
          },
        },
        {
          status: 201,
        }
      );
    }

    const body = await request.json();
    const submission = await addStrategySubmission(body);

    return NextResponse.json(
      {
        success: true,
        message: "Strategy submission saved and moved to admin review queue.",
        data: submission,
        meta: {
          workflow: "strategy-submission",
          source: "file-store",
        },
      },
      {
        status: 201,
      }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid strategy submission payload.",
      },
      {
        status: 400,
      }
    );
  }
}