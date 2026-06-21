/**
 * Extracts a clean, user-facing message from an Apollo/GraphQL/unknown error.
 * The backend (NestJS) already returns friendly Spanish messages — this just
 * pulls the right field out regardless of Apollo Client's error shape.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Ha ocurrido un error. Inténtalo de nuevo.',
): string {
  const e = error as any;

  const gqlMessage =
    e?.graphQLErrors?.[0]?.message ??
    e?.errors?.[0]?.message ??
    e?.cause?.errors?.[0]?.message;
  if (typeof gqlMessage === 'string' && gqlMessage.trim()) return gqlMessage;

  if (e?.networkError)
    return 'Error de conexión. Revisa tu internet e inténtalo de nuevo.';

  if (typeof e?.message === 'string' && e.message.trim()) return e.message;
  if (typeof error === 'string' && error.trim()) return error;

  return fallback;
}

/** True when the error carries GraphQL errors (i.e. the backend rejected it). */
export function isGraphQLError(error: unknown): boolean {
  const e = error as any;
  return Boolean(e?.graphQLErrors?.length || e?.errors?.length);
}
