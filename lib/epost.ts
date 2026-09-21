import { Resend } from "resend";
import { site } from "@/lib/site";

const fran = process.env.EPOST_FRAN || "Westsura Herrgård <boka@westsura.se>";

function html(rubrik: string, rader: string[], avslut = "Varmt välkomna till Westsura Herrgård.") {
  return `<!doctype html><html lang="sv"><body style="margin:0;background:#faf7ee;font-family:Georgia,serif;color:#1e3d33">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <p style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#937839;margin:0 0 12px">Westsura Herrgård · Anno 1680</p>
    <h1 style="font-weight:normal;font-size:26px;margin:0 0 20px">${rubrik}</h1>
    ${rader.map((r) => `<p style="font-size:16px;line-height:1.6;margin:0 0 14px">${r}</p>`).join("")}
    <p style="font-size:16px;line-height:1.6;margin:24px 0 0">${avslut}</p>
    <hr style="border:0;border-top:1px solid rgba(182,142,64,.5);margin:32px 0 16px">
    <p style="font-size:13px;color:#6b9483;margin:0">${site.name} · ${site.address.street}, ${site.address.zip} ${site.address.city}<br>${site.phone} · ${site.email}</p>
  </div></body></html>`;
}

/** Fritext från ett formulär in i mejlets html: escapa först, radbrytningar sedan. */
const fritext = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

async function skicka(till: string[], amne: string, body: string, svaraTill?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.warn("RESEND_API_KEY saknas — mejl skickas inte:", amne); return false; }
  const resend = new Resend(key);
  // Resend kastar inte vid avvisat utskick utan svarar med ett error-objekt. Utan den
  // här kontrollen blir ett misslyckat mejl helt tyst — till exempel när avsändarens
  // domän inte är verifierad.
  const { error } = await resend.emails.send({ from: fran, to: till, subject: amne, html: body, replyTo: svaraTill });
  if (error) { console.error(`Mejlet gick inte fram (${amne}) till ${till.join(", ")}:`, error.name, error.message); return false; }
  return true;
}

export async function mejlBokning(o: { epost: string; namn: string; nummer: number; ankomst: string; avresa: string; enheter: string[]; summa: number; hundar: number; frukost: boolean }) {
  const kr = o.summa.toLocaleString("sv-SE") + " kr";
  const rader = [
    `Tack ${o.namn}, vi har tagit emot din bokning med nummer <strong>${o.nummer}</strong>.`,
    `<strong>${o.ankomst} till ${o.avresa}</strong><br>${o.enheter.join("<br>")}${o.frukost ? "<br>Frukostkorg" : ""}${o.hundar ? `<br>${o.hundar} hund${o.hundar > 1 ? "ar" : ""} — varmt välkomna` : ""}`,
    `Summa: <strong>${kr}</strong>. Betalning senast 7 dagar före ankomst, eller mot faktura enligt överenskommelse.`,
    `Bokningen är preliminär tills du fått vår bekräftelse, som kommer inom en vardag. Fri avbokning fram till 7 dagar före ankomst.`,
  ];
  await skicka([o.epost], `Din bokning ${o.nummer} på Westsura Herrgård`, html("Vi har tagit emot din bokning", rader));
  await skicka([site.email], `Ny bokning ${o.nummer}: ${o.namn}, ${o.ankomst}–${o.avresa}`,
    html("Ny bokning på webben", [`${o.namn} · ${o.epost}`, `${o.ankomst} till ${o.avresa}: ${o.enheter.join(", ")}`, `Summa ${kr}. ${o.hundar ? o.hundar + " hund(ar). " : ""}${o.frukost ? "Frukost. " : ""}`, `Bekräfta i admin.`], ""), o.epost);
}

export async function mejlForfragan(o: { epost: string; namn: string; typ: string; nummer: number; datum?: string; antal?: string; meddelande?: string; telefon?: string }) {
  await skicka([o.epost], `Vi har tagit emot din förfrågan`, html("Tack för din förfrågan", [
    `Hej ${o.namn}, vi har tagit emot din förfrågan om <strong>${o.typ}</strong>${o.datum ? ` (${o.datum})` : ""}.`,
    `Vi hör av oss inom en vardag med ett förslag. Vill du hellre prata direkt: ${site.phone}.`,
  ]));
  await skicka([site.email], `Förfrågan ${o.nummer}: ${o.typ} — ${o.namn}`, html("Ny förfrågan", [
    `${o.namn} · ${o.epost}${o.telefon ? " · " + o.telefon : ""}`, `${o.typ}${o.datum ? ", " + o.datum : ""}${o.antal ? ", " + o.antal + " gäster" : ""}`, o.meddelande || "", `Svara i admin eller direkt på det här mejlet.`,
  ], ""), o.epost);
}

