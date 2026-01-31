const axios = require('axios');
const WebSocket = require('ws');
require("dotenv").config();
const appkey = process.env.KIS_APP_KEY;
const appsecret = process.env.KIS_SECRET_KEY;

let approvalKeyCache = null;
let approvalKeyExpiration = null;

async function getApproval(key, secret) {
    if (approvalKeyCache && approvalKeyExpiration > Date.now()) {
        return approvalKeyCache;
    }

    const url = 'https://openapi.koreainvestment.com:9443/oauth2/Approval';
    const headers = { "content-type": "application/json" };
    const body = {
        "grant_type": "client_credentials",
        "appkey": key,
        "secretkey": secret
    };

    try {
        const response = await axios.post(url, body, { headers });
        approvalKeyCache = response.data.approval_key;
        approvalKeyExpiration = Date.now() + 3600 * 1000; // Set expiration time (1 hour)
        return approvalKeyCache;
    } catch (error) {
        console.error('Error getting approval key:', error.response ? error.response.data : error.message);
        return null;
    }
}

async function wsdata(ws, id) {
    const stockId = String(id);
    const approvalKey = await getApproval(appkey, appsecret);

    const payload = {
        "header": {
            "approval_key": approvalKey,
            "custtype": "P",
            "tr_type": "1",
            "content-type": "utf-8"
        },
        "body": {
            "input": {
                "tr_id": "H0STCNT0",
                "tr_key": stockId
            }
        }
    };

    const wsConnection = new WebSocket("ws://ops.koreainvestment.com:21000");

    wsConnection.on('open', function open() {
        console.log('WebSocket Opened, sending data:', JSON.stringify(payload));
        wsConnection.send(JSON.stringify(payload));
    });

    wsConnection.on('message', function incoming(data) {
        const message = data.toString();
        if (message[0] === '0' || message[0] === '1') {  // 시세데이터가 아닌 경우
            const d1 = message.split("|");
            if (d1.length >= 4) {
                const isEncrypt = d1[0];
                const tr_id = d1[1];
                const tr_cnt = d1[2];
                const recvData = d1[3];
                stockspurchase(1, recvData, ws);
            } else {
                console.log('Data Size Error=', d1.length);
            }
        } else {
            try {
                const recv_dic = JSON.parse(message);
                const tr_id = recv_dic.header.tr_id;

                if (tr_id === 'PINGPONG') {
                    wsConnection.ping(data);
                } else {
                    console.log('tr_id=', tr_id, '\nmsg=', message);
                }
            } catch (error) {
                console.error('Error parsing JSON:', error.message);
            }
        }
    });

    wsConnection.on('error', function error(err) {
        console.error(`WebSocket Error: ${err.message}`);
    });

    wsConnection.on('close', function close(statusCode, closeMsg) {
        console.log(`WebSocket Closed: Status Code=${statusCode}, Message=${closeMsg}`);
    });

    // When WebSocket connection closes, close the connection gracefully
    ws.on('close', function close() {
        console.log('WebSocket 연결이 종료되었습니다.');
        wsConnection.close();
    });
}

function stockspurchase(data_cnt, data, ws) {
    const menulist = "유가증권단축종목코드|주식체결시간|주식현재가|전일대비부호|전일대비|전일대비율|가중평균주식가격|주식시가|주식최고가|주식최저가|매도호가1|매수호가1|체결거래량|누적거래량|누적거래대금|매도체결건수|매수체결건수|순매수체결건수|체결강도|총매도수량|총매수수량|체결구분|매수비율|전일거래량대비등락율|시가시간|시가대비구분|시가대비|최고가시간|고가대비구분|고가대비|최저가시간|저가대비구분|저가대비|영업일자|신장운영구분코드|거래정지여부|매도호가잔량|매수호가잔량|총매도호가잔량|총매수호가잔량|거래량회전율|전일동시간누적거래량|전일동시간누적거래량비율|시간구분코드|임의종료구분코드|정적VI발동기준가";
    const menustr = menulist.split('|');
    const pValue = data.split('^');
    const obj = {};
    for (let i = 0; i < 6; i++) {
        let menu = menustr[i];
        obj[menu] = pValue[i];
    }
    console.log(obj)
    ws.send(JSON.stringify(obj, null, 2));
}

module.exports = { wsdata }
