// Shared TypeScript types

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  slug: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  publishGeneration: number;
  publishedGeneration: number;
  publishStatus: "IDLE" | "RUNNING";
  createdAt: Date;
  updatedAt: Date;
}

export interface Link {
  id: string;
  profileId: string;
  url: string;
  draftTitle: string | null;
  draftDescription: string | null;
  draftImage: string | null;
  publishedTitle: string | null;
  publishedDescription: string | null;
  publishedImage: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  type: "METADATA" | "PUBLISH";
  entityType: "PROFILE" | "LINK";
  entityId: string;
  profileId: string | null;
  linkId: string | null;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Socket.IO event types
export interface SocketEvents {
  "metadata:started": { linkId: string; jobId: string };
  "metadata:updated": { linkId: string; jobId: string; metadata: LinkMetadata };
  "metadata:failed": { linkId: string; jobId: string; error: string };
  "publish:started": { jobId: string; generation: number };
  "publish:done": { jobId: string; generation: number };
  "publish:failed": { jobId: string; error: string };
  "profile:dirty": { reason: string };
}

export interface LinkMetadata {
  title: string;
  description: string;
  image: string;
}
