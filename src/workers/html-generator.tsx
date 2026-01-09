import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { extractCriticalCss } from "../lib/css/extract-critical";

interface Profile {
  slug: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

interface Link {
  id: string;
  url: string;
  publishedTitle: string | null;
  publishedDescription: string | null;
  publishedImage: string | null;
}

/**
 * Generate a fully self-contained static HTML file for a profile
 * Includes inline critical CSS, meta tags, and all content
 */
export function generateProfileHtml(profile: Profile, links: Link[]): string {
  const criticalCss = extractCriticalCss();
  
  const title = profile.name || profile.slug;
  const description = profile.bio || `Check out ${title}'s links on pile.bio`;
  const canonicalUrl = `https://pile.bio/${profile.slug}`;
  
  // Generate HTML body using React components
  const bodyContent = renderToStaticMarkup(
    ProfilePage({ profile, links })
  );

  // Construct full HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | pile.bio</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  ${profile.avatarUrl ? `<meta property="og:image" content="${escapeHtml(profile.avatarUrl)}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${profile.avatarUrl ? `<meta name="twitter:image" content="${escapeHtml(profile.avatarUrl)}">` : ''}
  
  <!-- Critical CSS -->
  <style>${criticalCss}</style>
</head>
<body>
${bodyContent}
</body>
</html>`;

  return html;
}

/**
 * Profile page React component (mirrors [slug]/page.tsx structure)
 */
function ProfilePage({ profile, links }: { profile: Profile; links: Link[] }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          {profile.avatarUrl && (
            <div className="mb-4 flex justify-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name || profile.slug}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">
            {profile.name || profile.slug}
          </h1>
          {profile.bio && (
            <p className="text-gray-600 max-w-md mx-auto">{profile.bio}</p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-lg p-6 shadow-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-4">
                {link.publishedImage && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                    <img
                      src={link.publishedImage}
                      alt={link.publishedTitle || "Link"}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">
                    {link.publishedTitle || link.url}
                  </h3>
                  {link.publishedDescription && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {link.publishedDescription}
                    </p>
                  )}
                </div>
                <div className="text-gray-400">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-600">
          <a
            href="https://pile.bio"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800 transition"
          >
            Create your own page on pile.bio
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
