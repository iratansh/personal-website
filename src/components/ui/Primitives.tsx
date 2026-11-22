import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Comp>
  );
}

export function SectionHead({ index, title, aside }: { index?: string; title: string; aside?: ReactNode }) {
  return (
    <div className="section-head">
      <span className="label">
        {index && <span className="accent">{index} </span>}
        {title}
      </span>
      <span className="rule" />
      {aside}
    </div>
  );
}

export function ViewHeader({
  index,
  kicker,
  title,
  lede,
  children,
}: {
  index: string;
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="view-header">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="label view-kicker">
          <span className="accent">{index}</span> <span className="dim">/</span> {kicker}
        </div>
        <h1 className="view-title">{title}</h1>
        {lede && <p className="view-lede">{lede}</p>}
      </motion.div>
      {children}
    </header>
  );
}
