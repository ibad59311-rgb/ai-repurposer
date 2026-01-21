import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "AI Repurposer",
  description: "Turn one transcript into posts in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, Arial", margin: 0, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ borderBottom: "1px solid #eee", padding: "12px 16px", display: "flex", gap: 12 }}>
          <Link href="/" style={{ fontWeight: 700, textDecoration: "none" }}>AI Repurposer</Link>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/pricing">Pricing</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/support">Support</Link><Link href="/generate">Generate</Link>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign up</Link>
          </div>
        </div>

        <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, width: "100%", flex: 1 }}>{children}</div>

        <div style={{ borderTop: "1px solid #eee", padding: "14px 16px" }}>
          <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", gap: 14, flexWrap: "wrap", fontSize: 14, color: "#666" }}>
            <Link href="/pricing">Pricing</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <span style={{ marginLeft: "auto" }}>© {new Date().getFullYear()} AI Repurposer</span>
          </div>
        </div>
      </body>
    </html>
  );
}
<footer style={{ marginTop: 40, padding: "24px 16px", borderTop: "1px solid #eee", fontSize: 14, color: "#555" }}>
  <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
    <span>© {new Date().getFullYear()} AI Repurposer</span>
    <span>
      Support:{" "}
      <a href="mailto:support.greensharkry@hotmail.com">
        support.greensharkry@hotmail.com
      </a>
    </span>
  </div>
</footer>

