import type { Metadata } from "next";
import { PageHead } from "@/components/Blocks";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Integritetspolicy", description: "Så hanterar Westsura Herrgård dina personuppgifter.", alternates: { canonical: "/integritetspolicy" }, robots: { index: false } };

export default function Integritet() {
  return (
    <>
      <PageHead label="Bra att veta" title="integritetspolicy" lede="På Westsura Herrgård värnar vi om din personliga integritet. Här förklarar vi hur vi samlar in, använder och skyddar dina personuppgifter." />
      <section style={{ paddingBottom: 96 }}>
        <div className="container prose">
          <h2 className="lower">personuppgiftsansvarig</h2>
          <p>{site.company}, org.nr {site.orgNr}, {site.address.street}, {site.address.zip} {site.address.city}.</p>
          <h2 className="lower">vilka uppgifter vi samlar in och varför</h2>
          <p>Namn, adress, e-postadress, telefonnummer samt information du själv väljer att dela med oss. Uppgifterna behövs för att hantera och bekräfta bokningar, kontakta dig vid frågor eller ändringar, genomföra betalningar och skicka bekräftelser och relevant information.</p>
          <h2 className="lower">westsuras vänner och nyhetsbrev</h2>
          <p>När du anmäler dig till Westsuras Vänner sparar vi ditt namn, din e-postadress, tidpunkten för samtycket och var du anmälde dig. Du kan avsluta prenumerationen när som helst via länken i varje utskick.</p>
          <h2 className="lower">hur länge vi sparar uppgifterna</h2>
          <p>Bokningsuppgifter sparas under bokningen och upp till 26 månader efter avslutad vistelse eller betalning, därefter anonymiseras de. E-postkonversationer i samband med bokningar sparas i 12 månader efter avslutad vistelse.</p>
          <h2 className="lower">när vi delar dina uppgifter</h2>
          <p>Med personuppgiftsbiträden som leverantörer av betallösningar, IT-drift och nyhetsbrev, som endast får behandla uppgifterna enligt våra instruktioner. Med självständigt personuppgiftsansvariga som myndigheter när vi är skyldiga enligt lag, eller inkassobolag vid obetalda fordringar.</p>
          <h2 className="lower">dina rättigheter</h2>
          <ul>
            <li>Rätt till tillgång — begär ett registerutdrag.</li>
            <li>Rätt till radering — om uppgifterna inte längre behövs eller du motsätter dig marknadsföring.</li>
            <li>Rätt att invända mot direktmarknadsföring.</li>
          </ul>
          <h2 className="lower">cookies</h2>
          <p>Webbplatsen använder endast nödvändiga cookies för att fungera. Statistik och analys sätts inte utan ditt godkännande.</p>
          <p>Frågor: <a href={`mailto:${site.email}`}>{site.email}</a></p>
        </div>
      </section>
    </>
  );
}
