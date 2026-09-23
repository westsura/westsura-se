export type Avsnitt = { id: string; ordning: number; rubrik: string; text: string; publicerad: boolean };
export type Fraga = { id: string; avsnitt_id: string | null; ordning: number; fraga: string; alternativ: string[]; ratt: number; kritisk: boolean; forklaring: string | null; publicerad: boolean };
