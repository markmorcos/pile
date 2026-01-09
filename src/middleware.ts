import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "./lib/prisma";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes that require authentication
  const adminRoutes = [
    "/dashboard",
    "/profile",
    "/links",
    "/appearance",
    "/publish",
    "/settings",
  ];

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isAdminRoute) {
    // Let the client-side handle auth redirect
    // (We can't verify Firebase token in middleware - Edge runtime limitation)
    console.log("Middleware: Admin route accessed:", pathname);
    return NextResponse.next();
  }

  // Check if this is a profile page request (e.g., /john)
  // Exclude known public pages and API routes
  const publicPages = [
    "/",
    "/privacy",
    "/terms",
    "/imprint",
    "/security",
    "/debug-auth",
  ];
  
  const isPublicPage = publicPages.includes(pathname);
  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile = pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/);

  // If it's a profile slug (not admin, not public page, not API)
  if (!isAdminRoute && !isPublicPage && !isApiRoute && !isStaticFile) {
    const slug = pathname.slice(1); // Remove leading slash

    try {
      // Check if profile exists and has published static HTML
      const profile = await prisma.profile.findUnique({
        where: { slug },
        select: {
          publishedUrl: true,
          publishedGeneration: true,
          publishGeneration: true,
        },
      });

      // If profile has published HTML and is up-to-date, proxy from CDN
      if (
        profile &&
        profile.publishedUrl &&
        profile.publishedGeneration === profile.publishGeneration
      ) {
        const cdnUrl = `${process.env.S3_PUBLIC_URL}/${profile.publishedUrl}`;
        
        console.log(`[Middleware] Proxying ${pathname} from ${cdnUrl}`);

        try {
          const cdnResponse = await fetch(cdnUrl, {
            // Forward cache headers from CDN
            headers: {
              "User-Agent": request.headers.get("user-agent") || "pile.bio",
            },
          });

          if (cdnResponse.ok) {
            // Return proxied response with original headers
            return new Response(cdnResponse.body, {
              status: cdnResponse.status,
              headers: cdnResponse.headers,
            });
          } else {
            console.warn(
              `[Middleware] CDN returned ${cdnResponse.status}, falling back to SSR`
            );
          }
        } catch (fetchError) {
          console.error(`[Middleware] Failed to fetch from CDN:`, fetchError);
          // Fall through to SSR
        }
      }
    } catch (error) {
      console.error(`[Middleware] Error checking profile:`, error);
      // Fall through to SSR
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
