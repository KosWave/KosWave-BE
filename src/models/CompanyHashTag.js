module.exports = (sequelize, DataTypes) => {
  const CompanyHashTag = sequelize.define(
    "CompanyHashTag",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: DataTypes.BIGINT,
      },
      hash_tag_id: {
        type: DataTypes.BIGINT,
      },
    },
    {
      tableName: "company_hash_tag",
      timestamps: true,
    }
  );

  return CompanyHashTag;
};
