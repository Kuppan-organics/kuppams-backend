const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  getCompleteProfile,
  updateProfilePhoto,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");
const {
  getAddresses,
  upsertAddress,
  deleteAddress,
} = require("../controllers/addressController");
const { protect } = require("../middleware/auth");
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyOtpValidator,
  resetPasswordValidator,
  updateProfileValidator,
  updateProfilePhotoValidator,
  upsertAddressValidator,
  deleteAddressValidator,
} = require("../middleware/validator");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated user ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         phone:
 *           type: string
 *           description: User's phone number
 *         profilePhoto:
 *           type: string
 *           format: uri
 *           description: URL of the user's profile photo
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or user already exists
 */
router.post("/register", registerValidator, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginValidator, login);

router.post("/forgot-password", forgotPasswordValidator, forgotPassword);
router.post("/verify-otp", verifyOtpValidator, verifyOtp);
router.post("/reset-password", resetPasswordValidator, resetPassword);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 */
router.get("/profile", protect, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *                 format: uri
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authorized
 */
router.put("/profile", protect, updateProfileValidator, updateProfile);

/**
 * @swagger
 * /api/auth/profile/complete:
 *   get:
 *     summary: Get complete user profile with orders, cart, and settings
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 profile:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     orders:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         history:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               orderNumber:
 *                                 type: string
 *                               date:
 *                                 type: string
 *                                 format: date-time
 *                               status:
 *                                 type: string
 *                               paymentStatus:
 *                                 type: string
 *                               items:
 *                                 type: array
 *                               totalAmount:
 *                                 type: number
 *                     cart:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                         total:
 *                           type: number
 *                         itemCount:
 *                           type: integer
 *                     settings:
 *                       type: object
 *                       properties:
 *                         profilePhoto:
 *                           type: string
 *                         address:
 *                           type: object
 *                         phone:
 *                           type: string
 *       401:
 *         description: Not authorized
 */
router.get("/profile/complete", protect, getCompleteProfile);

/**
 * @swagger
 * /api/auth/profile/photo:
 *   put:
 *     summary: Update user profile photo
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profilePhoto
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: uri
 *                 description: URL of the profile photo
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 */
router.put("/profile/photo", protect, updateProfilePhotoValidator, updateProfilePhoto);

/**
 * @swagger
 * /api/auth/addresses:
 *   get:
 *     summary: Get user's saved shipping addresses
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved addresses (max 3)
 */
router.get("/addresses", protect, getAddresses);

/**
 * @swagger
 * /api/auth/addresses/{label}:
 *   put:
 *     summary: Create or update a saved address by label
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: label
 *         required: true
 *         schema:
 *           type: string
 *           enum: [home, work, other]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - street
 *               - city
 *               - state
 *               - zipCode
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               phone:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Address saved successfully
 */
router.put("/addresses/:label", protect, upsertAddressValidator, upsertAddress);

/**
 * @swagger
 * /api/auth/addresses/{label}:
 *   delete:
 *     summary: Delete a saved address by label
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: label
 *         required: true
 *         schema:
 *           type: string
 *           enum: [home, work, other]
 *     responses:
 *       200:
 *         description: Address deleted successfully
 */
router.delete("/addresses/:label", protect, deleteAddressValidator, deleteAddress);

module.exports = router;
