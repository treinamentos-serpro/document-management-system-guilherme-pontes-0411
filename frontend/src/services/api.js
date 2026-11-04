const API_BASE_URL = '/api';
const USER_ID_STORAGE_KEY = 'dms-user-id';

export function getOrCreateUserId() {
  const savedUserId = window.localStorage.getItem(USER_ID_STORAGE_KEY)?.trim();
  if (savedUserId) {
    return savedUserId;
  }

  const userId = window.crypto.randomUUID();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  return userId;
}

function getHeaders(userId) {
  return { 'X-User-Id': userId };
}

async function ensureSuccess(response) {
  if (response.ok) {
    return response;
  }

  const fallbackMessage = `Não foi possível concluir a solicitação (${response.status}).`;
  const payload = await response.json();
  const message = payload?.error?.message;
  throw new Error(typeof message === 'string' ? message : fallbackMessage);
}

export async function listDocuments(userId) {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    headers: getHeaders(userId),
  });
  await ensureSuccess(response);
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: getHeaders(userId),
    body: formData,
  });
  await ensureSuccess(response);
  return response.json();
}

export async function downloadDocument(id, userId) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${encodeURIComponent(id)}/download`,
    { headers: getHeaders(userId) }
  );
  await ensureSuccess(response);
  return response.blob();
}
