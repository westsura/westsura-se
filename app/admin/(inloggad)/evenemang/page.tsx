import Lista from "../tillfallen/Lista";

export const dynamic = "force-dynamic";

/** Evenemang under Aktuellt — julmarknad, höstdagar, temakvällar. */
export default async function Evenemang({ searchParams }: { searchParams: Promise<{ tidigare?: string }> }) {
  const { tidigare } = await searchParams;
  return <Lista del="evenemang" visaTidigare={!!tidigare} />;
}
