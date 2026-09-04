/** Delas av server och klient — får inte importera något som kräver next/headers. */
export const FAKTURASTATUS: Record<string, string> = { ej_fakturerad: "Att fakturera", fakturerad: "Fakturerad", betald: "Betald", krediterad: "Krediterad" };
export const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";
