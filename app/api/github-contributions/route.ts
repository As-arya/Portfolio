import { profile } from "../../data";
import { parseContributions } from "../../github-contributions";

export async function GET() {
  try {
    const username = new URL(profile.github).pathname.slice(1);
    const response = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
      headers: { "User-Agent": "Asarya-portfolio", "Accept-Language": "en-US" },
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const days = parseContributions(await response.text());
    if (days.length < 300) throw new Error("GitHub contribution calendar is unavailable");
    return Response.json({ days });
  } catch {
    return Response.json({ error: "GitHub activity is unavailable" }, { status: 502 });
  }
}
