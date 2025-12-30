import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// Use global to persist Socket.IO instance across Next.js hot reloads
declare global {
  var socketIO: SocketIOServer | undefined;
}

export function initSocketServer(httpServer: HTTPServer) {
  if (global.socketIO) {
    console.log("Socket.IO server already initialized");
    return global.socketIO;
  }

  console.log("Initializing Socket.IO server...");

  global.socketIO = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  global.socketIO.on("connection", (socket) => {
    console.log("[Socket.IO] Client connected:", socket.id);

    socket.on("join:profile", (profileId: string) => {
      console.log(
        `[Socket.IO] Received join:profile request from ${socket.id} for profile:${profileId}`
      );
      socket.join(`profile:${profileId}`);
      console.log(
        `[Socket.IO] ✅ Socket ${socket.id} joined profile:${profileId}`
      );
      console.log(
        `[Socket.IO] Socket ${socket.id} is now in rooms:`,
        Array.from(socket.rooms)
      );
    });

    socket.on("leave:profile", (profileId: string) => {
      console.log(
        `[Socket.IO] Received leave:profile request from ${socket.id} for profile:${profileId}`
      );
      socket.leave(`profile:${profileId}`);
      console.log(`[Socket.IO] Socket ${socket.id} left profile:${profileId}`);
    });

    socket.on("disconnect", () => {
      console.log("[Socket.IO] Client disconnected:", socket.id);
    });

    socket.onAny((eventName, ...args) => {
      console.log(
        `[Socket.IO] Received event "${eventName}" from ${socket.id}:`,
        args
      );
    });
  });

  console.log("Socket.IO server initialized successfully");

  return global.socketIO;
}

export function getSocketServer() {
  if (!global.socketIO) {
    throw new Error("Socket.IO server not initialized");
  }
  return global.socketIO;
}

export function emitToProfile(profileId: string, event: string, data: any) {
  if (global.socketIO) {
    console.log(`[Socket.IO] Emitting ${event} to profile:${profileId}`, data);

    // Get all sockets in this room
    const room = global.socketIO.sockets.adapter.rooms.get(
      `profile:${profileId}`
    );
    const socketsInRoom = room ? room.size : 0;
    console.log(
      `[Socket.IO] Room "profile:${profileId}" has ${socketsInRoom} socket(s)`
    );

    if (socketsInRoom === 0) {
      console.warn(
        `[Socket.IO] ⚠️  WARNING: No sockets in room "profile:${profileId}" to receive event "${event}"`
      );
    }

    global.socketIO.to(`profile:${profileId}`).emit(event, data);
  } else {
    console.warn(`[Socket.IO] Socket.IO not initialized, cannot emit ${event}`);
  }
}
