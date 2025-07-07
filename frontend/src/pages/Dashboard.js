import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import HeaderMenu from "./HeaderMenu"; 
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    total_pemasukan: 0,
    total_pengeluaran: 0,
    laporan_sudah_tandatangan: 0,
    laporan_belum_tandatangan: 0,
  });
  const [periode, setPeriode] = useState("bulan");
  const [pemasukanVsPengeluaran, setPemasukanVsPengeluaran] = useState([]);
  const [pengeluaranPerDivisi, setPengeluaranPerDivisi] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [pemasukanInput, setPemasukanInput] = useState("");
  const [user, setUser] = useState({ full_name: "", role: "" });
  const [userLoaded, setUserLoaded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const token = localStorage.getItem("token");
  const fetchWithAuth = (url, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, {
    ...options,
    headers,
  })
  .then(async (res) => {
    if (res.status === 401) {
      alert("Sesi Anda telah berakhir. Silakan login ulang.");
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return res.json();
    } else {
      throw new Error("Invalid response format");
    }
  });
};


  const formatRupiah = (num) => {
    const angka = Number(num);
    if (isNaN(angka)) return "-";
    return angka.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
    });
  };

  useEffect(() => {
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setCurrentDate(today);
  }, []);

  useEffect(() => {
  fetchWithAuth("http://localhost:5000/api/dashboard/user")
    .then((data) => {
      console.log("User data:", data); // pastikan ini muncul di console
      setUser(data);
      setUserLoaded(true);
      console.log("User role:", data.role); // ✅ Cek di sini
    })
    .catch((err) => {
      console.error("Fetch user error:", err);
      setUserLoaded(true); // tetap set true meskipun error
    });
  }, [token]);


  const fetchSummary = () => {
    fetchWithAuth("http://localhost:5000/api/dashboard/summary")
      .then(setSummary)
      .catch(console.error);
  };

  const fetchNotifications = () => {
    fetchWithAuth(
      `http://localhost:5000/api/dashboard/notifications?periode=${periode}`)
      .then(setNotifications)
      .catch(console.error);
  };

  const fetchGraphs = () => {
  fetchWithAuth(
    `http://localhost:5000/api/dashboard/graph/pemasukan-vs-pengeluaran?periode=${periode}`)
      .then(setPemasukanVsPengeluaran)
      .catch(console.error);

  fetchWithAuth(
    `http://localhost:5000/api/dashboard/graph/pengeluaran-per-divisi?periode=${periode}`)
      .then(setPengeluaranPerDivisi)
      .catch(console.error);
  };

  useEffect(() => {
    if (userLoaded) {
      fetchSummary();
      fetchNotifications();
      fetchGraphs();
    }
  }, [periode, userLoaded]);

  const handleSubmitPemasukan = (e) => {
    e.preventDefault();
    if (!pemasukanInput || isNaN(pemasukanInput) || parseInt(pemasukanInput) <= 0) {
      alert("Masukkan nominal pemasukan yang valid");
      return;
    }

    fetchWithAuth("http://localhost:5000/api/dashboard/add-pemasukan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nominal: parseInt(pemasukanInput),
        deskripsi: "Input manual via form",
      }),
    })
      .then((data) => {
        alert(data.message);
        setPemasukanInput("");
        fetchSummary();
        fetchNotifications();
        fetchGraphs();
      })
      .catch((err) => alert(err.message));

  };

  const total = summary.total_pemasukan + summary.total_pengeluaran;
  const persenPemasukan =
    total > 0 ? Math.round((summary.total_pemasukan / total) * 100) : 0;
  const persenPengeluaran =
    total > 0 ? Math.round((summary.total_pengeluaran / total) * 100) : 0;

  return (
    <div className="dashboard-container">
      <HeaderMenu
        notifications={notifications}
        toggleNotif={() => setShowNotif(!showNotif)}
        showNotif={showNotif}
      />

      <main className="main-content-container">
        <section className="top-section">
          <div className="note-box">
            <h3>Catatan</h3>
            <textarea placeholder="Tulis catatan singkat di sini..." rows={6} />
          </div>

          <div className="calendar-pemasukan">
            <div className="calendar-box">
              <div className="calendar-icon">📅</div>
              <div className="calendar-date">{currentDate}</div>
            </div>

            {userLoaded &&
              (user.role === "pegawai" || user.role === "manajer") && (
                <form
                  className="pemasukan-form"
                  onSubmit={handleSubmitPemasukan}
                >
                  <label htmlFor="inputPemasukan">Pemasukan</label>
                  <input
                    id="inputPemasukan"
                    type="number"
                    placeholder="Masukkan nominal pemasukan"
                    value={pemasukanInput}
                    onChange={(e) => setPemasukanInput(e.target.value)}
                  />
                  <button>Save</button>
                </form>
              )}
          </div>

          <div className="welcome-box">
            <p>Hallo {user.full_name || "User"} 👋</p>
            <img src="/img/hay.svg" alt="User avatar" className="avatar" />
          </div>
        </section>

        <section className="summary-cards">
          <div className="card pemasukan">
            <h3>Pemasukan</h3>
            <p>{formatRupiah(summary.total_pemasukan)}</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${persenPemasukan}%` }}
              />
              <span className="progress-text">{persenPemasukan}%</span>
            </div>
          </div>
          <div className="card pengeluaran">
            <h3>Pengeluaran</h3>
            <p>{formatRupiah(summary.total_pengeluaran)}</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${persenPengeluaran}%` }}
              />
              <span className="progress-text">{persenPengeluaran}%</span>
            </div>
          </div>
          <div className="card send">
            <h3>Send</h3>
            <p>{summary.laporan_belum_tandatangan}</p>
          </div>
          <div className="card accept">
            <h3>Accept</h3>
            <p>{summary.laporan_sudah_tandatangan}</p>
          </div>
        </section>

        <section className="charts two-charts">
          <div className="chart-block pemasukan-vs-pengeluaran">
            <h3>Grafik Pemasukan Vs Pengeluaran</h3>
            <label>
              Pilih Periode:{" "}
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
              >
                <option value="bulan">Bulanan</option>
                <option value="tahun">Tahunan</option>
              </select>
            </label>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pemasukanVsPengeluaran}>
                <XAxis dataKey={(obj) => obj.bulan || obj.tahun} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pemasukan" fill="#00C49F" />
                <Bar dataKey="pengeluaran" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-block pengeluaran-only">
            <h3>Grafik Pengeluaran Per Divisi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pengeluaranPerDivisi}>
                <XAxis dataKey="divisi" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_pengeluaran" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}
