import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignupPage.css";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("pegawai");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!fullName.trim() || !email.trim() || !password) {
      setMessage("Semua field harus diisi");
      setIsError(true);
      return;
    }

    const payload = { fullName, email, password, role };

    try {
      const response = await fetch("http://127.0.0.1:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Signup berhasil! Silakan login.");
        setIsError(false);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage(data.error || "Signup gagal.");
        setIsError(true);
      }
    } catch (error) {
      setMessage("Error koneksi ke server: " + error.message);
      setIsError(true);
    }
  };

  return (
    <div className="signuppage-container">
      <div
        className="signuppage-background"
        style={{
          backgroundImage: "url('/img/bg.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="signuppage-box">
        <div className="signuppage-left">
          <div className="signuppage-logo-container">
            <img src="/img/lk-logo.png" alt="LK Laporanku" className="signuppage-logo-img" />
          </div>

          {message && (
            <div className={`signup-message ${isError ? "error" : "success"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signuppage-form">
            <div className="signuppage-form-group">
              <label htmlFor="fullName">Nama Lengkap</label>
              <div className="signuppage-input-wrapper">
                <span className="signuppage-input-icon">👤</span>
                <input
                  type="text"
                  id="fullName"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="signuppage-form-group">
              <label htmlFor="email">Email</label>
              <div className="signuppage-input-wrapper">
                <span className="signuppage-input-icon">📧</span>
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

            <div className="signuppage-form-group">
              <label htmlFor="password">Password</label>
              <div className="signuppage-input-wrapper">
                <span className="signuppage-input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="signuppage-form-group">
              <label>Role</label>
              <div className="signuppage-role-wrapper">
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="pegawai"
                    checked={role === "pegawai"}
                    onChange={() => setRole("pegawai")}
                  />
                  Pegawai
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="manajer"
                    checked={role === "manajer"}
                    onChange={() => setRole("manajer")}
                  />
                  Manajer
                </label>
              </div>
            </div>

            <button type="submit" className="signup-btn">Sign Up</button>
          </form>
        </div>

        <div className="signuppage-right">
          <div className="signuppage-tab">Sign Up</div>
          <div
            className="signuppage-login"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/login")}
          >
            Sign In
          </div>
        </div>
      </div>
    </div>
  );
}
