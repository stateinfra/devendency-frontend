const VERCEL_API = "https://api.vercel.com";
const TOKEN = process.env.VERCEL_API_TOKEN!;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID!;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

function teamQuery() {
  return TEAM_ID ? `?teamId=${TEAM_ID}` : "";
}

async function vercelFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${VERCEL_API}${path}${teamQuery()}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body?.error?.message || `Vercel API error: ${res.status}`);
  }

  return body;
}

export async function addDomainToProject(domain: string) {
  return vercelFetch(`/v10/projects/${PROJECT_ID}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });
}

export async function removeDomainFromProject(domain: string) {
  return vercelFetch(
    `/v9/projects/${PROJECT_ID}/domains/${encodeURIComponent(domain)}`,
    { method: "DELETE" },
  );
}

export async function getDomainConfig(domain: string): Promise<{
  configuredBy: string | null;
  misconfigured: boolean;
}> {
  return vercelFetch(`/v6/domains/${encodeURIComponent(domain)}/config`);
}

export async function verifyProjectDomain(domain: string) {
  return vercelFetch(
    `/v9/projects/${PROJECT_ID}/domains/${encodeURIComponent(domain)}/verify`,
    { method: "POST" },
  );
}
