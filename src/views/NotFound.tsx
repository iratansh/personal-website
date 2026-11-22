import { toHref } from "../lib/routes";
import { Icon } from "../components/ui/Icon";

export default function NotFound({ what = "that route" }: { what?: string }) {
  return (
    <div className="view notfound">
      <p className="label">
        <span style={{ color: "var(--red)" }}>404</span> · ENOENT
      </p>
      <h1 className="view-title">
        No such <span className="serif accent-2">{what}</span>.
      </h1>
      <p className="view-lede">The process you're looking for exited, or never existed.</p>
      <a className="btn" href={toHref({ module: "overview" })}>
        <Icon name="arrowLeft" /> Return to overview
      </a>
    </div>
  );
}
