const links = [
  { text: "京ICP备2023011302号-14", href: "#" },
  { text: "京B2-20240852", href: "#" },
  { text: "京公网安备11010802043150号", href: "#" },
]

const sep = <span style={{ margin: "0 4px", color: "rgba(0,0,0,0.15)" }}>|</span>

export default function LegalFooter() {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "0 6px", padding: "0 10px", marginTop: "auto", fontSize: "12px", lineHeight: "20px", color: "rgba(0,0,0,0.3)", opacity: 0.7, letterSpacing: "0.25px" }}>
      <span>内容由AI生成，请仔细甄别</span>
      {sep}
      <span>© 2026 北京月之暗面科技有限公司</span>
      {links.map((l, i) => (
        <span key={i}>
          {sep}
          <a href={l.href} style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >{l.text}</a>
        </span>
      ))}
    </div>
  )
}
