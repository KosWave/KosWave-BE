const express = require("express");
const axios = require("axios");
const router = express.Router();
const cacheController = require("../controllers/CacheController");
require("dotenv").config(); // dotenv 설정 불러오기

router.get("/", async (req, res) => {
  const queryData = req.query;
  const period = 0;
  const social = "naver-news";

  try { 
    const keyword = queryData.keyword;
    let cache = await cacheController.getCache(keyword, social, period);

    if (cache === null || cache === undefined) {
      const data = JSON.stringify(await getNaverNews(keyword));
      await cacheController.setCache(keyword, social, period, data);
      cache = await cacheController.getCache(keyword, social, period);
    }
    if (cacheController.isExpired(cache)) {
      const data = JSON.stringify(await getNaverNews(keyword));
      await cacheController.updateCache(keyword, social, period, data);
      cache = await cacheController.getCache(keyword, social, period);
    }

    let respdata = JSON.parse(cache.dataValues.data);

    res.json(respdata);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

async function getNaverNews(query) {
  const baseURL = "https://openapi.naver.com/v1/search/news.json";

  try {
    const response = await axios.get(baseURL, {
      params: {
        query: query,     // 검색어
        display: 10,      // 한 번에 표시할 검색 결과 개수
        start: 1,         // 검색 시작 위치
        sort: 'sim'       // 정렬 옵션: sim (유사도순), date (날짜순)
      },
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_ID,
        'X-Naver-Client-Secret': process.env.NAVER_SECRET
      }
    });
    return response.data.items;

  } catch (err) {
    console.error("API 요청 중 오류 발생:", err.response ? err.response.data : err.message);
    throw err;
  }
}

module.exports = router;
