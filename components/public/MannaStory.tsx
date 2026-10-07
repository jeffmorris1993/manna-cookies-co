import Crumbs from "./Crumbs";

export default function MannaStory() {
  return (
    <section
      data-screen-label="The Manna Story"
      className="relative overflow-hidden text-center"
      style={{
        background: "#24150D",
        color: "#F5EFE4",
        padding: "clamp(130px,16vw,210px) clamp(24px,6vw,64px)",
      }}
    >
      <Crumbs
        n={46}
        color="222,196,160"
        speed={0.8}
        alpha={0.75}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: 1,
          height: "clamp(70px,10vw,130px)",
          background: "linear-gradient(rgba(201,165,126,0),#C9A57E)",
        }}
      />
      <div className="relative" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          data-reveal="fade"
          style={{ fontSize: 11, letterSpacing: ".42em", fontWeight: 500, color: "#C9A57E" }}
        >
          EXODUS 16
        </div>
        <h2
          className="font-display"
          style={{ margin: "28px 0 0", fontWeight: 500, fontSize: "clamp(50px,9vw,116px)", lineHeight: 0.98 }}
        >
          <span style={{ display: "block", overflow: "hidden", paddingBottom: ".05em" }}>
            <span data-reveal="mask" style={{ display: "block" }}>
              SIMPLE.
            </span>
          </span>
          <span style={{ display: "block", overflow: "hidden", paddingBottom: ".05em" }}>
            <span data-reveal="mask" data-delay="140" style={{ display: "block" }}>
              GOOD.
            </span>
          </span>
          <span style={{ display: "block", overflow: "hidden", paddingBottom: ".05em" }}>
            <span
              data-reveal="mask"
              data-delay="280"
              style={{ display: "block", fontStyle: "italic", color: "#E3CBA8" }}
            >
              Provided.
            </span>
          </span>
        </h2>
        <p
          data-reveal="up"
          data-delay="200"
          className="font-display"
          style={{
            margin: "40px auto 0",
            maxWidth: 520,
            fontSize: "clamp(20px,2.4vw,26px)",
            lineHeight: 1.5,
            textWrap: "pretty",
          }}
        >
          Manna was something simple that arrived exactly when it was needed.
        </p>
        <p
          data-reveal="up"
          data-delay="320"
          style={{
            margin: "22px auto 0",
            maxWidth: 480,
            fontSize: 17,
            lineHeight: 1.75,
            color: "#D9C8B3",
            textWrap: "pretty",
          }}
        >
          Manna Cookies carries that spirit into something much smaller: a really good cookie,
          made carefully and meant to be shared.
        </p>
      </div>
    </section>
  );
}
