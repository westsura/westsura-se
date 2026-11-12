import { permanentRedirect } from "next/navigation";

/** Kurssidorna heter nu /aktiviteter — gamla länkar skickas vidare. */
export default async function GammalKurs({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  permanentRedirect(id === "naturfoto" ? "/paket/naturfoto" : `/aktiviteter/${id}`);
}
