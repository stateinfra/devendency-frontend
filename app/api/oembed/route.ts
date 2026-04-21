import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return Response.json({ error: "missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: "invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return Response.json({ error: "unsupported host" }, { status: 400 });
  }

  // YouTube oEmbed only accepts watch?v= and youtu.be forms. Normalize any
  // /embed/, /shorts/, or bare /watch link to a canonical watch URL.
  const host = parsed.hostname.replace(/^www\./, "");
  let videoId: string | null = null;
  if (host === "youtu.be") {
    videoId = parsed.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") videoId = parsed.searchParams.get("v");
    else if (parsed.pathname.startsWith("/embed/")) videoId = parsed.pathname.slice(7).split("/")[0] || null;
    else if (parsed.pathname.startsWith("/shorts/")) videoId = parsed.pathname.slice(8).split("/")[0] || null;
  }
  if (!videoId) {
    return Response.json({ error: "no video id" }, { status: 400 });
  }

  const canonical = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`;

  try {
    const res = await fetch(oembedUrl, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return Response.json({ error: "upstream" }, { status: 502 });
    }
    const data = await res.json();
    return Response.json(
      {
        title: data.title ?? null,
        authorName: data.author_name ?? null,
        authorUrl: data.author_url ?? null,
        thumbnailUrl: data.thumbnail_url ?? null,
        providerName: data.provider_name ?? "YouTube",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return Response.json({ error: "fetch failed" }, { status: 502 });
  }
}
