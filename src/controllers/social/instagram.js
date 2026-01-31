const axios = require("axios");
const cheerio = require("cheerio");

function formatInstagramStyle(input) {
  let num = input[0];
  let percentage = input[1] * 100;

  // 숫자를 적절한 단위로 축약
  function formatNumber(number) {
    if (number >= 1e6) {
      return (number / 1e6).toFixed(1) + "M";
    } else if (number >= 1e3) {
      return (number / 1e3).toFixed(1) + "K";
    } else {
      return number.toString();
    }
  }

  // 백분율로 변환
  let formattedNum = formatNumber(num);
  let formattedPercentage = percentage.toFixed(0) + "%";

  return [formattedNum, formattedPercentage];
}

const formatDate = function formatDate(originalDate) {
  let year = parseInt(originalDate.slice(2, 4));
  let month = parseInt(originalDate.slice(5, 7));
  month++;
  let ans;
  if (month > 12) {
    month = 1;
    year++;
  }
  if (month < 10) {
    ans = year + ".0" + month;
  } else {
    ans = year + "." + month;
  }

  return ans;
};
const getTagId = async function convertWordToTagId(word) {
  try {
    const { data } = await axios.get(
      `
      https://moana.mediance.co.kr/v1/instagram-tags/find?keyword=${encodeURI(
        word
      )}&uid=${process.env.INSTA_UID_KEY}&ip=${process.env.INSTA_IP}`,
      {
        headers: {
          Authorization: process.env.INSTA_KEY,
        },
      }
    );
    console.log("Daa:", data);
    return data.id;
  } catch (error) {
    console.error("Error fetching tag ID:", error);
  }
};

const getTags = async function getHotHashTags(word) {
  try {
    const { data } = await axios.get(
      `https://moana.mediance.co.kr/v1/instagram-tags/find?keyword=${encodeURI(
        word
      )}&ip=${process.env.INSTA_IP}&uid=${process.env.INSTA_UID_KEY}`,
      {
        headers: {
          Authorization: process.env.INSTA_KEY,
        },
      }
    );
    // console.log("xdata);/
    return data.instagramTag.instagramTagTree.engagementTags;
  } catch (error) {
    console.error("Error fetching hotTags data:", error);
  }
};
const getTrend = async function getTrendWithTagId(id) {
  try {
    const { data } = await axios.get(
      `https://moana.mediance.co.kr/v1/instagram-tags/${id}/series-summary`,
      {
        headers: {
          Authorization: process.env.INSTA_KEY,
        },
      }
    );

    const trend = data.data.map((item) => {
      return { date: formatDate(item.statOn), posts: item.postCount };
    });

    return trend;
  } catch (error) {
    console.error("Error fetching trend data:", error);
  }
};

const getTagInfo = async function getTagInfo(id) {
  try {
    const { data } = await axios.get(
      `https://moana.mediance.co.kr/v1/instagram-tags/${id}/summary?ip=${process.env.INSTA_IP}}`,
      {
        headers: {
          Authorization: process.env.INSTA_KEY,
        },
      }
    );

    return formatInstagramStyle([
      data.postCount,
      data.instagramTag.instagramTagStat.engagementAvg /
        data.instagramTag.instagramTagStat.occupyTimeAvg,
    ]);
  } catch (error) {
    console.error("Error fetching or parsing data:", error);
    return null;
  }
};
const getInstagramInfo = async function scrapingInstagramSocialInfo(word) {
  try {
    const id = await getTagId(word);
    if (id) {
      const trendData = await getTrend(id);
      const topTags = (await getTags(word)).slice(0, 3);
      const tagInfo = await getTagInfo(id);

      return { id, trendData, topTags, tagInfo };
    } else {
      console.log("No ID found for the given word.");
    }
  } catch (error) {
    console.error("Error in instagramInfo function:", error);
  }
};

module.exports = { getInstagramInfo };
