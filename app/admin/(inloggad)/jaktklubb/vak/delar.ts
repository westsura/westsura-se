import type { Vakbokning } from "@/lib/vak";

export type BokningMedJagare = Vakbokning & {
  jagare: { id: string; namn: string; epost: string; telefon: string | null; status: string; kurs_godkand: string | null } | null;
  dokument_ok?: boolean;
};
