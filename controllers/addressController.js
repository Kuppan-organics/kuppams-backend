const User = require("../models/User");

const MAX_ADDRESSES = 3;
const ADDRESS_LABELS = ["home", "work", "other"];

const formatAddress = (address) => ({
  id: address._id?.toString(),
  label: address.label,
  firstName: address.firstName,
  lastName: address.lastName,
  street: address.street,
  city: address.city,
  state: address.state,
  zipCode: address.zipCode,
  country: address.country,
  phone: address.phone,
  isDefault: address.isDefault,
});

// @desc    Get user's saved addresses
// @route   GET /api/auth/addresses
// @access  Private
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("savedAddresses address phone name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      (!user.savedAddresses || user.savedAddresses.length === 0) &&
      user.address?.street
    ) {
      const nameParts = (user.name || "").split(" ");
      user.savedAddresses = [
        {
          label: "home",
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          street: user.address.street,
          city: user.address.city,
          state: user.address.state,
          zipCode: user.address.zipCode,
          country: user.address.country || "India",
          phone: user.phone,
          isDefault: true,
        },
      ];
      await user.save();
    }

    res.json({
      success: true,
      addresses: (user.savedAddresses || []).map(formatAddress),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update a saved address by label (home, work, other)
// @route   PUT /api/auth/addresses/:label
// @access  Private
exports.upsertAddress = async (req, res, next) => {
  try {
    const label = (req.params.label || "").toLowerCase();

    if (!ADDRESS_LABELS.includes(label)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address label. Use home, work, or other.",
      });
    }

    const {
      firstName,
      lastName,
      street,
      city,
      state,
      zipCode,
      phone,
      country,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.savedAddresses) {
      user.savedAddresses = [];
    }

    const isFirstAddress = user.savedAddresses.length === 0;

    if (!isFirstAddress && user.savedAddresses.length >= MAX_ADDRESSES) {
      const labelExists = user.savedAddresses.some((addr) => addr.label === label);
      if (!labelExists) {
        return res.status(400).json({
          success: false,
          message: "Maximum 3 saved addresses allowed. Delete one to add another.",
        });
      }
    }

    const resolvedLabel = isFirstAddress ? "home" : label;

    const addressPayload = {
      label: resolvedLabel,
      firstName,
      lastName,
      street,
      city,
      state,
      zipCode,
      country: country || "India",
      phone,
      isDefault: isFirstAddress || resolvedLabel === "home",
    };

    const existingByLabel = user.savedAddresses.find(
      (addr) => addr.label === resolvedLabel
    );

    if (existingByLabel) {
      Object.assign(existingByLabel, addressPayload);
    } else {
      user.savedAddresses.push(addressPayload);
    }

    if (phone) {
      user.phone = phone;
    }

    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    if (fullName) {
      user.name = fullName;
    }

    // Keep legacy single address in sync with default saved address
    const defaultAddress =
      user.savedAddresses.find((addr) => addr.isDefault) ||
      user.savedAddresses[0];

    if (defaultAddress) {
      user.address = {
        street: defaultAddress.street,
        city: defaultAddress.city,
        state: defaultAddress.state,
        zipCode: defaultAddress.zipCode,
        country: defaultAddress.country,
      };
    }

    await user.save();

    res.json({
      success: true,
      addresses: user.savedAddresses.map(formatAddress),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved address by label
// @route   DELETE /api/auth/addresses/:label
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const label = (req.params.label || "").toLowerCase();

    if (!ADDRESS_LABELS.includes(label)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address label. Use home, work, or other.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const beforeCount = user.savedAddresses?.length || 0;
    user.savedAddresses = (user.savedAddresses || []).filter(
      (addr) => addr.label !== label
    );

    if (user.savedAddresses.length === beforeCount) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (user.savedAddresses.length > 0) {
      const hasDefault = user.savedAddresses.some((addr) => addr.isDefault);
      if (!hasDefault) {
        user.savedAddresses[0].isDefault = true;
      }

      const defaultAddress =
        user.savedAddresses.find((addr) => addr.isDefault) ||
        user.savedAddresses[0];

      user.address = {
        street: defaultAddress.street,
        city: defaultAddress.city,
        state: defaultAddress.state,
        zipCode: defaultAddress.zipCode,
        country: defaultAddress.country,
      };
    } else {
      user.address = undefined;
    }

    await user.save();

    res.json({
      success: true,
      addresses: user.savedAddresses.map(formatAddress),
    });
  } catch (error) {
    next(error);
  }
};
