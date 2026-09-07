const FranchiseEnquiry = require("../models/FranchiseEnquiry");
const { validationResult } = require("express-validator");

// @desc    Submit franchise enquiry
// @route   POST /api/franchises/enquiries
// @access  Public
exports.submitFranchiseEnquiry = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, phone, email, description } = req.body;

    const enquiry = await FranchiseEnquiry.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim()?.toLowerCase() || null,
      description: description?.trim() || "",
    });

    res.status(201).json({
      success: true,
      message:
        "Thank you for your interest. Our team will contact you soon.",
      enquiry: {
        id: enquiry._id,
        name: enquiry.name,
        phone: enquiry.phone,
        createdAt: enquiry.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all franchise enquiries
// @route   GET /api/admin/franchise-enquiries
// @access  Admin
exports.getFranchiseEnquiries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const [enquiries, total] = await Promise.all([
      FranchiseEnquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FranchiseEnquiry.countDocuments(filter),
    ]);

    res.json({
      success: true,
      enquiries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update franchise enquiry status
// @route   PUT /api/admin/franchise-enquiries/:id/status
// @access  Admin
exports.updateFranchiseEnquiryStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { status } = req.body;
    const enquiry = await FranchiseEnquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Franchise enquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Franchise enquiry updated successfully",
      enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete franchise enquiry
// @route   DELETE /api/admin/franchise-enquiries/:id
// @access  Admin
exports.deleteFranchiseEnquiry = async (req, res, next) => {
  try {
    const enquiry = await FranchiseEnquiry.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Franchise enquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Franchise enquiry deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
