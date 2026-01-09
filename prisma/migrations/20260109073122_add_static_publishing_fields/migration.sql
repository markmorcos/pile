-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "next_retry_at" TIMESTAMP(3),
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "published_url" TEXT;
