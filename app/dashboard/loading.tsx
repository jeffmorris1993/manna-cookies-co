/** Skeleton for every dashboard tab while server data loads. */
export default function DashboardLoading() {
  return (
    <main
      aria-busy
      aria-label="Loading"
      style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 14 }}
    >
      {/* page title */}
      <div className="skel" style={{ width: 190, height: 34 }} />

      {/* stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: "#FBF8F1", borderRadius: 14, padding: "16px 16px 14px" }}>
            <div className="skel" style={{ width: "70%", height: 11 }} />
            <div className="skel" style={{ marginTop: 12, width: 64, height: 36 }} />
          </div>
        ))}
      </div>

      {/* dark card */}
      <div style={{ background: "#24150D", borderRadius: 16, padding: 20 }}>
        <div className="skel-dark" style={{ width: 90, height: 11 }} />
        <div className="skel-dark" style={{ marginTop: 12, width: 180, height: 24 }} />
        <div className="skel-dark" style={{ marginTop: 18, width: "100%", height: 96, borderRadius: 12 }} />
      </div>

      {/* list rows */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ background: "#FBF8F1", borderRadius: 16, padding: 16 }}>
          <div className="skel" style={{ width: "45%", height: 18 }} />
          <div className="skel" style={{ marginTop: 10, width: "70%", height: 12 }} />
          <div className="skel" style={{ marginTop: 10, width: "55%", height: 12 }} />
        </div>
      ))}
    </main>
  );
}
