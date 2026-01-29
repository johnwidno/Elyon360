const express = require("express");
const router = express.Router();
const eventTypeController = require("../controllers/eventTypeController");
const tenant = require("../middleware/tenant");

router.get("/", tenant, eventTypeController.getAll);
router.post("/", tenant, eventTypeController.create);
router.delete("/:id", tenant, eventTypeController.delete);

module.exports = router;
