const axios = require("axios");
const cheerio = require("cheerio");
const { Model, Op } = require("sequelize");
const { CompanyNews, Company } = require("../models/DB");
const fetchNews = require("../utils/NaverStockNews");

async function fetchNewsContent(link) {
  try {
    const response = await axios.get(link);
    const $ = cheerio.load(response.data);
    const content =
      $("#newsct_article").text().trim() ||
      $("._article_content").text().trim(); 
    return content;
  } catch (error) {
    console.error(`Error fetching news content from ${link}:`, error);
    return null;
  }
}

async function saveCodes() {
  const companies = await Company.findAll();
  const companyCodes = companies.map((company) => ({
    code: company.dataValues.code,
    id: company.dataValues.id,
  }));
  return companyCodes;
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function saveNewsToDatabase(id, newsItems) {
  const newsData = [];

  for (let items of newsItems) {
    for (let item of items) {
      const link = `https://n.news.naver.com/article/${item.officeId}/${item.articleId}`;

      // 1초 지연 (1000ms)
      await delay(100);

      try {
        const detailedContent = await fetchNewsContent(link);

        newsData.push({
          title: item.title,
          content: detailedContent || item.body,
          link: link,
          company_id: id,
        });
      } catch (error) {
        console.error(`Error fetching news content for ${link}:`, error);
        // 에러 처리 (예: 특정 뉴스 아이템에 대한 실패를 로그로 남기거나, 다시 시도할 수 있도록 로직 추가)
      }
    }
  }
  // 데이터베이스에 저장
  if (newsData.length > 0) {
    await CompanyNews.bulkCreate(newsData);
  }
}

// Express 컨트롤러 함수
async function handleNewsDatas(data, res) {
  try {
    // fetchNews 함수로 뉴스 아이템들 가져오기
    const newsItems = await fetchNews(data.code);

    // 가져온 뉴스 아이템들을 데이터베이스에 저장하기
    await saveNewsToDatabase(data.id, newsItems);
  } catch (error) {
    console.error(`Error handling news data for company ${data.id}:`, error);
    // 에러 처리 (예: 특정 회사에 대한 실패를 로그로 남기거나, 다시 시도할 수 있도록 로직 추가)
  }
}

const handleCompanyNews = async (req, res, next) => {
  try {
    // 회사 코드를 데이터베이스에서 가져오기
    const companyCodes = await saveCodes();

    // 각 회사 코드에 대해 뉴스 아이템을 가져오고 데이터베이스에 저장하기
    for (const data of companyCodes) {
      await handleNewsDatas(data, res);
    }

    res
      .status(200)
      .json({ message: `Successfully fetched and saved news items.` });
  } catch (error) {
    console.error("Error handling news data:", error);
    // 에러 응답 보내기
    res.status(500).json({ error: "Failed to fetch and save news items." });
  }
};

module.exports = handleCompanyNews;
