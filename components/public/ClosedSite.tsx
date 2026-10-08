import Image from "next/image";
import WaitlistForm from "./WaitlistForm";
import BetaBar from "./BetaBar";

/** Public site when no drop is live: branded rest state + waitlist. */
export default function ClosedSite() {
  return (
    <>
    <BetaBar />
    <main
      className="flex flex-col items-center justify-center text-center"
      style={{
        minHeight: "100svh",
        background: "#F5EFE4",
        color: "#24150D",
        padding: "48px 24px",
        animation: "mannaFade .6s ease",
      }}
    >
      <Image
        src="/logo.png"
        alt="Manna Cookies & Co."
        width={110}
        height={110}
        priority
        style={{ width: 110, height: 110, display: "block" }}
      />
      <div
        style={{
          marginTop: 28,
          fontSize: 11,
          letterSpacing: ".42em",
          fontWeight: 500,
          color: "#8A6440",
        }}
      >
        SMALL BATCH · WEEKLY
      </div>
      <h1
        className="font-display"
        style={{ margin: "18px 0 0", fontWeight: 500, fontSize: "clamp(34px,7vw,64px)", lineHeight: 1.05 }}
      >
        THE OVEN IS RESTING.
      </h1>
      <p
        className="font-display italic"
        style={{ margin: "14px 0 0", fontSize: "clamp(17px,2.4vw,22px)", color: "#8A6440" }}
      >
        One really good cookie, baked fresh each week.
      </p>

      <div style={{ margin: "44px auto 0", width: "100%", maxWidth: 560, border: "1px solid #4A2616", padding: 9 }}>
        <div style={{ border: "1px solid rgba(74,38,22,.35)", padding: "40px clamp(20px,5vw,48px)" }}>
          <div className="font-display" style={{ fontSize: "clamp(22px,3.4vw,30px)", lineHeight: 1.15 }}>
            Hear about the next bake first.
          </div>
          <p style={{ margin: "12px auto 0", maxWidth: 380, color: "#5A4334", lineHeight: 1.6, fontSize: 15 }}>
            Join the list and we&apos;ll let you know the moment ordering opens.
          </p>
          <WaitlistForm dropId={null} />
        </div>
      </div>

      <div className="font-display" style={{ marginTop: 56, fontSize: 22, letterSpacing: ".04em" }}>
        Manna Cookies &amp; Co.
      </div>
      <div className="font-display italic" style={{ marginTop: 4, fontSize: 17, color: "#8A6440" }}>
        Straight From Heaven. · Made to Crave.
      </div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          gap: 28,
          fontSize: 11,
          letterSpacing: ".26em",
          fontWeight: 500,
        }}
      >
        <a href="https://www.instagram.com/mannacookiesmi/" target="_blank" rel="noopener noreferrer">INSTAGRAM</a>
        <a href="https://www.facebook.com/mannacookiesmi" target="_blank" rel="noopener noreferrer">FACEBOOK</a>
      </div>
    </main>
    </>
  );
}
