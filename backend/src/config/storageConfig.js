const path = require('node:path');

const backendRoot = path.resolve(__dirname, '../..');
const storageDirectory = process.env.STORAGE_DIR
  ? path.resolve(backendRoot, process.env.STORAGE_DIR)
  : path.join(backendRoot, 'storage');
const defaultMaxUploadSizeBytes = 10 * 1024 * 1024;
const configuredMaxUploadSizeBytes = process.env.MAX_UPLOAD_SIZE_BYTES;

function getMaxUploadSizeBytes() {
  if (configuredMaxUploadSizeBytes === undefined) {
    return defaultMaxUploadSizeBytes;
  }

  if (!/^\d+$/.test(configuredMaxUploadSizeBytes)) {
    throw new Error('MAX_UPLOAD_SIZE_BYTES deve ser um inteiro positivo.');
  }

  const maxUploadSizeBytes = Number(configuredMaxUploadSizeBytes);
  if (!Number.isSafeInteger(maxUploadSizeBytes) || maxUploadSizeBytes < 1) {
    throw new Error('MAX_UPLOAD_SIZE_BYTES deve ser um inteiro positivo.');
  }

  return maxUploadSizeBytes;
}

module.exports = {
  storageDirectory,
  maxUploadSizeBytes: getMaxUploadSizeBytes(),
};
