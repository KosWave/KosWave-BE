const { default: axios } = require("axios");
const express = require("express");
const router = express.Router();
const googleTrends = require("google-trends-api");
const cacheController = require("../controllers/CacheController");

router.get("/google", async (req, res) => {
  try {
    const social = "google-chart";
    const keyword = req.query.keyword;
    const start = req.query.startTime;

    // 현재 날짜 기준으로 30일 전부터 데이터 가져오기
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(start) + 2);
    startDate.setHours(0, 0, 0, 0);
    console.log("날짜:", startDate);

    let cache = await cacheController.getCache(keyword, social, start);

    if (cache === null || cache === undefined) {
      const data = await googleTrends.interestOverTime({
        keyword: keyword,
        startTime: startDate,
        endTime: new Date(),
      });
      await cacheController.setCache(keyword, social, start, data);
      cache = await cacheController.getCache(keyword, social, start);
    }
    if (cacheController.isExpired(cache)) {
      const data = await googleTrends.interestOverTime({
        keyword: keyword,
        startTime: startDate,
        endTime: new Date(),
      });
      await cacheController.updateCache(keyword, social, start, data);
      cache = await cacheController.getCache(keyword, social, start);
    }

    const results = cache.dataValues;
    res.status(200).json(results.data);
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).json({ error: "서버 에러가 발생했습니다." });
  }
});

router.get("/youtube", async (req, res) => {
  try {
    const social = "youtube-chart";
    const keyword = req.query.keyword;
    const start = req.query.startTime;

    // 현재 날짜 기준으로 30일 전부터 데이터 가져오기
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(start) + 2);
    startDate.setHours(0, 0, 0, 0);
    console.log("날짜:", startDate);

    let cache = await cacheController.getCache(keyword, social, start);

    if (cache === null || cache === undefined) {
      const data = await googleTrends.interestOverTime({
        keyword: keyword,
        startTime: startDate,
        endTime: new Date(),
        property: "youtube",
      });

      await cacheController.setCache(keyword, social, start, data);
      cache = await cacheController.getCache(keyword, social, start);
    }
    if (cacheController.isExpired(cache)) {
      const data = await googleTrends.interestOverTime({
        keyword: keyword,
        startTime: startDate,
        endTime: new Date(),
        property: "youtube",
      });

      await cacheController.updateCache(keyword, social, start, data);
      cache = await cacheController.getCache(keyword, social, start);
    }

    const results = cache.dataValues;
    res.status(200).json(results.data);
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).json({ error: "서버 에러가 발생했습니다." });
  }
});

router.post("/naver", async (req, res) => {
  const social = "naver-chart";
  const { keywords, startDate, endDate, periodOffset } = req.body;
  const requestBody = {
    startDate: startDate,
    endDate: endDate,
    timeUnit: Number(periodOffset) >= 365 ? "month" : "date",
    keywordGroups: keywords.map((keyword) => ({
      groupName: keyword,
      keywords: [keyword],
    })),
  };
  console.log("Request Body for Naver API:", requestBody);
  const keyword = keywords[0];
  try {
    let cache = await cacheController.getCache(keyword, social, periodOffset);

    if (cache === null || cache === undefined) {
      const data = JSON.stringify(await getNaverChart(requestBody));

      await cacheController.setCache(keyword, social, periodOffset, data);
      cache = await cacheController.getCache(keyword, social, periodOffset);
    }
    if (cacheController.isExpired(cache)) {
      const data = JSON.stringify(await getNaverChart(requestBody));

      await cacheController.updateCache(keyword, social, periodOffset, data);
      cache = await cacheController.getCache(keyword, social, periodOffset);
    }

    const results = JSON.parse(cache.dataValues.data);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching keyword data:", error);
    res.status(500).send("Error fetching keyword data");
  }
});

async function getNaverChart(requestBody) {
  try {
    const response = await axios.post(
      "https://openapi.naver.com/v1/datalab/search",
      requestBody,
      {
        headers: {
          "X-Naver-Client-Id": `${process.env.NAVER_ID}`,
          "X-Naver-Client-Secret": `${process.env.NAVER_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("result111: " + response.data.results);
    return response.data.results;
  } catch (err) {
    throw err;
  }
}

module.exports = router;
