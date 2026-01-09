import fs from "fs";
import path from "path";

/**
 * Extract critical CSS for profile pages at runtime
 * Reads compiled CSS from .next/static/css/ and purges to only include
 * classes used in profile pages.
 * 
 * This is a simplified runtime approach. For production, consider:
 * - Build-time extraction with PurgeCSS
 * - Caching extracted CSS in memory
 * - Using a proper CSS parser library
 */
export function extractCriticalCss(): string {
  try {
    // Path to Next.js built CSS
    const nextDir = path.join(process.cwd(), ".next");
    const staticCssDir = path.join(nextDir, "static", "css");

    // Check if build exists
    if (!fs.existsSync(staticCssDir)) {
      console.warn(
        "[CSS] .next/static/css not found, using inline fallback CSS"
      );
      return getFallbackCss();
    }

    // Find CSS files (they have hashed names like app-layout.abc123.css)
    const cssFiles = fs
      .readdirSync(staticCssDir)
      .filter((file) => file.endsWith(".css"));

    if (cssFiles.length === 0) {
      console.warn("[CSS] No CSS files found, using fallback CSS");
      return getFallbackCss();
    }

    // Read all CSS files and concatenate
    let allCss = "";
    for (const file of cssFiles) {
      const filePath = path.join(staticCssDir, file);
      allCss += fs.readFileSync(filePath, "utf-8");
    }

    // Extract only critical classes for profile pages
    // This is a basic approach - matches Tailwind utilities used in [slug]/page.tsx
    const criticalCss = purgeCss(allCss);

    console.log(
      `[CSS] ✅ Extracted ${criticalCss.length} bytes of critical CSS from ${cssFiles.length} files`
    );

    return criticalCss;
  } catch (error) {
    console.error("[CSS] Error extracting critical CSS:", error);
    return getFallbackCss();
  }
}

/**
 * Purge unused CSS - keep only classes used in profile pages
 * This is a simplified version. For production, use a proper CSS parser.
 */
