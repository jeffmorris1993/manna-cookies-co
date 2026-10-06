import Crumbs from "./Crumbs";

export default function MannaStory() {
  return (
    <section
      data-screen-label="The Manna Story"
      className="relative overflow-hidden px-6 py-24 text-center sm:px-10 sm:py-32"
      style={{ background: "#24150D" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(201,165,126,.5), transparent)" }}
      />
      <Crumbs count={46} color="222,196,160" className="pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-2xl">
        <span className="eyebrow text-gold" data-reveal="fade">
          Exodus 16
        </span>
        <h2
          className="mt-5 font-display font-medium text-cream"
          style={{ fontSize: "clamp(40px,7vw,88px)", lineHeight: 1, letterSpacing: ".02em" }}
        >
          <span className="block overflow-hidden">
            <span className="block" data-reveal="up">
              SIMPLE.
            </span>
          </span>
          <span className="block overflow-hidden">
            <span className="block" data-reveal="up" data-delay="120">
              GOOD.
            </span>
          </span>
          <span className="block overflow-hidden">
            <span className="block italic" style={{ color: "#E3CBA8" }} data-reveal="up" data-delay="240">
              Provided.
            </span>
          </span>
        </h2>
        <p className="mt-9 leading-relaxed text-cream-dark-muted" data-reveal="fade" data-delay="250">
          Manna was something simple that arrived exactly when it was needed.
        </p>
        <p className="mt-4 leading-relaxed text-cream-dark-muted" data-reveal="fade" data-delay="380">
          Manna Cookies carries that spirit into something much smaller: a really good cookie, made
          carefully and meant to be shared.
        </p>
      </div>
    </section>
  );
}
