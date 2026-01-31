const express = require("express");
const router = express.Router();
const Youtube = require("youtube-node");
const youtube = new Youtube();

const cacheController = require("../controllers/CacheController");

router.get("/", async (req, res) => {
  const word = req.query.keyword; // 검색어 지정
  const limit = 10; // 출력 갯수

  const social = "youtube-news";
  const keyword = word;
  youtube.setKey(process.env.YOUTUBE_KEY); // API 키 입력

  //// 검색 옵션 시작
  youtube.addParam("order", "date"); // 날짜 순으로 정렬
  youtube.addParam("type", "video"); // 타입 지정F
  youtube.addParam("videoLicense", "creativeCommon"); // 크리에이티브 커먼즈 아이템만 불러옴
  //// 검색 옵션 끝
  try {
    let cache = await cacheController.getCache(keyword, social, 0);

    if (cache === null || cache === undefined) {
      const youtube = await getYoutubeNews(word, limit);
      const data = JSON.stringify(youtube);
      await cacheController.setCache(keyword, social, 0, data);
      cache = await cacheController.getCache(keyword, social, 0);
    }
    if (cacheController.isExpired(cache)) {
      const youtube = await getYoutubeNews(word, limit);
      const data = JSON.stringify(youtube);
      await cacheController.updateCache(keyword, social, 0, data);
      cache = await cacheController.getCache(keyword, social, 0);
    }

    const newsItems = JSON.parse(cache.dataValues.data);
    res.json(newsItems);
  } catch (err) {
    console.error("Error fetching RSS feed:", err);
    res.status(500).send("Error fetching RSS feed");
  }
});

async function getYoutubeNews(word, limit) {
  try {
    const result = await searchYoutube(word, limit);
    const items = result["items"]; // 결과 중 items 항목만 가져옴

    // item 돌면서 각각의 영상 정보 추출
    const data = items.map((it) => {
      const title = it["snippet"]["title"];
      const video_id = it["id"]["videoId"];
      const url = "https://www.youtube.com/watch?v=" + video_id;
      const thumbnail_url = `https://img.youtube.com/vi/${video_id}/0.jpg`;
      const channel = it["snippet"]["channelTitle"];
      const pubDate = it["snippet"]["publishTime"];

      // 영상 정보를 객체로 저장
      const videoData = {
        title,
        video_id,
        url,
        thumbnail_url,
        channel,
        pubDate,
      };
      return videoData;
    });

    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
function searchYoutube(word, limit) {
  return new Promise((resolve, reject) => {
    youtube.search(word, limit, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
}

module.exports = router;
