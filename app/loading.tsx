import Image from "next/image";

/** Branded first-paint loader for the public site. */
export default function Loading() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: "100svh", background: "#F5EFE4" }}
    >
      <Image
        src="/logo.png"
        alt=""
        width={96}
        height={96}
        priority
        style={{ width: 96, height: 96, display: "block", animation: "mannaFade .6s ease" }}
      />
      <div
        className="font-display italic"
        style={{ marginTop: 20, fontSize: 18, color: "#8A6440", animation: "mannaFade .6s ease" }}
      >
        Warming the oven…
      </div>
      <div className="skel" style={{ marginTop: 22, width: 120, height: 3, borderRadius: 2 }} />
    </div>
  );
}
