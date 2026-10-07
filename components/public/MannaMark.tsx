"use client";

/** The intro's animated SVG mark — geometry and timings verbatim from the design file. */
export default function MannaMark() {
  return (
    <svg
      viewBox="0 0 500 500"
      role="img"
      aria-label="Manna Cookies & Co."
      style={{ position: "relative", width: "min(66vw,320px)", height: "auto", overflow: "visible" }}
    >
      <defs>
        <path id="mannaTop" d="M 102,250 A 148,148 0 0 1 398,250" />
        <path id="mannaBot" d="M 76,250 A 174,174 0 0 0 424,250" />
      </defs>
      <circle
        cx="250" cy="250" r="204" transform="rotate(-90 250 250)"
        style={{
          fill: "none", stroke: "#4A2616", strokeWidth: 7,
          strokeDasharray: 1282, strokeDashoffset: 1282,
          animation: "mannaDraw 1s cubic-bezier(.65,0,.35,1) .1s forwards",
        }}
      />
      <circle
        cx="250" cy="250" r="190" transform="rotate(90 250 250)"
        style={{
          fill: "none", stroke: "#4A2616", strokeWidth: 2.5,
          strokeDasharray: 1194, strokeDashoffset: 1194,
          animation: "mannaDraw 1s cubic-bezier(.65,0,.35,1) .25s forwards",
        }}
      />
      <text
        x="250" y="322"
        style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: 214,
          fontWeight: 500, fill: "#4A2616", textAnchor: "middle", opacity: 0,
          animation: "mannaRise .6s cubic-bezier(.2,.7,.2,1) .7s forwards",
        }}
      >
        M
      </text>
      <text
        style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: 40,
          letterSpacing: 16, fill: "#4A2616", opacity: 0,
          animation: "mannaFade .5s ease 1.05s forwards",
        }}
      >
        <textPath href="#mannaTop" startOffset="50%" style={{ textAnchor: "middle" }}>
          MANNA
        </textPath>
      </text>
      <text
        style={{
          fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontSize: 33,
          letterSpacing: 7, fill: "#4A2616", opacity: 0,
          animation: "mannaFade .5s ease 1.2s forwards",
        }}
      >
        <textPath href="#mannaBot" startOffset="50%" style={{ textAnchor: "middle" }}>
          COOKIES &amp; CO.
        </textPath>
      </text>
      <circle cx="84" cy="250" r="6" style={{ fill: "#4A2616", opacity: 0, animation: "mannaFade .4s ease 1.2s forwards" }} />
      <circle cx="416" cy="250" r="6" style={{ fill: "#4A2616", opacity: 0, animation: "mannaFade .4s ease 1.2s forwards" }} />
    </svg>
  );
}
