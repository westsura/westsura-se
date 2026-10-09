"use client";

import { useState, useTransition } from "react";
import { sparaTillfalle } from "@/app/admin/actions";

type T = {
  id: string; typ: string; titel: string; beskrivning: string | null; datum: string; tid: string | null; platser: number; pris: number | null;
  publicerad: boolean; synlighet?: string; samling?: string | null; program?: string | null; algjakt?: boolean;
  slug?: string | null; ingress?: string | null; bild?: string | null; bild_alt?: string | null; anmalan?: boolean;
  barnpris?: number | null; barn_alder?: number;
};

/** Förminskar en bild i webbläsaren till högst 2000 px och JPEG, så att uppladdningen går snabbt. */
async function forminska(fil: File): Promise<Blob> {
  if (!fil.type.startsWith("image/") || fil.type === "image/gif") return fil;
  const bitmap = await createImageBitmap(fil);
  const skala = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * skala); canvas.height = Math.round(bitmap.height * skala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b ?? fil), "image/jpeg", 0.85));
}

export default function TillfalleForm({ tillfalle }: { tillfalle?: T }) {
  const [open, setOpen] = useState(false);
  const [typ, setTyp] = useState(tillfalle?.typ ?? "jakt");
  const [bild, setBild] = useState<Blob | null>(null);
  const [forhand, setForhand] = useState<string | null>(tillfalle?.bild ?? null);
  const [taBort, setTaBort] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ev = typ === "evenemang";

  if (!open) return <button className="btn btn--ghost btn--sm" onClick={() => setOpen(true)} style={{ marginBottom: tillfalle ? 0 : 20 }}>{tillfalle ? "Ändra" : "+ Nytt tillfälle eller evenemang"}</button>;
  return (
    <form className="form admin__panel" style={{ marginBottom: 20, gridColumn: "1 / -1", width: "100%" }} onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      fd.delete("bildval");
      if (ev && bild) fd.set("bildfil", new File([bild], "bild.jpg", { type: bild.type || "image/jpeg" }));
      if (ev && taBort) fd.set("ta_bort_bild", "1");
      setFel(null);
      start(async () => { const r = await sparaTillfalle(fd); if (r.ok) { setOpen(false); setBild(null); } else setFel(r.fel ?? "Kunde inte spara."); });
    }}>
      {tillfalle && <input type="hidden" name="id" value={tillfalle.id} />}
      <div className="field"><label>Typ</label>
        <select name="typ" value={typ} onChange={(e) => setTyp(e.target.value)}>
          <option value="jakt">Jakt</option><option value="hundtraning">Hundträning</option><option value="jaktkurs">Jaktkurs</option>
          <option value="evenemang">Evenemang — visas under Aktuellt på startsidan</option>
        </select></div>
      <div className="field"><label>Titel</label><input name="titel" defaultValue={tillfalle?.titel} required placeholder={ev ? "Julmarknad på Westsura" : ""} /></div>
      <div className="field"><label>Datum</label><input type="date" name="datum" defaultValue={tillfalle?.datum} required /></div>
      <div className="field"><label>Tid</label><input name="tid" defaultValue={tillfalle?.tid ?? ""} placeholder="10.00–16.00" /></div>

      {ev && (
        <>
          <div className="field field--full"><label>Ingress</label>
            <input name="ingress" defaultValue={tillfalle?.ingress ?? ""} placeholder="En mening som lockar — visas på startsidan och överst på evenemangssidan" /></div>
          <div className="field field--full"><label>Bild</label>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              {forhand && !taBort && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={forhand} alt="" style={{ width: 160, height: 107, objectFit: "cover", border: "1px solid var(--border-subtle)" }} />
              )}
              <input type="file" name="bildval" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const b = await forminska(f); setBild(b); setTaBort(false); setForhand(URL.createObjectURL(b));
              }} />
              {forhand && !taBort && tillfalle?.bild && !bild && <button type="button" className="linkbtn" onClick={() => setTaBort(true)}>Ta bort bilden</button>}
            </div>
            <p className="hint">Liggande bild fungerar bäst. Den förminskas automatiskt och används även när länken delas på Facebook.</p>
          </div>
          <div className="field field--full"><label>Bildtext för syntolkning</label><input name="bild_alt" defaultValue={tillfalle?.bild_alt ?? ""} placeholder="Valfritt — t.ex. marknadsstånd vid herrgårdens gula fasad" /></div>
        </>
      )}

      <div className="field"><label>{ev ? "Platser (om anmälan)" : "Platser"}</label><input type="number" name="platser" defaultValue={tillfalle?.platser ?? (ev ? 100 : 6)} min={0} required /></div>
      <div className="field"><label>Pris (kr)</label><input type="number" name="pris" defaultValue={tillfalle?.pris ?? ""} min={0} placeholder={ev ? "0 = fri entré, tomt = visas inte" : ""} /></div>
      {ev && (
        <>
          <div className="field"><label>Barnpris (kr)</label><input type="number" name="barnpris" defaultValue={tillfalle?.barnpris ?? ""} min={0} placeholder="Tomt = inget barnpris" /></div>
          <div className="field"><label>Barn upp till (år)</label><input type="number" name="barn_alder" defaultValue={tillfalle?.barn_alder ?? 12} min={1} max={18} /></div>
        </>
      )}
      {!ev && (
        <>
          <div className="field"><label>Synlighet</label>
            <select name="synlighet" defaultValue={tillfalle?.synlighet ?? "publik"}><option value="publik">Publik — syns på sajten</option><option value="medlem">Bara medlemmar — jaktklubben</option></select></div>
          <div className="field"><label>Samling</label><input name="samling" defaultValue={tillfalle?.samling ?? ""} placeholder="Samling vid herrgården" /></div>
        </>
      )}
      <div className="field field--full"><label>{ev ? "Text" : "Beskrivning"}</label>
        <textarea name="beskrivning" defaultValue={tillfalle?.beskrivning ?? ""} style={{ minHeight: ev ? 180 : 80 }} placeholder={ev ? "Berätta om evenemanget. Tom rad mellan styckena." : ""} /></div>
      <div className="field field--full"><label title="En rad per punkt">Program</label>
        <textarea name="program" defaultValue={tillfalle?.program ?? ""} style={{ minHeight: 100 }} placeholder={ev ? "Valfritt — en rad per punkt, t.ex.\n10.00  Portarna öppnas\n12.00  Lunch från grillen" : "En rad per punkt, t.ex.\n07.00  Samling vid herrgården\n07.30  Säkerhetsgenomgång"} /></div>
      {ev && (
        <div className="field field--full"><label>Adress</label>
          <input name="slug" defaultValue={tillfalle?.slug ?? ""} placeholder="Valfritt — skapas av titel och år, t.ex. julmarknad-2026" />
          <p className="hint">Sidan hamnar på westsura.se/aktuellt/{tillfalle?.slug || "…"}</p></div>
      )}
      <div className="field"><label className="checkfield checkfield--bare"><input type="checkbox" name="publicerad" defaultChecked={tillfalle?.publicerad ?? true} /><span>Publicerad på sajten</span></label></div>
      {ev
        ? <div className="field"><label className="checkfield checkfield--bare"><input type="checkbox" name="anmalan" defaultChecked={tillfalle?.anmalan ?? false} /><span>Ta emot anmälan (platser räknas ner)</span></label></div>
        : typ === "jakt" && <div className="field"><label className="checkfield checkfield--bare"><input type="checkbox" name="algjakt" defaultChecked={tillfalle?.algjakt ?? false} /><span>Älgjakt — räknas för fördelningen av älgkött</span></label></div>}
      {fel && <div className="notice notice--fel field--full" role="alert">{fel}</div>}
      <div className="field--full cta-row"><button className="btn" type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara"}</button><button className="btn btn--ghost" type="button" onClick={() => setOpen(false)}>Avbryt</button></div>
    </form>
  );
}
