import { prisma } from "../lib/prisma";
import axios from "axios";
import * as cheerio from "cheerio";

async function fetchMetadata(url: string) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; pile.bio/1.0; +https://pile.bio)",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract metadata
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text() ||
      url;

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    const image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      "";

    return {
      title: title.trim().substring(0, 200),
      description: description.trim().substring(0, 500),
      image: image.trim(),
    };
  } catch (error) {
    console.error("Error fetching metadata:", error);
    throw error;
  }
}

async function processMetadataJob(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { link: true },
  });

  if (!job || job.type !== "METADATA" || !job.link) {
    throw new Error("Invalid job");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  try {
    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "RUNNING" },
    });

    // Metadata started event is emitted by the API route that creates the job

    // Fetch metadata
    const metadata = await fetchMetadata(job.link.url);

    // Update link with draft metadata
    await prisma.link.update({
      where: { id: job.linkId! },
      data: {
        draftTitle: metadata.title,
        draftDescription: metadata.description,
        draftImage: metadata.image || null,
      },
    });

    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED" },
    });

    console.log(`Metadata job ${jobId} completed`);

    // Notify main server to emit Socket.IO events

    try {
      await axios.post(`${apiUrl}/api/jobs/${jobId}/notify`);
    } catch (error) {
      console.warn("Could not notify main server:", error);
    }
  } catch (error) {
    console.error(`Metadata job ${jobId} failed:`, error);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    // Notify main server about failure
    try {
      await axios.post(`${apiUrl}/api/jobs/${jobId}/notify`);
    } catch (error) {
      console.warn("Could not notify main server:", error);
    }
  }
}

async function pollMetadataJobs() {
  console.log("Polling for metadata jobs...");

  const jobs = await prisma.job.findMany({
    where: {
      type: "METADATA",
      status: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    take: 5, // Process 5 jobs at a time
  });

  if (jobs.length === 0) {
    return;
  }

  console.log(`Found ${jobs.length} metadata jobs`);

  await Promise.all(jobs.map((job) => processMetadataJob(job.id)));
}

// Main worker loop
async function main() {
  console.log("Metadata worker started");

  // Poll every 5 seconds
  setInterval(async () => {
    try {
      await pollMetadataJobs();
    } catch (error) {
      console.error("Error polling metadata jobs:", error);
    }
  }, 5000);

  // Initial poll
  await pollMetadataJobs();
}

main().catch(console.error);
