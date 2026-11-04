import Lista from "./Lista";

export const dynamic = "force-dynamic";

/** Jaktdagar, hundträning och jaktkurser. Evenemang ligger under /admin/evenemang. */
export default async function Jaktdagar({ searchParams }: { searchParams: Promise<{ tidigare?: string }> }) {
  const { tidigare } = await searchParams;
  return <Lista del="jakt" visaTidigare={!!tidigare} />;
}
