import Image from "next/image";

/** Branded empty-results card: seal, serif line, quiet sub-copy. */
export default function EmptyState({
  title,
  sub,
  children,
  compact = false,
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FBF8F1",
        borderRadius: 16,
        padding: compact ? "32px 20px" : "48px 24px",
        textAlign: "center",
        animation: "mannaIn .35s ease",
      }}
    >
      <Image
        src="/logo.png"
        alt=""
        width={compact ? 44 : 60}
        height={compact ? 44 : 60}
        style={{
          width: compact ? 44 : 60,
          height: compact ? 44 : 60,
          display: "block",
          margin: "0 auto",
          opacity: 0.85,
        }}
      />
      <div
        className="font-display"
        style={{ marginTop: 14, fontSize: compact ? 19 : 22, lineHeight: 1.25, color: "#24150D" }}
      >
        {title}
      </div>
      {sub && (
        <p
          style={{
            margin: "8px auto 0",
            maxWidth: 320,
            fontSize: 14,
            lineHeight: 1.6,
            color: "#6E5546",
          }}
        >
          {sub}
        </p>
      )}
      {children && <div style={{ marginTop: 18 }}>{children}</div>}
    </div>
  );
}
