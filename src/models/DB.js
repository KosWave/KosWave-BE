const { Sequelize } = require("sequelize");
require("dotenv").config(); // dotenv 설정 불러오기

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;
const DB_NAME =
  process.env.ENVIRONMENT === "PROD"
    ? process.env.PROD_DB
    : process.env.DEVELOP_DB;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "postgres", // 사용하는 데이터베이스 종류
  logging: false, // 쿼리 로깅 여부 (false로 설정하면 콘솔에 SQL 쿼리가 출력되지 않음)
});
// 모델 정의 및 연결
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 모델 정의 및 연결
db.Company = require("./Company")(sequelize, Sequelize);
db.HashTag = require("./HashTag")(sequelize, Sequelize);
db.CompanyHashTag = require("./CompanyHashTag")(sequelize, Sequelize);
db.CompanyNews = require("./CompanyNews")(sequelize, Sequelize);
db.AuthToken = require("./AuthToken")(sequelize, Sequelize);
db.Cache = require("./Cache")(sequelize, Sequelize);

// 모델 간의 관계 정의
db.Company.belongsToMany(db.HashTag, {
  through: db.CompanyHashTag,
  foreignKey: "company_id",
});
db.HashTag.belongsToMany(db.Company, {
  through: db.CompanyHashTag,
  foreignKey: "hash_tag_id",
});

db.CompanyNews.belongsTo(db.Company, {
  foreignKey: "company_id",
  targetKey: "id",
  as: "company",
});

module.exports = db;
