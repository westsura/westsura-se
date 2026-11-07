import type { Metadata } from "next";
import { bekraftaAdminlank } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Logga in i admin", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Landningssida för engångslänken till admin. Koden förbrukas först när man trycker på knappen. */
export default async function Bekrafta({ searchParams }: { searchParams: Promise<{ token_hash?: string; next?: string }> }) {
  const { token_hash = "", next = "/admin/losenord" } = await searchParams;
  return (
    <section className="section">
      <div className="container narrow center">
        <p className="label">Westsura Herrgård · admin</p>
        <h1 className="lower">logga in</h1>
        <p>Tryck på knappen för att logga in. Därefter kommer du till sidan där du väljer ett nytt lösenord.</p>
        <form action={bekraftaAdminlank}>
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="next" value={next} />
          <button className="btn" type="submit" disabled={!token_hash}>Logga in</button>
        </form>
      </div>
    </section>
  );
}
