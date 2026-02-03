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

// 랜덤 IP 생성 함수
const getRotatedIP = function getRotatedIP() {
  // 192.168.0.1 ~ 192.168.255.255 범위의 랜덤 IP 생성
  const octet2 = Math.floor(Math.random() * 256);
  const octet3 = Math.floor(Math.random() * 256);
  const octet4 = Math.floor(Math.random() * 256);

  const randomIP = `192.168.${octet2}.${octet3}`;
  console.log(`🎲 Using random IP: ${randomIP}`);
  return randomIP;
};

const getTagId = async function convertWordToTagId(word, retryCount = 0) {
  try {
    const currentIP = getRotatedIP();
    const { data } = await axios.get(
      `https://moana.mediance.co.kr/v1/instagram-tags/find?keyword=${encodeURI(
        word
      )}&uid=${process.env.INSTA_UID_KEY}&ip=${currentIP}`,
      {
        headers: {
          Authorization: process.env.INSTA_KEY,
        },
      }
    );
    console.log("Tag ID data:", data);
    return data.id;
  } catch (error) {
    console.error(`Error fetching tag ID (attempt ${retryCount + 1}):`, error.message);

    // 최대 3번까지 재시도
    if (retryCount < 3) {
      return await getTagId(word, retryCount + 1);
    }

    console.error("Max retries reached for getTagId");
    return null;
  }
};

const getTags = async function getHotHashTags(word, retryCount = 0) {
  try {
    const currentIP = getRotatedIP();
    const { data } = await axios.get(
      `https://moana.mediance.co.kr/v1/instagram-tags/find?keyword=${encodeURI(
        word
      )}&ip=${currentIP}&uid=${process.env.INSTA_UID_KEY}`,
      {
        headers: {
          Authorization: process.env.INSTA_KEY,
        },
      }
    );
    return data.instagramTag.instagramTagTree.engagementTags;
  } catch (error) {
    console.error(`Error fetching hotTags (attempt ${retryCount + 1}):`, error.message);

    // 최대 3번까지 재시도
    if (retryCount < 3) {
      return await getTags(word, retryCount + 1);
    }

    console.error("Max retries reached for getTags");
    return [];
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

const getTagInfo = async function getTagInfo(id, retryCount = 0) {
  try {
    const currentIP = getRotatedIP();
    const { data } = await axios.get(
      `https://moana.mediance.co.kr/v1/instagram-tags/${id}/summary?ip=${currentIP}`,
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
    console.error(`Error fetching tagInfo (attempt ${retryCount + 1}):`, error.message);

    // 최대 3번까지 재시도
    if (retryCount < 3) {
      return await getTagInfo(id, retryCount + 1);
    }

    console.error("Max retries reached for getTagInfo");
    return null;
  }
};

const getInstagramInfo = async function scrapingInstagramSocialInfo(word) {
  try {
    // 각 요청마다 IP offset 초기화 (선택사항)
    // currentIpOffset = 0;

    const id = await getTagId(word);
    if (id) {
      const trendData = await getTrend(id);
      const topTags = (await getTags(word)).slice(0, 3);
      const tagInfo = await getTagInfo(id);

      return { id, trendData, topTags, tagInfo };
    } else {
      console.log("No ID found for the given word.");
      return null;
    }
  } catch (error) {
    console.error("Error in instagramInfo function:", error);
    return null;
  }
};

module.exports = { getInstagramInfo };
