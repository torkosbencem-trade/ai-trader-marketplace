import { NextResponse } from "next/server";
import { listDeployments } from "../../../lib/platform-repository";

export async function GET() {
  const deployments = await listDeployments();

  return NextResponse.json({
    data: deployments,
    meta: {
      count: deployments.length,
      prepared: deployments.filter((deployment) => deployment.status === "Prepared").length,
      active: deployments.filter((deployment) => deployment.status === "Active").length,
      paused: deployments.filter((deployment) => deployment.status === "Paused").length,
      source: "file-store",
      timestamp: new Date().toISOString(),
    },
  });
}