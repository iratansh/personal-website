import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNexus } from "../../lib/nexus";

/** Technical grid with a pointer-following light. Pure CSS; the pointer only updates two custom properties. */
export function Backdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useNexus();

  useEffect(() => {
    if (reducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          ref.current?.style.setProperty("--mx", `${x}px`);
          ref.current?.style.setProperty("--my", `${y}px`);
        });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <div className="backdrop" ref={ref} aria-hidden="true">
      <div className="backdrop-grid" />
      <div className="backdrop-light" />
      <div className="backdrop-vignette" />
      <div className="backdrop-noise" />
    </div>
  );
}

export function Toasts() {
  const { toasts } = useNexus();
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast mono toast-${t.tone}`}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <span className="dot" />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
