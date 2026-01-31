const axios = require('axios');
const {checkToken} = require("../../utils/KISUtils");

require("dotenv").config(); // dotenv 설정 불러오기

const host = "KIS";
const APP_KEY = process.env.KIS_APP_KEY;
const APP_SECRET = process.env.KIS_SECRET_KEY;
const URL_BASE = "https://openapi.koreainvestment.com:9443";

// 일별 주식 가격 요청
const getPeriodPrice = async (symbol, startDate, endDate, period) => {
    
    try {
    const ACCESS_TOKEN = await checkToken(host);
    const PATH = "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice";
    const URL = `${URL_BASE}/${PATH}`;


    const authorization = ACCESS_TOKEN.access_token;
    const token_type = ACCESS_TOKEN.token_type;
    const headers = {
        "Content-Type": "application/json",
        "authorization": `${token_type} ${authorization}`,
        "appKey": APP_KEY,
        "appSecret": APP_SECRET,
        "tr_id": "FHKST03010100"
    };

    const params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_input_iscd": symbol,
        "fid_input_date_1":startDate,
        "fid_input_date_2":endDate,
        "fid_period_div_code": period,
        "fid_org_adj_prc": "1"
    };

        const response = await axios.get(URL, { headers, params });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Error response:', error.response.status, error.response.statusText);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw new Error('Failed to fetch daily price');
    }
};

module.exports = { getPeriodPrice };
