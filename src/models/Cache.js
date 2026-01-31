module.exports = (sequelize, DataTypes) => {
  const Cache = sequelize.define(
    "Cache",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      keyword: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      social: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      period: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      data: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "cache",
      timestamps: true,
    }
  );

  return Cache;
};
