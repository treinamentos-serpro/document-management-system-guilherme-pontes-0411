const defaultPort = 3000;

function getPort(value = process.env.PORT) {
  if (value === undefined) {
    return defaultPort;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
  }

  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
  }

  return port;
}

module.exports = { getPort };
