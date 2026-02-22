import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/constants";

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: {
      author: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  });

  const siteUrl = SITE_CONFIG.url;

  const items = posts
    .map((post) => {
      const pubDate = post.publishedAt ?? post.createdAt;
      const categories = post.tags
        .map((t) => `<category>${escapeXml(t.tag.name)}</category>`)
        .join("\n        ");

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/posts/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/posts/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || post.content.slice(0, 200))}</description>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      ${post.author.name ? `<author>${escapeXml(post.author.name)}</author>` : ""}
      ${categories}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_CONFIG.name)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(SITE_CONFIG.description)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