function purgeCss(css: string): string {
  // Critical classes used in [slug]/page.tsx
  const criticalClasses = [
    // Base/reset styles
    "*",
    "html",
    "body",
    "a",
    "img",
    "div",
    "h1",
    "h2",
    "h3",
    "p",

    // Layout utilities
    "min-h-screen",
    "max-w-2xl",
    "mx-auto",
    "py-12",
    "py-8",
    "py-6",
    "px-4",
    "px-6",

    // Background/gradients
    "bg-gradient-to-br",
    "from-blue-50",
    "to-purple-50",
    "dark:from-gray-900",
    "dark:to-gray-800",
    "bg-white",
    "dark:bg-gray-800",
    "bg-gray-50",
    "dark:bg-gray-700",

    // Text utilities
    "text-center",
    "text-2xl",
    "text-3xl",
    "text-lg",
    "text-sm",
    "font-bold",
    "font-semibold",
    "text-gray-600",
    "dark:text-gray-400",
    "dark:text-gray-300",
    "truncate",
    "line-clamp-2",

    // Flexbox
    "flex",
    "flex-col",
    "items-center",
    "justify-center",
    "space-y-4",
    "space-y-8",
    "gap-4",
    "flex-1",
    "min-w-0",

    // Borders/rounded
    "rounded-full",
    "rounded-lg",
    "border",
    "border-2",
    "border-4",
    "border-white",
    "dark:border-gray-700",
    "border-border",

    // Shadows
    "shadow-lg",
    "shadow-sm",

    // Sizing
    "w-24",
    "h-24",
    "w-12",
    "h-12",
    "w-6",
    "h-6",

    // Positioning
    "relative",
    "overflow-hidden",

    // Transitions
    "hover:bg-gray-50",
    "dark:hover:bg-gray-700",
    "transition",

    // Object-fit
    "object-cover",

    // Margins/padding
    "mb-4",
    "mb-8",
    "mb-1",
    "mb-2",
  ];

  // Extract base, component layers and utility classes
  const lines = css.split("\n");
  const criticalLines: string[] = [];

  let inBaseLayer = false;
  let inComponentsLayer = false;

  for (const line of lines) {
    // Keep @tailwind base and components layers
    if (line.includes("@layer base") || line.includes("@tailwind base")) {
      inBaseLayer = true;
    }
    if (
      line.includes("@layer components") ||
      line.includes("@tailwind components")
    ) {
      inComponentsLayer = true;
    }

    // Keep all base/component layer rules
    if (inBaseLayer || inComponentsLayer) {
      criticalLines.push(line);
      if (line.includes("}") && line.trim() === "}") {
        inBaseLayer = false;
        inComponentsLayer = false;
      }
      continue;
    }

    // For utility classes, only keep critical ones
    const isCritical = criticalClasses.some(
      (className) =>
        line.includes(`.${className}`) ||
        line.includes(`\\.${className}`) ||
        line.includes(`*`) ||
        line.includes("html") ||
        line.includes("body")
    );

    if (isCritical) {
      criticalLines.push(line);
    }
  }

  // Minify: remove comments, extra whitespace
  let minified = criticalLines.join("\n");
  minified = minified.replace(/\/\*[\s\S]*?\*\//g, ""); // Remove comments
  minified = minified.replace(/\s+/g, " "); // Collapse whitespace
  minified = minified.replace(/\s*([{}:;,])\s*/g, "$1"); // Remove space around delimiters

  return minified.trim();
}

/**
 * Fallback CSS if build files aren't available
 * Contains minimal reset + critical profile page styles
 */
function getFallbackCss(): string {
  return `
*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
body{margin:0;line-height:inherit}
h1,h2,h3,p{margin:0}
a{color:inherit;text-decoration:inherit}
img{display:block;max-width:100%;height:auto}
.min-h-screen{min-height:100vh}
.bg-gradient-to-br{background-image:linear-gradient(to bottom right,var(--tw-gradient-stops))}
.from-blue-50{--tw-gradient-from:#eff6ff;--tw-gradient-to:rgb(239 246 255 / 0);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}
.to-purple-50{--tw-gradient-to:#faf5ff}
.max-w-2xl{max-width:42rem}
.mx-auto{margin-left:auto;margin-right:auto}
.py-12{padding-top:3rem;padding-bottom:3rem}
.px-4{padding-left:1rem;padding-right:1rem}
.text-center{text-align:center}
.mb-8{margin-bottom:2rem}
.mb-4{margin-bottom:1rem}
.flex{display:flex}
.justify-center{justify-content:center}
.relative{position:relative}
.w-24{width:6rem}
.h-24{height:6rem}
.rounded-full{border-radius:9999px}
.overflow-hidden{overflow:hidden}
.border-4{border-width:4px}
.border-white{--tw-border-opacity:1;border-color:rgb(255 255 255 / var(--tw-border-opacity))}
.shadow-lg{box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1),0 4px 6px -4px rgb(0 0 0 / 0.1)}
.text-3xl{font-size:1.875rem;line-height:2.25rem}
.font-bold{font-weight:700}
.text-gray-600{--tw-text-opacity:1;color:rgb(75 85 99 / var(--tw-text-opacity))}
.flex-col{flex-direction:column}
.space-y-4>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(1rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(1rem * var(--tw-space-y-reverse))}
.bg-white{--tw-bg-opacity:1;background-color:rgb(255 255 255 / var(--tw-bg-opacity))}
.rounded-lg{border-radius:0.5rem}
.p-6{padding:1.5rem}
.border{border-width:1px}
.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms}
.hover\\:bg-gray-50:hover{--tw-bg-opacity:1;background-color:rgb(249 250 251 / var(--tw-bg-opacity))}
.items-center{align-items:center}
.gap-4{gap:1rem}
.w-12{width:3rem}
.h-12{height:3rem}
.flex-1{flex:1 1 0%}
.min-w-0{min-width:0px}
.text-lg{font-size:1.125rem;line-height:1.75rem}
.font-semibold{font-weight:600}
.mb-1{margin-bottom:0.25rem}
.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.text-sm{font-size:0.875rem;line-height:1.25rem}
.line-clamp-2{overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.object-cover{object-fit:cover}
  `.trim();
}
