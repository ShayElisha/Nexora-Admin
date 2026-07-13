import { AuthService } from "../services/auth.service.js";

/**
 * Middleware to protect routes - requires valid access token
 */
export const protectRoute = async (req, res, next) => {
  try {
    // Check for token in cookies or Authorization header
    let token = req.cookies["superadmin_access_token"];

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    }

    // Verify token
    const decoded = AuthService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // If access token is expired, try refresh token
    if (error.message.includes("expired")) {
      return handleRefreshToken(req, res, next);
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid token",
      error: error.message,
    });
  }
};

/**
 * Handle refresh token when access token expires
 */
const handleRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies["superadmin_refresh_token"];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No refresh token",
      });
    }

    const decoded = AuthService.verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const newAccessToken = AuthService.generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    // Set new access token cookie
    res.cookie("superadmin_access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid refresh token",
      error: error.message,
    });
  }
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user found",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Insufficient permissions",
      });
    }

    next();
  };
};

