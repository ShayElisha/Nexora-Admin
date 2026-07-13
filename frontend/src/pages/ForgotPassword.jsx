import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const data = await requestPasswordReset(email);
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "Failed to send reset email");
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-20 animate-in">
          <h1 className="text-5xl font-light mb-8 tracking-tight">Forgot Password</h1>
          <p className="text-xl text-[var(--gray-500)] font-light">
            {success
              ? "Check your email for reset instructions"
              : "Enter your email to reset your password"}
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
                <p className="font-medium mb-2">Reset email sent!</p>
                <p className="text-xs">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <p className="text-xs mt-4">
                  Please check your inbox and follow the link to reset your password.
                </p>
              </div>

              <div className="text-center space-y-4">
                <Link to="/" className="btn btn-primary w-full">
                  Back to Sign In
                </Link>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="text-sm text-[var(--gray-500)] hover:text-[var(--black)] underline-animate"
                >
                  Try another email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-12">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium mb-5 text-[var(--gray-600)]">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
                <p className="mt-3 text-xs text-[var(--gray-500)] font-light">
                  We'll send you a link to reset your password
                </p>
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
                    <span>Sending...</span>
                  </div>
                ) : (
                  "Send Reset Link"
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

