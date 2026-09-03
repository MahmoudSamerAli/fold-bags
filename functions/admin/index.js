// Fold — /admin
// Entry point for the admin area. Serves the login form when unauthenticated,
// or the admin dashboard when a valid session exists.
import { adminGate } from '../api/_lib/adminGate.js';

export async function onRequest(context) {
  return adminGate(context);
}
