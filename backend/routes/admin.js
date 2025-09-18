const express = require("express");
const router = express.Router();
const { runSiteSync } = require("../jobs/syncsites");

// Trigger site sync manually
router.post("/sync-sites", async (req, res) => {
  try {
    await runSiteSync();
    res.json({ success: true, message: "Site sync triggered successfully" });
  } catch (err) {
    console.error("Manual site sync failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
