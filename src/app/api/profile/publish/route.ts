import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

async function handler(req: NextRequest, { user }: { user: any }) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if already publishing
    if (profile.publishStatus === 'RUNNING') {
      return NextResponse.json(
        { error: 'Publish already in progress' },
        { status: 409 }
      )
    }

    // Increment publish generation and set status
    const updatedProfile = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        publishGeneration: { increment: 1 },
        publishStatus: 'RUNNING',
      },
    })

    // Create publish job
    const job = await prisma.job.create({
      data: {
        type: 'PUBLISH',
        entityType: 'PROFILE',
        entityId: profile.id,
        profileId: profile.id,
        status: 'PENDING',
      },
    })

    // Emit Socket.IO event for real-time updates
    try {
      const { emitToProfile } = await import('@/lib/socket/server')
      emitToProfile(profile.id, 'publish:started', {
        jobId: job.id,
        generation: updatedProfile.publishGeneration,
      })
    } catch (error) {
      console.warn('Socket.IO not available:', error)
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: 'Publish started',
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)

