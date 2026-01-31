const db = require("../models/DB");

async function getCompanyByCode(code) {
  try {
    const company = await db.Company.findOne({ where: { code: code } });
    console.log(company);
    return company.dataValues;
  } catch (error) {
    console.log("회사 정보가 없음");
    return null;
  }
}

async function getCompanies() {
  try {
    const companies = await db.Company.findAll();
    return companies;
  } catch (error) {
    console.log("회사 정보가 없음");
    return null;
  }
}

async function setCompanies(companies) {
  await db.Company.destroy({ where: {} });
  const companyData = companies.map((company) => ({
    name: company.name,
    code: company.code,
  }));

  console.log(companyData);
  await db.Company.bulkCreate(companyData);
}

module.exports = { setCompanies, getCompanies, getCompanyByCode };
