import React, { useState, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import "./Pemasukan.css";

export default function Pemasukan() {
  const [jumlah, setJumlah] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [pemasukanList, setPemasukanList] = useState([]);
  const token = localStorage.getItem("token");

  const fetchPemasukan = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/pemasukan/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Gagal mengambil data pemasukan");
      const data = await res.json();
      setPemasukanList(data);
    } catch (err) {
      alert("Gagal memuat data pemasukan: " + err.message);
    }
  };

  useEffect(() => {
    fetchPemasukan();
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!jumlah || !tanggal || !deskripsi) {
    alert("Semua field wajib diisi");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/add/pemasukan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jumlah: parseFloat(jumlah),
        tanggal,
        deskripsi,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Gagal menyimpan data pemasukan");
    }

    setJumlah("");
    setTanggal("");
    setDeskripsi("");
    setNotifications([{ message: "Pemasukan berhasil ditambahkan!" }]);
    fetchPemasukan();
    setTimeout(() => setNotifications([]), 3000);
  } catch (err) {
    alert("Gagal: " + err.message);
  }
};




  return (
  <>
    <HeaderMenu />
    <div className="background-white-box">
      <div className="main-red-box">
        <div className="form-tabel-wrapper">
          
          {/* FORM PEMASUKAN */}
          <div className="form-box">
            <h2>Catat Pemasukan</h2>
            {notifications.map((notif, index) => (
              <div key={index} className="alert alert-success">{notif.message}</div>
            ))}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Jumlah Pemasukan (Rp)</label>
                <input
                  type="number"
                  step="0.01"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  placeholder="Contoh: 1000000"
                  required
                />
              </div>
              <div className="form-row">
                <label>Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label>Deskripsi</label>
                <input
                  type="text"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Pemasukan penjualan"
                  required
                />
                </div>
              <button type="submit" className="submit-btn">Simpan</button>
            </form>
          </div>

          {/* TABEL DATA */}
          <div className="table-box">
            <h2>Data Pemasukan</h2>
            <table className="pemasukan-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Jumlah (Rp)</th>
                  <th>Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {pemasukanList.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>Belum ada data</td>
                  </tr>
                ) : (
                  pemasukanList.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.tanggal}</td>
                      <td>{parseFloat(item.jumlah).toLocaleString("id-ID")}</td>
                      <td>{item.deskripsi}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div> {/* end form-tabel-wrapper */}
      </div>
    </div>
  </>
);

}
