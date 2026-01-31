var express = require("express");
var router = express.Router();
const { returnDto } = require("../utils/DtoUtils");

const cacheController = require("../controllers/CacheController");

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
    res.status(400).json(returnDto("E003", 400, "Error"));
  }
});

async function getSimilarityCompanies(word) {
  return [{"name": "삼성전자", "code": "005930", "description": "삼성전자는 " + word + "와는 엄청난 연관이 있습니다", "similarity": 0.97},
    {"name": "SK하이닉스", "code": "005930", "description": "SK하이닉스와 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.96},
    {"name": "코스콤", "code": "005930", "description": "코스콤과 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.95},
    {"name": "현대자동차", "code": "005930", "description": "현대자동차는 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.94},
    {"name": "더미데이터", "code": "005930", "description": "더미데이터는 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.93},
    {"name": "랍니다", "code": "005930", "description": "랍니다는 " + word + "와는 엄청난 연관이 있습니다","similarity": 0.92}
  ];
}

module.exports = router;
