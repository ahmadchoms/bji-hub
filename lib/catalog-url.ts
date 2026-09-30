/**
 * Build a catalog href preserving current params, applying overrides,
 * always dropping `halaman` (pagination resets on any filter change).
 * Pass undefined as a value to remove that key.
 */
export function buildCatalogHref(
  current: URLSearchParams | Record<string, string>,
  overrides: Record<string, string | undefined>
): string {
  const p =
    current instanceof URLSearchParams
      ? new URLSearchParams(current.toString())
      : new URLSearchParams(current);

  // Apply overrides
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === "") {
      p.delete(key);
    } else {
      p.set(key, value);
    }
  }

  // Always reset pagination on filter change
  p.delete("halaman");

  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}
