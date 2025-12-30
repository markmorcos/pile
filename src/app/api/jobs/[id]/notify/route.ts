import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitToProfile } from "@/lib/socket/server";

export const runtime = "nodejs";

// This endpoint allows workers to notify the main server about job completion
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[Notify] Received notification for job ${params.id}`);

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: { profile: true },
    });

    if (!job) {
      console.error(`[Notify] Job ${params.id} not found`);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    console.log(
      `[Notify] Job type: ${job.type}, status: ${job.status}, profileId: ${job.profileId}`
    );

    // Emit socket events directly
    
    if (job.profileId) {
      try {
        if (job.status === "COMPLETED") {
          if (job.type === "PUBLISH") {
            console.log(
              `[Notify] Emitting publish:done for profile ${job.profileId}`
            );
            emitToProfile(job.profileId, 'publish:done', {
              jobId: job.id,
              generation: job.profile?.publishGeneration,
            });
          } else if (job.type === "METADATA") {
            // Fetch the updated link
            const link = await prisma.link.findUnique({
              where: { id: job.linkId! },
            });

            console.log(
              `[Notify] Emitting metadata:updated for profile ${job.profileId}`
            );
            emitToProfile(job.profileId, 'metadata:updated', {
              linkId: job.linkId,
              metadata: {
                title: link?.draftTitle,
                description: link?.draftDescription,
                image: link?.draftImage,
              },
            });
          }
        } else if (job.status === "FAILED") {
          if (job.type === "PUBLISH") {
            console.log(
              `[Notify] Emitting publish:failed for profile ${job.profileId}`
            );
            emitToProfile(job.profileId, 'publish:failed', {
              jobId: job.id,
              error: job.error || "Unknown error",
            });
          }
        }
      } catch (error) {
        console.error("[Notify] Error emitting socket event:", error);
      }
    } else {
      console.warn(`[Notify] Job ${params.id} has no profileId`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notify] Job notify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
