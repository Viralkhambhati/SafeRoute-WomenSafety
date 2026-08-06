const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
    // Get Authorization header
    // Example:
    // Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token not provided.",
      });
    }

    // Split the header into two parts
    // ["Bearer", "token"]
    const tokenParts = authHeader.split(" ");

    // Validate header format
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid token format.",
      });
    }

    // Extract the actual JWT token
    const token = tokenParts[1];

    // Verify the token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store decoded user information in request object
    // decoded contains:
    // {
    //   id: "...",
    //   iat: ...,
    //   exp: ...
    // }
    req.user = decoded;

    // Continue to the next middleware/controller
    next();

  } catch (error) {

    // Token expired or invalid
    return res.status(401).json({
      success: false,
      message: "Invalid or Expired Token.",
    });

  }
};

// ==========================================================
// Export Middleware
// ==========================================================

module.exports = authMiddleware;