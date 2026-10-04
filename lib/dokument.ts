/**
 * Filter för medlemsdokument som gäller i dag: utan giltighetsdatum (ID-handling) eller
 * med ett datum som inte passerat. Jaktkort och älgskyttemärke gäller ett jaktår i taget.
 * Används som `.or(giltigaIdag())` efter `.eq("status", "godkand")`.
 */
export const giltigaIdag = () => `giltig_till.is.null,giltig_till.gte.${new Date().toISOString().slice(0, 10)}`;
