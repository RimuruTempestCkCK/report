-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 26 Jun 2025 pada 07.42
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `report_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `akun`
--

CREATE TABLE `akun` (
  `id` int(11) NOT NULL,
  `kode` varchar(20) NOT NULL,
  `deskripsi` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `akun`
--

INSERT INTO `akun` (`id`, `kode`, `deskripsi`) VALUES
(1, 'AK001', 'Biaya Listrik'),
(2, 'AK002', 'Biaya Internet'),
(3, 'AK123', 'Akun untuk pengeluaran operasional'),
(4, '0999', 'ssss'),
(5, 'n', 'n'),
(6, '21', 'll'),
(7, '21', 'll'),
(8, '21', 'll'),
(9, '21', 'll'),
(10, '21', 'll'),
(11, '21', 'll'),
(12, '21', 'll'),
(13, '21', 'll'),
(14, '21', 'll'),
(15, '21', 'll'),
(16, '21', 'll'),
(17, '21', 'll'),
(18, '21', 'll'),
(19, '21', 'll'),
(20, '21', 'll'),
(21, '21', 'll'),
(22, 'ii', 'ii'),
(23, 's', 's'),
(24, 'AK123', 'Deskripsi akun baru');

-- --------------------------------------------------------

--
-- Struktur dari tabel `divisi`
--

CREATE TABLE `divisi` (
  `id` int(11) NOT NULL,
  `kode` varchar(20) NOT NULL,
  `nama` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `divisi`
--

INSERT INTO `divisi` (`id`, `kode`, `nama`) VALUES
(1, 'DIV001', 'Keuangan'),
(2, 'DIV002', 'Operasional'),
(3, 'DV001', 'Divisi Keuangan'),
(4, '0okk', 'jiend'),
(5, 's', 's'),
(6, 'DV123', 'Nama Divisi Baru'),
(7, 'DV123', 'Nama Divisi Baru'),
(8, 'DV123', 'Nama Divisi Baru');

-- --------------------------------------------------------

--
-- Struktur dari tabel `laporan`
--

CREATE TABLE `laporan` (
  `id` int(11) NOT NULL,
  `nama_laporan` varchar(255) NOT NULL,
  `tanggal_dibuat` date NOT NULL DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `pemasukan`
--

CREATE TABLE `pemasukan` (
  `id` int(11) NOT NULL,
  `jumlah` decimal(15,2) NOT NULL,
  `tanggal` date NOT NULL DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `penandatangan`
--

CREATE TABLE `penandatangan` (
  `id` int(11) NOT NULL,
  `judul_dokumen` varchar(255) DEFAULT NULL,
  `nama` varchar(100) DEFAULT NULL,
  `jabatan` varchar(100) DEFAULT NULL,
  `nik` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `penandatangan`
--

INSERT INTO `penandatangan` (`id`, `judul_dokumen`, `nama`, `jabatan`, `nik`, `created_at`) VALUES
(1, 'Laporan Pengeluaran Mei', 'Budi Santoso', 'Manager Keuangan', '1234567890', '2025-06-11 14:14:36'),
(2, 'Laporan LPT Bulan Mei', 'Nama 1', 'Manager', '12345', '2025-06-11 16:02:45'),
(3, NULL, 'kkk', 'kkk', '0909', '2025-06-12 15:02:15'),
(4, NULL, 'mm', 'mm', '88', '2025-06-12 15:10:28'),
(5, NULL, 'm', 'm', 'm', '2025-06-12 15:52:29'),
(6, NULL, 'k', 'k', 'k', '2025-06-12 15:58:08'),
(7, NULL, 'o', 'i', 'e', '2025-06-12 16:27:52'),
(8, NULL, 'l', 'l', 'l', '2025-06-12 16:52:06'),
(9, NULL, 'f', 'f', 'f', '2025-06-12 16:54:56'),
(10, NULL, 'N', 'N', 'N', '2025-06-12 17:45:07'),
(11, NULL, 'NK', 'M', 'L', '2025-06-12 17:46:41'),
(12, NULL, 'mkkkk', 'm', 'mmmm', '2025-06-12 17:51:19'),
(13, NULL, 'zz', 'z', 'z', '2025-06-12 17:52:52'),
(14, NULL, 'lll', 'l', 'l', '2025-06-13 04:26:21'),
(15, 'Laporan LPT Bulan Mei', 'zz', 'z', 'z', '2025-06-13 14:29:25'),
(16, 'Laporan LPT Bulan Mey', 'zz', 'z', 'z', '2025-06-13 15:02:22'),
(17, 'Laporan LPT Bulan Mei', 'mkkkk', 'm', 'mmmm', '2025-06-13 15:45:12'),
(18, 'Laporan LPT Bulan Mei', 'mkkkk', 'm', 'mmmm', '2025-06-17 06:38:42'),
(19, 'Laporan Juni', 'Budi', 'Manager', '1234567890', '2025-06-18 06:38:55'),
(20, NULL, 'Sari', 'Supervisor', '0987654321', '2025-06-18 06:45:02'),
(21, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-23 09:56:00'),
(22, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-23 09:57:05'),
(23, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-23 09:57:06'),
(24, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-23 09:57:09'),
(25, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-23 15:08:12'),
(26, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-23 15:09:14'),
(27, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-23 16:23:04'),
(28, 'Laporan LPT Bulan Mei', 'Budi', 'Manager', '1234567890', '2025-06-23 16:23:38'),
(29, 'Laporan LPT Bulan Mei', 'Budi', 'Manager', '1234567890', '2025-06-23 16:25:52'),
(30, 'Laporan LPT Bulan Mei', 'Budi', 'Manager', '1234567890', '2025-06-23 16:26:07'),
(31, 'Laporan LPT Bulan Mei', 'mkkkk', 'm', 'mmmm', '2025-06-23 16:26:34'),
(32, 'Laporan LPT Bulan Mei', 'mkkkk', 'm', 'mmmm', '2025-06-24 04:46:55'),
(33, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 05:34:46'),
(34, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 05:34:52'),
(35, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 05:35:05'),
(36, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 05:35:10'),
(37, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 05:35:41'),
(38, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 06:10:26'),
(39, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 06:10:42'),
(40, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 06:10:46'),
(41, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 06:10:56'),
(42, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 06:11:04'),
(43, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 06:11:11'),
(44, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 06:11:12'),
(45, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 06:30:40'),
(46, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 06:38:35'),
(47, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 07:29:06'),
(48, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 07:29:22'),
(49, 'Laporan LPT Bulan Mei', 'Sari', 'Supervisor', '0987654321', '2025-06-25 08:33:23');

-- --------------------------------------------------------

--
-- Struktur dari tabel `pengeluaran`
--

CREATE TABLE `pengeluaran` (
  `id` int(11) NOT NULL,
  `akun_id` int(11) NOT NULL,
  `deskripsi` varchar(255) DEFAULT NULL,
  `tanggal` date NOT NULL,
  `deskripsi_kegiatan` varchar(255) DEFAULT NULL,
  `realisasi` decimal(15,2) NOT NULL,
  `divisi_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_selected` tinyint(1) DEFAULT 0,
  `report_id` int(11) DEFAULT NULL,
  `judul_utama` varchar(255) DEFAULT NULL,
  `sub_judul` varchar(255) DEFAULT NULL,
  `bulan` varchar(50) DEFAULT NULL,
  `tahun` int(11) DEFAULT NULL,
  `laporan_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `pengeluaran`
