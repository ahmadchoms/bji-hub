export type FieldErrors = Record<string, string[]>;

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: FieldErrors };

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(
  error: string,
  fieldErrors?: FieldErrors,
): ActionResult<never> {
  return { success: false, error, fieldErrors };
}
