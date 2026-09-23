export type SasongRad = { id: string; namn: string; fran: string; till: string; moms: number; aktiv: boolean };
export type NivaRad = { id: string; sasong_id: string; namn: string; beskrivning: string | null; avgift: number; platser: number; bokning_oppnar: string | null; ordning: number };
