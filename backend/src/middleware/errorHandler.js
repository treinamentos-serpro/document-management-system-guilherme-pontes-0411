const multer = require('multer');
const HttpError = require('../errors/HttpError');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'O arquivo excede o limite permitido.',
        },
      });
    }

    return res.status(400).json({
      error: {
        code: 'INVALID_MULTIPART',
        message: 'A requisição de upload é inválida.',
      },
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  console.error('Erro inesperado no backend:', error);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocorreu um erro interno.',
    },
  });
}

module.exports = errorHandler;
