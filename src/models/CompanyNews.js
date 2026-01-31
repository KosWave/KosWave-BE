module.exports = (sequelize, DataTypes) => {
  const CompanyNews = sequelize.define(
    "CompanyNews",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
      },
      content: {
        type: DataTypes.TEXT,
      },
      link: {
        type: DataTypes.STRING,
      },
      company_id: {
        type: DataTypes.BIGINT,
      },
    },
    {
      tableName: "company_news",
      timestamps: true,
    }
  );

  return CompanyNews;
};
