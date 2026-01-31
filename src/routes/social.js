var express = require("express");
var router = express.Router();
const { getInstagramInfo } = require("../controllers/social/instagram");
const cacheController = require("../controllers/CacheController");

router.get("/instagram", async (req, res, next) => {
  try {
    // console.log("req word:", req.query.word);
    const keyword = req.query.word;
    const social = "insta-info";
    let cache = await cacheController.getCache(keyword, social, 0);
    if (cache === null || cache === undefined) {
      const instagram = await getInstagramInfo(req.query.word);
      const data = JSON.stringify(instagram);
      await cacheController.setCache(keyword, social, 0, data);
      cache = await cacheController.getCache(keyword, social, 0);
    }
    if (cacheController.isExpired(cache)) {
      const instagram = await getInstagramInfo(req.query.word);
      const data = JSON.stringify(instagram);
      await cacheController.updateCache(keyword, social, 0, data);
      cache = await cacheController.getCache(keyword, social, 0);
    }

    console.log("dddddd", cache.dataValues.data);
    let insta = JSON.parse(cache.dataValues.data);
    res.status(200).json(insta);
  } catch (error) {
    res.status(400).json({ b: 1 });
  }
});

module.exports = router;
