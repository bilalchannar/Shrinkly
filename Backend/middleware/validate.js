const { body, validationResult } = require("express-validator");

// Middleware: collect validation errors and return 400 if any
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg, // Return first error message
      errors: errors.array()
    });
  }
  next();
};

// Signup validation rules
const signupValidation = [
  body("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 3, max: 30 }).withMessage("Username must be 3–30 characters")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

  validate
];

// Login validation rules
const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }),

  body("password")
    .notEmpty().withMessage("Password is required"),

  validate
];

// Forgot password validation
const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }),

  validate
];

// Reset password validation
const resetPasswordValidation = [
  body("token")
    .notEmpty().withMessage("Reset token is required"),

  body("password")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

  validate
];

// Resend verification validation
const resendVerificationValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }),

  validate
];

module.exports = {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendVerificationValidation
};
