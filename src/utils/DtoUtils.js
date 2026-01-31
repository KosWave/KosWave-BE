function returnDto(code, status, message) {
  return {
    code: code,
    status: status,
    message: message,
    createdAt: new Date().toISOString(),
  };
}

module.exports = { returnDto };
