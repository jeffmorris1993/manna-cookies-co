import Image from "next/image";

type Tile =
  | { kind: "photo"; src: string; alt: string }
  | { kind: "quote"; dark: boolean; quote: string; source: string };

const TILES: Tile[] = [
  { kind: "photo", src: "/cookie-broken.jpg", alt: "Cookie broken open with melted chocolate" },
  {
    kind: "quote",
    dark: true,
    quote: "We split a dozen four ways and still argued over the last one.",
    source: "@CUSTOMER · INSTAGRAM",
  },
  { kind: "photo", src: "/customer.jpg", alt: "Customer enjoying a Manna cookie" },
  {
    kind: "quote",
    dark: false,
    quote: "The brown butter is the real thing. Already planning my next order.",
    source: "@CUSTOMER · FACEBOOK",
  },
  { kind: "photo", src: "/sea-salt.jpg", alt: "Flaky sea salt falling onto a cookie" },
  {
    kind: "quote",
    dark: true,
    quote: "Ordered a dozen for my mom's birthday. Gone before the candles were lit.",
    source: "@CUSTOMER · TEXT MESSAGE",
  },
];

export default function Testimonials() {
  return (
    <section data-screen-label="Social" className="bg-cream px-6 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="eyebrow text-brown-muted" data-reveal="fade">
            Shared by You
          </span>
          <h2
            className="mt-5 font-display font-medium text-ink"
            style={{ fontSize: "clamp(36px,5.5vw,68px)", lineHeight: 1.02 }}
            data-reveal="up"
          >
            GOOD NEWS <span className="italic text-brown-muted">travels fast.</span>
          </h2>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="eyebrow mt-6 inline-block border-b border-brown/40 pb-1 text-brown transition-[letter-spacing] duration-300 hover:tracking-[0.42em]"
            data-reveal="fade"
            data-delay="150"
          >
            Tag Us on Instagram
          </a>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:flex sm:snap-x sm:snap-mandatory sm:gap-6 sm:overflow-x-auto sm:pb-4">
          {TILES.map((t, i) => (
            <div
              key={i}
              data-reveal="up"
              data-delay={String((i % 3) * 110)}
              className="sm:w-64 sm:flex-none sm:snap-start"
              style={{ aspectRatio: "4/5" }}
            >
              {t.kind === "photo" ? (
                <div className="relative h-full w-full overflow-hidden rounded-md">
                  <Image
                    src={t.src}
                    alt={t.alt}
                    fill
                    sizes="(max-width: 640px) 45vw, 256px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <figure
                  className={`flex h-full w-full flex-col justify-between rounded-md p-6 ${
                    t.dark ? "bg-ink text-cream" : "border border-brown/20 bg-cream-raised text-ink"
                  }`}
                >
                  <div
                    className={`font-display text-6xl leading-none ${t.dark ? "text-gold" : "text-brown/30"}`}
                    aria-hidden
                  >
                    &ldquo;
                  </div>
                  <blockquote className="font-display text-base italic leading-snug sm:text-lg">
                    {t.quote}
                  </blockquote>
                  <figcaption
                    className={`eyebrow mt-4 ${t.dark ? "text-cream-dark-muted" : "text-muted-2"}`}
                    style={{ fontSize: "9px" }}
                  >
                    {t.source}
                  </figcaption>
                </figure>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
