export interface B2BTaxInfo {
  companyName: string | null;
  npwp: string | null;
  cleanNotes: string;
}

export function parseB2BTaxInfo(rawNotes?: string | null): B2BTaxInfo {
  if (!rawNotes) return { companyName: null, npwp: null, cleanNotes: "" };

  const match = rawNotes.match(/\[FAKTUR B2B:\s*(.*?)(?:NPWP:\s*([\d.\w-]+))?\]/);
  if (!match) return { companyName: null, npwp: null, cleanNotes: rawNotes.trim() };

  const rawCompany = match[1]?.trim() || null;
  const companyName = rawCompany && rawCompany !== "-" ? rawCompany : null;
  const rawNpwp = match[2]?.trim() || null;
  const npwp = rawNpwp && rawNpwp !== "-" ? rawNpwp : null;

  const cleanNotes = rawNotes
    .replace(/\[FAKTUR B2B:.*?\]/, "")
    .replace(/^\s*\|\s*|\s*\|\s*$/g, "")
    .trim();

  return { companyName, npwp, cleanNotes };
}

export function formatB2BTaxNote(companyName?: string, npwp?: string): string {
  const comp = companyName?.trim();
  const tax = npwp?.trim();
  if (!comp && !tax) return "";
  return `[FAKTUR B2B: ${comp ? comp + " " : ""}NPWP: ${tax || "-"}]`;
}
