import { SITE_LOCATION, SITE_NAME, publicSiteUrl } from "./site";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function extractUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match?.[0] ?? null;
}

export function renderEmailHtml(input: { subject: string; body: string }) {
  const site = publicSiteUrl();
  const cta = extractUrl(input.body);
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map((block) => escapeHtml(block.trim()).replaceAll("\n", "<br />"))
    .filter(Boolean)
    .map((html) => `<p style="margin:0 0 16px;color:#28232b;font-size:16px;line-height:1.55;">${html}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#151217;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#151217;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:0 8px 20px;color:#c7a15a;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.28em;text-transform:uppercase;">
                ${escapeHtml(SITE_NAME)}
              </td>
            </tr>
            <tr>
              <td style="background:#fcfaf6;border-radius:24px;padding:32px 28px;font-family:Georgia,'Times New Roman',serif;">
                <p style="margin:0 0 8px;color:#c7a15a;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;">${escapeHtml(SITE_LOCATION.city)}, ${escapeHtml(SITE_LOCATION.region)}</p>
                <h1 style="margin:0 0 20px;color:#151217;font-size:28px;line-height:1.2;">${escapeHtml(input.subject)}</h1>
                ${paragraphs}
                ${
                  cta
                    ? `<p style="margin:28px 0 0;"><a href="${escapeHtml(cta)}" style="display:inline-block;background:#c8afe4;color:#151217;text-decoration:none;border-radius:999px;padding:14px 22px;font-weight:600;">View details</a></p>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0;color:#f1e7d9;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;">
                Appointment updates from ${escapeHtml(SITE_NAME)}. This is not a marketing list.
                <br />
                <a href="${escapeHtml(site)}" style="color:#c7a15a;">${escapeHtml(site.replace(/^https?:\/\//, ""))}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
