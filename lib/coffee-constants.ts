export const GRIND_SIZE_OPTIONS = [
  {
    value: "Biji Utuh",
    label: "Biji Utuh (Whole Bean)",
    desc: "Biji sangrai utuh, giling sendiri di rumah",
  },
  {
    value: "Giling Kasar",
    label: "Giling Kasar (Coarse)",
    desc: "Cold Brew, French Press",
  },
  {
    value: "Giling Sedang",
    label: "Giling Sedang (Medium)",
    desc: "V60, Aeropress, Kalita Wave, Filter",
  },
  {
    value: "Giling Halus",
    label: "Giling Halus (Fine)",
    desc: "Espresso, Kopi Tubruk, Mokapot",
  },
] as const;

export type GrindSize = (typeof GRIND_SIZE_OPTIONS)[number]["value"];
