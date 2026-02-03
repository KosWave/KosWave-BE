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

  if(!isValidData(data)) {
    console.log("데이터 이상 캐싱 탐지")
    return false;
  }

  await db.Cache.create({
    keyword: keyword,
    social: social,
    period: period,
    data: data,
  });
}

async function updateCache(keyword, social, period, data) {
    if(!isValidData(data)) {
    console.log("데이터 이상 캐싱 탐지")
    return false;
  }

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

function isValidData(data) {

  // null, undefined 체크
  if (data == null) {
    console.log("정상적이지 않은 값 캐싱 방지 - null/undefined");
    return false;
  }
  
  // 문자열 "null", "undefined" 체크
  if (data === "null" || data === "undefined" || data === "[]") {
    console.log("정상적이지 않은 값 캐싱 방지 - 문자열 null");
    return false;
  }
  
  // 빈 문자열 체크
  if (data === "") {
    console.log("정상적이지 않은 값 캐싱 방지 - 빈 문자열");
    return false;
  }
  
  // HTML 응답 체크
  if (typeof data === 'string') {
    const trimmed = data.trim();
    
    // HTML 응답 감지 (가장 확실한 방법)
    if (trimmed.startsWith('<') || 
        trimmed.includes('<!DOCTYPE') ||
        trimmed.includes('html') ||
        trimmed.includes('Error 401') ||
        trimmed.includes('Error 400') ||
        trimmed.includes('Error 403') ||
        trimmed.includes('Error 404') ||
        trimmed.includes('Error 500')) {
      console.log("❌ 캐싱 방지: HTML/에러 응답 감지");
      return false;
    }
  }
  
  // 빈 객체 체크
  if (typeof data === 'object' && Object.keys(data).length === 0) {
    console.log("정상적이지 않은 값 캐싱 방지 - 빈 객체");
    return false;
  }
  
  // 빈 배열 체크
  if (Array.isArray(data) && data.length === 0) {
    console.log("정상적이지 않은 값 캐싱 방지 - 빈 배열");
    return false;
  }
  
  return true;
}



module.exports = { getCache, setCache, updateCache, isExpired };
