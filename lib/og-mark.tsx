import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export async function markImage(px: number, rounded: boolean) {
  const font = await readFile(
    join(process.cwd(), "assets/fonts/fraunces-latin-800-normal.ttf"),
  );
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2b2710",
        borderRadius: rounded ? px * 0.22 : 0,
      }}
    >
      <div
        style={{
          width: px * 0.72,
          height: px * 0.72,
          borderRadius: 999,
          background: "#ffe767",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Fraunces",
          fontWeight: 800,
          fontSize: px * 0.48,
          color: "#2b2710",
          paddingBottom: px * 0.03,
        }}
      >
        T
      </div>
    </div>,
    {
      width: px,
      height: px,
      fonts: [{ name: "Fraunces", data: font, weight: 800, style: "normal" }],
    },
  );
}
