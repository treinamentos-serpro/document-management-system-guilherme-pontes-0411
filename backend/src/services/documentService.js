const HttpError = require('../errors/HttpError');
const documentRepository = require('../repositories/documentRepository');

function createDocument(file, owner) {
  const document = {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype || 'application/octet-stream',
  };

  return documentRepository.add(document);
}

function listDocuments(owner) {
  return documentRepository.listByOwner(owner);
}

function getDocumentForDownload(id, owner) {
  const document = documentRepository.findByIdAndOwner(id, owner);
  if (!document) {
    throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return {
    document,
    filePath: documentRepository.getFilePath(id),
  };
}

async function removeUploadedFile(id) {
  await documentRepository.removeStoredFile(id);
}

module.exports = {
  createDocument,
  getDocumentForDownload,
  listDocuments,
  removeUploadedFile,
};
