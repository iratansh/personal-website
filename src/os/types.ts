import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";

export type AppId =
  | "files"
  | "reader"
  | "pdf"
  | "homelab"
  | "terminal"
  | "browser"
  | "contact"
  | "settings"
  | "about"
  | "analytics";

/** Visual spec for an icon. Every icon in the system is drawn from one of three shapes. */
export type IconSpec =
  | { shape: "folder"; tint: Tint; glyph?: LucideIcon }
  | { shape: "app"; tint: Tint; glyph: LucideIcon }
  | { shape: "doc"; ext: string; tint?: Tint; glyph?: LucideIcon };

export type Tint = "emerald" | "cyan" | "blue" | "violet" | "amber" | "rose" | "slate" | "ink";

export type NodeKind = "folder" | "app" | "document" | "link";

export interface FsNode {
  id: string;
  name: string;
  kind: NodeKind;
  /** Canonical parent (drives breadcrumbs). Folders may also list aliases that live elsewhere. */
  parent: string | null;
  children?: string[];
  icon: IconSpec;
  /** How to open it. Folders open in Files; everything else names an app and an argument. */
  open?: { app: AppId; arg?: string };
  /** External URL for link nodes (opened in Browser). */
  href?: string;
  kindLabel: string;
  /** YYYY-MM or YYYY-MM-DD. */
  modified?: string;
  /** One-line description shown in Files' status bar, the launcher, and Get Info. */
  description?: string;
  keywords?: string[];
  /** Hidden from folder listings (still searchable / openable). */
  hidden?: boolean;
  /** Shows a lock badge. */
  locked?: boolean;
}

export type WinMode = "normal" | "max" | "left" | "right";

export interface Win {
  id: string;
  app: AppId;
  arg?: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mode: WinMode;
  minimized: boolean;
  z: number;
}

export interface AppProps {
  win: Win;
  arg?: string;
}

export interface AppDef {
  id: AppId;
  title: string;
  icon: IconSpec;
  component: LazyExoticComponent<ComponentType<AppProps>>;
  size: { w: number; h: number };
  minSize?: { w: number; h: number };
  /** Only one window; opening again focuses it (and passes the new argument). */
  single?: boolean;
  description: string;
}
