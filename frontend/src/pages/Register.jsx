import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await registerUser({ name, email, password });
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.replace("/dashboard");
      } else {
        setError(data.message || "Registration failed");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || err.error || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-20 animate-in">
          <h1 className="text-5xl font-light mb-8 tracking-tight">Create Account</h1>
          <p className="text-xl text-[var(--gray-500)] font-light">Join Nexora today</p>
        </div>

        {/* Form */}
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          {error && (
            <div className="mb-8 p-4 border border-[var(--gray-300)] bg-[var(--gray-50)] text-sm text-[var(--gray-700)] animate-scale">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-12">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium mb-5 text-[var(--gray-600)]">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

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
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium mb-5 text-[var(--gray-600)]">
                Password
              </label>
              <input
                type="password"
                placeholder="Create password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <p className="text-xs text-[var(--gray-400)] mt-3 font-light">
                Minimum 6 characters
              </p>
            </div>

            <div className="flex items-start gap-3 pt-6">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 border-[var(--gray-300)]"
              />
              <label htmlFor="terms" className="text-sm text-[var(--gray-600)] font-light">
                I agree to the{" "}
                <a href="#" className="text-[var(--black)] underline-animate">Terms</a>
                {" "}and{" "}
                <a href="#" className="text-[var(--black)] underline-animate">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-16"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.2)' }}></div>
                  <span>Creating...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-16 pt-12 border-t border-[var(--gray-200)] text-center">
            <p className="text-sm text-[var(--gray-600)] font-light mb-6">
              Already have an account?
            </p>
            <Link to="/">
              <button type="button" className="btn btn-secondary w-full">
                Sign In
              </button>
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
