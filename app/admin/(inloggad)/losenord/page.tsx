import { kravAdmin } from "@/lib/admin";
import LosenordForm from "@/components/LosenordForm";
import { bytLosenordAdmin } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function Losenord() {
  const a = await kravAdmin();
  return (
    <>
      <header className="admin__head"><div><p className="label">Konto</p><h1 className="admin__h1">byt lösenord</h1></div><p className="admin__meta">{a.epost}</p></header>
      <div className="admin__panel" style={{ maxWidth: 480 }}>
        <LosenordForm action={bytLosenordAdmin} />
      </div>
    </>
  );
}
