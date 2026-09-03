// Fold — /admin.html
// Shadow of the static admin.html asset. Serves the login form when
// unauthenticated, or the admin dashboard when a valid session exists.
// Unauthorized visitors never see any admin data.
import { adminGate } from './api/_lib/adminGate.js';

export async function onRequest(context) {
  return adminGate(context);
}
