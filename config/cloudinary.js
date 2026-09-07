const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kuppam-products",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

// File filter to validate image types
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Multer upload instance for products
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const franchiseStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kuppam-franchises",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

const franchiseUpload = multer({
  storage: franchiseStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1.5 * 1024 * 1024, // 1.5MB limit
  },
});

// Helper function to extract public_id from a Cloudinary URL
const getPublicIdFromUrl = (imageUrl, folder = "kuppam-products") => {
  const folderIndex = imageUrl.indexOf(`${folder}/`);
  if (folderIndex === -1) return null;

  const pathWithExt = imageUrl.substring(folderIndex).split("?")[0];
  return pathWithExt.replace(/\.[^/.]+$/, "");
};

// Helper function to delete a single image from Cloudinary
const deleteImage = async (imageUrl, folder = "kuppam-products") => {
  try {
    const publicId = getPublicIdFromUrl(imageUrl, folder);
    if (!publicId) {
      console.error("Could not extract public_id from URL:", imageUrl);
      return false;
    }

    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return false;
  }
};

const deleteFranchiseImage = async (imageUrl) =>
  deleteImage(imageUrl, "kuppam-franchises");

// Helper function to delete multiple images from Cloudinary
const deleteImages = async (imageUrls = []) => {
  if (!imageUrls.length) return;

  await Promise.all(imageUrls.map((imageUrl) => deleteImage(imageUrl)));
};

module.exports = {
  cloudinary,
  upload,
  franchiseUpload,
  deleteImage,
  deleteImages,
  deleteFranchiseImage,
};
