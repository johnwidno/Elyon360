const express = require("express");
const router = express.Router();
const db = require("../models");

router.get("/", async (req, res) => {
    try {
        const categories = await db.MemberCategory.findAll({
            where: { churchId: req.church.id }
        });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
