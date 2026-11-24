/**
 * Catalog of custom interaction events. Properties are short, non-identifying strings,
 * never free text a visitor typed (terminal arguments and form contents are not recorded).
 */
export const EVENTS = {
  resume_download: { label: "Résumé opened", props: ["source"] },
  outbound_github: { label: "GitHub link clicked", props: ["target", "source"] },
  outbound_linkedin: { label: "LinkedIn link clicked", props: ["source"] },
  outbound_link: { label: "Other external link clicked", props: ["host", "source"] },
  contact_mailto: { label: "Email link clicked", props: ["source"] },
  contact_copy_email: { label: "Email address copied", props: ["source"] },
  contact_compose: { label: "Compose form sent to mail client", props: [] },
  project_view: { label: "Project detail viewed", props: ["project"] },
  project_section: { label: "Project section jumped to", props: ["project", "section"] },
  topology_select: { label: "Topology node inspected", props: ["node"] },
  lab_interaction: { label: "Simulator control used", props: ["action"] },
  app_open: { label: "App or window opened", props: ["app"] },
  terminal_open: { label: "Terminal opened", props: [] },
  terminal_command: { label: "Terminal command run", props: ["command"] },
  palette_open: { label: "Command palette opened", props: [] },
  palette_select: { label: "Command palette item chosen", props: ["item"] },
  easter_egg: { label: "Easter egg found", props: ["name"] },
} as const;

export type EventName = keyof typeof EVENTS;
export type EventProps = Partial<Record<string, string>>;
