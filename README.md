# pile.bio

A production-ready link-in-bio platform built with Next.js, featuring a dynamic admin interface with real-time updates and optimized server-side rendering for public pages.

## Features

- ⚡ **Lightning Fast Public Pages** - Optimized server-side rendering
- 🔐 **Firebase Authentication** - Secure Google Sign-In
- 🎨 **Beautiful UI** - Modern, responsive design with dark mode support
- 🔄 **Real-time Updates** - Socket.IO for live admin previews
- 📝 **Automatic Metadata** - Fetches titles, descriptions, and images from URLs
- 🚀 **Safe Publishing** - Explicit publish workflow with draft/published states
- 🗄️ **PostgreSQL Database** - Reliable data storage with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (Node runtime)
- **Database**: PostgreSQL with Prisma
- **Auth**: Firebase Auth (Google provider)
- **Real-time**: Socket.IO
- **Hosting**: Node.js server

## Project Structure

```
pile/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (public)
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── [slug]/         # Public profile pages (SSR)
│   │   │   ├── privacy/
│   │   │   ├── terms/
│   │   │   ├── imprint/
│   │   │   └── security/
│   │   ├── app/                # Admin pages (auth required)
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── links/
│   │   │   ├── appearance/
│   │   │   ├── publish/
│   │   │   └── settings/
│   │   └── api/                # API routes
│   │       ├── auth/
│   │       ├── profile/
│   │       ├── links/
│   │       └── uploads/
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and configurations
│   │   ├── auth/               # Auth helpers
│   │   ├── firebase/           # Firebase setup
│   │   ├── socket/             # Socket.IO setup
│   │   └── prisma.ts           # Prisma client
│   └── workers/                # Background job workers
│       ├── metadata-worker.ts  # Fetches URL metadata
│       └── publish-worker.ts   # Handles publishing
├── prisma/
│   └── schema.prisma           # Database schema
├── server.ts                   # Custom server with Socket.IO
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Firebase project with Google Auth enabled

### 1. Clone and Install

```bash
git clone <your-repo>
cd pile
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pilebio"

# Firebase Client (from Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Firebase Admin (from Firebase Console > Service Accounts)
FIREBASE_ADMIN_PROJECT_ID="..."
FIREBASE_ADMIN_CLIENT_EMAIL="..."
FIREBASE_ADMIN_PRIVATE_KEY="..."

# Socket.IO
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

Run Prisma migrations:

```bash
npm run db:push
```

Or for development with migration files:

```bash
npm run db:migrate
```

### 4. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Google Authentication in Firebase Console > Authentication > Sign-in method
3. Add your domain to authorized domains
4. Get your Firebase config from Project Settings
5. Generate a service account key from Project Settings > Service Accounts

### 5. Run Development Server

Start the Next.js server with Socket.IO:

```bash
npm run dev
```

In separate terminals, start the workers:

```bash
# Terminal 2: Metadata worker
npm run worker:metadata

# Terminal 3: Publish worker
npm run worker:publish
```

Visit http://localhost:3000

## Development Workflow

### Admin Flow

1. Sign in with Google at `/app/dashboard`
2. Set up your profile at `/app/profile` (choose your slug)
3. Add links at `/app/links` (metadata fetched automatically)
4. Preview changes (draft state, not public)
5. Publish at `/app/publish` to make changes live

### How It Works

#### Authentication

- Firebase Auth handles user authentication
- Google Sign-In only (can be extended)
- API routes validate Firebase ID tokens
- Public pages never require auth

#### Link Metadata

- When you add/update a link, a metadata job is created
- Metadata worker fetches the URL and extracts:
  - Title (from `<title>` or Open Graph)
  - Description (from meta tags)
  - Image (from Open Graph)
- Updates are pushed to admin UI via Socket.IO
- Metadata is stored in `draft_*` fields

#### Publishing

- Explicit publish action increments `publish_generation`
- Publish worker copies `draft_*` fields to `published_*` fields in database
- Updates `published_generation` when complete
- Public pages show only published data
- Changes are reflected immediately on the live site

