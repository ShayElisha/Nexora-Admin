import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Compare a password with a hashed password
   */
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET || "superadmin_secret_key", {
      expiresIn: "15m", // Short-lived access token
    });
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || "superadmin_refresh_secret_key", {
      expiresIn: "7d", // Long-lived refresh token
    });
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || "superadmin_secret_key");
    } catch (error) {
      throw new Error("Invalid or expired access token");
    }
  }

  /**
   * Verify JWT refresh token
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET || "superadmin_refresh_secret_key");
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Generate tokens and set cookies
   */
  static setAuthCookies(res, payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Set access token cookie
    res.cookie("superadmin_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set refresh token cookie
    res.cookie("superadmin_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken, refreshToken };
  }

  /**
   * Clear auth cookies
   */
  static clearAuthCookies(res) {
    res.clearCookie("superadmin_access_token");
    res.clearCookie("superadmin_refresh_token");
  }
}

