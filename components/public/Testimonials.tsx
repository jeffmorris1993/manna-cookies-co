"use client";

import { useEffect, useState } from "react";

const REVIEWS = [
  {
    name: "KATONDRA P",
    quote:
      "Manna Cookies is it! It's the attention to detail that will keep you coming back. Cookies made to BLESS you!",
  },
  {
    name: "JASMIN W",
    quote: "These cookies are absolutely delicious, each bite is filled with flavor!",
  },
  {
    name: "COREY M",
    quote: "Manna cookies are truly straight from heaven. Best cookies I've ever had!",
  },
  {
    name: "ANDREW P",
    quote: "These cookies are amazing! Every order I've received they are all consistent!",
  },
  {
    name: "RAYLYNN H",
    quote: "These cookies are dangerously good!!!!",
  },
  {
    name: "YOLANDA R",
    quote:
      "The chocolate chip cookies were delicious! Rich and buttery, little crisp on outside and soft on inside! I recommend. They are very good!!",
  },
  {
    name: "GREGORY D",
    quote:
      "They're soft, delicious and classic. Everything that you would want in a cookie. Simply incredible.",
  },
  {
    name: "TINESHA POLLOCK",
    quote:
      "These chocolate chip cookies are the BEST chocolate chip cookies that I've ever had!! They are slightly crispy, chewy on the inside. I don't know if it's the chocolate chips or butter or both; but they taste amazing.",
  },
];

function Stars({ gold }: { gold: string }) {
  return (
    <div aria-label="Rated 5 out of 5 stars" style={{ fontSize: 13, letterSpacing: 4, color: gold }}>
      ★★★★★
    </div>
  );
}

function Quote({
  dark,
  quote,
  name,
  delay,
  onOpen,
}: {
  dark: boolean;
  quote: string;
  name: string;
  delay?: string;
  onOpen: () => void;
}) {
  return (
    <button
      data-reveal="up"
      data-delay={delay}
      onClick={onOpen}
      aria-label={`Read the full review from ${name}`}
      className="cursor-pointer"
      style={{
        aspectRatio: "4/5",
        width: "100%",
        minWidth: 0,
        overflow: "hidden", // never leak past the card — leaked content makes the rail scroll vertically
        scrollSnapAlign: "start",
        background: dark ? "#24150D" : "#FBF8F1",
        color: dark ? "#F5EFE4" : "#24150D",
        border: dark ? 0 : "1px solid rgba(74,38,22,.25)",
        padding: "clamp(16px,1.8vw,24px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 14,
        textAlign: "left",
        font: "inherit",
      }}
    >
      <div className="font-display" style={{ fontSize: 42, lineHeight: 0.6, color: dark ? "#C9A57E" : "#8A6440" }}>
        &ldquo;
      </div>
      <div
        className="font-display review-clamp"
        style={{ fontSize: "clamp(14px,1.25vw,17px)", lineHeight: 1.4, textWrap: "pretty" }}
      >
        {quote}
      </div>
      <div>
        <Stars gold={dark ? "#C9A57E" : "#B98B55"} />
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            letterSpacing: ".22em",
            color: dark ? "#D9C8B3" : "#6E5546",
          }}
        >
          — {name}
        </div>
      </div>
    </button>
  );
}

function ReviewLightbox({
  review,
  dark,
  onClose,
}: {
  review: (typeof REVIEWS)[number];
  dark: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(20,11,6,.62)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "mannaFade .25s ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Review from ${review.name}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          maxHeight: "85svh",
          overflowY: "auto",
          background: dark ? "#24150D" : "#FBF8F1",
          color: dark ? "#F5EFE4" : "#24150D",
          border: dark ? "1px solid rgba(201,165,126,.35)" : "1px solid rgba(74,38,22,.3)",
          padding: "clamp(28px,5vw,44px)",
          animation: "mannaSheet .35s cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close review"
          className="cursor-pointer"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: dark ? "1px solid rgba(245,239,228,.35)" : "1px solid rgba(74,38,22,.25)",
            background: "transparent",
            color: dark ? "#F5EFE4" : "#4A2616",
            fontSize: 18,
          }}
        >
          ×
        </button>
        <div
          className="font-display"
          style={{ fontSize: 56, lineHeight: 0.6, color: dark ? "#C9A57E" : "#8A6440" }}
        >
          &ldquo;
        </div>
        <div
          className="font-display"
          style={{
            marginTop: 18,
            fontSize: "clamp(19px,3vw,26px)",
            lineHeight: 1.4,
            textWrap: "pretty",
          }}
        >
          {review.quote}
        </div>
        <div style={{ marginTop: 24 }}>
          <Stars gold={dark ? "#C9A57E" : "#B98B55"} />
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              letterSpacing: ".22em",
              color: dark ? "#D9C8B3" : "#6E5546",
            }}
          >
            — {review.name}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

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
          {REVIEWS.map((r, i) => (
            <Quote
              key={r.name}
              dark={i % 2 === 0}
              delay={i ? String(Math.min(i * 60, 240)) : undefined}
              quote={r.quote}
              name={r.name}
              onOpen={() => setOpenIdx(i)}
            />
          ))}
        </div>
      </div>

      {openIdx !== null && (
        <ReviewLightbox
          review={REVIEWS[openIdx]}
          dark={openIdx % 2 === 0}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </section>
  );
}
