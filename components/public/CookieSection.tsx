import Image from "next/image";

const STEPS = [
  {
    n: "01",
    title: "Browned by Hand",
    copy: "Butter cooked slowly until deep, rich and nutty.",
    img: "/brown-butter.jpg",
    alt: "Brown butter being poured",
  },
  {
    n: "02",
    title: "Real Ingredients",
    copy: "Quality chocolate, butter and flour. Nothing to fill space.",
    img: "/cookie-broken.jpg",
    alt: "Cookie broken open with melted chocolate",
  },
  {
    n: "03",
    title: "The Finishing Touch",
    copy: "Every cookie finished by hand, one at a time.",
    img: "/sea-salt.jpg",
    alt: "Flaky sea salt falling onto a cookie",
  },
];

export default function CookieSection() {
  return (
    <section data-screen-label="The Cookie" className="bg-cream px-6 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <span className="eyebrow text-brown-muted" data-reveal="fade">
            The Cookie
          </span>
          <h2
            className="mt-6 font-display font-medium text-ink"
            style={{ fontSize: "clamp(44px,5.8vw,86px)", lineHeight: 0.98 }}
          >
            <span className="block overflow-hidden">
              <span className="block" data-reveal="up">
                ONE REALLY
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="block" data-reveal="up" data-delay="120">
                GOOD COOKIE.
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="block italic text-brown-muted" data-reveal="up" data-delay="240">
                Made really well.
              </span>
            </span>
          </h2>
          <p className="mt-8 max-w-md leading-relaxed" data-reveal="fade" data-delay="200">
            Each week, Manna bakes a single cookie in one small batch. Instead of a long menu, all
            the attention goes into one recipe: slow-browned butter, real ingredients, and every
            cookie finished by hand before it&apos;s handed to you.
          </p>
          <div className="mt-10 border-t border-brown/15 pt-4" data-reveal="fade" data-delay="300">
            <span className="eyebrow text-muted-2">EST. 2023 · Small Batch</span>
          </div>
        </div>

        <div data-reveal="scale" className="mx-auto w-full max-w-sm">
          <div className="arch border border-brown/25 p-[10px]">
            <div className="arch relative overflow-hidden border border-brown/15" style={{ aspectRatio: "4/5" }}>
              <Image
                src="/cookie-stack.jpg"
                alt="A stack of Manna brown butter chocolate chunk cookies"
                fill
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-5xl gap-10 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.n} className="text-center" data-reveal="up" data-delay={String(i * 130)}>
            <div className="group mx-auto h-36 w-36 overflow-hidden rounded-full border border-brown/20 sm:h-40 sm:w-40">
              <Image
                src={s.img}
                alt={s.alt}
                width={320}
                height={320}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
              />
            </div>
            <div className="eyebrow mt-6 text-brown-muted">{s.n}</div>
            <h3 className="eyebrow mt-2 text-ink">{s.title}</h3>
            <p className="mx-auto mt-3 max-w-[26ch] text-sm leading-relaxed text-muted">{s.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
