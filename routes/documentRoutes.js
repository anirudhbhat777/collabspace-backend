const express = require("express");

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const {
  createDocument,
  getDocuments,
} = require(
  "../controllers/documentController"
);

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  createDocument
);

router.get(
  "/all",
  authMiddleware,
  getDocuments
);

module.exports = router;