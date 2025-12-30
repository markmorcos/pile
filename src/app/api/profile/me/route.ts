import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function handler(req: NextRequest, { user }: { user: any }) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: {
        links: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