#### Real-time Updates

- Socket.IO connects admin clients only
- Events: `metadata:updated`, `publish:started`, `publish:done`, `profile:dirty`
- Public pages are read-only and don't require WebSocket connections

## Production Deployment

### Deploy to Node.js Hosting

Deploy to any Node.js hosting provider (Railway, Render, Fly.io, etc.):

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

3. Start background workers:

```bash
npm run worker:metadata &
npm run worker:publish &
```

4. Configure your environment variables on your hosting platform

## Database Schema

### User

- Stores Firebase UID and email
- One-to-one with Profile

### Profile

- User's public profile information
- `slug`: unique URL identifier
- `publish_generation`: increments on publish intent
- `published_generation`: last successful publish
- `publish_status`: IDLE | RUNNING

### Link

- User's links with draft and published states
- `draft_*`: current edits (admin preview)
- `published_*`: live on public page
- `order`: display order
- `isActive`: show/hide toggle

### Job

- Background jobs for metadata and publishing
- Types: METADATA | PUBLISH
- Status: PENDING | RUNNING | COMPLETED | FAILED

## API Routes

### Authentication

- `POST /api/auth/session` - Create session from Firebase token

### Profile

- `GET /api/profile/me` - Get current user's profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/publish` - Trigger publish

### Links

- `GET /api/links` - List user's links
- `POST /api/links` - Create link
- `PUT /api/links/[id]` - Update link
- `DELETE /api/links/[id]` - Delete link

### Uploads

- `POST /api/uploads/avatar` - Get signed URL for avatar upload
- `POST /api/uploads/link-image` - Get signed URL for link image upload

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Prisma Studio
- `npm run worker:metadata` - Start metadata worker
- `npm run worker:publish` - Start publish worker

## Environment Variables

### Required for Development

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client config
- `FIREBASE_ADMIN_*` - Firebase admin credentials

### Required for Production

- All development variables
- `NEXT_PUBLIC_APP_URL` - Your production domain

## Architecture Decisions

### Why Server-Side Rendering?

- **Public pages**: SSR for dynamic content with good performance
- **Admin pages**: Dynamic for real-time updates, authenticated access
- Simplified deployment: single server for everything
- Immediate updates when publishing (no build step required)

### Why Explicit Publishing?

- Prevents accidental public changes
- Allows preview before going live
- Clear separation of draft vs. published state
- Professional workflow

### Why Socket.IO?

- Real-time metadata updates in admin UI
- Publish status notifications
- Better UX than polling
- Only used in admin (not on public pages)

### Why Node Runtime?

- Socket.IO requires Node runtime
- Background workers need Node
- API routes use Node features
- Static pages don't need Edge runtime

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U postgres

# Reset database
npm run db:push -- --force-reset
```

### Firebase Auth Issues

- Verify Firebase config in `.env`
- Check authorized domains in Firebase Console
- Ensure service account key is valid

### Socket.IO Not Connecting

- Check `NEXT_PUBLIC_SOCKET_URL` matches your server
- Verify custom server is running (not `next dev`)
- Check browser console for connection errors

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Security Considerations

- Firebase Admin SDK validates all auth tokens
- API routes protected with `withAuth` wrapper
- Public pages are static (no server-side logic)
- Environment variables never exposed to client
- CORS configured for Socket.IO
- SQL injection prevented by Prisma

## Performance

- Public pages: Fast SSR with database query optimization
- Admin pages: Real-time updates via WebSocket
- Database queries optimized with indexes
- Publishing updates database only (instant)
- Metadata fetching is async (doesn't block UI)

## Future Enhancements

- [ ] Custom themes and layouts
- [ ] Analytics dashboard
- [ ] Custom domains
- [ ] Link click tracking
- [ ] QR code generation
- [ ] Social media integrations
- [ ] Scheduled publishing
- [ ] A/B testing

## License

MIT

## Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ using Next.js and Firebase
