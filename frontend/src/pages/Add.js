import React, { useState, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import "./Add.css";

const bulanOptions = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

  const currentYear = new Date().getFullYear();
  const tahunOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { value: String(year), label: String(year) };
  });

    export default function Add() {
      const [judulUtama, setJudulUtama] = useState("Lembar Pertanggungjawaban Transaksi (LPT)");
      const [subJudul, setSubJudul] = useState("Kantor Cabang Bogor");
      const [bulan, setBulan] = useState("");
      const [tahun, setTahun] = useState("");
      const [akunId, setAkunId] = useState("");
      const [deskripsi, setDeskripsi] = useState("");
      const [tanggal, setTanggal] = useState("");
      const [deskripsiKegiatan, setDeskripsiKegiatan] = useState("");
      const [realisasi, setRealisasi] = useState("");
      const [divisiId, setDivisiId] = useState("");
      const [daftarAkun, setDaftarAkun] = useState([]);
      const [daftarDivisi, setDaftarDivisi] = useState([]);
      const [notifications, setNotifications] = useState([]);
      const [isAkunModalOpen, setIsAkunModalOpen] = useState(false);
      const [isDivisiModalOpen, setIsDivisiModalOpen] = useState(false);
      const [newAkun, setNewAkun] = useState({ kode: "", deskripsi: "" });
      const [newDivisi, setNewDivisi] = useState({ kode: "", nama: "" });

      const token = localStorage.getItem("token");

      useEffect(() => {
        if (token) {
          fetchAkun();
          fetchDivisi();
        } else {
          alert("Token tidak ditemukan. Silakan login ulang.");
        }
      }, []);

      const fetchAkun = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/add/akun", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error("Gagal mengambil data Akun");
          const data = await response.json();
          setDaftarAkun(data);
        } catch (error) {
          alert("Gagal memuat data akun: " + error.message);
        }
      };

      const fetchDivisi = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/add/divisi", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error("Gagal mengambil data Divisi");
          const data = await response.json();
          setDaftarDivisi(data);
        } catch (error) {
          alert("Gagal memuat data divisi: " + error.message);
        }
      };

      const handleAkunChange = (e) => {
        const id = e.target.value;
        setAkunId(id);
        const akun = daftarAkun.find((a) => a.id.toString() === id);
        setDeskripsi(akun ? akun.deskripsi : "");
      };

      const handleDivisiChange = (e) => {
        setDivisiId(e.target.value);
      };

      const handleSubmit = async (e) => {
        e.preventDefault();

        if (!judulUtama || !subJudul || !bulan || !tahun || !akunId || !tanggal || !realisasi || !divisiId) {
          alert("Jangan biarkan field kosong, semua field harus diisi!");
          return;
        }
        const today = new Date().toISOString().split("T")[0];
        if (tanggal > today) {
          alert("Tanggal tidak boleh melebihi hari ini");
          return;
        }

        const realisasiValue = parseFloat(realisasi);
        if (isNaN(realisasiValue)) {
          alert("Realisasi harus berupa angka");
          return;
        }

        const data = {
          judul_utama: judulUtama,
          sub_judul: subJudul,
          bulan: parseInt(bulan, 10),
          tahun: parseInt(tahun, 10),
          akun_id: parseInt(akunId, 10),
          deskripsi,
          tanggal,
          deskripsi_kegiatan: deskripsiKegiatan,
          realisasi: realisasiValue,
          divisi_id: parseInt(divisiId, 10),
        };

        try {
          const res = await fetch("http://localhost:5000/api/add/pengeluaran", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Gagal submit pengeluaran");
          }

          setNotifications([...notifications, { message: "Pengeluaran berhasil disimpan!" }]);

          setJudulUtama("Lembar Pertanggungjawaban Transaksi (LPT)");
          setSubJudul("Kantor Cabang Bogor");
          setBulan("");
          setTahun("");
          setAkunId("");
          setDeskripsi("");
          setTanggal("");
          setDeskripsiKegiatan("");
          setRealisasi("");
          setDivisiId("");

          setTimeout(() => setNotifications([]), 3000);
        } catch (err) {
          alert("Error: " + err.message);
        }
      };

      const handleAkunSubmit = async (e) => {
        e.preventDefault();
        if (!newAkun.kode || !newAkun.deskripsi) {
          alert("Kode dan Deskripsi akun harus diisi!");
          return;
        }
        try {
          const res = await fetch("http://localhost:5000/api/add/akun", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newAkun),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Gagal tambah akun");
          }

          setNotifications([...notifications, { message: "Akun berhasil ditambahkan!" }]);
          setNewAkun({ kode: "", deskripsi: "" });
          setIsAkunModalOpen(false);
          fetchAkun();
          setTimeout(() => setNotifications([]), 3000);
        } catch (err) {
          alert("Error: " + err.message);
        }
      };

      const handleDivisiSubmit = async (e) => {
        e.preventDefault();
        if (!newDivisi.kode || !newDivisi.nama) {
          alert("Kode dan Nama divisi harus diisi!");
          return;
        }
        try {
          const res = await fetch("http://localhost:5000/api/add/divisi", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newDivisi),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Gagal tambah divisi");
          }

          setNotifications([...notifications, { message: "Divisi berhasil ditambahkan!" }]);
          setNewDivisi({ kode: "", nama: "" });
          setIsDivisiModalOpen(false);
          fetchDivisi();
          setTimeout(() => setNotifications([]), 3000);
        } catch (err) {
          alert("Error: " + err.message);
        }
      };

  return (
    <>
      <HeaderMenu />
      <div className="background-white-box">
        <div className="main-red-box">
          <div className="title-with-image">
            <img src="/img/mikir.svg" alt="Mikir Illustration" />
            <h2>Ada pengeluaran apa hari ini?</h2>
          </div>

          <div className="alert-container">
            {notifications.map((notif, index) => (
              <div key={index} className="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Notifikasi!</strong> {notif.message}
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    const newNotifications = [...notifications];
                    newNotifications.splice(index, 1);
                    setNotifications(newNotifications);
                  }}
                ></button>
              </div>
            ))}
          </div>

          <form className="add-form" onSubmit={handleSubmit}>
            <fieldset>
              <legend>1. JUDUL</legend>
              <div className="form-row">
                <label>Judul Utama</label>
                <input type="text" value={judulUtama} onChange={(e) => setJudulUtama(e.target.value)} />
              </div>
              <div className="form-row">
                <label>Sub Judul</label>
                <input type="text" value={subJudul} onChange={(e) => setSubJudul(e.target.value)} />
              </div>
              <div className="form-row">
                <label>Bulan</label>
                <select value={bulan} onChange={(e) => setBulan(e.target.value)} required>
                  <option value="">Pilih Bulan</option>
                  {bulanOptions.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Tahun</label>
                <select value={tahun} onChange={(e) => setTahun(e.target.value)} required>
                  <option value="">Pilih Tahun</option>
                  {tahunOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>

            <fieldset>
              <legend>2. ISI</legend>

              <div className="form-row">
                <label>Akun</label>
                <div className="input-plus-group">
                  <select value={akunId} onChange={handleAkunChange} required>
                    <option value="">Pilih Akun</option>
                    {daftarAkun.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.kode} - {a.deskripsi}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsAkunModalOpen(true)}>+</button>
                </div>
              </div>

              <div className="form-row">
                <label>Deskripsi Akun</label>
                <input type="text" value={deskripsi} disabled />
              </div>

              <div className="form-row">
                <label>Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
              </div>

              <div className="form-row">
                <label>Deskripsi Kegiatan</label>
                <input type="text" value={deskripsiKegiatan} onChange={(e) => setDeskripsiKegiatan(e.target.value)} />
              </div>

              <div className="form-row">
                <label>Realisasi (Rp)</label>
                <input type="number" min="0" value={realisasi} onChange={(e) => setRealisasi(e.target.value)} required />
              </div>

              <div className="form-row">
                <label>Divisi</label>
                <div className="input-plus-group">
                  <select value={divisiId} onChange={(e) => setDivisiId(e.target.value)} required>
                    <option value="">Pilih Divisi</option>
                    {daftarDivisi.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.kode} - {d.nama}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsDivisiModalOpen(true)}>+</button>
                </div>
              </div>
            </fieldset>

            <button type="submit" className="submit-btn">Submit</button>
          </form>
        </div>
      </div>

      {isAkunModalOpen && (
        <>
          <div className="modal-overlay" onClick={() => setIsAkunModalOpen(false)}></div>
          <div className="modal">
            <div className="modal-header">
              <span className="close-btn" onClick={() => setIsAkunModalOpen(false)}>&times;</span>
            </div>
            <div className="modal-body">
              <input type="text" placeholder="Masukkan Akun" onChange={(e) => setNewAkun({ ...newAkun, kode: e.target.value })} />
              <input type="text" placeholder="Deskripsi Akun" onChange={(e) => setNewAkun({ ...newAkun, deskripsi: e.target.value })} />
              <button onClick={handleAkunSubmit}>Tambah Akun</button>
            </div>
          </div>
        </>
      )}

      {isDivisiModalOpen && (
        <>
          <div className="modal-overlay" onClick={() => setIsDivisiModalOpen(false)}></div>
          <div className="modal">
            <div className="modal-header">
              <span className="close-btn" onClick={() => setIsDivisiModalOpen(false)}>&times;</span>
            </div>
            <div className="modal-body">
              <input type="text" placeholder="Masukkan Divisi" onChange={(e) => setNewDivisi({ ...newDivisi, kode: e.target.value })} />
              <input type="text" placeholder="Nama Divisi" onChange={(e) => setNewDivisi({ ...newDivisi, nama: e.target.value })} />
              <button onClick={handleDivisiSubmit}>Tambah Divisi</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
