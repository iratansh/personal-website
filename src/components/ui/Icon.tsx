/* eslint-disable react-refresh/only-export-components */
import type { SVGProps } from "react";
import type { ModuleId } from "../../lib/routes";

/** Hairline icon set drawn on a 16px grid to match the interface's 1px borders. */
const paths = {
  arrowRight: "M3 8h10M9 4l4 4-4 4",
  arrowUpRight: "M5 11l6-6M6 5h5v5",
  arrowLeft: "M13 8H3M7 4L3 8l4 4",
  terminal: "M2.5 3.5h11v9h-11zM5 6.5l2 1.5-2 1.5M8.5 10h2.5",
  command: "M6 6V4.5a1.5 1.5 0 10-1.5 1.5H6zm0 0h4m-4 0v4m4-4V4.5A1.5 1.5 0 1111.5 6H10zm0 0v4m0 0h1.5a1.5 1.5 0 11-1.5 1.5V10zm0 0H6m0 0v1.5A1.5 1.5 0 114.5 10H6z",
  search: "M7 12A5 5 0 107 2a5 5 0 000 10zM10.5 10.5L14 14",
  close: "M4 4l8 8M12 4l-8 8",
  mail: "M2 4h12v8H2zM2 4.5l6 4.5 6-4.5",
  file: "M4 2h5l3 3v9H4zM9 2v3h3M6 8.5h4M6 11h4",
  copy: "M5.5 5.5h7v7h-7zM3.5 10.5v-7h7",
  check: "M3 8.5l3 3 7-7",
  overview: "M8 2v3M8 11v3M2 8h3M11 8h3M8 10a2 2 0 100-4 2 2 0 000 4z",
  registry: "M2.5 3h11v3h-11zM2.5 7.5h11v3h-11zM2.5 12h11v1.5h-11zM4.5 4.5h1M4.5 9h1",
  experience: "M3 2v12M3 4h7l-1.5 2L10 8H3M3 10h5",
  lab: "M6 2h4M6.5 2v4.2L3 13h10L9.5 6.2V2M5 10h6",
  knowledge: "M2.5 3.5c2-.8 3.8-.6 5.5.5v9c-1.7-1.1-3.5-1.3-5.5-.5zM13.5 3.5c-2-.8-3.8-.6-5.5.5v9c1.7-1.1 3.5-1.3 5.5-.5z",
  contact: "M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z",
  menu: "M2.5 5h11M2.5 8h11M2.5 11h11",
  motion: "M2 8c2-4 4-4 6 0s4 4 6 0",
  play: "M5 3.5l7 4.5-7 4.5z",
  pause: "M5 3.5v9M11 3.5v9",
  reset: "M3 8a5 5 0 105-5H5M5 1v2.5h2.5",
  zap: "M9 1.5L3.5 9H8l-1 5.5L12.5 7H8z",
  shield: "M8 1.8l5 1.9v4c0 3.2-2.1 5.4-5 6.5-2.9-1.1-5-3.3-5-6.5v-4zM5.8 8l1.6 1.6L10.4 6.5",
  telemetry: "M2 13.5h12M3.5 11V8M6.5 11V4.5M9.5 11V6.5M12.5 11V2.5",
  node: "M8 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8 1.5v4M8 10.5v4M1.5 8h4M10.5 8h4",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 16, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}

export const moduleIcon: Record<ModuleId, IconName> = {
  overview: "overview",
  registry: "registry",
  experience: "experience",
  lab: "lab",
  knowledge: "knowledge",
  contact: "contact",
  privacy: "shield",
  telemetry: "telemetry",
};
