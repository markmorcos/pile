import { prisma } from "../lib/prisma";
import axios from "axios";
import { generateProfileHtml } from "./html-generator";
import { uploadHtml } from "../lib/storage/s3";

const MAX_RETRIES = 5;
const MAX_BACKOFF_MS = 60000; // 60 seconds

async function processPublishJob(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { profile: true },
  });

  if (!job || job.type !== "PUBLISH" || !job.profile) {
    throw new Error("Invalid job");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  try {
    // Check for coalescing - only one publish job per profile
    const runningJobs = await prisma.job.findMany({
      where: {
        profileId: job.profileId,
        type: "PUBLISH",
        status: "RUNNING",
        id: { not: jobId },
      },
    });

    if (runningJobs.length > 0) {
      console.log(`Publish job ${jobId} skipped - another job is running`);
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "COMPLETED" },
      });
      return;
    }

    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "RUNNING" },
    });

    console.log(`Publish job ${jobId} started`);

    // Copy draft to published for all links
    const profile = await prisma.profile.findUnique({
      where: { id: job.profileId! },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (profile) {
      await prisma.$transaction(
        profile.links.map((link) =>
          prisma.link.update({
            where: { id: link.id },
            data: {
              publishedTitle: link.draftTitle,
              publishedDescription: link.draftDescription,
              publishedImage: link.draftImage,
            },
          })
        )
      );

      // Generate static HTML and upload to S3/MinIO
      try {
        console.log(`[Publish] Generating HTML for profile ${profile.slug}...`);
        
        const html = generateProfileHtml(
          {
            slug: profile.slug,
            name: profile.name,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
          },
          profile.links.map((link) => ({
            id: link.id,
            url: link.url,
            publishedTitle: link.draftTitle,
            publishedDescription: link.draftDescription,
            publishedImage: link.draftImage,
          }))
        );

        console.log(`[Publish] Uploading HTML to S3 for ${profile.slug}...`);
        const publishedUrl = await uploadHtml(profile.slug, html);

        console.log(`[Publish] ✅ Successfully uploaded to ${publishedUrl}`);

        // Update profile with published URL and generation
        await prisma.profile.update({
          where: { id: job.profileId! },
          data: {
            publishedGeneration: job.profile.publishGeneration,
            publishedUrl: publishedUrl,
            publishStatus: "IDLE",
          },
        });
      } catch (uploadError) {
        console.error(
          `[Publish] ❌ Failed to generate/upload HTML for ${profile.slug}:`,
          uploadError
        );

        // Handle retry logic with exponential backoff
        const retryCount = job.retryCount + 1;
        
        if (retryCount <= MAX_RETRIES) {
          // Calculate backoff: 2^retryCount seconds, capped at 60s
          const backoffSeconds = Math.min(
            Math.pow(2, retryCount),
            MAX_BACKOFF_MS / 1000
          );
          const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

          console.log(
            `[Publish] Scheduling retry ${retryCount}/${MAX_RETRIES} in ${backoffSeconds}s for job ${jobId}`
          );

          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: "FAILED",
              error: uploadError instanceof Error ? uploadError.message : "Upload failed",
              retryCount: retryCount,
              nextRetryAt: nextRetryAt,
            },
          });

          // Reset profile publish status so it can be retried
          await prisma.profile.update({
            where: { id: job.profileId! },
            data: { publishStatus: "IDLE" },
          });

          // Schedule retry by setting status back to PENDING after delay
          setTimeout(async () => {
            try {
              await prisma.job.update({
                where: { id: jobId },
                data: { status: "PENDING" },
              });
              console.log(`[Publish] Job ${jobId} marked PENDING for retry`);
            } catch (error) {
              console.error(`[Publish] Failed to schedule retry:`, error);
            }
          }, backoffSeconds * 1000);

          return; // Exit without marking as completed
        } else {
          // Max retries exceeded
          console.error(
            `[Publish] ❌ Max retries (${MAX_RETRIES}) exceeded for job ${jobId}`
          );

          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: "FAILED",
              error: `Max retries exceeded: ${uploadError instanceof Error ? uploadError.message : "Upload failed"}`,
            },
          });

          await prisma.profile.update({
            where: { id: job.profileId! },
            data: { publishStatus: "IDLE" },
          });

          // Notify about permanent failure
          try {
            await axios.post(`${apiUrl}/api/jobs/${jobId}/notify`);
          } catch (error) {
            console.warn("Could not notify main server:", error);
          }

          return;
        }
      }
    }

    // If no upload error, update profile published generation (legacy path)
    // This shouldn't execute if upload succeeds above, but kept for safety
    if (!profile) {
      await prisma.profile.update({
        where: { id: job.profileId! },
        data: {
          publishedGeneration: job.profile.publishGeneration,
          publishStatus: "IDLE",
        },
      });
    }

    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED" },
    });

    console.log(`Publish job ${jobId} completed`);

    // Notify main server to emit Socket.IO event
    try {
      console.log(`Notifying main server about job ${jobId}...`);
      const response = await axios.post(`${apiUrl}/api/jobs/${jobId}/notify`);
      console.log(`Notify response:`, response.status, response.data);
    } catch (error) {
      console.error("Could not notify main server:", error);
    }
  } catch (error) {
    console.error(`Publish job ${jobId} failed:`, error);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    // Reset publish status
    if (job.profileId) {
      await prisma.profile.update({
        where: { id: job.profileId },
        data: { publishStatus: "IDLE" },
      });
    }

    // Notify main server about failure
    try {
      console.log(`Notifying main server about job ${jobId}...`);
      const response = await axios.post(`${apiUrl}/api/jobs/${jobId}/notify`);
      console.log(`Notify response:`, response.status, response.data);
    } catch (error) {
      console.warn("Could not notify main server:", error);
    }
  }
}

async function pollPublishJobs() {
  console.log("Polling for publish jobs...");

  const jobs = await prisma.job.findMany({
    where: {
      type: "PUBLISH",
      status: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    take: 1, // Process one at a time
  });

  if (jobs.length === 0) {
    return;
  }

  console.log(`Found ${jobs.length} publish jobs`);

  await processPublishJob(jobs[0].id);
}

// Main worker loop
async function main() {
  console.log("Publish worker started");

  // Poll every 10 seconds
  setInterval(async () => {
    try {
      await pollPublishJobs();
    } catch (error) {
      console.error("Error polling publish jobs:", error);
    }
  }, 10000);

  // Initial poll
  await pollPublishJobs();
}

main().catch(console.error);
