const db = require("../models/DB");

async function getAuthToken(apiHost) {
  try {
    const authToken = await db.AuthToken.findOne({
      where: { name: apiHost },
      order: [['updatedAt', 'DESC']]
    });
    
    return authToken.dataValues;
  } catch (error) {
    return null;
  }
}

async function setAuthToken(
  apiHost,
  accessToken,
  tokenExpired,
  tokenType = "Bearer"
) {
  await db.AuthToken.create({
    name: apiHost,
    access_token: accessToken,
    access_token_expired: tokenExpired,
    token_type: tokenType,
  });
}

async function updateAuthToken(
  apiHost,
  accessToken,
  tokenExpired,
  tokenType = "Bearer"
) {
  await db.AuthToken.update(
    {
      access_token: accessToken,
      access_token_expired: tokenExpired,
      token_type: tokenType,
    },
    {
      where: { name: apiHost },
    }
  );
}

module.exports = { getAuthToken, setAuthToken, updateAuthToken };
