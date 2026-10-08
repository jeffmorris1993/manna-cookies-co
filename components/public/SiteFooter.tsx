"use client";

import Image from "next/image";
import Link from "next/link";

export default function SiteFooter({
  onOrder,
}: {
  onOrder: (e?: React.MouseEvent) => void;
}) {
  return (
    <footer className="text-center" style={{ background: "#FBF8F1" }}>
      <div
        style={{
          height: 14,
          background: "repeating-linear-gradient(90deg,#4A2616 0 14px,#FBF8F1 14px 28px)",
        }}
      />
      <div
        style={{
          padding: "72px 24px 120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Image
          src="/logo.png"
          alt="Manna Cookies & Co."
          width={128}
          height={128}
          style={{ width: 128, height: 128, display: "block" }}
        />
        <div style={{ marginTop: 28, fontSize: 10, letterSpacing: ".3em", fontWeight: 500, color: "#8A6440" }}>
          FOLLOW THE BAKE
        </div>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px 32px",
            fontSize: 11,
            letterSpacing: ".26em",
            fontWeight: 500,
          }}
        >
          <a href="https://www.instagram.com/mannacookiesmi/" target="_blank" rel="noopener noreferrer">
            INSTAGRAM
          </a>
          <a href="https://www.facebook.com/mannacookiesmi" target="_blank" rel="noopener noreferrer">
            FACEBOOK
          </a>
          <a href="mailto:hello@mannacookies.co">CONTACT</a>
          <a href="#order" onClick={onOrder}>
            PICKUP INFO
          </a>
          <Link href="/privacy">PRIVACY</Link>
        </div>
        <p style={{ margin: "20px 0 0", fontSize: "clamp(12px,3.5vw,14px)", lineHeight: 1.6, color: "#5A4334" }}>
          Pickup by reservation.
          <br />
          <span style={{ whiteSpace: "nowrap" }}>Your pickup address is sent with your confirmation.</span>
        </p>
        <div
          className="font-display"
          style={{ marginTop: 52, fontSize: "clamp(26px,4vw,36px)", letterSpacing: ".04em" }}
        >
          Manna Cookies &amp; Co.
        </div>
        <div
          className="font-display italic"
          style={{ marginTop: 6, fontSize: "clamp(20px,3vw,26px)", color: "#8A6440" }}
        >
          Straight From Heaven.
        </div>
        <div
          className="font-display italic"
          style={{ marginTop: 2, fontSize: "clamp(17px,2.6vw,22px)", color: "#8A6440" }}
        >
          Made to Crave.
        </div>
        <span style={{ marginTop: 44, fontSize: 10, letterSpacing: ".24em", color: "#6E5546" }}>
          EST. 2023
        </span>
        <span style={{ marginTop: 14, fontSize: 10, letterSpacing: ".24em", color: "#6E5546" }}>
          POWERED BY SIRROM STUDIOS
        </span>
      </div>
    </footer>
  );
}
