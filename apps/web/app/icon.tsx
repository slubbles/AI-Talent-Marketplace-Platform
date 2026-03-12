import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(145deg, #082f49 0%, #0f172a 55%, #f59e0b 100%)",
          color: "#f8fafc",
          display: "flex",
          fontFamily: '"Segoe UI", sans-serif',
          fontSize: 26,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "0.16em",
          width: "100%"
        }}
      >
        ATM
      </div>
    ),
    size
  );
}