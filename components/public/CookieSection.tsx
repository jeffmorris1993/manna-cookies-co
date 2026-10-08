import Image from "next/image";

const STEPS = [
  {
    n: "01",
    title: "BROWNED BY HAND",
    copy: "Butter cooked slowly until deep, rich and nutty.",
    img: "/process-browned.jpg",
    alt: "A cookie cross-section showing deep browned-butter edges",
    delay: undefined as string | undefined,
  },
  {
    n: "02",
    title: "REAL INGREDIENTS",
    copy: "Quality chocolate, butter and flour. Nothing to fill space.",
    img: "/process-ingredients.jpg",
    alt: "A cookie pulled apart with melted chocolate stretching between the halves",
    delay: "120",
  },
  {
    n: "03",
    title: "THE FINISHING TOUCH",
    copy: "Every cookie finished by hand, one at a time.",
    img: "/process-salt.jpg",
    alt: "A bitten cookie topped with flaky sea salt and dark chocolate",
    delay: "240",
  },
];

export default function CookieSection() {
  return (
    <section
      data-screen-label="The Cookie"
      style={{ background: "#F5EFE4", padding: "clamp(88px,12vw,160px) clamp(20px,5vw,64px)" }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))",
            gap: "clamp(48px,7vw,104px)",
            alignItems: "center",
          }}
        >
          <div style={{ containerType: "inline-size", minWidth: 0 }}>
            <div
              data-reveal="fade"
              style={{ fontSize: 11, letterSpacing: ".4em", fontWeight: 500, color: "#8A6440" }}
            >
              THE COOKIE
            </div>
            <h2
              className="font-display"
              style={{
                margin: "22px 0 0",
                fontWeight: 500,
                fontSize: "min(64px,12.6cqi)",
                lineHeight: 1.02,
                letterSpacing: ".01em",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ display: "block", overflow: "hidden", paddingBottom: ".06em" }}>
                <span data-reveal="mask" style={{ display: "block" }}>
                  ONE REALLY
                </span>
              </span>
              <span style={{ display: "block", overflow: "hidden", paddingBottom: ".06em" }}>
                <span data-reveal="mask" data-delay="90" style={{ display: "block" }}>
                  GOOD COOKIE.
                </span>
              </span>
              <span style={{ display: "block", overflow: "hidden", paddingBottom: ".06em" }}>
                <span data-reveal="mask" data-delay="180" style={{ display: "block", fontStyle: "italic" }}>
                  Made really well.
                </span>
              </span>
            </h2>
            <p
              data-reveal="up"
              data-delay="200"
              style={{
                margin: "28px 0 0",
                maxWidth: 470,
                fontSize: 17,
                lineHeight: 1.7,
                color: "#5A4334",
                textWrap: "pretty",
              }}
            >
              Each week, Manna bakes a single cookie in one small batch. Instead of a long menu,
              all the attention goes into one recipe: slow-browned butter, real ingredients, and
              every cookie finished by hand before it&apos;s handed to you.
            </p>
            <div
              data-reveal="up"
              data-delay="300"
              className="est-rail"
              style={{ marginTop: 32, color: "#4A2616" }}
            >
              <span className="est-dash" style={{ flex: "0 0 auto", width: 40, height: 1, background: "#4A2616" }} />
              <span style={{ whiteSpace: "nowrap" }}>EST. 2023 · SMALL BATCH · MADE TO CRAVE</span>
            </div>
          </div>

          <div data-parallax=".06" style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
            <div
              style={{
                aspectRatio: "4/5",
                width: "100%",
                minWidth: 0,
                borderRadius: "50% 50% 6px 6px / 34% 34% 6px 6px",
                overflow: "hidden",
                border: "1px solid rgba(74,38,22,.4)",
                padding: 10,
                background: "#FBF8F1",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  borderRadius: "50% 50% 2px 2px / 32% 32% 2px 2px",
                }}
              >
                <Image
                  data-reveal="scale"
                  src="/cookie-stack.jpg"
                  alt="A stack of brown butter chocolate chunk cookies"
                  width={520}
                  height={650}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "clamp(80px,10vw,140px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))",
            gap: "clamp(40px,4vw,56px)",
          }}
        >
          {STEPS.map((s) => (
            <div
              key={s.n}
              data-reveal="up"
              data-delay={s.delay}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                width: "100%",
                maxWidth: 340,
                margin: "0 auto",
              }}
            >
              <div style={{ aspectRatio: "1", borderRadius: "50%", overflow: "hidden" }}>
                <Image
                  src={s.img}
                  alt={s.alt}
                  width={340}
                  height={340}
                  className="transition-transform duration-[1.2s] ease-[cubic-bezier(.2,.7,.2,1)] hover:scale-[1.08]"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <span
                  className="font-display italic"
                  style={{ color: "#8A6440", fontSize: 18 }}
                >
                  {s.n}
                </span>
                <div>
                  <div className="font-display" style={{ fontSize: 22, letterSpacing: ".14em" }}>
                    {s.title}
                  </div>
                  <div style={{ marginTop: 6, color: "#5A4334", fontSize: 16 }}>{s.copy}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
