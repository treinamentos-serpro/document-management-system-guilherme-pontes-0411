const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const express = require('express');
const multer = require('multer');
const { maxUploadSizeBytes, storageDirectory } = require('../config/storageConfig');
const documentController = require('../controllers/documentController');

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

router.post(
  '/upload',
  documentController.requireUserId,
  upload.single('file'),
  documentController.upload
);
router.get('/documents', documentController.requireUserId, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.requireUserId,
  documentController.download
);

module.exports = router;
