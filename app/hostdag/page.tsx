import { permanentRedirect } from "next/navigation";

/** Höstdagen ligger nu som evenemang under Aktuellt. (Omdirigeringen finns även i next.config.ts.) */
export default function Hostdag() {
  permanentRedirect("/aktuellt/hostdag-2026");
}
