var express = require("express");
var router = express.Router();
const { returnDto } = require("../utils/DtoUtils");
const axios = require("axios");

const cacheController = require("../controllers/CacheController");

// AI 서버 URL 설정 (환경 변수 또는 기본값)
const AI_SERVER_URL = process.env.AI_SERVER_URL || "http://localhost:5000";

router.get("/", async function (req, res, next) {
  try {
    var searchWord = req.query.word;
    const keyword = searchWord;
    const SOCIAL = "ai";
    const PERIOD = 0;
    let cache = await cacheController.getCache(keyword, SOCIAL, PERIOD);

    if (cache === null || cache === undefined) {
      const data = JSON.stringify(await getSimilarityCompanies(searchWord));
      await cacheController.setCache(keyword, SOCIAL, PERIOD, data);
      cache = await cacheController.getCache(keyword, SOCIAL, PERIOD);
    }
    if (cacheController.isExpired(cache)) {
      const data = JSON.stringify(await getSimilarityCompanies(searchWord));
      await cacheController.updateCache(keyword, SOCIAL, PERIOD, data);
      cache = await cacheController.getCache(keyword, SOCIAL, PERIOD);
    }
    var similarities = JSON.parse(cache.dataValues.data);
    res.status(200).json(returnDto("A003", 200, similarities));
  } catch (error) {
    res.status(400).json(returnDto("E003", 400, error));
  }
});

async function getSimilarityCompanies(word) {
  try {
    // AI 서버에 GET 요청
    const response = await axios.get(`${AI_SERVER_URL}/api/company`, {
      params: {
        keyword: word
      },
      timeout: 1000000 // 1000초 타임아웃
    });

    // AI 서버 응답 형식 확인 및 데이터 추출
    if (response.data && response.data.message) {
      return response.data.message;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      throw new Error("Invalid response format from AI server");
    }
  } catch (error) {
    console.error("AI 서버 요청 실패:", error.message);

    // AI 서버 연결 실패 시 더미 데이터 반환
    return [{"name": "삼성전자", "code": "005930", "description": "삼성전자는 " + word + "와는 엄청난 연관이 있습니다", "similarity": 0.97},
    {"name": "SK하이닉스", "code": "000660", "description": "SK하이닉스와 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.96},
    {"name": "동화약품", "code": "000020", "description": "코스콤과 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.95},
    {"name": "현대자동차", "code": "005380", "description": "현대자동차는 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.94},
    {"name": "더미데이터", "code": "000050", "description": "더미데이터는 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.93},
    {"name": "랍니다", "code": "000070", "description": "랍니다는 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.92}
  ];
  }
}

module.exports = router;