export async function mejlMedlemsansokan(o: { epost: string; namn: string; telefon: string; ort?: string; jakterfarenhet: string; hund?: string; meddelande?: string; niva: string; flera: boolean }) {
  await skicka([o.epost], `Din ansökan till Westsura Herrgårds jaktklubb`, html("Tack för din ansökan", [
    `Hej ${o.namn}, vi har tagit emot din ansökan om medlemskap i jaktklubben.`,
    `Antalet platser är begränsat och medlemskap beviljas av herrgården. Vi läser din ansökan och hör av oss personligen — räkna med några dagar. Är säsongen fullsatt sätter vi upp dig på väntelistan och hör av oss när en plats blir ledig.`,
    `Frågor under tiden? Ring ${site.phone}.`,
  ], "Med vänliga hälsningar, Westsura Herrgård"));
  await skicka([site.email], `Medlemsansökan jaktklubben: ${o.namn}`, html("Ny medlemsansökan till jaktklubben", [
    `${fritext(o.namn)} · ${fritext(o.epost)} · ${fritext(o.telefon)}${o.ort ? " · " + fritext(o.ort) : ""}`,
    o.flera ? `Önskad nivå: <strong>${fritext(o.niva)}</strong>` : "",
    `<strong>Jakterfarenhet</strong><br>${fritext(o.jakterfarenhet)}`,
    o.hund ? `<strong>Hund</strong><br>${fritext(o.hund)}` : "",
    o.meddelande ? `<strong>Meddelande</strong><br>${fritext(o.meddelande)}` : "",
    `Hantera i admin under Jaktklubb.`,
  ].filter(Boolean), ""), o.epost);
}

/* ---------- Jaktklubbens medlemskap ---------- */

const medlemslank = () => `${process.env.NEXT_PUBLIC_SITE_URL || site.url}/jaktklubb/login`;

export async function mejlMedlemGodkand(o: { epost: string; namn: string; sasong: string; niva: string; avgift: number }) {
  await skicka([o.epost], `Välkommen till Westsura Herrgårds jaktklubb`, html("Ditt medlemskap är beviljat", [
    `Hej ${o.namn}, det är med glädje vi hälsar dig välkommen som medlem i jaktklubben för säsongen <strong>${o.sasong}</strong>.`,
    `Medlemskapet gäller nivån <strong>${fritext(o.niva)}</strong>. Årsavgiften, ${o.avgift.toLocaleString("sv-SE")} kr, faktureras separat och kommer i ett eget utskick.`,
    `Logga in i medlemsklubben på <a href="${medlemslank()}">${medlemslank()}</a> med den här e-postadressen. Du får en engångslänk till din inkorg — inget lösenord att komma ihåg.`,
    `Före din första jaktdag behöver vi tre handlingar av dig: kopia på <strong>giltigt inlöst statligt jaktkort</strong>, <strong>ID-handling</strong> och <strong>älgskyttemärke</strong>. Du laddar upp dem under Mitt medlemskap när du loggat in. Anmälan till jaktdagarna öppnar när alla tre är godkända.`,
  ], "Varmt välkommen till klubben."));
}

export async function mejlMedlemVantelista(o: { epost: string; namn: string }) {
  await skicka([o.epost], `Din ansökan till Westsura Herrgårds jaktklubb`, html("Du står på väntelistan", [
    `Hej ${o.namn}, tack för din ansökan. Säsongens platser är tagna, men du står på vår väntelista.`,
    `Vi hör av oss så snart en plats blir ledig. Har du frågor under tiden är du välkommen att ringa ${site.phone}.`,
  ], "Med vänliga hälsningar, Westsura Herrgård"));
}

export async function mejlMedlemAvbojd(o: { epost: string; namn: string }) {
  await skicka([o.epost], `Din ansökan till Westsura Herrgårds jaktklubb`, html("Tack för din ansökan", [
    `Hej ${o.namn}, tack för att du sökte till jaktklubben och för att du tog dig tid att berätta om din jakt.`,
    `Klubben är liten och vi kan i år inte erbjuda dig en plats. Det är inget omdöme om dig som jägare — platserna är helt enkelt färre än de som söker.`,
    `Du är varmt välkommen att söka igen inför en kommande säsong, och lika välkommen på våra öppna jakttillfällen och kurser under tiden.`,
  ], "Med vänliga hälsningar, Westsura Herrgård"));
}

export async function mejlAnmalan(o: { epost: string; namn: string; titel: string; datum: string; status: string; antal: number }) {
  const vantelista = o.status === "vantelista";
  await skicka([o.epost], vantelista ? `Du står på väntelista: ${o.titel}` : `Din anmälan: ${o.titel}`, html(
    vantelista ? "Du står på väntelistan" : "Vi har tagit emot din anmälan",
    [
      `Hej ${o.namn}. ${vantelista ? "Tillfället är fullbokat, men du står på väntelistan och vi hör av oss om en plats blir ledig." : "Vi har tagit emot din anmälan och bekräftar platsen inom en vardag."}`,
      `<strong>${o.titel}</strong><br>${o.datum}${o.antal > 1 ? ` · ${o.antal} personer` : ""}`,
    ]));
  await skicka([site.email], `${vantelista ? "Väntelista" : "Anmälan"}: ${o.titel} — ${o.namn}`, html("Ny anmälan", [`${o.namn} · ${o.epost}`, `${o.titel}, ${o.datum}, ${o.antal} pers`, `Status: ${o.status}`], ""), o.epost);
}
