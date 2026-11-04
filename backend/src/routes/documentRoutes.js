const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const express = require('express');
const multer = require('multer');
const { maxUploadSizeBytes, storageDirectory } = require('../config/storageConfig');
const documentController = require('../controllers/documentController');
const HttpError = require('../errors/HttpError');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true })
      .then(() => callback(null, storageDirectory), callback);
  },
  filename(req, file, callback) {
    callback(null, crypto.randomUUID());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxUploadSizeBytes,
    files: 1,
  },
});

function uploadFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (
      error &&
      ['Malformed part header', 'Multipart: Boundary not found', 'Unexpected end of form']
        .includes(error.message)
    ) {
      return next(
        new HttpError(400, 'INVALID_MULTIPART', 'A requisição de upload é inválida.')
      );
    }

    return next(error);
  });
}

router.post(
  '/upload',
  documentController.requireUserId,
  uploadFile,
  documentController.upload
);
router.get('/documents', documentController.requireUserId, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.requireUserId,
  documentController.download
);

module.exports = router;
