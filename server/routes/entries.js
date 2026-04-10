const express = require("express");
const requireAuth = require("../middleware/auth");
const { validateCreateEntry, validateUpdateEntry } = require("../middleware/validate");
const {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  getHistory,
} = require("../controllers/entriesController");

const router = express.Router();

router.use(requireAuth);

router.get("/", getEntries);
router.get("/history", getHistory);
router.post("/", validateCreateEntry, createEntry);
router.put("/:id", validateUpdateEntry, updateEntry);
router.delete("/:id", deleteEntry);

module.exports = router;
