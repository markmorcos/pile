import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

// Socket.IO is initialized in server.ts and handled separately
// This file is just a placeholder to reserve the /api/socket route
export async function GET(req: NextRequest) {
  return new Response('Socket.IO endpoint', { status: 200 })
}

