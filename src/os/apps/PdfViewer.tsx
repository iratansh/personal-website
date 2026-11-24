import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Printer, ZoomIn, ZoomOut } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { profile } from "../../data/profile";
import { useOS } from "../store";
import { Loading } from "../ui/Loading";
import type { AppProps } from "../types";
import { track } from "../../analytics";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** PDFs this viewer knows by name. Add an entry to make another document openable. */
const PDF_SOURCES: Record<string, { url: string; file: string }> = {
  resume: { url: profile.resume, file: "Ishaan-Ratanshi-Resume.pdf" },
};

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PdfViewer({ arg = "resume" }: AppProps) {
  const os = useOS();
  const src = PDF_SOURCES[arg] ?? PDF_SOURCES.resume;
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [width, setWidth] = useState(0);
  const [texts, setTexts] = useState<string[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    const task = pdfjs.getDocument(src.url);
    task.promise.then(
      async (d) => {
        if (cancelled) return;
        setDoc(d);
        const t: string[] = [];
        for (let i = 1; i <= d.numPages; i++) {
          const pg = await d.getPage(i);
          const content = await pg.getTextContent();
          t.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
        }
        if (!cancelled) setTexts(t);
      },
      (e: Error) => !cancelled && setError(e.message),
    );
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [src.url]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Render every page at the current scale. Pages are few (a résumé), so continuous scroll is simplest.
  useEffect(() => {
    if (!doc || !width) return;
    const tasks: RenderTask[] = [];
    let cancelled = false;
    (async () => {
      for (let i = 1; i <= doc.numPages; i++) {
        const pg = await doc.getPage(i);
        if (cancelled) return;
        const base = pg.getViewport({ scale: 1 });
        // contentRect width already excludes the scroller's padding.
        const scale = zoom === "fit" ? Math.min(2.2, (width - 2) / base.width) : zoom;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vp = pg.getViewport({ scale: scale * dpr });
        const canvas = canvases.current[i - 1];
        if (!canvas) continue;
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        canvas.style.width = `${Math.floor(vp.width / dpr)}px`;
        canvas.style.height = `${Math.floor(vp.height / dpr)}px`;
        const t = pg.render({ canvasContext: canvas.getContext("2d")!, viewport: vp });
        tasks.push(t);
        await t.promise.catch(() => undefined);
      }
    })();
    return () => {
      cancelled = true;
      tasks.forEach((t) => t.cancel());
    };
  }, [doc, width, zoom]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const mid = el.scrollTop + el.clientHeight / 3;
    let p = 1;
    canvases.current.forEach((c, i) => c && c.offsetTop <= mid && (p = i + 1));
    if (p !== page) setPage(p);
  };
  const goTo = (p: number) => {
    const c = canvases.current[p - 1];
    if (c && scroller.current) scroller.current.scrollTo({ top: c.offsetTop - 16, behavior: "smooth" });
    setPage(p);
  };

  const currentScale = zoom === "fit" ? null : zoom;
  const step = (dir: 1 | -1) => {
    const cur = currentScale ?? 1;
    const next = dir === 1 ? ZOOMS.find((z) => z > cur + 0.01) : [...ZOOMS].reverse().find((z) => z < cur - 0.01);
    if (next) setZoom(next);
  };

  const print = useCallback(() => {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    frame.src = src.url;
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        window.open(src.url, "_blank", "noopener");
      }
      window.setTimeout(() => frame.remove(), 60_000);
    };
    document.body.appendChild(frame);
  }, [src.url]);

  return (
    <div className="pdf">
      <div className="pdf-bar">
        <div className="seg">
          <button onClick={() => goTo(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <span className="pdf-page" aria-live="polite">
            {page} / {doc?.numPages ?? "…"}
          </span>
          <button onClick={() => goTo(Math.min(doc?.numPages ?? 1, page + 1))} disabled={!doc || page >= doc.numPages} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="seg">
          <button onClick={() => step(-1)} aria-label="Zoom out" disabled={currentScale !== null && currentScale <= ZOOMS[0]}>
            <ZoomOut size={15} />
          </button>
          <select value={zoom === "fit" ? "fit" : String(zoom)} onChange={(e) => setZoom(e.target.value === "fit" ? "fit" : Number(e.target.value))} aria-label="Zoom">
            <option value="fit">Fit width</option>
            {ZOOMS.map((z) => (
              <option key={z} value={z}>
                {Math.round(z * 100)}%
              </option>
            ))}
          </select>
          <button onClick={() => step(1)} aria-label="Zoom in" disabled={currentScale !== null && currentScale >= ZOOMS[ZOOMS.length - 1]}>
            <ZoomIn size={15} />
          </button>
        </div>
        <span className="pdf-spacer" />
        <button className="btn btn-sm btn-ghost" onClick={print}>
          <Printer size={14} /> Print
        </button>
        <a className="btn btn-sm btn-ghost" href={src.url} target="_blank" rel="noreferrer" aria-label="Open in a new tab">
          <ExternalLink size={14} />
        </a>
        <a
          className="btn btn-sm btn-primary"
          href={src.url}
          download={src.file}
          onClick={() => {
            track("resume_download", { source: "pdf-download" });
            os.toast("Downloading résumé", src.file);
          }}
        >
          <Download size={14} /> Download
        </a>
      </div>
      <div className="pdf-scroll" ref={scroller} onScroll={onScroll} tabIndex={0} role="region" aria-label="Résumé pages">
        {error ? (
          <div className="pdf-error">
            <p>The PDF couldn&rsquo;t be rendered here ({error}).</p>
            <a className="btn" href={src.url} target="_blank" rel="noreferrer">
              Open it directly
            </a>
          </div>
        ) : !doc ? (
          <Loading label="Opening résumé" />
        ) : (
          Array.from({ length: doc.numPages }, (_, i) => (
            <div className="pdf-page-wrap" key={i}>
              <canvas ref={(el) => (canvases.current[i] = el)} className="pdf-canvas" aria-hidden="true" />
              <div className="sr-only">
                Page {i + 1} of {doc.numPages}. {texts[i]}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
