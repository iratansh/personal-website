/**
 * Application registry. To add an app: create a component in ./apps that accepts AppProps,
 * register it here, and (optionally) add an `app:<id>` node in fs.ts so it appears in Files.
 */
import { lazy } from "react";
import { getNode } from "./fs";
import type { AppDef, AppId, IconSpec } from "./types";

const icon = (id: AppId): IconSpec => getNode(`app:${id}`)?.icon ?? { shape: "doc", ext: "txt" };

export const APPS: Record<AppId, AppDef> = {
  files: {
    id: "files",
    title: "Files",
    icon: icon("files"),
    component: lazy(() => import("./apps/Files")),
    size: { w: 860, h: 540 },
    minSize: { w: 480, h: 320 },
    description: "File manager",
  },
  reader: {
    id: "reader",
    title: "Reader",
    icon: { shape: "doc", ext: "md" },
    component: lazy(() => import("./apps/Reader")),
    size: { w: 860, h: 680 },
    minSize: { w: 420, h: 320 },
    description: "Document reader",
  },
  pdf: {
    id: "pdf",
    title: "PDF Viewer",
    icon: icon("pdf"),
    component: lazy(() => import("./apps/PdfViewer")),
    size: { w: 760, h: 820 },
    minSize: { w: 420, h: 360 },
    single: true,
    description: "PDF viewer",
  },
  homelab: {
    id: "homelab",
    title: "Home Lab",
    icon: icon("homelab"),
    component: lazy(() => import("./apps/HomeLab")),
    size: { w: 1120, h: 740 },
    minSize: { w: 640, h: 440 },
    single: true,
    description: "Infrastructure dashboard",
  },
  terminal: {
    id: "terminal",
    title: "Terminal",
    icon: icon("terminal"),
    component: lazy(() => import("./apps/Terminal")),
    size: { w: 720, h: 460 },
    minSize: { w: 420, h: 260 },
    single: true,
    description: "Simulated shell",
  },
  browser: {
    id: "browser",
    title: "Browser",
    icon: icon("browser"),
    component: lazy(() => import("./apps/Browser")),
    size: { w: 900, h: 620 },
    minSize: { w: 480, h: 360 },
    single: true,
    description: "Link browser",
  },
  contact: {
    id: "contact",
    title: "Contact",
    icon: icon("contact"),
    component: lazy(() => import("./apps/Contact")),
    size: { w: 720, h: 560 },
    minSize: { w: 420, h: 400 },
    single: true,
    description: "Get in touch",
  },
  settings: {
    id: "settings",
    title: "Settings",
    icon: icon("settings"),
    component: lazy(() => import("./apps/Settings")),
    size: { w: 760, h: 540 },
    minSize: { w: 520, h: 380 },
    single: true,
    description: "System settings",
  },
  about: {
    id: "about",
    title: "About iratanshOS",
    icon: icon("about"),
    component: lazy(() => import("./apps/About")),
    size: { w: 520, h: 560 },
    minSize: { w: 400, h: 420 },
    single: true,
    description: "About this system",
  },
  analytics: {
    id: "analytics",
    title: "Analytics",
    icon: icon("analytics"),
    component: lazy(() => import("./apps/Analytics")),
    size: { w: 820, h: 600 },
    minSize: { w: 480, h: 380 },
    single: true,
    description: "Private analytics",
  },
};

/** Apps pinned to the dock, in order. Entries can be app ids or filesystem node ids. */
export const DOCK_PINS: { target: string; label: string }[] = [
  { target: "app:files", label: "Files" },
  { target: "projects", label: "Projects" },
  { target: "app:homelab", label: "Home Lab" },
  { target: "app:terminal", label: "Terminal" },
  { target: "app:browser", label: "Browser" },
  { target: "resume", label: "Resume" },
  { target: "app:contact", label: "Contact" },
];
