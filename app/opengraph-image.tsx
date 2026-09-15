import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — ${SITE_DESCRIPTION}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function OpenGraphImage() {
  const logoBytes = await readFile(join(process.cwd(), "public/media/derived/brand-logo/original.jpg"));
  const logoSrc = `data:image/jpeg;base64,${logoBytes.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#151217",
          color: "#fcfaf6",
        }}
      >
        <div style={{ display: "flex", width: 630, height: 630, overflow: "hidden" }}>
          <img src={logoSrc} alt="" width={630} height={630} style={{ objectFit: "cover" }} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 56px",
            width: 570,
            height: 630,
            borderLeft: "1px solid #c7a15a",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#c7a15a",
              fontSize: 20,
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Freeport · Grand Bahama
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 58,
              lineHeight: 1.08,
              marginTop: 22,
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            Crowned by Chrissy
          </div>
          <div
            style={{
              display: "flex",
              width: 160,
              height: 1,
              background: "#c7a15a",
              marginTop: 28,
              marginBottom: 28,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 26,
              lineHeight: 1.4,
              color: "#f1e7d9",
            }}
          >
            Locs, braids, sew-ins, and ponytails. Request your appointment.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
