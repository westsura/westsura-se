"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function plusDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

export type Sokning = { in: string; out: string; guests: string; dog: boolean };

/**
 * Sökrutan. På startsidan skickar den vidare till /boende. På boendesidan (inline)
 * anropas onSearch vid Sök, och onChange direkt när antal gäster eller hund ändras —
 * så att priset räknas om utan att man behöver söka igen.
 */
export default function SearchBar({ inline = false, onSearch, onChange, initial }: {
  inline?: boolean;
  onSearch?: (q: Sokning) => void;
  onChange?: (q: Sokning) => void;
  initial?: Sokning;
}) {
  const router = useRouter();
  const today = new Date();
  const [inD, setIn] = useState(initial?.in ?? plusDays(today, 7));
  const [outD, setOut] = useState(initial?.out ?? plusDays(today, 9));
  const [guests, setGuests] = useState(initial?.guests ?? "2");
  const [dog, setDog] = useState(initial?.dog ?? false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = { in: inD, out: outD, guests, dog };
    if (onSearch) return onSearch(q);
    const p = new URLSearchParams({ in: inD, out: outD, guests, dog: dog ? "1" : "0" });
    router.push(`/boende?${p.toString()}#bokning`);
  }

  return (
    <form className={`searchbar${inline ? " searchbar--inline" : ""}`} onSubmit={submit}>
      <div className="field">
        <label htmlFor="s-in">Ankomst</label>
        <input type="date" id="s-in" value={inD} onChange={(e) => setIn(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="s-out">Avresa</label>
        <input type="date" id="s-out" value={outD} onChange={(e) => setOut(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="s-guests">Gäster</label>
        <select id="s-guests" value={guests} onChange={(e) => { setGuests(e.target.value); onChange?.({ in: inD, out: outD, guests: e.target.value, dog }); }}>
          {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={String(n)}>{n} {n === 1 ? "gäst" : "gäster"}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <span className="field-label">Hund</span>
        <label className="checkfield" htmlFor="s-dog">
          <input type="checkbox" id="s-dog" checked={dog} onChange={(e) => { setDog(e.target.checked); onChange?.({ in: inD, out: outD, guests, dog: e.target.checked }); }} />
          <span>Vi har med hund</span>
        </label>
      </div>
      <button className="btn" type="submit">Sök ledigt</button>
    </form>
  );
}
