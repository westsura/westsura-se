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

export async function mejlBokning(o: { epost: string; namn: string; nummer: number; ankomst: string; avresa: string; enheter: string[]; summa: number; hundar: number; frukost: boolean; bricka?: boolean; paket?: boolean }) {
  const kr = o.summa.toLocaleString("sv-SE") + " kr";
  const rader = [
    `Tack ${o.namn}, vi har tagit emot din bokning med nummer <strong>${o.nummer}</strong>.`,
    `<strong>${o.ankomst} till ${o.avresa}</strong><br>${o.enheter.join("<br>")}${o.frukost ? "<br>Frukostkorg" : ""}${o.bricka ? "<br>Västmanländsk välkomstbricka" : ""}${o.hundar ? `<br>${o.hundar} hund${o.hundar > 1 ? "ar" : ""} — varmt välkomna` : ""}`,
    `Summa: <strong>${kr}</strong>. Betalning senast 7 dagar före ankomst, eller mot faktura enligt överenskommelse.`,
    // Paket innehåller partners (kanot, golf m.fl.) — boendets avbokningsregel gäller inte där.
    o.paket
      ? `Bokningen är preliminär tills du fått vår bekräftelse, som kommer inom en vardag.`
      : `Bokningen är preliminär tills du fått vår bekräftelse, som kommer inom en vardag. Fri avbokning fram till 7 dagar före ankomst.`,
  ];
  await skicka([o.epost], `Din bokning ${o.nummer} på Westsura Herrgård`, html("Vi har tagit emot din bokning", rader));
  await skicka([site.email], `Ny bokning ${o.nummer}: ${o.namn}, ${o.ankomst}–${o.avresa}`,
    html("Ny bokning på webben", [`${o.namn} · ${o.epost}`, `${o.ankomst} till ${o.avresa}: ${o.enheter.join(", ")}`, `Summa ${kr}. ${o.hundar ? o.hundar + " hund(ar). " : ""}${o.frukost ? "Frukost. " : ""}${o.bricka ? "Välkomstbricka. " : ""}`, `Bekräfta i admin.`], ""), o.epost);
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

export async function mejlMedlemsansokan(o: { epost: string; namn: string; telefon: string; ort?: string; jakterfarenhet: string; hund?: string; meddelande?: string; niva: string; flera: boolean; yrke?: string }) {
  await skicka([o.epost], `Din ansökan till Westsura Herrgårds jaktklubb`, html("Tack för din ansökan", [
    `Hej ${o.namn}, vi har tagit emot din ansökan om medlemskap i jaktklubben.`,
    `Antalet platser är begränsat och medlemskap beviljas av herrgården. Vi läser din ansökan och hör av oss personligen — räkna med några dagar. Är säsongen fullsatt sätter vi upp dig på väntelistan och hör av oss när en plats blir ledig.`,
    `Frågor under tiden? Ring ${site.phone}.`,
  ], "Med vänliga hälsningar, Westsura Herrgård"));
  await skicka([site.email], `Medlemsansökan jaktklubben: ${o.namn}`, html("Ny medlemsansökan till jaktklubben", [
    `${fritext(o.namn)} · ${fritext(o.epost)} · ${fritext(o.telefon)}${o.ort ? " · " + fritext(o.ort) : ""}`,
    o.flera ? `Önskad nivå: <strong>${fritext(o.niva)}</strong>` : "",
    `<strong>Jakterfarenhet</strong><br>${fritext(o.jakterfarenhet)}`,
    o.yrke ? `<strong>Yrke och arbetstider</strong><br>${fritext(o.yrke)}` : "",
    o.hund ? `<strong>Hund</strong><br>${fritext(o.hund)}` : "",
    o.meddelande ? `<strong>Meddelande</strong><br>${fritext(o.meddelande)}` : "",
    `Hantera i admin under Jaktklubb.`,
  ].filter(Boolean), ""), o.epost);
}

/* ---------- Westsuras Vänner ---------- */

/** Välkomstmejl till nya vänner, med rabattkoden och en länk för att avsluta. */
export async function mejlVanValkommen(o: { epost: string; namn?: string | null; kod: string; procent: number; giltigTill: string; avsluta: string }) {
  const datum = new Date(o.giltigTill + "T12:00:00").toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  await skicka([o.epost], "Välkommen till Westsuras Vänner", html("Välkommen till Westsuras Vänner", [
    `${o.namn ? `Hej ${fritext(o.namn)}, tack` : "Tack"} för att du vill följa livet på herrgården.`,
    `Några gånger om året skickar vi nyheter från Westsura: säsongens meny, kommande evenemang och inbjudningar till höstdagar, julmarknad och temakvällar — ofta några dagar innan de blir offentliga.`,
    `Som vän till Westsura får du en tillfällig rabattkod på <strong>${o.procent} %</strong> när du bokar boende hos oss: <strong style="letter-spacing:.08em">${o.kod}</strong>`,
    `Koden är personlig, gäller en bokning och kan användas till och med <strong>${datum}</strong>. Skriv den i rutan för rabattkod när du bokar på <a href="${bas}/boende" style="color:#7d6530">${bas.replace(/^https?:\/\//, "")}/boende</a>.`,
  ], "Varmt välkommen till herrgården.") .replace("</div></body>",
    `<p style="font-size:12px;color:#6b9483;margin:16px 0 0">Vill du inte längre få mejl från oss? <a href="${o.avsluta}" style="color:#6b9483">Avsluta här</a>.</p></div></body>`));
}

/* ---------- Jaktklubbens medlemskap ---------- */

const medlemslank = () => `${process.env.NEXT_PUBLIC_SITE_URL || site.url}/jaktklubb/login`;

const inloggningsrad = (losenord: string | null) => losenord
  ? `Logga in i medlemsklubben på <a href="${medlemslank()}">${medlemslank()}</a> med den här e-postadressen och lösenordet <strong>${losenord}</strong>. Byt gärna till ett eget lösenord under Mitt medlemskap när du loggat in.`
  : `Logga in i medlemsklubben på <a href="${medlemslank()}">${medlemslank()}</a> med den här e-postadressen och ditt vanliga lösenord.`;

export async function mejlMedlemGodkand(o: { epost: string; namn: string; sasong: string; niva: string; avgift: number; losenord: string | null }) {
  await skicka([o.epost], `Välkommen till Westsura Herrgårds jaktklubb`, html("Ditt medlemskap är beviljat", [
    `Hej ${o.namn}, det är med glädje vi hälsar dig välkommen som medlem i jaktklubben för säsongen <strong>${o.sasong}</strong>.`,
    `Medlemskapet gäller nivån <strong>${fritext(o.niva)}</strong>. Årsavgiften, ${o.avgift.toLocaleString("sv-SE")} kr, faktureras separat och kommer i ett eget utskick.`,
    inloggningsrad(o.losenord),
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

const bokalank = () => `${process.env.NEXT_PUBLIC_SITE_URL || site.url}/jaktklubb/medlem/boka`;
const medlemskapslank = () => `${process.env.NEXT_PUBLIC_SITE_URL || site.url}/jaktklubb/medlem/medlemskap`;

export async function mejlDokumentstatus(o: { epost: string; namn: string; dokument: string; godkand: boolean; giltigTill?: string | null; kommentar?: string | null }) {
  if (o.godkand) {
    await skicka([o.epost], `${o.dokument} är godkänt`, html("Handlingen är godkänd", [
      `Hej ${o.namn}, vi har granskat din kopia på <strong>${fritext(o.dokument)}</strong> och den är godkänd.`,
      o.giltigTill ? `Den gäller till och med <strong>${o.giltigTill}</strong>. Vi hör av oss i god tid innan dess.` : "",
      `Du ser dina handlingar under Mitt medlemskap: <a href="${medlemskapslank()}">${medlemskapslank()}</a>.`,
    ].filter(Boolean), "Med vänliga hälsningar, Westsura Herrgård"));
    return;
  }
  await skicka([o.epost], `Vi behöver en ny kopia på ${o.dokument.toLowerCase()}`, html("Handlingen behöver kompletteras", [
    `Hej ${o.namn}, vi har tittat på din kopia på <strong>${fritext(o.dokument)}</strong> och behöver en ny.`,
    o.kommentar ? `<strong>Vår kommentar:</strong> ${fritext(o.kommentar)}` : "",
    `Ladda upp en ny kopia under Mitt medlemskap: <a href="${medlemskapslank()}">${medlemskapslank()}</a>. Hör gärna av dig om något är oklart — ${site.phone}.`,
  ].filter(Boolean), "Med vänliga hälsningar, Westsura Herrgård"));
}

export async function mejlDokumentKlar(o: { epost: string; namn: string }) {
  await skicka([o.epost], `Du är klar för säsongen`, html("Du är klar för säsongen", [
    `Hej ${o.namn}, dina tre handlingar är godkända: jaktkort, ID och älgskyttemärke.`,
    `Därmed är du klar att anmäla dig till säsongens jaktdagar. Välj en dag som passar: <a href="${bokalank()}">${bokalank()}</a>.`,
  ], "Vi ses i skogen."));
}

export async function mejlDokumentVantar(o: { namn: string; dokument: string }) {
  await skicka([site.email], `Dokument att granska: ${o.namn}`, html("Ett dokument väntar på granskning", [
    `${fritext(o.namn)} har laddat upp <strong>${fritext(o.dokument)}</strong> i medlemsklubben.`,
    `Granska det under Jaktklubb i admin.`,
  ], ""));
}

/** Skickas när en anmälan till jakt skapat ett nytt jägarkonto. */
export async function mejlJagarkonto(o: { epost: string; namn: string; titel: string; datum: string; losenord?: string | null }) {
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  await skicka([o.epost], `Ditt jägarkonto på Westsura`, html("Välkommen till jakten på Westsura", [
    `Hej ${o.namn}. I och med din anmälan till <strong>${o.titel}</strong> (${o.datum}) har du fått ett jägarkonto hos oss.`,
    `Innan din första jaktdag behöver tre saker vara klara i kontot: kopia på jaktkortet, en ID-handling och vår säkerhetskurs online — den tar en kvart. Vi granskar dokumenten inom en vardag.`,
    o.losenord
      ? `<a href="${bas}/jaktklubb/login" style="color:#7d6530">Logga in på jägarkontot</a> med den här e-postadressen och lösenordet <strong>${o.losenord}</strong>. Byt gärna till ett eget lösenord när du är inne.`
      : `<a href="${bas}/jaktklubb/login" style="color:#7d6530">Logga in på jägarkontot</a> med den här e-postadressen och ditt lösenord.`,
    `Kontot är kostnadsfritt. Vill du jaga mer hos oss under säsongen finns medlemskapet i jaktklubben, med ingående dagar och förtur till bokningen.`,
  ]));
}

/** Ny admin: vilka delar hen fått, och inloggningsuppgifter (lösenord bara om kontot skapades nu). */
export async function mejlAdminValkommen(o: { epost: string; namn: string; omraden: string[]; losenord?: string | null; av: string }) {
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  await skicka([o.epost], `Du har fått tillgång till Westsuras admin`, html("Välkommen till admin", [
    `Hej ${fritext(o.namn)}. ${fritext(o.av)} har gett dig tillgång till administrationen för Westsura Herrgård.`,
    `Du kommer åt: <strong>${o.omraden.map(fritext).join(", ")}</strong>.`,
    o.losenord
      ? `<a href="${bas}/admin/login" style="color:#7d6530">Logga in i admin</a> med den här e-postadressen och det tillfälliga lösenordet <strong>${o.losenord}</strong>. Byt till ett eget under <em>Byt lösenord</em> när du är inne.`
      : `<a href="${bas}/admin/login" style="color:#7d6530">Logga in i admin</a> med den här e-postadressen och ditt vanliga lösenord. Har du glömt det finns en länk på inloggningssidan.`,
  ]));
}

/* ---------- Kurser ---------- */

/** Bokningsbekräftelse för en kurs, och besked till herrgården. */
export async function mejlKursbokning(o: { epost: string; namn: string; telefon: string; kurs: string; datum: string; nummer: number; antal: number; rum: string; earlybird: boolean; prisPerPerson: number; summa: number; deltagare?: string; kost?: string; meddelande?: string }) {
  const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";
  await skicka([o.epost], `Bokningsbekräftelse: ${o.kurs}`, html(`Välkommen på ${o.kurs.toLowerCase()}`, [
    `Hej ${fritext(o.namn)}. Tack för din bokning — vi ser fram emot en helg med foto, natur och inspiration.`,
    `<strong>${fritext(o.kurs)}</strong><br>${fritext(o.datum)}<br>${o.antal} ${o.antal === 1 ? "deltagare" : "deltagare"} · ${o.rum}${o.earlybird ? " · Early Bird" : ""}<br>${kr(o.prisPerPerson)} per person · <strong>totalt ${kr(o.summa)}</strong><br>Bokningsnummer ${o.nummer}`,
    `Bokningen är bindande. Faktura skickas separat och betalas inom tio dagar. Får du förhinder kan du överlåta platsen till någon annan utan kostnad — meddela oss namn och kontaktuppgifter. Blir kursen inställd på grund av för få deltagare återbetalas hela beloppet.`,
    `Vi skickar program och praktisk information närmare kursen. Frågor? Ring ${site.phone} eller svara på det här mejlet.`,
  ]), site.email);
  await skicka([site.email], `Kursbokning ${o.nummer}: ${o.kurs} — ${o.namn}`, html("Ny kursbokning", [
    `${fritext(o.namn)} · ${fritext(o.epost)} · ${fritext(o.telefon)}`,
    `<strong>${fritext(o.kurs)}</strong>, ${o.antal} pers · ${o.rum}${o.earlybird ? " · Early Bird" : ""} · ${kr(o.summa)}`,
    o.deltagare ? `<strong>Övriga deltagare</strong><br>${fritext(o.deltagare)}` : "",
    o.kost ? `<strong>Kost och allergier</strong><br>${fritext(o.kost)}` : "",
    o.meddelande ? `<strong>Meddelande</strong><br>${fritext(o.meddelande)}` : "",
    `Fakturaunderlaget ligger under Fakturering i admin. Deltagarlistan finns under Kurser.`,
  ].filter(Boolean), ""), o.epost);
}

/* ---------- Hundekipage ---------- */

const EKIPAGENAMN: Record<string, string> = { hundforare: "hundförare", eftersok: "eftersöksekipage" };

/** Kvitto till den som registrerat ett ekipage, och besked till herrgården. */
export async function mejlEkipageRegistrerat(o: { epost: string; namn: string; telefon: string; ort?: string; ekipage: string; jagarexamen: boolean; hundar: { namn: string; ras: string | null; driver: string[]; eftersok: boolean; meriter: string | null }[]; meddelande?: string }) {
  await skicka([o.epost], `Ditt hundekipage hos Westsura Herrgård`, html("Tack för din registrering", [
    `Hej ${fritext(o.namn)}. Vi har tagit emot din registrering som ${EKIPAGENAMN[o.ekipage]} med ${o.hundar.map((h) => fritext(h.namn)).join(" och ")}.`,
    `Vi går igenom uppgifterna och hör av oss. När ekipaget är godkänt får du ett mejl med inloggning till ditt konto — och halva priset på boendet hos oss.`,
    `Frågor under tiden? Ring ${site.phone}.`,
  ], "Med vänliga hälsningar, Westsura Herrgård"));
  await skicka([site.email], `Nytt hundekipage: ${o.namn}`, html("Nytt hundekipage att godkänna", [
    `${fritext(o.namn)} · ${fritext(o.epost)} · ${fritext(o.telefon)}${o.ort ? " · " + fritext(o.ort) : ""}`,
    `<strong>${EKIPAGENAMN[o.ekipage].replace(/^./, (c) => c.toUpperCase())}</strong> · jägarexamen: ${o.jagarexamen ? "ja" : "nej"}`,
    ...o.hundar.map((h) => `<strong>${fritext(h.namn)}</strong>${h.ras ? ", " + fritext(h.ras) : ""}${h.driver.length ? " — " + h.driver.join(", ") : ""}${h.eftersok ? " · eftersök" : ""}${h.meriter ? "<br>" + fritext(h.meriter) : ""}`),
    o.meddelande ? `<strong>Meddelande</strong><br>${fritext(o.meddelande)}` : "",
    `Godkänn under Jaktklubb › Hundekipage i admin.`,
  ].filter(Boolean), ""), o.epost);
}

/** Ekipaget är godkänt — med inloggning (lösenord bara om kontot skapades nu). */
export async function mejlEkipageGodkant(o: { epost: string; namn: string; losenord?: string | null; rabatt: number }) {
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  await skicka([o.epost], `Ditt hundekipage är godkänt`, html("Välkommen som hundekipage", [
    `Hej ${fritext(o.namn)}. Ditt ekipage är godkänt hos Westsura Herrgård. Vi hör av oss inför jakter där vi behöver hundar.`,
    o.losenord
      ? `<a href="${bas}/jaktklubb/login" style="color:#7d6530">Logga in på ditt konto</a> med den här e-postadressen och lösenordet <strong>${o.losenord}</strong>. Byt gärna till ett eget när du är inne.`
      : `<a href="${bas}/jaktklubb/login" style="color:#7d6530">Logga in på ditt konto</a> med den här e-postadressen och ditt lösenord.`,
    `Som godkänt ekipage får du ${o.rabatt} % rabatt på boendet för dig och hunden, och medlemspris på maten. Logga in innan du <a href="${bas}/boende" style="color:#7d6530">bokar boende</a> så dras rabatten automatiskt.`,
  ]));
}

/** Inbjudan till en jaktdag, skickad från admin till utvalda ekipage. */
export async function mejlEkipageInbjudan(o: { epost: string; namn: string; titel: string; datum: string; tid?: string | null; text?: string }) {
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  await skicka([o.epost], `Inbjudan: ${o.titel} ${o.datum}`, html("Vi behöver hundar", [
    `Hej ${fritext(o.namn)}. Vi skulle gärna ha med dig och din hund på <strong>${fritext(o.titel)}</strong>, ${o.datum}${o.tid ? ", " + fritext(o.tid) : ""}.`,
    o.text ? fritext(o.text) : "",
    `Svara på det här mejlet eller ring ${site.phone} om du kan vara med. Vill du stanna över natten bor du till halva priset — <a href="${bas}/boende" style="color:#7d6530">boka här</a> när du är inloggad.`,
  ].filter(Boolean)), site.email);
}

/* ---------- Vak & pyrsch ---------- */

const vaklank = () => `${process.env.NEXT_PUBLIC_SITE_URL || site.url}/jaktklubb/medlem/vak`;

/** Kvitto på en önskan om vak-/pyrschdygn, och besked till herrgården. */
export async function mejlVakOnskad(o: { epost: string; namn: string; datum: string; typ: string; omrade?: string | null; pris: number; meddelande?: string | null; gast: boolean }) {
  await skicka([o.epost], `Din önskan: ${o.typ} ${o.datum}`, html("Vi har tagit emot din önskan", [
    `Hej ${o.namn}. Du har önskat <strong>${o.typ}</strong> dygnet <strong>${o.datum}</strong>${o.omrade ? `, helst ${fritext(o.omrade)}` : ""}.`,
    `Jaktledaren tittar på vilka områden som är lediga och bekräftar inom en vardag. Du får ett mejl med område och praktiska uppgifter.`,
    o.pris ? `Pris: <strong>${o.pris.toLocaleString("sv-SE")} kr</strong> — faktureras efter dygnet.` : `Dygnet ingår i ditt medlemskap.`,
    `Du ser dina dygn på <a href="${vaklank()}">${vaklank()}</a>.`,
  ]));
  await skicka([site.email], `Vak/pyrsch önskas: ${o.namn}, ${o.datum}`, html("Önskat vak-/pyrschdygn", [
    `${fritext(o.namn)} · ${fritext(o.epost)} · ${o.gast ? "gästjägare" : "medlem"}`,
    `${o.typ}, ${o.datum}${o.omrade ? `, önskar ${fritext(o.omrade)}` : ""}${o.pris ? `, ${o.pris} kr` : ", ingår"}`,
    o.meddelande ? `<strong>Meddelande</strong><br>${fritext(o.meddelande)}` : "",
    `Svara under Jaktklubb › Vak & pyrsch i admin.`,
  ].filter(Boolean), ""), o.epost);
}

/** Jaktledarens svar: bekräftat med område, eller avböjt. */
export async function mejlVakSvar(o: { epost: string; namn: string; datum: string; typ: string; bekraftad: boolean; omrade?: string | null; vagbeskrivning?: string | null; svar?: string | null; pris: number }) {
  if (o.bekraftad) {
    await skicka([o.epost], `Bekräftat: ${o.typ} ${o.datum}`, html("Ditt dygn är bekräftat", [
      `Hej ${o.namn}. <strong>${o.typ}</strong> dygnet <strong>${o.datum}</strong> är bekräftat.`,
      o.omrade ? `Område: <strong>${fritext(o.omrade)}</strong>.${o.vagbeskrivning ? `<br>${fritext(o.vagbeskrivning)}` : ""}` : "",
      o.svar ? `<strong>Från jaktledaren:</strong> ${fritext(o.svar)}` : "",
      `Kom ihåg: jaktkort, ID och säkerhetskursen ska vara klara i kontot före dygnet. Rapportera skott och fällt vilt till jaktledaren direkt efteråt.`,
      o.pris ? `Pris ${o.pris.toLocaleString("sv-SE")} kr, faktureras efter dygnet.` : "",
      `Dina dygn: <a href="${vaklank()}">${vaklank()}</a>.`,
    ].filter(Boolean), "Skitjakt!"));
    return;
  }
  await skicka([o.epost], `Tyvärr: ${o.typ} ${o.datum}`, html("Dygnet gick inte att ordna", [
    `Hej ${o.namn}. Vi kan tyvärr inte erbjuda <strong>${o.typ}</strong> dygnet <strong>${o.datum}</strong>.`,
    o.svar ? `<strong>Från jaktledaren:</strong> ${fritext(o.svar)}` : "",
    `Önska gärna ett annat datum: <a href="${vaklank()}">${vaklank()}</a>, eller ring ${site.phone}.`,
  ].filter(Boolean), "Med vänliga hälsningar, Westsura Herrgård"));
}

/** Det som behövs om ett tillfälle för att beskriva det i ett mejl. */
export type AnmalanMejl = {
  epost: string; namn: string; antal: number;
  titel: string; datum: string; tid?: string | null; pris?: number | null; samling?: string | null; typ?: string | null; slug?: string | null;
};

const MANAD = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const VECKODAG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
/** "2026-10-31" → "lördag 31 oktober 2026" */
const mejldatum = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return isNaN(d.getTime()) ? iso : `${VECKODAG[d.getDay()]} ${d.getDate()} ${MANAD[d.getMonth()]} ${d.getFullYear()}`;
};

/** Ruta med tillfällets detaljer: namn, datum och tid, plats, antal, pris och länk. */
function tillfalleRuta(o: AnmalanMejl) {
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  const lank = o.slug ? `${bas}/aktuellt/${o.slug}` : o.typ && o.typ !== "evenemang" ? `${bas}/jakt` : null;
  const pris = o.pris == null ? "" : o.pris === 0 ? "Fri entré"
    : `${o.pris.toLocaleString("sv-SE")} kr per person${o.antal > 1 ? ` · totalt ${(o.pris * o.antal).toLocaleString("sv-SE")} kr` : ""}`;
  return [
    `<strong>${fritext(o.titel)}</strong>`,
    `${mejldatum(o.datum).replace(/^./, (c) => c.toUpperCase())}${o.tid ? `, ${fritext(o.tid)}` : ""}`,
    o.samling ? fritext(o.samling) : `${site.name}, ${site.address.street}, ${site.address.city}`,
    `${o.antal} ${o.antal === 1 ? "person" : "personer"}${pris ? ` · ${pris}` : ""}`,
    lank ? `<a href="${lank}" style="color:#7d6530">Läs mer om ${o.typ === "evenemang" ? "evenemanget" : "dagen"} →</a>` : "",
  ].filter(Boolean).join("<br>");
}

/** Kvitto direkt när någon anmäler sig — med väntelista om det är fullt. Kopia till herrgården. */
export async function mejlAnmalan(o: AnmalanMejl & { status: string }) {
  const vantelista = o.status === "vantelista";
  await skicka([o.epost], vantelista ? `Du står på väntelistan: ${o.titel}` : `Vi har tagit emot din anmälan: ${o.titel}`, html(
    vantelista ? "Du står på väntelistan" : "Vi har tagit emot din anmälan",
    [
      `Hej ${fritext(o.namn)}. ${vantelista
        ? "Det är fullbokat just nu, men du står på väntelistan. Blir en plats ledig hör vi av oss direkt."
        : "Tack för din anmälan! Vi går igenom den och skickar en bekräftelse inom en vardag."}`,
      tillfalleRuta(o),
      `Frågor eller ändringar? Svara på det här mejlet eller ring ${site.phone}.`,
    ]), site.email);
  await skicka([site.email], `${vantelista ? "Väntelista" : "Anmälan"}: ${o.titel} — ${o.namn}`, html("Ny anmälan", [
    `${fritext(o.namn)} · ${fritext(o.epost)}`, tillfalleRuta(o), `Status: ${vantelista ? "väntelista" : "anmäld — bekräfta under Tillfällen i admin, så får gästen ett mejl"}`,
  ], ""), o.epost);
}

/** Skickas när herrgården ändrar status i admin: bekräftad plats eller flyttad till väntelistan. */
export async function mejlAnmalanStatus(o: AnmalanMejl & { status: "bekraftad" | "vantelista" }) {
  const bekraftad = o.status === "bekraftad";
  await skicka([o.epost], bekraftad ? `Bekräftat: ${o.titel}` : `Du står på väntelistan: ${o.titel}`, html(
    bekraftad ? "Din plats är bekräftad" : "Du står på väntelistan",
    [
      `Hej ${fritext(o.namn)}. ${bekraftad
        ? `Din plats är bekräftad — varmt välkommen!`
        : "Just nu är alla platser tagna, så vi har satt dig på väntelistan. Blir en plats ledig hör vi av oss direkt — du behöver inte göra något."}`,
      tillfalleRuta(o),
      bekraftad
        ? `Får du förhinder? Hör av dig så snart du kan, så kan någon på väntelistan få platsen. Svara på det här mejlet eller ring ${site.phone}.`
        : `Frågor? Svara på det här mejlet eller ring ${site.phone}.`,
    ]), site.email);
}
