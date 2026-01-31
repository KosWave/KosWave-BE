const db = require("../models/DB");

async function getCache(keyword, social, period) {
  try {
    const cacheData = await db.Cache.findOne({
      where: {
        keyword: keyword,
        social: social,
        period: period,
      },
      order: [["updatedAt", "DESC"]],
    });

    return cacheData;
  } catch (error) {
    console.log("cacheError", error);
    return null;
  }
}

async function setCache(keyword, social, period, data) {
  await db.Cache.create({
    keyword: keyword,
    social: social,
    period: period,
    data: data,
  });
}

async function updateCache(keyword, social, period, data) {
  await db.Cache.update(
    {
      data: data,
      updatedAt: Date.now(),
    },
    {
      where: {
        keyword: keyword,
        social: social,
        period: period,
      },
    }
  );
}

function isExpired(cache) {
  if (cache === null || cache === undefined) return true;
  const givenDate = new Date(cache.updatedAt);

  const expirationDate = new Date(givenDate.getTime() + 24 * 60 * 60 * 1000);

  const currentDate = new Date();

  return expirationDate < currentDate;
}

module.exports = { getCache, setCache, updateCache, isExpired };
