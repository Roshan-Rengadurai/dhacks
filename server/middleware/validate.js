/**
 * Input validation middleware for entry creation.
 * Sanitises and validates before the request reaches the controller.
 */

const VALID_BUSINESS_TYPES = ["restaurant", "retail", "office", "warehouse", "hotel"];
const ZIP_RE = /^\d{5}$/;

function validateCreateEntry(req, res, next) {
  const { business_type, zip_code, square_footage, monthly_bill, operating_hours } = req.body;

  const errors = [];

  if (!business_type || !VALID_BUSINESS_TYPES.includes(business_type)) {
    errors.push(`business_type must be one of: ${VALID_BUSINESS_TYPES.join(", ")}`);
  }

  if (!zip_code || !ZIP_RE.test(String(zip_code).trim())) {
    errors.push("zip_code must be a 5-digit US zip code");
  }

  const sqft = Number(square_footage);
  if (!sqft || sqft < 100 || sqft > 1_000_000) {
    errors.push("square_footage must be a number between 100 and 1,000,000");
  }

  const bill = Number(monthly_bill);
  if (!bill || bill < 1 || bill > 1_000_000) {
    errors.push("monthly_bill must be a number between 1 and 1,000,000");
  }

  const hours = Number(operating_hours);
  if (!hours || hours < 1 || hours > 168) {
    errors.push("operating_hours must be between 1 and 168 (hours per week)");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  // Sanitize — coerce to correct types
  req.body.zip_code = String(zip_code).trim();
  req.body.square_footage = sqft;
  req.body.monthly_bill = bill;
  req.body.operating_hours = hours;

  next();
}

function validateUpdateEntry(req, res, next) {
  const { actions } = req.body;

  if (!Array.isArray(actions)) {
    return res.status(400).json({ error: "actions must be an array" });
  }

  for (const action of actions) {
    if (typeof action.id !== "string" || typeof action.adopted !== "boolean") {
      return res.status(400).json({
        error: "Each action must have a string id and boolean adopted field",
      });
    }
  }

  next();
}

module.exports = { validateCreateEntry, validateUpdateEntry };
