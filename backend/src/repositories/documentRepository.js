const path = require('node:path');
const { storageDirectory } = require('../config/storageConfig');

const documents = new Map();

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
  return path.join(storageDirectory, id);
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
