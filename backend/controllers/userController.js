import User from "../models/userModel.js";
import { AuthService } from "../services/auth.service.js";
import { EmailService } from "../services/email.service.js";
import crypto from "crypto";

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is active
    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended",
      });
    }

    // Compare password
    const isPasswordValid = await AuthService.comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens and set cookies
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    AuthService.setAuthCookies(res, payload);

    res.json({
      success: true,
      message: "Login successful",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const logout = (req, res) => {
  AuthService.clearAuthCookies(res);
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies["superadmin_refresh_token"];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    const decoded = AuthService.verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const newAccessToken = AuthService.generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    res.cookie("superadmin_access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
      error: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const registerPublic = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(403).json({
        success: false,
        message:
          "Public registration is closed. Ask an existing admin to create your account.",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await AuthService.hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "Owner",
      status: "Active",
      permissions: {
        analytics: true,
        companies: true,
        billing: true,
        subscriptions: true,
        users: true,
        activity: true,
      },
    });

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    AuthService.setAuthCookies(res, payload);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Public register error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const createUser = async (req, res) => {
  const { name, email, password, role, status, permissions } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required",
    });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await AuthService.hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      status,
      permissions,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, status, permissions } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (status) user.status = status;
    if (permissions) {
      user.permissions = { ...user.permissions, ...permissions };
    }

    if (password) {
      user.password = await AuthService.hashPassword(password);
    }

    await user.save();
    res.json({
      success: true,
      message: "User updated successfully",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============ Password Reset Functions ============

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5174"}/reset-password/${resetToken}`;

    // Send email with reset link
    try {
      await EmailService.sendPasswordResetEmail(user.email, resetToken, resetLink);
      console.log(`Password reset email sent to: ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Still return success to user, but log the error
      // In production, you might want to handle this differently
    }

    // Log for development (remove in production)
    if (process.env.NODE_ENV !== "production") {
      console.log("Password reset token:", resetToken);
      console.log("Reset link:", resetLink);
    }

    res.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
      // In development, include the token (remove in production)
      ...(process.env.NODE_ENV !== "production" && {
        resetToken,
        resetLink,
      }),
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: "Token and password are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  try {
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const hashedPassword = await AuthService.hashPassword(password);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
