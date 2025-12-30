import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateProfileSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

async function handler(req: NextRequest, { user }: { user: any }) {
  try {
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    // Check if slug is taken
    if (data.slug) {
      const existing = await prisma.profile.findFirst({
        where: {
          slug: data.slug,
          userId: { not: user.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Slug already taken" },
          { status: 400 }
        );
      }
    }

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      // Create profile with default slug
      const defaultSlug = data.slug || `user-${user.id.slice(0, 8)}`;
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          slug: defaultSlug,
          name: data.name,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
        },
      });
    } else {
      // Update profile and increment publishGeneration (mark as dirty)
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: {
          ...(data.slug && { slug: data.slug }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          publishGeneration: { increment: 1 },
        },
      });

      // Emit Socket.IO event for real-time updates
      console.log(
        `[Profile API] Emitting profile:dirty for profile ${profile.id}`
      );
      try {
        const { emitToProfile } = await import("@/lib/socket/server");
        emitToProfile(profile.id, "profile:dirty", {
          reason: "profile_updated",
        });
        console.log(`[Profile API] ✅ Successfully emitted profile:dirty`);
      } catch (error) {
        console.error("[Profile API] ❌ Failed to emit profile:dirty:", error);
      }
    }

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(handler);
