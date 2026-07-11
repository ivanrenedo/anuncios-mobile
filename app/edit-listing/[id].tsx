/**
 * Dedicated route for editing an existing listing. Reuses the Post form and
 * feeds it the `id` route param as `editId`. Living on the root Stack (not
 * inside the tabs) means back navigation returns to the caller (Perfil /
 * detalle de producto) instead of jumping to Home like a tab switch would.
 */
export { default } from '@/app/(tabs)/post';
