import React, { useState, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import "./Select.css";

export default function Select() {
  const [documentTitle, setDocumentTitle] = useState("Laporan LPT Bulan Mei");
  const [signerName, setSignerName] = useState("");
  const [signerPosition, setSignerPosition] = useState("");
  const [signerNIK, setSignerNIK] = useState("");
  const [dataReports, setDataReports] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [isEditable, setIsEditable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("terbaru");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newSigner, setNewSigner] = useState({ nama: "", jabatan: "", nik: "" });
  const [signersList, setSignersList] = useState([]);
  const [tempSearch, setTempSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [notification, setNotification] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const BASE_URL = "http://localhost:5000/api";

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const handleAuthError = (response) => {
    if (response.status === 401) {
      showNotification("Session expired. Please login again.", "error");
      localStorage.removeItem('token');
      window.location.href = '/login';
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchData();
    fetchSigners();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 8000);
  };

  const fetchSigners = async () => {
    try {
      const res = await fetch(`${BASE_URL}/select/signers`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (handleAuthError(res)) return;
      
      if (!res.ok) throw new Error("Gagal mengambil daftar penandatangan");

      const data = await res.json();
      setSignersList(data);
    } catch (err) {
      console.error("Error fetch signers:", err);
      showNotification("Error fetching signers: " + err.message, "error");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/select/data`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (handleAuthError(res)) {
        setLoading(false);
        return;
      }
      
      if (!res.ok) throw new Error("Failed to fetch data");
      
      const data = await res.json();
      setDataReports(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      showNotification("Error fetching data: " + err.message, "error");
    }
  };

  const handleSelectData = (id) => {
    setSelectedData((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id]
    );
  };

  const handleSignerNameChange = (e) => {
    const selectedName = e.target.value;
    setSignerName(selectedName);

    const selectedSigner = signersList.find((s) => s.nama === selectedName);
    if (selectedSigner) {
      setSignerPosition(selectedSigner.jabatan);
      setSignerNIK(selectedSigner.nik);
    } else {
      setSignerPosition("");
      setSignerNIK("");
    }
  };

  const handleSaveSignature = async () => {
    if (!documentTitle || !signerName || !signerPosition || !signerNIK) {
      showNotification("Lengkapi semua informasi penandatangan!", "error");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/select/signature`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          judul_dokumen: documentTitle,
          nama: signerName,
          jabatan: signerPosition,
          nik: signerNIK,
        }),
      });

      if (handleAuthError(res)) return;

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save signature");

      setIsEditable(false);
      showNotification("Informasi penandatangan berhasil disimpan!");
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleDeleteAll = async () => {
    if (selectedData.length === 0) {
      showNotification("Pilih data yang ingin dihapus terlebih dahulu!", "error");
      return;
    }

    const konfirmasi = window.confirm("Yakin ingin menghapus semua data terpilih?");
    if (!konfirmasi) return;

    try {
      const res = await fetch(`${BASE_URL}/select/delete`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ laporan_ids: selectedData }),
      });

      if (handleAuthError(res)) return;

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal menghapus data");
      }

      setDataReports((prev) => prev.filter((item) => !selectedData.includes(item.id)));
      setSelectedData([]);
      fetchData();
      showNotification("Data berhasil dihapus!");
    } catch (error) {
      showNotification("Terjadi kesalahan: " + error.message, "error");
    }
  };

