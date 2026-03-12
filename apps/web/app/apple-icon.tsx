import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "radial-gradient(circle at top, rgba(56, 189, 248, 0.55), transparent 35%), linear-gradient(160deg, #020617 0%, #0f172a 58%, #082f49 100%)",
          borderRadius: 36,
          color: "#fef3c7",
          display: "flex",
          fontFamily: '"Segoe UI", sans-serif',
          fontSize: 72,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "0.14em",
          width: "100%"
        }}
      >
        ATM
      </div>
    ),
    size
  );
}