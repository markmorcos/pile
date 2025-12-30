import { NextRequest, NextResponse } from 'next/server'
import { emitToProfile } from '@/lib/socket/server'

export async function POST(req: NextRequest) {
  try {
    const { profileId, event, data } = await req.json()

    if (!profileId || !event) {
      return NextResponse.json(
        { error: 'profileId and event are required' },
        { status: 400 }
      )
    }

    // Emit the event to the profile room
    emitToProfile(profileId, event, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error emitting socket event:', error)
    return NextResponse.json(
      { error: 'Failed to emit socket event' },
      { status: 500 }
    )
  }
}
