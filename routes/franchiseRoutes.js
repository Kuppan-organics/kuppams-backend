const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  submitFranchiseEnquiry,
} = require("../controllers/franchiseEnquiryController");
const {
  getMyFranchise,
  getFranchiseProducts,
} = require("../controllers/franchiseController");
const {
  createFranchiseOrder,
  getFranchiseOrders,
} = require("../controllers/franchiseOrderController");
const {
  franchiseEnquiryValidator,
  createFranchiseOrderValidator,
  paginationValidator,
} = require("../middleware/validator");

router.post("/enquiries", franchiseEnquiryValidator, submitFranchiseEnquiry);

router.get("/me", protect, authorize("franchise"), getMyFranchise);

router.get(
  "/products",
  protect,
  authorize("franchise"),
  paginationValidator,
  getFranchiseProducts,
);

router.post(
  "/orders",
  protect,
  authorize("franchise"),
  createFranchiseOrderValidator,
  createFranchiseOrder,
);

router.get(
  "/orders",
  protect,
  authorize("franchise"),
  paginationValidator,
  getFranchiseOrders,
);

module.exports = router;
