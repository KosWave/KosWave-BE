var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const axios = require("axios");
const cheerio = require("cheerio");

// 라우터 추가

const { wsdata } = require("./src/utils/WSPrice");
var indexRouter = require("./src/routes/index");
var companyRouter = require("./src/routes/company");
var socialRouter = require("./src/routes/social");
const db = require("./src/models/DB");
var keywordRouter = require("./src/routes/keyword"); //연관검색어 router
var socialChartRouter = require("./src/routes/socialChart");
var stockInfoRouter = require("./src/routes/stock.info.detail");
var googleNewsRouter = require("./src/routes/google-news");
var youTubeNewsRouter = require("./src/routes/youtube-news");
var naverNewsRouter = require("./src/routes/naver-news");
var instaNewsRouter = require("./src/routes/instagram-news");
const http = require("http");
var app = express();
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const server = http.createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
wss.on("connection", async function connection(ws) {
  console.log("새로운 WebSocket 클라이언트가 연결되었습니다.");
  let id;
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    console.log("Received data:", data);
    id = data.id;
    if (id) {
      wsdata(ws, id); // id가 설정된 후에 wsdata 호출
    } else {
      console.error("ID is undefined");
    }
  });

  ws.on("close", function close() {
    console.log("WebSocket 연결이 종료되었습니다.");
  });
});
server.listen(3002, () => {
  console.log("서버가 3002번 포트에서 실행 중입니다.");
});

db.sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
    return db.sequelize.sync({
      force: false,
    });
  })
  .then(() => {
    console.log("Database synced successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

// 라우터 url 설정
app.use("/api", indexRouter);
app.use("/api/company", companyRouter);
app.use("/api/social", socialRouter);
app.use("/api/keyword", keywordRouter);
app.use("/api/trends", socialChartRouter);
app.use("/api/stockInfo", stockInfoRouter);
app.use("/api/news/google", googleNewsRouter);
app.use("/api/news/youtube", youTubeNewsRouter);
app.use("/api/news/naver", naverNewsRouter);
app.use("/api/news/instagram", instaNewsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  createError(404);
  res.json({ code: 404, message: "서버에 url과 일치하는 api가 없습니다." });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(res.locals);
});

module.exports = app;
