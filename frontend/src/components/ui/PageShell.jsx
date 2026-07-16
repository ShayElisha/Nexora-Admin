export default function PageShell({ children, className = "", dir }) {
  return (
    <div className={`page-shell ${className}`.trim()} dir={dir}>
      <div className="container page-stack">{children}</div>
    </div>
  );
}
