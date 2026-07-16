import { getRows, json, error } from '../../_lib/sheets.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'GET') return handleGet(env);
  return error('Method not allowed', 405);
}

async function handleGet(env) {
  const rows = await getRows(env, 'Products');
  return json(rows);
}