const handleCetak = async () => {
  if (!documentTitle || !signerName || !signerPosition || !signerNIK) {
    showNotification("Lengkapi semua informasi penandatangan!", "error");
    return;
  }

  if (selectedData.length === 0) {
    showNotification("Pilih data terlebih dahulu untuk disimpan!", "error");
    return;
  }

  try {
    // 1. Simpan data penandatangan
    const signatureRes = await fetch(`${BASE_URL}/select/signature`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        judul_dokumen: documentTitle,
        nama: signerName,
        jabatan: signerPosition,
        nik: signerNIK,
      }),
    });

    if (handleAuthError(signatureRes)) return;
    if (!signatureRes.ok) {
      const errData = await signatureRes.json();
      throw new Error(errData.error || "Gagal menyimpan penandatangan");
    }

    // 2. Submit data terpilih ke backend untuk dibuatkan laporan
    const submitRes = await fetch(`${BASE_URL}/select/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        laporan_ids: selectedData,
        judul: documentTitle,
      }),
    });

    if (handleAuthError(submitRes)) return;

    const submitResult = await submitRes.json();
    if (!submitRes.ok) {
      throw new Error(submitResult.error || "Gagal menyimpan laporan");
    }

    showNotification("Laporan berhasil disimpan. Silakan cetak dari menu Report.");
    setSelectedData([]);

  } catch (err) {
    console.error("❌ Error di handleCetak:", err);
    showNotification("Terjadi kesalahan: " + err.message, "error");
  }
};



  const formatTanggal = (tgl) => {
    const date = new Date(tgl);
    if (isNaN(date)) return tgl;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const filteredData = dataReports.filter((item) => {
    const q = appliedSearch.toLowerCase();
    return (
      item.akun.toLowerCase().includes(q) ||
      item.deskripsi.toLowerCase().includes(q) ||
      item.divisi.toLowerCase().includes(q) ||
      item.kegiatan.toLowerCase().includes(q) ||
      formatTanggal(item.tanggal).includes(q)
    );
  });

  const sortedData = filteredData.sort((a, b) => {
    switch (sortOption) {
      case "terbaru":
        return new Date(b.tanggal) - new Date(a.tanggal);
      case "terlama":
        return new Date(a.tanggal) - new Date(b.tanggal);
      case "divisi":
        return a.divisi.localeCompare(b.divisi);
      case "akun":
        return a.akun.localeCompare(b.akun);
      default:
        return 0;
    }
  });

  const handleEditRow = (item) => {
    setEditData(item);
    setShowEditModal(true);
  };

  const handleDeleteRow = async (id) => {
    const konfirmasi = window.confirm("Yakin ingin menghapus data ini?");
    if (!konfirmasi) return;

    try {
      const res = await fetch(`${BASE_URL}/select/delete`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ laporan_ids: [id] }),
      });

      if (handleAuthError(res)) return;

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus data");

      showNotification("Data berhasil dihapus!");
      fetchData();
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`${BASE_URL}/select/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editData),
      });

      if (handleAuthError(res)) return;

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memperbarui data");

      showNotification("Data berhasil diperbarui!");
      setShowEditModal(false);
      setEditData(null);
      fetchData();
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalRealisasi = selectedData.reduce((sum, id) => {
    const found = dataReports.find((d) => d.id === id);
    return found ? sum + Number(found.realisasi) : sum;
  }, 0);

  const formatNumber = (num) =>
    num.toLocaleString("id-ID", { minimumFractionDigits: 0 });

  const handleSaveNewSigner = async () => {
    if (!newSigner.nama || !newSigner.jabatan || !newSigner.nik) {
      showNotification("Lengkapi semua field terlebih dahulu.", "error");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/select/signer`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newSigner),
      });

      if (handleAuthError(res)) return;

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Gagal menambahkan penandatangan");

      await fetchSigners();
      setShowModal(false);
      setNewSigner({ nama: "", jabatan: "", nik: "" });
      showNotification("Penandatangan berhasil ditambahkan!");
    } catch (err) {
      showNotification("Gagal menyimpan: " + err.message, "error");
    }
  };

  return (
    <div className="select-page">
      <HeaderMenu />

      <div className="select-container">
        <div className="header-container">
          <img src="/img/choice.svg" alt="Choice Icon" />
          <h2>Ayo Pilih yang akan menjadi laporan kamu</h2>
        </div>

        {notification && (
          <div className={`notification-fixed ${notification.type}`}>
            <span>{notification.message}</span>
            <button className="close-btn" onClick={() => setNotification(null)}>X</button>
          </div>
        )}

        {loading ? (
          <div>Loading data...</div>
        ) : error ? (
          <div style={{ color: "red" }}>Error: {error}</div>
        ) : (
          <div className="content-wrapper">
            <div className="info-penandatangan">
              <h2>Informasi Penandatangan</h2>
              <div className="penandatangan-form">
                <div className="form-judul-dokumen">
                  <label>Judul Dokumen</label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    readOnly={!isEditable}
                  />
                  {isEditable ? (
                    <button
                      onClick={() => {
                        setIsEditable(false);
                        showNotification("Judul dokumen berhasil disimpan!");
                      }}
                    >
                      Save
                    </button>
                  ) : (
                    <button onClick={() => setIsEditable(true)}>Edit</button>
                  )}
                </div>

                <div className="select-form-group-horizontal">
                  <label>Nama Penandatangan</label>
                  <select value={signerName} onChange={handleSignerNameChange}>
                    <option value="">Pilih Penandatangan</option>
                    {signersList.map((signer, index) => (
                      <option key={index} value={signer.nama}>
                        {signer.nama}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                  >
                    +
                  </button>
                </div>

                <div className="select-form-group-horizontal">
                  <label>Jabatan Penandatangan</label>
                  <input type="text" value={signerPosition} readOnly />
                </div>

                <div className="select-form-group-horizontal">
                  <label>NIK Penandatangan</label>
                  <input type="number" value={signerNIK} readOnly />
                </div>
              </div>
            </div>

            {/* Modal tetap sama */}
            {showModal && (
              <div className="modal-backdrop">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Tambah Penandatangan</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowModal(false)}
                      >
                        &#x2715;
                      </button>
                    </div>
                    <div className="modal-body">
                      <form>
                        <div className="form-group horizontal">
                          <label>Nama Penandatangan</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newSigner.nama}
                            onChange={(e) =>
                              setNewSigner({ ...newSigner, nama: e.target.value })
                            }
                          />
                        </div>
                        <div className="form-group horizontal">
                          <label>Jabatan</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newSigner.jabatan}
                            onChange={(e) =>
                              setNewSigner({ ...newSigner, jabatan: e.target.value })
                            }
                          />
                        </div>
                        <div className="form-group horizontal">
                          <label>NIK</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newSigner.nik}
                            onChange={(e) =>
                              setNewSigner({ ...newSigner, nik: e.target.value })
                            }
                          />
                        </div>
                      </form>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveNewSigner}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="select-report-selection">
              <h3>Ayo Pilih Data Laporan</h3>
            <div className="select-report-actions">
              <button onClick={handleDeleteAll}>Delete All</button>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="terbaru">Sort by Terbaru</option>
                <option value="terlama">Sort by Terlama</option>
                <option value="divisi">Sort by Divisi</option>
                <option value="akun">Sort by Akun</option>
              </select>
              <div className="total">Total: Rp {formatNumber(totalRealisasi)}</div>
              <div className="search-bar">
                <input
                  className="form-control"
                  type="text"
                  placeholder="Search..."
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  aria-label="Search"
                />
                <button
                  className="btn btn-outline-success"
                  type="button"
                  onClick={() => {
                    setAppliedSearch(tempSearch);
                    setCurrentPage(1); 
                  }}
                >
                  Search
                </button>
              </div>
            </div>
              <table className="select-report-table">
                <thead>
                <tr>
                  <th>
                <input
                  type="checkbox"
                  checked={currentItems.every((item) => selectedData.includes(item.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newSelections = currentItems
                        .filter((item) => !selectedData.includes(item.id))
                        .map((item) => item.id);
                      setSelectedData([...selectedData, ...newSelections]);
                    } else {
                      const remaining = selectedData.filter(
                        (id) => !currentItems.find((item) => item.id === id)
                      );
                      setSelectedData(remaining);
                    }
                  }}
                />
              </th>
                  <th>Akun</th>
                  <th>Deskripsi</th>
                  <th>Tanggal</th>
                  <th>Kegiatan</th>
                  <th>Realisasi</th>
                  <th>Divisi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
                <tbody>
                  {currentItems.map((item) => (
                    <tr
                      key={item.id}
                      className={selectedData.includes(item.id) ? "selected" : ""}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedData.includes(item.id)}
                          onChange={() => handleSelectData(item.id)}
                        />
                      </td>
                      <td>{item.akun}</td>
                      <td>{item.deskripsi}</td>
                      <td>{formatTanggal(item.tanggal)}</td>
                      <td>{item.kegiatan || item.deskripsi_kegiatan}</td>
                      <td>{formatNumber(Number(item.realisasi))}</td>
                      <td>{item.divisi}</td>
                      <td>
                          <button onClick={() => handleEditRow(item)} className="icon-button">✏️</button>
                          <button onClick={() => handleDeleteRow(item.id)} className="icon-button">🗑️</button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                className="total-realisasi"
                style={{ marginTop: "10px", fontSize: "16px" }}
              >
                <strong>Total Realisasi Terpilih: </strong> Rp {formatNumber(totalRealisasi)}
              </div>

              <nav aria-label="Page navigation example">
                <ul className="pagination justify-content-center">
                  <li className="page-item">
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from(
                    { length: Math.ceil(filteredData.length / itemsPerPage) },
                    (_, index) => (
                      <li key={index} className="page-item">
                        <button
                          className="page-link"
                          onClick={() => paginate(index + 1)}
                          style={{
                            fontWeight: currentPage === index + 1 ? "bold" : "normal",
                          }}
                        >
                          {index + 1}
                        </button>
                      </li>
                    )
                  )}
                  <li className="page-item">
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={
                        currentPage === Math.ceil(filteredData.length / itemsPerPage)
                      }
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            <button
              className="cetak-button"
              onClick={() => {
                console.log("Tombol Cetak diklik");
                handleCetak();
              }}
              disabled={selectedData.length === 0 || !signerName || !signerNIK}
            >
              Cetak
            </button>

          {showEditModal && editData && (
            <div className="modal-backdrop">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Data</h5>
                    <button onClick={() => setShowEditModal(false)} className="btn-close">×</button>
                  </div>
                  <div className="form-group modal-form-group">
                    <form>
                      <label>Deskripsi</label>
                      <input
                        type="text"
                        value={editData.deskripsi}
                        onChange={(e) => setEditData({ ...editData, deskripsi: e.target.value })}
                      />
                      <label>Tanggal</label>
                      <input
                        type="date"
                        value={
                          editData.tanggal
                            ? new Date(editData.tanggal).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => setEditData({ ...editData, tanggal: e.target.value })}
                      />
                      <label>Deskripsi Kegiatan</label>
                      <input
                        type="text"
                        value={editData.kegiatan}
                        onChange={(e) =>
                          setEditData({ ...editData, kegiatan: e.target.value })
                        }
                      />
                      <label>Realisasi</label>
                      <input
                        type="number"
                        value={editData.realisasi}
                        onChange={(e) => setEditData({ ...editData, realisasi: e.target.value })}
                      />
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button className="btn custom-secondary" onClick={handleSaveEdit}>Simpan</button>
                  </div>
                </div>
              </div>
            </div>
          )}
            </div>
          </div>
        )}
      </div>
    </div>
    
  );
}