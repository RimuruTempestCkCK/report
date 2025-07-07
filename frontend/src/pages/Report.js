import axios from 'axios';
import React, { useState, useEffect } from "react";
import HeaderMenu from "./HeaderMenu";
import './Report.css';

const Report = () => {
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({ id: null, name: '', date: '' });
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [confirmDeleteMultipleModalVisible, setConfirmDeleteMultipleModalVisible] = useState(false);
  const [confirmSaveModalVisible, setConfirmSaveModalVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  const BASE_URL = "http://localhost:5000/api/report";
  const itemsPerPage = 10;

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("Token tidak ditemukan di localStorage");
    return;
  }

    axios.get("http://localhost:5000/api/report/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    })
    .then(response => {
      console.log("Laporan dari API:", response.data);
      const formatted = response.data
        .filter(item => item.judul && item.bulan && item.tahun && item.judul !== 'None - None')
        .map(item => ({
          id: item.id,
          name: item.judul,
          date: item.bulan && item.tahun ? `${item.tahun}-${String(item.bulan).padStart(2, '0')}-01` : "",
          status_tandatangan: item.status_tandatangan,
          nama_user: item.nama_user,
          sub_judul: item.sub_judul || '',
      }));
      setReports(formatted);
    })

  }, []);


  const fetchReportsFromBackend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/list`, {
        headers: getAuthHeaders()
      });
      if (response.status === 401) {
        alert("Sesi Anda habis. Silakan login kembali.");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      if (!response.ok) throw new Error("Gagal mengambil data laporan");

      const data = await response.json();
      setReports(data.map(item => ({
        id: item.id,
        name: item.judul,
        date: `${item.tahun}-${String(item.bulan).padStart(2, '0')}-01`,
        status_tandatangan: item.status_tandatangan,
        nama_user: item.nama_user,
        sub_judul: item.sub_judul || '',
      })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInput = e => setSearchQuery(e.target.value);
  const handleSearch = () => { setActiveSearch(searchQuery); setCurrentPage(1); };
  const handleSortChange = e => setSortBy(e.target.value);

  const handleDeleteRow = id => { setPendingDeleteId(id); setConfirmDeleteModalVisible(true); };
  const confirmDeleteRow = async () => {
    try {
      const res = await fetch(`${BASE_URL}/delete/${pendingDeleteId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus laporan");

      await fetchReportsFromBackend(); // <= tambahkan ini
      setConfirmDeleteModalVisible(false);
      setPendingDeleteId(null);
    } catch (e) {
      alert("Gagal menghapus laporan: " + e.message);
      console.error(e);
    }
  };


  const handleDeleteSelected = () => setConfirmDeleteMultipleModalVisible(true);
  const confirmDeleteMultiple = async () => {
    try {
      const res = await fetch(`${BASE_URL}/delete-multiple`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error();
      setReports(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      await fetchReportsFromBackend(); // Tambahkan setelah berhasil hapus multiple
      setConfirmDeleteMultipleModalVisible(false);
    } catch (e) {
        alert("Gagal menghapus laporan");
        console.error("Error saat menghapus:", e);
      }
  };

  const handleCheckboxChange = id => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );
  const handleSelectAll = e => {
    const currentIds = paginatedReports.map(r => r.id);
    if (e.target.checked) setSelectedIds([...new Set([...selectedIds, ...currentIds])]);
    else setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
  };

  const handleEditRow = report => {
    setEditData({ id: report.id, name: report.name, date: report.date });
    setEditModalVisible(true);
  };
  const handleSaveEditClicked = () => setConfirmSaveModalVisible(true);
  const confirmSaveEdit = async () => {
    try {
      const [year, month] = editData.date.split('-');
      const body = { judul: editData.name, bulan: Number(month), tahun: Number(year) };
      const res = await fetch(`${BASE_URL}/update/${editData.id}`, {
        method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body)
      });
      if (!editData.date || !editData.date.includes('-')) {
      alert("Tanggal tidak valid");
      return;
    }
      if (!res.ok) throw new Error();
      setReports(prev => prev.map(r => r.id === editData.id ? { ...r, name: editData.name, date: editData.date } : r));
      setEditModalVisible(false);
      setConfirmSaveModalVisible(false);
    } catch {
      alert("Gagal memperbarui laporan");
    }
  };
  const cancelEdit = () => setEditModalVisible(false);

const downloadWithToken = async (url, filename) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
};

