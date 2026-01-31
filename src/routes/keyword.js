var express = require("express");
var router = express.Router();
var axios = require("axios");

const SOCIAL = "sometrend";

//fetchKeyword: 검색어-연관어 키워드 가져오기
async function fetchKeyword(body) {
  const baseURL =
    "https://m.some.co.kr/sometrend/analysis/composite/v2/association-transition";
  const headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  };
  try {
    const response = await axios.post(baseURL, body, headers);
    const respdata = response.data.item.dataList[0].data.rows[0];
    // console.log(respdata.associationData.slice(0,12));
    return respdata.associationData.slice(0, 12);
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

router.post("/", async (req, res) => {
  //body에 필요한 객체: keyword
  // - keyword가 영어일 경우 모두 소문자로 변환해야 합니다. (by 썸트렌드 요청규칙)
  const keyword = req.body.keyword.toLowerCase();
  const scoringKeyword = keyword;

  if (!keyword) {
    return res.status(400).json({
      error: "keyword, scoringKeyword, startDate, and endDate are required",
    });
  }

  // - 비로그인 요청이므로, 날짜는 7일 전부터 오늘로 고정시켜놨습니다.
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  // 썸트렌드 요청 날짜 형식으로 변환 (ex. 20240622)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };
  // startDate: 7일 전 날짜
  // endDate: 현재날짜
  const startDate = formatDate(sevenDaysAgo);
  const endDate = formatDate(today);

  const body = {
    keyword,
    scoringKeyword,
    startDate,
    endDate,
    analysisMonth: 0,
    categoryList:
      "politician,celebrity,sportsman,characterEtc,government,business,agency,groupEtc,tourism,restaurant,shopping,scene,placeEtc,brandFood,cafe,brandBeverage,brandElectronics,brandFurniture,brandBeauty,brandFashion,brandEtc,productFood,productBeverage,productElectronics,productFurniture,productBeauty,productFashion,productEtc,economy,social,medicine,education,culture,sports,cultureEtc,animal,plant,naturalPhenomenon,naturalEtc",
    categorySetName: "SMT",
    exForHash: "",
    excludeWordOperators: "||",
    includeWordOperators: "||",
    keywordFilterExcludes: null,
    keywordFilterIncludes: null,
    period: "1",
    sources: "news",
    synonym: null,
    topN: 500,
  };

  try {
    //todo 여기 캐싱

    const result = await fetchKeyword(body);
    if (result) {
      res.json({ data: result });
    } else {
      res.status(500).json({ error: "Failed to fetch data" });
    }
  } catch (error) {
    console.error("Error in /api/keyword:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//fetchNews: 검색어-연관어 간의 관련 news 가져오기
async function fetchNews(body) {
  const baseURL =
    "https://some.co.kr/sometrend/analysis/composite/v2/documents/score";
  const headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  };

  try {
    const response = await axios.post(baseURL, body, headers);
    const respdata = response.data.item["ko.news"]; //뉴스기사 속성태그

    return respdata;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

router.post("/news", async (req, res) => {
  console.log("news 요청");
  //body에 필요한 객체: keyword, exWord(선택된 연관어)
  // - keyword가 영어일 경우 모두 소문자로 변환해야 합니다. (by 썸트렌드 요청규칙)
  const exWord = req.body.exWord;
  const ex = { news: [exWord] };
  const keyword = req.body.keyword.toLowerCase();
  const scoringKeyword = keyword;

  if (!keyword || !ex) {
    return res.status(400).json({
      error: "keyword, scoringKeyword, startDate, and endDate are required",
    });
  }

  // - 비로그인 요청이므로, 날짜는 7일 전부터 오늘로 고정시켜놨습니다.
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  // 썸트렌드 요청 날짜 형식으로 변환 (ex. 20240622)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };
  // startDate: 7일 전 날짜
  // endDate: 현재날짜
  const startDate = formatDate(sevenDaysAgo);
  const endDate = formatDate(today);

  const body = {
    ex,
    keyword,
    scoringKeyword,
    startDate,
    endDate,
    // "ex": {
    //     "blog": ["삼양식품"], "news": ["삼양식품"]
    //     },
    //     "keyword": "불닭",
    //     "scoringKeyword": "불닭",
    //     "startDate": "20240614",
    //     "endDate": "20240620",
    analysisMonth: 0,
    categoryList:
      "politician,celebrity,sportsman,characterEtc,government,business,agency,groupEtc,tourism,restaurant,shopping,scene,placeEtc,brandFood,cafe,brandBeverage,brandElectronics,brandFurniture,brandBeauty,brandFashion,brandEtc,productFood,productBeverage,productElectronics,productFurniture,productBeauty,productFashion,productEtc,economy,social,medicine,education,culture,sports,cultureEtc,animal,plant,naturalPhenomenon,naturalEtc",
    categorySetName: "TSN",
    exForHash: "",
    excludeWordOperators: "||",
    includeWordOperators: "||",
    keywordFilterExcludes: null,
    keywordFilterIncludes: null,
    period: "1",
    sources: "news",
    synonym: null,
    topN: 500,
  };

  try {
    const result = await fetchNews(body);
    if (result) {
      res.json({ data: result });
    } else {
      res.status(500).json({ error: "Failed to fetch data" });
    }
  } catch (error) {
    console.error("Error in /api/news:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
