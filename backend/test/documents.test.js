const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_UPLOAD_SIZE_BYTES = '32';

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await fsPromises.rm(storageDirectory, { recursive: true, force: true });
});

test('uploads, lists and downloads documents only for their owner', async () => {
  const owner = 'user-123';
  const form = new FormData();
  form.append('file', new Blob(['document contents']), 'report.txt');

  const missingUserResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: form,
  });
  assert.equal(missingUserResponse.status, 400);
  assert.equal(fs.readdirSync(storageDirectory).length, 0);

  const uploadForm = new FormData();
  uploadForm.append('file', new Blob(['document contents']), 'report.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: uploadForm,
  });
  assert.equal(uploadResponse.status, 201);

  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'report.txt');
  assert.equal(document.size, Buffer.byteLength('document contents'));
  assert.equal(document.owner, owner);
  assert.match(document.id, /^[0-9a-f-]{36}$/i);
  assert.equal(fs.readdirSync(storageDirectory).join(''), document.id);

  const ownerListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': owner },
  });
  assert.deepEqual(await ownerListResponse.json(), { documents: [document] });

  const otherUserListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'other-user' },
  });
  assert.deepEqual(await otherUserListResponse.json(), { documents: [] });

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': owner } }
  );
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-type'), /application\/octet-stream/);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.equal(await downloadResponse.text(), 'document contents');

  const unauthorizedDownloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: { 'X-User-Id': 'other-user' } }
  );
  assert.equal(unauthorizedDownloadResponse.status, 404);
  assert.deepEqual(await unauthorizedDownloadResponse.json(), {
    error: {
      code: 'DOCUMENT_NOT_FOUND',
      message: 'Documento não encontrado.',
    },
  });

  const invalidIdResponse = await fetch(`${baseUrl}/documents/not-a-uuid/download`, {
    headers: { 'X-User-Id': owner },
  });
  assert.equal(invalidIdResponse.status, 400);

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob(['x'.repeat(33)]), 'large.txt');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: oversizedForm,
  });
  assert.equal(oversizedResponse.status, 413);
  assert.deepEqual(
    (await (await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': owner },
    })).json()).documents.map((item) => item.id),
    [document.id]
  );
});
