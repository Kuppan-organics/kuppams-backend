const express = require("express");
const router = express.Router();
const { submitContact } = require("../controllers/contactController");
const { contactFormValidator } = require("../middleware/validator");

router.post("/", contactFormValidator, submitContact);

module.exports = router;
