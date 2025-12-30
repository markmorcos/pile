import { getAdminAuth } from '@/lib/firebase/admin'
import { prisma } from '@/lib/prisma'

export async function verifyFirebaseToken(token: string) {
  try {
    const adminAuth = getAdminAuth()
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error('Error verifying Firebase token:', error)
    return null
  }
}

export async function getUserFromToken(token: string) {
  const decodedToken = await verifyFirebaseToken(token)
  if (!decodedToken) {
    return null
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { firebaseUid: decodedToken.uid },
    include: { profile: true },
  })

  if (!user) {
    // Create user on first login
    user = await prisma.user.create({
      data: {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email!,
      },
      include: { profile: true },
    })
  }

  return user
}

