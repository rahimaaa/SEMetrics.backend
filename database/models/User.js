const { DataTypes } = require("sequelize");
const db = require("../db");

const User = db.define(
  "User",
  {
    fullname: {
      type: DataTypes.STRING,
    },
    username: {
      type: DataTypes.STRING,
    },
    githubId: {
      type: DataTypes.STRING,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
    },
    profilePhoto: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    access_token: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = User;
