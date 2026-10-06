"use client";

/**
 * The animated SVG rendition of the Manna mark used by the intro overlay:
 * two stroke-drawn concentric circles, arc text, giant Playfair M, two dots.
 */
export default function MannaMark({ size = 300, animate = true }: { size?: number; animate?: boolean }) {
  const C1 = 2 * Math.PI * 204;
  const C2 = 2 * Math.PI * 190;
  return (
    <svg
      viewBox="0 0 500 500"
      width={size}
      height={size}
      role="img"
      aria-label="Manna Cookies & Co."
      style={{ display: "block" }}
    >
      <defs>
        <path id="mannaTop" d="M 86 250 A 164 164 0 0 1 414 250" fill="none" />
        <path id="mannaBot" d="M 102 250 A 148 148 0 0 0 398 250" fill="none" />
      </defs>
      <circle
        cx="250"
        cy="250"
        r="204"
        fill="none"
        stroke="#4A2616"
        strokeWidth="7"
        strokeDasharray={C1}
        strokeDashoffset={animate ? C1 : 0}
        style={animate ? { animation: "mannaDraw 1.4s cubic-bezier(.2,.7,.2,1) .1s forwards" } : undefined}
      />
      <circle
        cx="250"
        cy="250"
        r="190"
        fill="none"
        stroke="#4A2616"
        strokeWidth="2.5"
        strokeDasharray={C2}
        strokeDashoffset={animate ? C2 : 0}
        style={animate ? { animation: "mannaDraw 1.4s cubic-bezier(.2,.7,.2,1) .25s forwards" } : undefined}
      />
      <text
        x="250"
        y="318"
        textAnchor="middle"
        fontFamily="var(--font-playfair), Georgia, serif"
        fontSize="214"
        fontWeight="500"
        fill="#4A2616"
        style={animate ? { opacity: 0, animation: "mannaRise .8s cubic-bezier(.2,.7,.2,1) .55s forwards" } : undefined}
      >
        M
      </text>
      <text
        fontFamily="var(--font-jost), sans-serif"
        fontSize="30"
        fontWeight="600"
        letterSpacing="10"
        fill="#4A2616"
        style={animate ? { opacity: 0, animation: "mannaRise .8s cubic-bezier(.2,.7,.2,1) .8s forwards" } : undefined}
      >
        <textPath href="#mannaTop" startOffset="50%" textAnchor="middle">
          MANNA
        </textPath>
      </text>
      <text
        fontFamily="var(--font-jost), sans-serif"
        fontSize="22"
        fontWeight="600"
        letterSpacing="6"
        fill="#4A2616"
        style={animate ? { opacity: 0, animation: "mannaRise .8s cubic-bezier(.2,.7,.2,1) .95s forwards" } : undefined}
      >
        <textPath href="#mannaBot" startOffset="50%" textAnchor="middle">
          COOKIES &amp; CO.
        </textPath>
      </text>
      <circle cx="84" cy="250" r="6" fill="#4A2616" />
      <circle cx="416" cy="250" r="6" fill="#4A2616" />
    </svg>
  );
}
