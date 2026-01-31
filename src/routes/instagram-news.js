const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const cacheController = require("../controllers/CacheController");
const router = express.Router();

const fetchData = async (url) => {
  try {
    const { data } = await axios.get(url);
    console.log(data);
    const formattedData = data.data.map((post) => ({
      caption: post.edgeMediaToCaption,
      hashtag: post.hashTags,
      likeN: post.likeCount,
      commentN: post.commentCount,
      pubDate: post.publishedAt,
      channel: post.channel.fullName || post.channel.name,
      thumbnail_url: null,
      url: `https://www.instagram.com/p/${post.postCode}`,
    }));
    return formattedData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

router.get("/", async (req, res) => {
  try {
    const { keyword } = req.query;
    const social = "insta-news";
    let cache = await cacheController.getCache(keyword, social, 0);
    const url = `https://moana.mediance.co.kr/v1/instagram-tags/top-posts?keyword=${encodeURI(
      keyword
    )}&uid=${process.env.INSTA_UID_KEY}%ip=${process.env.INSTA_IP}`;

    if (cache === null || cache === undefined) {
      const insta = await fetchData(url);
      const data = JSON.stringify(insta);
      await cacheController.setCache(keyword, social, 0, data);
      cache = await cacheController.getCache(keyword, social, 0);
    }
    if (cacheController.isExpired(cache)) {
      const insta = await fetchData(url);
      const data = JSON.stringify(insta);
      await cacheController.updateCache(keyword, social, 0, data);
      cache = await cacheController.getCache(keyword, social, 0);
    }
    posts = JSON.parse(cache.dataValues.data);
    res.json(posts);
  } catch (err) {
    console.error("Error fetching Instagram posts:", err);
    res.status(500).send("Error fetching Instagram posts");
  }
});

module.exports = router;
