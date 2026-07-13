import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../api/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    // Validate token on mount
    if (!token) {
      setError("Invalid reset token");
      setValidating(false);
    } else {
      setValidating(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const data = await resetPassword(token, password);
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "2px" }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-20 animate-in">
          <h1 className="text-5xl font-light mb-8 tracking-tight">Reset Password</h1>
          <p className="text-xl text-[var(--gray-500)] font-light">
            {success ? "Password reset successfully!" : "Enter your new password"}
          </p>
        </div>

        {/* Form */}
        <div className="animate-in" style={{ animationDelay: "0.1s" }}>
          {error && (
            <div className="mb-8 p-4 border border-red-300 bg-red-50 text-sm text-red-700 animate-scale">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-8">
              <div className="p-6 border border-green-300 bg-green-50 text-sm text-green-700 animate-scale text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="font-medium mb-2">Password reset successful!</p>
                <p className="text-xs">Redirecting to login page...</p>
              </div>

              <Link to="/" className="btn btn-primary w-full">
                Go to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-12">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium mb-5 text-[var(--gray-600)]">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  autoFocus
                  minLength={6}
                />
                <p className="mt-3 text-xs text-[var(--gray-500)] font-light">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium mb-5 text-[var(--gray-600)]">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full mt-16"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="spinner"
                      style={{
                        borderTopColor: "white",
                        borderColor: "rgba(255,255,255,0.2)",
                      }}
                    ></div>
                    <span>Resetting...</span>
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          <div className="mt-16 pt-12 border-t border-[var(--gray-200)] text-center">
            <Link
              to="/"
              className="text-sm text-[var(--gray-600)] font-light hover:text-[var(--black)] underline-animate"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--gray-400)] mt-12 font-light uppercase tracking-wider">
          © 2024 Nexora
        </p>
      </div>
    </div>
  );
}

