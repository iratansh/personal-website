export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="win-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}
