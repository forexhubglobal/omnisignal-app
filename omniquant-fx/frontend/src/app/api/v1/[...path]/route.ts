import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_ORIGIN = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8005";

async function proxyToFastApi(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const subPath = path.join("/");
  const search = req.nextUrl.search || "";
  const targetUrl = `${BACKEND_ORIGIN}/api/v1/${subPath}${search}`;

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Accept: "application/json",
        Connection: "close",
      },
      cache: "no-store",
    });

    const bodyText = await res.text();
    return new NextResponse(bodyText, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Backend FastAPI Quant Engine unreachable", detail: String(err) },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyToFastApi(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyToFastApi(req, context);
}
