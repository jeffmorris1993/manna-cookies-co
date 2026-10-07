import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · Manna Cookies & Co.",
  description: "How Manna Cookies & Co. handles your information.",
};

const H2: React.CSSProperties = { marginTop: 36, fontSize: 24, lineHeight: 1.2 };
const P: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: 15,
  lineHeight: 1.75,
  color: "#5A4334",
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100svh",
        background: "#F5EFE4",
        color: "#24150D",
        fontFamily: "var(--font-jost), Jost, sans-serif",
      }}
    >
      <div
        style={{
          height: 14,
          background: "repeating-linear-gradient(90deg,#4A2616 0 14px,#F5EFE4 14px 28px)",
        }}
      />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "56px 24px 96px" }}>
        <Link href="/" style={{ fontSize: 11, letterSpacing: ".24em", fontWeight: 500 }}>
          ← MANNA COOKIES &amp; CO.
        </Link>

        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 18 }}>
          <Image
            src="/logo.png"
            alt=""
            width={64}
            height={64}
            style={{ width: 64, height: 64, display: "block" }}
          />
          <div>
            <h1 className="font-display" style={{ fontWeight: 500, fontSize: "clamp(30px,5vw,42px)", lineHeight: 1.05 }}>
              Privacy Policy
            </h1>
            <div style={{ marginTop: 6, fontSize: 11, letterSpacing: ".24em", color: "#8A6440" }}>
              LAST UPDATED · OCTOBER 2026
            </div>
          </div>
        </div>

        <p style={{ ...P, marginTop: 28, fontSize: 16 }}>
          Manna Cookies &amp; Co. is a small weekly bakery. We collect only what we need to bake
          your cookies and hand them to the right person — nothing more.
        </p>

        <h2 className="font-display" style={H2}>
          What we collect
        </h2>
        <p style={P}>
          When you place an order we collect your <strong>name</strong>, <strong>phone number</strong>,
          and <strong>email address</strong>, together with your order details and chosen pickup
          window. If you join the waitlist, we keep the email address or phone number you provide.
        </p>

        <h2 className="font-display" style={H2}>
          Payments
        </h2>
        <p style={P}>
          Payments are processed by <strong>Square</strong>. Your card number is entered into and
          handled entirely by Square&rsquo;s secure payment form — it never touches our servers and
          we never see or store it. Square&rsquo;s handling of your payment information is governed
          by{" "}
          <a href="https://squareup.com/us/en/legal/general/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
            Square&rsquo;s privacy policy
          </a>
          . A record of your purchase (name, contact details, and items) is kept in our Square
          account alongside the payment, the same as if you had paid at a register.
        </p>

        <h2 className="font-display" style={H2}>
          How we use your information
        </h2>
        <p style={P}>
          To prepare your order, to contact you about your pickup, and — if you joined the
          waitlist — to let you know when the next bake opens. That&rsquo;s it. We do not sell,
          rent, or share your information with anyone for marketing, and we don&rsquo;t run
          third-party advertising or analytics trackers on this site.
        </p>

        <h2 className="font-display" style={H2}>
          Where it lives
        </h2>
        <p style={P}>
          Order and customer records are stored with our database provider (Supabase) and payment
          records with Square, both protected by access controls. Only the owner of Manna Cookies
          &amp; Co. can access them.
        </p>

        <h2 className="font-display" style={H2}>
          Cookies (the browser kind)
        </h2>
        <p style={P}>
          The public site sets no tracking cookies. A small browser-session flag remembers that
          you&rsquo;ve seen our intro animation. Secure login cookies are used only for the
          owner&rsquo;s private dashboard.
        </p>

        <h2 className="font-display" style={H2}>
          Your choices
        </h2>
        <p style={P}>
          Want your information corrected or deleted, or off the waitlist? Email{" "}
          <a href="mailto:hello@mannacookies.co" style={{ textDecoration: "underline" }}>
            hello@mannacookies.co
          </a>{" "}
          and we&rsquo;ll take care of it promptly.
        </p>

        <div style={{ marginTop: 56, borderTop: "1px solid rgba(74,38,22,.15)", paddingTop: 28, textAlign: "center" }}>
          <div className="font-display" style={{ fontSize: 20 }}>
            Manna Cookies &amp; Co.
          </div>
          <div className="font-display italic" style={{ marginTop: 4, fontSize: 16, color: "#8A6440" }}>
            Straight From Heaven.
          </div>
        </div>
      </div>
    </main>
  );
}
