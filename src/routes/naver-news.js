const express = require("express");
const axios = require("axios");
const router = express.Router();
const cacheController = require("../controllers/CacheController");

router.post("/", async (req, res) => {
  const body = req.body;
  const period = 0;
  const social = "naver-news";
  console.log("naver news : " + JSON.stringify(body));

  try {
    const keyword = body.keyword;
    let cache = await cacheController.getCache(keyword, social, period);

    if (cache === null || cache === undefined) {
      const data = JSON.stringify(await getNaverNews(body));
      await cacheController.setCache(keyword, social, period, data);
      cache = await cacheController.getCache(keyword, social, period);
    }
    if (cacheController.isExpired(cache)) {
      const data = JSON.stringify(await getNaverNews(body));
      await cacheController.updateCache(keyword, social, period, data);
      cache = await cacheController.getCache(keyword, social, period);
    }

    let respdata = JSON.parse(cache.dataValues.data);

    // 최신순으로 정렬
    respdata = respdata.sort((a, b) => {
      const dateA = new Date(
        `${a.documentDate.slice(0, 4)}-${a.documentDate.slice(
          4,
          6
        )}-${a.documentDate.slice(6, 8)}T${a.documentDate.slice(
          8,
          10
        )}:${a.documentDate.slice(10, 12)}:${a.documentDate.slice(12, 14)}`
      );
      const dateB = new Date(
        `${b.documentDate.slice(0, 4)}-${b.documentDate.slice(
          4,
          6
        )}-${b.documentDate.slice(6, 8)}T${b.documentDate.slice(
          8,
          10
        )}:${b.documentDate.slice(10, 12)}:${b.documentDate.slice(12, 14)}`
      );
      return dateB - dateA;
    });

    res.json(respdata.slice(0, 20));
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

async function getNaverNews(data) {
  const baseURL =
    "https://some.co.kr/sometrend/analysis/composite/v2/documents/score";
  try {
    const response = await axios.post(baseURL, data);
    let respdata = response.data.item["ko.news"];
    return respdata;
  } catch (err) {
    throw err;
  }
}

module.exports = router;
