// 날짜 timeAgo 정제 함수 (ex. '4시간 전', '3일 전', '2주 전', '2개월 전', '1년 전')
const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");

let curDate = new Date();
curDate.setDate(curDate.getDate() - 1);
let day = String(curDate.getDate()).padStart(2, "0");
let month = String(curDate.getMonth() + 1).padStart(2, "0");
let year = String(curDate.getFullYear()).slice(2);
let formattedDate = `${year}.${month}.${day}`;

router.get("/", async (req, res) => {
  console.log("req", req.params.word);
  const transformData = (inputArray) => {
    return inputArray.map((item) => {
      let detailsObj = null;
      if (item.details) {
        let details = item.details.split(" ");
        details = details.map((detail, index) => {
          return detail.trim();
        });
        detailsObj = {};

        details.forEach((detail, index) => {
          console.log(item.title.slice(0, 4));
          switch (item.title.slice(0, 4)) {
            case "시세정보":
              if (detail === "시가") {
                detailsObj["openingPrice"] = details[index + 1];
              } else if (detail === "1년" && details[index + 1] === "최고") {
                detailsObj["oneYearHigh"] = details[index + 2];
              } else if (detail === "1년" && details[index + 1] === "최저") {
                detailsObj["oneYearLow"] = details[index + 2];
              }
              break;

            case "종목정보":
              if (detail === "시총") {
                detailsObj["marketcome"] = details[index + 2]
                  ? details[index + 1] + " " + details[index + 2]
                  : details[index + 1];
              } else if (detail === "거래량") {
                detailsObj["tradingVolume"] = details[index + 1];
              }
              break;

            case `투자자별`:
              if (detail === "외국인보유율") {
                detailsObj["foreignOwnershipRate"] = details[index + 1];
              } else if (detail === "외국인매매") {
                detailsObj["foreignTrade"] = details[index + 1];
              } else if (detail === "기관매매") {
                detailsObj["institutionalTrade"] = details[index + 1];
              }
              break;

            case "분기실적":
              if (detail === "매출액") {
                detailsObj["revenue"] = details[index + 2]
                  ? details[index + 1] + " " + details[index + 2]
                  : details[index + 1];
              } else if (detail === "영업이익") {
                detailsObj["operatingIncome"] = details[index + 2]
                  ? details[index + 1] + " " + details[index + 2]
                  : details[index + 1];
              } else if (detail === "당기순이익") {
                detailsObj["netIncome"] = details[index + 2]
                  ? details[index + 1] + " " + details[index + 2]
                  : details[index + 1];
              }
              break;

            default:
              detailsObj["unknown"] = item.details;
          }
        });
      }

      return {
        section: item.title,
        details: detailsObj,
      };
    });
  };

  const url = `https://m.search.naver.com/search.naver?sm=mtb_hty.top&where=m&ssc=tab.m.all&oquery=${encodeURIComponent(
    req.query.word
  )}+%EC%A3%BC%EA%B0%80&tqi=iFMIHlqo1iCssKy%2BvLssssssssR-179872&query=${encodeURIComponent(
    req.query.word
  )}+%EC%A3%BC%EA%B0%80`;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const stockInfo = [];

    $("ul.invest_list li.list_item").each((index, element) => {
      const title = $(element).find("a.item_box strong.item_title").text();
      const details = $(element).find("dl.item_info").text().trim();

      stockInfo.push({
        title,
        details,
      });
    });
    stockInfo.shift();
    res.json(transformData(stockInfo));
  } catch (error) {
    console.error("Error fetching stock information:", error);
  }
});

module.exports = router;
