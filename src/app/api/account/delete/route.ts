import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function handler(req: NextRequest, { user }: { user: any }) {
  try {
    console.log(
      `[Account Delete] User ${user.id} (${user.email}) requesting account deletion`
    );

    // Delete user (cascade will delete profile, links, jobs)
    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log(`[Account Delete] ✅ Successfully deleted user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("[Account Delete] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(handler);
