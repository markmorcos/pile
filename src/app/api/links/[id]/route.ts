import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateLinkSchema = z.object({
  url: z.string().url().optional(),
  draftTitle: z.string().max(200).optional().nullable(),
  draftDescription: z.string().max(500).optional().nullable(),
  draftImage: z.string().url().optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

async function putHandler(
  req: NextRequest,
  { user, params }: { user: any; params: { id: string } }
) {
  try {
    const body = await req.json();
    const data = updateLinkSchema.parse(body);

    // Check ownership
    const link = await prisma.link.findUnique({
      where: { id: params.id },
      include: { profile: true },
    });

    if (!link || link.profile.userId !== user.id) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Handle order change (reordering)
    if (data.order !== undefined && data.order !== link.order) {
      const oldOrder = link.order;
      const newOrder = data.order;

      // Get all links for this profile
      const allLinks = await prisma.link.findMany({
        where: { profileId: link.profileId },
        orderBy: { order: 'asc' },
      });

      // Update orders for affected links
      if (newOrder > oldOrder) {
        // Moving down: shift links between old and new position up
        await prisma.$transaction(
          allLinks
            .filter((l) => l.order > oldOrder && l.order <= newOrder)
            .map((l) =>
              prisma.link.update({
                where: { id: l.id },
                data: { order: l.order - 1 },
              })
            )
        );
      } else {
        // Moving up: shift links between new and old position down
        await prisma.$transaction(
          allLinks
            .filter((l) => l.order >= newOrder && l.order < oldOrder)
            .map((l) =>
              prisma.link.update({
                where: { id: l.id },
                data: { order: l.order + 1 },
              })
            )
        );
      }
    }

    // Update link
    const updatedLink = await prisma.link.update({
      where: { id: params.id },
      data: {
        ...(data.url && { url: data.url }),
        ...(data.draftTitle !== undefined && { draftTitle: data.draftTitle }),
        ...(data.draftDescription !== undefined && {
          draftDescription: data.draftDescription,
        }),
        ...(data.draftImage !== undefined && { draftImage: data.draftImage }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    // Increment publishGeneration (mark profile as dirty)
    await prisma.profile.update({
      where: { id: link.profileId },
      data: {
        publishGeneration: { increment: 1 },
      },
    });

    // If URL changed, create metadata job
    if (data.url && data.url !== link.url) {
      const job = await prisma.job.create({
        data: {
          type: "METADATA",
          entityType: "LINK",
          entityId: link.id,
          profileId: link.profileId,
          linkId: link.id,
          status: "PENDING",
        },
      });

      // Emit metadata started event
      try {
        const { emitToProfile } = await import('@/lib/socket/server');
        emitToProfile(link.profileId, 'metadata:started', {
          linkId: link.id,
          jobId: job.id,
        });
      } catch (error) {
        console.warn('Socket.IO not available:', error);
      }
    }

    // Emit profile dirty event
    try {
      const { emitToProfile } = await import('@/lib/socket/server');
      emitToProfile(link.profileId, 'profile:dirty', {
        reason: 'link_updated',
      });
    } catch (error) {
      console.warn('Socket.IO not available:', error);
    }

    return NextResponse.json({ link: updatedLink });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  req: NextRequest,
  { user, params }: { user: any; params: { id: string } }
) {
  try {
    // Check ownership
    const link = await prisma.link.findUnique({
      where: { id: params.id },
      include: { profile: true },
    });

    if (!link || link.profile.userId !== user.id) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Delete link
    await prisma.link.delete({
      where: { id: params.id },
    });

    // Increment publishGeneration (mark profile as dirty)
    await prisma.profile.update({
      where: { id: link.profileId },
      data: {
        publishGeneration: { increment: 1 },
      },
    });

    // Emit profile dirty event
    try {
      const { emitToProfile } = await import('@/lib/socket/server');
      emitToProfile(link.profileId, 'profile:dirty', {
        reason: 'link_deleted',
      });
    } catch (error) {
      console.warn('Socket.IO not available:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth((req, context) => putHandler(req, { ...context, params }))(
    req
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth((req, context) => deleteHandler(req, { ...context, params }))(
    req
  );
}
