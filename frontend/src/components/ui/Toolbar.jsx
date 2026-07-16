export default function Toolbar({ children, className = "" }) {
  return (
    <div className={`toolbar ${className}`.trim()}>
      <div className="toolbar-inner">{children}</div>
    </div>
  );
}
