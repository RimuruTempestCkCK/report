import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!email.trim() || !password) {
      setMessage("Email dan password wajib diisi");
      setIsError(true);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.token;
        const user = data.user;

        if (!token) {
          setMessage("Login gagal, token tidak ditemukan");
          setIsError(true);
          return;
        }

        if (rememberMe) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
        } else {
          sessionStorage.setItem("token", token);
          sessionStorage.setItem("user", JSON.stringify(user));
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }

        setMessage("Welcome " + user.full_name);
        setIsError(false);
        setPassword("");

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setMessage(data.error || "Login gagal");
        setIsError(true);
      }
    } catch (error) {
      setMessage("Error koneksi ke server: " + error.message);
      setIsError(true);
    }
  };

  return (
    <div className="loginpage-container">
      <div
        className="loginpage-background"
        style={{
          backgroundImage: "url('/img/bg.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="loginpage-box">
        <div className="loginpage-left">
          <div className="loginpage-tab">Sign In</div>
          <div
            className="loginpage-signin"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </div>
        </div>
        <div className="loginpage-right">
          <div className="loginpage-logo-container">
            <img src="/img/lk-logo.png" alt="LK Laporanku" className="loginpage-logo-img" />
          </div>

        {message && (
          <div
            className={`loginpage-message ${isError ? "error" : "success"}`}
          >
            {message}
          </div>
        )}

          <form onSubmit={handleSubmit} className="loginpage-form">
            <div className="loginpage-form-group">
              <label htmlFor="email">Email</label>
              <div className="loginpage-input-wrapper">
                <span className="loginpage-input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="loginpage-form-group">
              <label htmlFor="password">Password</label>
              <div className="loginpage-input-wrapper">
                <span className="loginpage-input-icon">🔑</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <span
                  className="loginpage-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? "👁️" : "🙈"}
                </span>
              </div>
            </div>

            <div className="loginpage-checkbox-wrapper">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>

            <button type="submit" className="loginpage-btn">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}
