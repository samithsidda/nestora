
const express = require("express");
const router = express.Router();

const {
  createRecommendations,
} = require("../controllers/recommendationController");

router.post("/", createRecommendations);

module.exports = router;
