const express = require("express");
const router = express.Router();
const Parser = require("rss-parser");
const parser = new Parser();
const cacheController = require("../controllers/CacheController");

const SOCIAL = "google-news";
const PERIOD = 0;

router.get("/", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    let cache = await cacheController.getCache(keyword, SOCIAL, PERIOD);

    if (cache === null || cache === undefined) {
      const data = JSON.stringify(await getGoogleNews(keyword));
      await cacheController.setCache(keyword, SOCIAL, PERIOD, data);
      cache = await cacheController.getCache(keyword, SOCIAL, PERIOD);
    }
    if (cacheController.isExpired(cache)) {
      const data = JSON.stringify(await getGoogleNews(keyword));
      await cacheController.updateCache(keyword, SOCIAL, PERIOD, data);
      cache = await cacheController.getCache(keyword, SOCIAL, PERIOD);
    }

    const newsItems = JSON.parse(cache.dataValues.data);

    newsItems.sort((a, b) => b.pubDate - a.pubDate);
    res.json(newsItems);
  } catch (err) {
    console.error("Error fetching RSS feed:", err);
    res.status(500).send("Error fetching RSS feed");
  }
});

async function getGoogleNews(keyword) {
  try {
    const feed = await parser.parseURL(
      `https://news.google.com/rss/search?q=${encodeURIComponent(
        keyword
      )}&hl=ko&gl=KR&ceid=KR:ko`
    );

    const newsItems = feed.items.map((item) => {
      const titleParts = item.title.split(" - ");
      const title = titleParts[0];
      const source = titleParts[titleParts.length - 1] || "Unknown";

      return {
        title,
        link: item.link,
        pubDate: new Date(item.pubDate),
        contentSnippet: item.contentSnippet,
        source,
      };
    });
    return newsItems;
  } catch (err) {
    throw err;
  }
}

module.exports = router;