--

INSERT INTO `pengeluaran` (`id`, `akun_id`, `deskripsi`, `tanggal`, `deskripsi_kegiatan`, `realisasi`, `divisi_id`, `created_by`, `created_at`, `is_selected`, `report_id`, `judul_utama`, `sub_judul`, `bulan`, `tahun`, `laporan_id`) VALUES
(28, 1, 'Biaya Listrik', '0000-00-00', 'ok', 897.00, 1, 14, '2025-06-23 03:02:43', 1, 18, NULL, NULL, NULL, NULL, 18),
(29, 3, 'Akun untuk pengeluaran operasional', '2025-06-23', 'karena ', 9000.00, 3, 14, '2025-06-23 16:25:33', 1, 18, NULL, NULL, NULL, NULL, 18),
(30, 1, 'Biaya Listrik', '2025-06-25', 'ff', 9000.00, 4, 14, '2025-06-25 05:34:00', 1, 18, 'Lembar Pertanggungjawaban Transaksi (LPT)', 'Kantor Cabang Bogor', '1', 2023, 18);

-- --------------------------------------------------------

--
-- Struktur dari tabel `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `judul` varchar(255) DEFAULT NULL,
  `bulan` int(11) DEFAULT NULL,
  `tahun` int(11) DEFAULT NULL,
  `status_tandatangan` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `reports`
--

INSERT INTO `reports` (`id`, `user_id`, `judul`, `bulan`, `tahun`, `status_tandatangan`) VALUES
(2, 11, 'Laporan Bulanan', 5, 2025, 0),
(8, 14, 'Laporan Bulanan Juni', 6, 2025, 0),
(9, 14, 'Laporan Bulanan', 6, 2025, 0),
(10, 14, 'Laporan Bulanan', 1, 2023, 0),
(18, 14, 'Lembar Pertanggungjawaban Transaksi (LPT) - Kantor Cabang Bogor', 1, 2023, 0);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`) VALUES
(11, 'cantik', 'cantik@gmail.com', '$2b$12$T90.Epcq56WgFdts7kgPdOwIBCakXD6RQUEnzeUQwk5FYzDOLMrEi', 'pegawai'),
(12, 'bgt', 'bgt@gmail.com', '$2b$12$bUjaoJQ44nye9HoaN99Q4em4LAQVOm0EnsAgONggg7E.2BmF4f91m', 'pegawai'),
(14, 'uti', 'uti@gmail.com', '$2b$12$pL.sBxi4C6sH0Wbccni0YOE9IC8H2QeQ1dyPX.oUavy5nBo1Pja4q', 'pegawai'),
(15, 'jaehyun', 'jaehyun@sayang.com', '$2b$12$zMqSbLgFrGDZqqeRTWSrf.hL.VVGQNfosSf7ImAgpocrqDqefrgbG', 'pegawai');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `akun`
--
ALTER TABLE `akun`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `divisi`
--
ALTER TABLE `divisi`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `laporan`
--
ALTER TABLE `laporan`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `pemasukan`
--
ALTER TABLE `pemasukan`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `penandatangan`
--
ALTER TABLE `penandatangan`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `pengeluaran`
--
ALTER TABLE `pengeluaran`
  ADD PRIMARY KEY (`id`),
  ADD KEY `akun_id` (`akun_id`),
  ADD KEY `divisi_id` (`divisi_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `fk_pengeluaran_report` (`report_id`);

--
-- Indeks untuk tabel `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `akun`
--
ALTER TABLE `akun`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT untuk tabel `divisi`
--
ALTER TABLE `divisi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `laporan`
--
ALTER TABLE `laporan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `pemasukan`
--
ALTER TABLE `pemasukan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `penandatangan`
--
ALTER TABLE `penandatangan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT untuk tabel `pengeluaran`
--
ALTER TABLE `pengeluaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT untuk tabel `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `pengeluaran`
--
ALTER TABLE `pengeluaran`
  ADD CONSTRAINT `fk_pengeluaran_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `pengeluaran_ibfk_2` FOREIGN KEY (`akun_id`) REFERENCES `akun` (`id`),
  ADD CONSTRAINT `pengeluaran_ibfk_3` FOREIGN KEY (`divisi_id`) REFERENCES `divisi` (`id`),
  ADD CONSTRAINT `pengeluaran_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `pengeluaran_ibfk_5` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
