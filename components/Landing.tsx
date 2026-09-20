import { Hero, DogBand } from "@/components/Blocks";
import InquiryForm from "@/components/InquiryForm";

export type Faq = { q: string; a: string };

/** Landningssida för en sökintention: bröllop, firande, minnesstund, konferens… */
export default function Landing({
  hero, label, title, lede, intro, sections, faq, formTyp, formAlternativ, facts, dog = false,
}: {
  hero: { src: string; alt: string; remote?: boolean };
  label: string; title: string; lede: string;
  intro: React.ReactNode;
  sections: { h: string; body: React.ReactNode }[];
  faq: Faq[];
  formTyp: string; formAlternativ?: string[];
  facts?: { b: string; s: string }[];
  dog?: boolean;
}) {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Hero src={hero.src} alt={hero.alt} remote={hero.remote} sub label={label} title={title} lede={lede} />

      <section className="section section--tight">
        <div className="container">
          <div className="split split--start">
            <div className="prose">{intro}</div>
            <div>
              {facts && (
                <div className="facts">
                  {facts.map((f) => <div key={f.s}><b>{f.b}</b><span>{f.s}</span></div>)}
                </div>
              )}
              <div className="notice">
                <strong>Så går det till.</strong> Skicka en förfrågan eller ring. Vi hör av oss inom en vardag med ett förslag på upplägg. Inget är bindande förrän ni fått vår bekräftelse.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section tint">
        <div className="container">
          <div className="grid grid-2 grid--wide">
            {sections.map((s) => (
              <div key={s.h} className="prose">
                <h2 className="lower">{s.h}</h2>
                {s.body}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section band" id="forfragan">
        <div className="container split split--start">
          <div>
            <p className="label">Skicka en förfrågan</p>
            <h2 className="lower">berätta vad ni tänker er</h2>
            <p>Fyll i det ni vet, så ringer vi upp. Ni kan lika gärna ringa direkt — det gör många, och det går ofta fortare.</p>
            <p className="label faq__label">Vanliga frågor</p>
            {faq.map((f) => (
              <details key={f.q} className="faq">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <div><InquiryForm typ={formTyp} alternativ={formAlternativ} /></div>
        </div>
      </section>

      {dog && <DogBand short />}
    </>
  );
}
