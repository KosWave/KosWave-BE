module.exports = (sequelize, DataTypes) => {
  const HashTag = sequelize.define(
    "HashTag",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "hash_tag",
      timestamps: true,
    }
  );

  return HashTag;
};
