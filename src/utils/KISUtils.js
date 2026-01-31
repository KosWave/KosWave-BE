const axios = require("axios");
require("dotenv").config(); // dotenv 설정 불러오기
const authController = require("../controllers/AuthController");
const { setCompanies } = require("../controllers/CompanyController");

const host = "KIS";
const appkey = process.env.KIS_APP_KEY;
const appsecret = process.env.KIS_SECRET_KEY;

async function getToken() {
  const url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP";
  const headers = { "content-type": "application/json" };
  const body = {
    grant_type: "client_credentials",
    appkey: appkey,
    appsecret: appsecret,
  };
  const response = await axios.post(url, body, { headers });
  return response.data;
}

function isExpired(dateString) {
  const givenDate = new Date(dateString);
  const currentDate = new Date();

  return givenDate < currentDate;
}

async function checkToken(host) {
  let accessToken = await authController.getAuthToken(host);
    if (accessToken === null) {
      accessToken = await getToken();
      await authController.setAuthToken(
        host,
        accessToken.access_token,
        accessToken.access_token_token_expired,
        accessToken.token_type
      );
      accessToken = await authController.getAuthToken(host);
    }
    if (isExpired(accessToken.access_token_expired)) {
      accessToken = await getToken();
      await authController.updateAuthToken(
        host,
        accessToken.access_token,
        accessToken.access_token_token_expired,
        accessToken.token_type
      );
      accessToken = await authController.getAuthToken(host);
    }
    return accessToken;
}

const getStockData = async function getStockData() {
  let accessToken = await checkToken(host);
  try {
    const url =
      "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/ranking/market-cap";
    
    const authorization = accessToken.access_token;
    const token_type = accessToken.token_type;
    const headers = {
      authorization: token_type + " " + authorization,
      appkey: appkey,
      appsecret: appsecret,
      custtype: "P",
      tr_id: "FHPST01730000",
      "content-type": "utf-8",
    };
    const params = {
      fid_cond_mrkt_div_code: "J",
      fid_cond_scr_div_code: "20173",
      fid_input_iscd: "0000",
      fid_div_cls_code: "0",
      fid_input_price_1: "",
      fid_input_price_2: "",
      fid_vol_cnt: "",
      fid_input_option_1: "2023",
      fid_input_option_2: "0",
      fid_rank_sort_cls_code: "0",
      fid_blng_cls_code: "0",
      fid_trgt_exls_cls_code: "0",
      fid_trgt_cls_code: "0",
    };

    const response = await axios.get(url, { headers, params });
    setCompanies(response.data);
    return true;
  } catch (error) {
    console.log("Error Message : ", error);
    return false;
  }
};

const fs = require("fs").promises;
const path = require("path");

const setStockData = async function setStockData() {
  try {
    // 파일 경로 설정
    const filePath = path.join(__dirname, "../../company.txt");

    // 파일 읽기
    const data = await fs.readFile(filePath, "utf-8");

    // 파일 내용을 줄 단위로 분할
    const lines = data.split("\r\n");

    // 각 줄을 ',' 기준으로 분할하여 {name, code} 객체로 변환
    const stockData = lines.map((line) => {
      const [name, code] = line.split(",");
      return { name, code };
    });
    setCompanies(stockData);
    return "succuess";
  } catch (error) {
    console.error("Error reading the file:", error);
  }
};
module.exports = { getStockData, setStockData, checkToken };
