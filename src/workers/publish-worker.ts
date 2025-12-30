import { prisma } from "../lib/prisma";
import axios from "axios";

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
    }

    // Update profile published generation
    await prisma.profile.update({
      where: { id: job.profileId! },
      data: {
        publishedGeneration: job.profile.publishGeneration,
        publishStatus: "IDLE",
      },
    });

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
