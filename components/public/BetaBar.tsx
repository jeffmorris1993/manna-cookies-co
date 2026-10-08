/**
 * Visible while the site runs sandbox payments. Disappears automatically the
 * moment production Square credentials are configured.
 */
export default function BetaBar() {
  if (process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production") return null;
  return (
    <div
      role="status"
      style={{
        height: 34,
        background: "#C9A57E",
        color: "#24150D",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 14px",
      }}
    >
      <span style={{ fontSize: 10, letterSpacing: ".2em", fontWeight: 600, whiteSpace: "nowrap" }}>
        BETA PREVIEW · TEST ORDERS ONLY — NO REAL CHARGES
      </span>
    </div>
  );
}
