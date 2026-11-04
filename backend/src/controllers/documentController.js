const HttpError = require('../errors/HttpError');
const documentService = require('../services/documentService');

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireUserId(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) {
    return next(new HttpError(400, 'USER_ID_REQUIRED', 'O cabeçalho X-User-Id é obrigatório.'));
  }

  req.userId = owner;
  return next();
}

async function upload(req, res) {
  if (!req.file) {
    throw new HttpError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  try {
    const document = documentService.createDocument(req.file, req.userId);
    return res.status(201).json(document);
  } catch (error) {
    try {
      await documentService.removeUploadedFile(req.file.filename);
    } catch (cleanupError) {
      console.error('Falha ao remover arquivo após erro no upload:', cleanupError);
    }

    throw error;
  }
}

function list(req, res) {
  return res.json({
    documents: documentService.listDocuments(req.userId),
  });
}

function download(req, res, next) {
  const { id } = req.params;
  if (!UUID_PATTERN.test(id)) {
    return next(new HttpError(400, 'INVALID_DOCUMENT_ID', 'Identificador de documento inválido.'));
  }

  let download;
  try {
    download = documentService.getDocumentForDownload(id, req.userId);
  } catch (error) {
    return next(error);
  }

  res.set('Content-Type', 'application/octet-stream');
  return res.download(download.filePath, download.document.originalName, (error) => {
    if (error) {
      return next(error);
    }
  });
}

module.exports = {
  download,
  list,
  requireUserId,
  upload,
};
