var express = require("express");
var router = express.Router();
const { getStockData, setStockData } = require("../utils/KISUtils");
const { returnDto } = require("../utils/DtoUtils");
const handleCompanyNews = require("../controllers/NewsCrawling");
const { getCurrentPrice } = require("../controllers/stockdetail/CurrentPrice");
const { getDailyPrice } = require("../controllers/stockdetail/DailyPrice");
const { getPeriodPrice } = require("../controllers/stockdetail/PeriodPrice");
const fetchNews = require("../utils/NaverStockNews");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.json("Hello World");
});

router.get("/news", handleCompanyNews);
router.get("/stocknews", async (req, res, next) => {
  const code = req.query.symbol || "005930"; // default code if not provided
  try {
    const news = await fetchNews(code);
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

router.get("/current-price", async (req, res) => {
  const symbol = req.query.symbol || "005930";
  try {
    const price = await getCurrentPrice(symbol); // 현재 삼성전자로 하드코딩
    res.json(price);
  } catch (error) {
    console.error("Error fetching data from external API:", error);
    res.status(500).json({ error: "Error fetching data from external API" });
  }
});

router.get("/daily-price", async (req, res) => {
  try {
    const symbol = req.query.symbol || "005930";
    const period = req.query.period;
    const price = await getDailyPrice(symbol, period); // 현재 삼성전자로 하드코딩

    res.json(price);
  } catch (error) {
    console.error("Error fetching data from external API:", error);
    res.status(500).json({ error: "Error fetching data from external API" });
  }
});

router.get("/period-price", async (req, res) => {
  try {
    const symbol = req.query.symbol || "005930";
    const startday = req.query.startDate;
    const endday = req.query.endDate;
    const period = req.query.period;
    const price = await getPeriodPrice(symbol, startday, endday, period);

    res.json(price.output2);
  } catch (error) {
    console.error("Error fetching data from external API:", error);
    res.status(500).json({ error: "Error fetching data from external API" });
  }
});

module.exports = router;
