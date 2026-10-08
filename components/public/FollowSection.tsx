"use client";

const CARD: React.CSSProperties = {
  flex: "1 1 220px",
  maxWidth: 320,
  minHeight: 76,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  padding: "14px 20px",
};

export default function FollowSection() {
  return (
    <section
      style={{
        background: "#24150D",
        color: "#F5EFE4",
        padding: "clamp(88px,11vw,140px) clamp(20px,5vw,64px)",
        textAlign: "center",
      }}
    >
      <div
        data-reveal="fade"
        style={{ fontSize: 11, letterSpacing: ".42em", fontWeight: 500, color: "#C9A57E" }}
      >
        FOLLOW THE BAKE
      </div>
      <h2
        className="font-display"
        data-reveal="up"
        style={{
          margin: "20px auto 0",
          maxWidth: 720,
          fontWeight: 500,
          fontSize: "clamp(32px,5vw,60px)",
          lineHeight: 1.08,
          textWrap: "balance",
        }}
      >
        Be first to know when the <span style={{ fontStyle: "italic" }}>next batch</span> drops.
      </h2>
      <p
        data-reveal="up"
        data-delay="90"
        style={{
          margin: "20px auto 0",
          maxWidth: 480,
          fontSize: 16,
          lineHeight: 1.7,
          color: "#D9C8B3",
          textWrap: "pretty",
        }}
      >
        New cookies, pickup days and sold-out alerts are posted on Instagram and Facebook first.
      </p>
      <div
        data-reveal="up"
        data-delay="160"
        style={{ marginTop: 36, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}
      >
        <a
          href="https://www.instagram.com/mannacookiesmi/"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-card"
          style={CARD}
        >
          <span style={{ fontSize: 12, letterSpacing: ".26em", fontWeight: 500 }}>INSTAGRAM</span>
          <span className="font-display italic" style={{ fontSize: 15, opacity: 0.85 }}>
            @mannacookiesmi
          </span>
        </a>
        <a
          href="https://www.facebook.com/mannacookiesmi"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-card"
          style={CARD}
        >
          <span style={{ fontSize: 12, letterSpacing: ".26em", fontWeight: 500 }}>FACEBOOK</span>
          <span className="font-display italic" style={{ fontSize: 15, opacity: 0.85 }}>
            Manna Cookies &amp; Co.
          </span>
        </a>
      </div>
    </section>
  );
}
