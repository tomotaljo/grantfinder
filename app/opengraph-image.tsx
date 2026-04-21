import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MyPublicAid — Find Government Benefits & Assistance Programs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#1D9E75",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: 80,
          fontWeight: 900,
          letterSpacing: "-2px",
          marginBottom: 28,
          lineHeight: 1,
        }}
      >
        MyPublicAid
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.88)",
          fontSize: 34,
          textAlign: "center",
          maxWidth: 820,
          lineHeight: 1.4,
        }}
      >
        Find government benefits and assistance programs you qualify for — free, takes 2 minutes
      </div>
      <div
        style={{
          marginTop: 48,
          background: "rgba(255,255,255,0.18)",
          borderRadius: 16,
          padding: "16px 36px",
          color: "white",
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        Food · Healthcare · Utilities · Housing
      </div>
    </div>,
    { ...size }
  );
}
