import { redirect } from "next/navigation";

/** Förfrågningar hanteras nu under Bokningar (status Förfrågan). Gamla länkar skickas dit. */
export default function Forfragningar() {
  redirect("/admin/bokningar?status=forfragan");
}
