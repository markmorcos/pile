import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createLinkSchema = z.object({
  url: z.string().url(),
});

async function getHandler(req: NextRequest, { user }: { user: any }) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: {
        links: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ links: [] });
    }

    return NextResponse.json({ links: profile.links });
  } catch (error) {
    console.error("Get links error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function postHandler(req: NextRequest, { user }: { user: any }) {
  try {
    const body = await req.json();
    const data = createLinkSchema.parse(body);

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      // Create profile with default slug
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          slug: `user-${user.id.slice(0, 8)}`,
        },
      });
    }

    // Get max order
    const maxOrderLink = await prisma.link.findFirst({
      where: { profileId: profile.id },
      orderBy: { order: "desc" },
    });

    const newOrder = (maxOrderLink?.order ?? -1) + 1;

    // Create link
    const link = await prisma.link.create({
      data: {
        profileId: profile.id,
        url: data.url,
        order: newOrder,
      },
    });

    // Increment publishGeneration (mark profile as dirty)
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        publishGeneration: { increment: 1 },
      },
    });

    // Create metadata job
    const job = await prisma.job.create({
      data: {
        type: "METADATA",
        entityType: "LINK",
        entityId: link.id,
        profileId: profile.id,
        linkId: link.id,
        status: "PENDING",
      },
    });

    // Emit Socket.IO events
    try {
      const { emitToProfile } = await import("@/lib/socket/server");

      // Notify that metadata fetch started
      emitToProfile(profile.id, "metadata:started", {
        linkId: link.id,
        jobId: job.id,
      });

      // Notify profile is dirty
      emitToProfile(profile.id, "profile:dirty", {
        reason: "link_added",
      });
    } catch (error) {
      console.warn("Socket.IO not available:", error);
    }

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
