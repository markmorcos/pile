import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "./verify-token";

type RouteContext = {
  params?: Record<string, string | string[]>;
};

export function withAuth(
  handler: (req: NextRequest, context: { user: any }) => Promise<Response>
) {
  return async (
    req: NextRequest,
    context?: RouteContext
  ): Promise<Response> => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, { user });
  };
}