const handleDownloadPDF = id => downloadWithToken(`${BASE_URL}/download-pdf/${id}`, `report_${id}.pdf`);
const handleDownloadExcel = id => downloadWithToken(`${BASE_URL}/download-excel/${id}`, `report_${id}.xlsx`);


  const handleSignReport = async id => {
    try {
      const res = await fetch(`${BASE_URL}/sign/${id}`, {
        method: 'PUT', headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error();
      setReports(prev => prev.map(r => r.id === id ? { ...r, status_tandatangan: true } : r));
    } catch {
      alert("Gagal menandatangani laporan");
    }
  };

  const filteredReports = reports.filter(r =>
    (r.name?.toLowerCase().includes(activeSearch.toLowerCase()) || r.date?.includes(activeSearch))
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const totalPages = Math.ceil(sortedReports.length / itemsPerPage);
  const paginatedReports = sortedReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const allSelected = paginatedReports.length > 0 && paginatedReports.every(r => selectedIds.includes(r.id));
  const handlePageChange = page => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };
  const formatTanggal = (dateString) => {
    const [year, month] = dateString.split("-");
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${bulan[parseInt(month, 10) - 1]} ${year}`;
  };

  return (
    <div className="report-container">
      <HeaderMenu />
      <div className="report-content">
        <div className="report-header">
          <img src="/img/loading.svg" alt="Loading" className="report-loading-image" />
          <h1>AYO UNDUH LAPORANNYA</h1>
        </div>
      {loading && <p style={{ textAlign: 'center', fontStyle: 'italic' }}>Memuat data laporan...</p>}

        <div className="report-tabel-merah">
          <div className="report-controls">
            <button className="report-delete-all-btn"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
              title="Hapus laporan terpilih">
              Delete Selected
            </button>
            <div className="report-control-right">
              <select className="report-sort-dropdown" value={sortBy} onChange={handleSortChange}>
                <option value="">Sort By</option>
                <option value="newest">Terbaru-Terlama</option>
                <option value="oldest">Terlama-Terbaru</option>
                <option value="name">Nama Dokumen</option>
              </select>
              <input type="text" className="report-search-bar" value={searchQuery}
                onChange={handleSearchInput} placeholder="Search by name or date" />
              <button className="report-search-btn" onClick={handleSearch}>Search</button>
            </div>
          </div>

          <table className="report-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allSelected} onChange={handleSelectAll} /></th>
                <th>No</th>
                <th>Nama Dokumen</th>
                <th>Periode</th>
                <th>Status</th>
                <th>Unduh</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((r,i) => (
                <tr key={r.id}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(r.id)}
                      onChange={() => handleCheckboxChange(r.id)} />
                  </td>
                  <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                  <td>{r.name}</td>
                  <td>{formatTanggal(r.date)}</td>
                  <td>{r.status_tandatangan ? "✅ Ditandatangani" : "❌ Belum"}</td>
                  <td>
                    <button className="report-download-btn" onClick={() => handleDownloadPDF(r.id)}>
                      <i className="bi bi-file-pdf report-icon-pdf"></i>
                    </button>
                    <button className="report-download-btn" onClick={() => handleDownloadExcel(r.id)}>
                      <i className="bi bi-file-earmark-excel report-icon-excel"></i>
                    </button>
                  </td>
                  <td>
                    <button className="report-action-btn" onClick={() => handleSignReport(r.id)}
                      disabled={r.status_tandatangan} title={r.status_tandatangan ? "Sudah ditandatangani" : "Tandatangani"}>
                      ✍️
                    </button>
                    <button className="report-action-btn" onClick={() => handleEditRow(r)}>✏️</button>
                    <button className="report-action-btn" onClick={() => handleDeleteRow(r.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {paginatedReports.length === 0 && (
                <tr>
                  <td colSpan="7" className="report-empty-msg">Tidak ada laporan yang ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="pagination-wrapper">
            <nav aria-label="Page navigation">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}>Previous
                  </button>
                </li>
                {[...Array(totalPages)].map((_, idx) => (
                  <li key={idx} className={`page-item ${currentPage === idx + 1 ? 'active' : ''}`}>
                    <button className="page-link"
                      onClick={() => handlePageChange(idx+1)}>{idx+1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}>Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {editModalVisible && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <h2 className="report-modal-title">Edit Laporan</h2>
              <button className="report-modal-close" onClick={cancelEdit}>×</button>
            </div>
            <div className="report-modal-body">
              <div className="form-group">
                <label>Nama Dokumen:</label>
                <input type="text" value={editData.name}
                  onChange={e => setEditData({ ...editData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tanggal:</label>
                <input type="date" value={editData.date}
                  onChange={e => setEditData({ ...editData, date: e.target.value })} />
              </div>
              <div className="form-actions">
                <button onClick={handleSaveEditClicked}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteModalVisible && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <h2 className="report-modal-title">Konfirmasi Hapus</h2>
              <button className="report-modal-close" onClick={() => setConfirmDeleteModalVisible(false)}>×</button>
            </div>
            <div className="report-modal-body">
              <p>Apakah Anda yakin ingin menghapus laporan ini?</p>
              <div className="form-actions">
                <button className="report-modal-cancel" onClick={() => setConfirmDeleteModalVisible(false)}>Cancel</button>
                <button className="report-modal-delete" onClick={confirmDeleteRow}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteMultipleModalVisible && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <h2 className="report-modal-title">Konfirmasi Hapus Multiple</h2>
              <button className="report-modal-close" onClick={() => setConfirmDeleteMultipleModalVisible(false)}>×</button>
            </div>
            <div className="report-modal-body">
              <p>Apakah Anda yakin ingin menghapus {selectedIds.length} laporan terpilih?</p>
              <div className="form-actions">
                <button className="report-modal-cancel" onClick={() => setConfirmDeleteMultipleModalVisible(false)}>Cancel</button>
                <button className="report-modal-delete" onClick={confirmDeleteMultiple}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmSaveModalVisible && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <h2 className="report-modal-title">Konfirmasi Simpan</h2>
              <button className="report-modal-close" onClick={() => setConfirmSaveModalVisible(false)}>×</button>
            </div>
            <div className="report-modal-body">
              <p>Apakah Anda yakin ingin menyimpan perubahan laporan?</p>
              <div className="form-actions">
                <button className="report-modal-cancel" onClick={() => setConfirmSaveModalVisible(false)}>Cancel</button>
                <button className="report-modal-save" onClick={confirmSaveEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
  