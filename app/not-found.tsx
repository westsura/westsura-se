import Link from "next/link";
import { PageHead } from "@/components/Blocks";

export default function NotFound() {
  return (
    <>
      <PageHead label="Sidan finns inte" title="här var det tomt" lede="Sidan du sökte finns inte längre, eller så blev adressen fel." />
      <section style={{ paddingBottom: 96 }}>
        <div className="container cta-row">
          <Link className="btn" href="/">Till startsidan</Link>
          <Link className="btn btn--ghost" href="/boende">Se lediga rum</Link>
        </div>
      </section>
    </>
  );
}
