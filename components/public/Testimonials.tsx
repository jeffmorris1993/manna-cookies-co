import Image from "next/image";

const IMG_HOVER =
  "transition-transform duration-[1.2s] ease-[cubic-bezier(.2,.7,.2,1)] hover:scale-[1.06]";

function Photo({ src, alt, delay }: { src: string; alt: string; delay?: string }) {
  return (
    <div
      data-reveal="up"
      data-delay={delay}
      style={{ aspectRatio: "4/5", width: "100%", minWidth: 0, scrollSnapAlign: "start", overflow: "hidden" }}
    >
      <Image
        src={src}
        alt={alt}
        width={340}
        height={425}
        className={IMG_HOVER}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

function Quote({
  dark,
  quote,
  source,
  delay,
}: {
  dark: boolean;
  quote: string;
  source: string;
  delay?: string;
}) {
  return (
    <div
      data-reveal="up"
      data-delay={delay}
      style={{
        aspectRatio: "4/5",
        width: "100%",
        minWidth: 0,
        scrollSnapAlign: "start",
        background: dark ? "#24150D" : "#FBF8F1",
        color: dark ? "#F5EFE4" : undefined,
        border: dark ? undefined : "1px solid rgba(74,38,22,.25)",
        padding: "clamp(16px,1.8vw,24px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div className="font-display" style={{ fontSize: 42, lineHeight: 0.6, color: dark ? "#C9A57E" : "#8A6440" }}>
        &ldquo;
      </div>
      <div
        className="font-display"
        style={{ fontSize: "clamp(15px,1.35vw,18px)", lineHeight: 1.35, textWrap: "pretty" }}
      >
        {quote}
      </div>
      <div style={{ fontSize: 10, letterSpacing: ".22em", color: dark ? "#D9C8B3" : "#6E5546" }}>
        {source}
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section
      data-screen-label="Social"
      style={{ background: "#F5EFE4", padding: "clamp(88px,11vw,150px) clamp(20px,5vw,64px)" }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 24,
          }}
        >
          <div>
            <div
              data-reveal="fade"
              style={{ fontSize: 11, letterSpacing: ".42em", fontWeight: 500, color: "#8A6440" }}
            >
              SHARED BY YOU
            </div>
            <h2
              className="font-display"
              style={{ margin: "18px 0 0", fontWeight: 500, fontSize: "clamp(36px,5.5vw,68px)", lineHeight: 1.02 }}
            >
              <span style={{ display: "block", overflow: "hidden", paddingBottom: ".06em" }}>
                <span data-reveal="mask" style={{ display: "block" }}>
                  GOOD NEWS
                </span>
              </span>
              <span style={{ display: "block", overflow: "hidden", paddingBottom: ".06em" }}>
                <span data-reveal="mask" data-delay="100" style={{ display: "block", fontStyle: "italic" }}>
                  travels fast.
                </span>
              </span>
            </h2>
          </div>
          <a
            href="https://www.instagram.com/mannacookiesmi/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              letterSpacing: ".24em",
              fontWeight: 500,
              borderBottom: "1px solid #4A2616",
              paddingBottom: 5,
            }}
          >
            TAG US ON INSTAGRAM
          </a>
        </div>

        <div className="testi-rail">
          <Photo src="/customer.jpg" alt="Customer enjoying a Manna cookie" />
          <Quote
            dark
            delay="80"
            quote="We split a dozen four ways and still argued over the last one."
            source="@CUSTOMER · INSTAGRAM"
          />
          <Photo src="/cookie-broken.jpg" alt="Cookie broken open" delay="160" />
          <Quote
            dark={false}
            delay="240"
            quote="The brown butter is the real thing. Already planning my next order."
            source="@CUSTOMER · FACEBOOK"
          />
          <Photo src="/sea-salt.jpg" alt="Sea salt on a fresh cookie" delay="160" />
          <Quote
            dark
            delay="240"
            quote="Ordered a dozen for my mom's birthday. Gone before the candles were lit."
            source="@CUSTOMER · TEXT MESSAGE"
          />
        </div>
      </div>
    </section>
  );
}
