const path = require('node:path');
const { storageDirectory } = require('../config/storageConfig');

const documents = new Map();
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
    mimeType: document.mimeType,
  };
}

function add(document) {
  documents.set(document.id, { ...document });
  return toPublicDocument(document);
}

function listByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
    .map(toPublicDocument);
}

function findByIdAndOwner(id, owner) {
  const document = documents.get(id);
  if (!document || document.owner !== owner) {
    return null;
  }

  return toPublicDocument(document);
}

function getFilePath(id) {
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throw new TypeError('Identificador de documento inválido.');
  }

  const filePath = path.resolve(storageDirectory, id);
  const relativePath = path.relative(storageDirectory, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new TypeError('Caminho do documento fora do diretório de armazenamento.');
  }

  return filePath;
}

async function removeStoredFile(id) {
  const fs = require('node:fs/promises');
  await fs.unlink(getFilePath(id));
}

module.exports = {
  add,
  findByIdAndOwner,
  getFilePath,
  listByOwner,
  removeStoredFile,
};
