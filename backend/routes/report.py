from flask import Blueprint, request, jsonify, send_file, current_app
from functools import wraps
import MySQLdb.cursors
import logging
import io
import pandas as pd
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from fpdf import FPDF
from extensions import mysql
from datetime import datetime

report_bp = Blueprint('report', __name__)
report_logger = logging.getLogger(__name__)

tanggal_sekarang = datetime.now().strftime("BOGOR, %d %B %Y").upper()


def verify_jwt(token):
    try:
        return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
    except (ExpiredSignatureError, InvalidTokenError):
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token is missing'}), 401

        token = auth_header.split(' ')[1]
        payload = verify_jwt(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        kwargs['user_id'] = payload.get('user_id')
        kwargs['role'] = payload.get('role')
        return f(*args, **kwargs)
    return decorated

@report_bp.route('/list', methods=['GET'])
@token_required
def get_report_list(user_id=None, role=None):
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cur.execute("""
        SELECT r.id, r.judul, r.bulan, r.tahun, r.status_tandatangan, u.full_name AS nama_user
        FROM reports r
        JOIN users u ON r.user_id = u.id
        WHERE r.user_id = %s
        ORDER BY r.tahun DESC, r.bulan DESC
    """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        return jsonify(rows)
    except Exception:
        report_logger.exception("Gagal mengambil daftar laporan")
        return jsonify({'error': 'Terjadi kesalahan saat mengambil data'}), 500


@report_bp.route('/detail/<int:report_id>', methods=['GET'])
@token_required
def get_report_detail(report_id, user_id=None, role=None):
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        cur.execute("""
            SELECT p.id, a.kode AS akun, a.deskripsi  AS deskripsi_akun, p.tanggal, 
                p.deskripsi, p.deskripsi_kegiatan, p.realisasi, d.nama AS divisi
            FROM pengeluaran p
            JOIN akun a ON p.akun_id = a.id
            JOIN divisi d ON p.divisi_id = d.id
            WHERE p.report_id = %s
        """, (report_id,))

        rows = cur.fetchall()
        cur.close()
        return jsonify(rows)
    except Exception:
        report_logger.exception("Gagal mengambil detail laporan")
        return jsonify({'error': 'Terjadi kesalahan saat mengambil detail'}), 500

@report_bp.route('/sign/<int:report_id>', methods=['PUT'])
@token_required
def sign_report(report_id, user_id=None, role=None):
    try:
        cur = mysql.connection.cursor()
        cur.execute("UPDATE reports SET status_tandatangan = TRUE WHERE id = %s", (report_id,))
        if cur.rowcount == 0:
            cur.close()
            return jsonify({'error': 'Laporan tidak ditemukan'}), 404
        mysql.connection.commit()
        cur.close()
        return jsonify({'message': 'Laporan berhasil ditandatangani'})
    except Exception:
        report_logger.exception("Gagal menandatangani laporan")
        return jsonify({'error': 'Gagal menandatangani laporan'}), 500

@report_bp.route('/delete/<int:report_id>', methods=['DELETE'])
@token_required
def delete_report(report_id, user_id=None, role=None):
    try:
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM pengeluaran WHERE report_id = %s", (report_id,))
        cur.execute("DELETE FROM reports WHERE id = %s", (report_id,))
        if cur.rowcount == 0:
            cur.close()
            return jsonify({'error': 'Laporan tidak ditemukan'}), 404
        mysql.connection.commit()
        cur.close()
        return jsonify({'message': 'Laporan berhasil dihapus'})
    except Exception:
        report_logger.exception("Gagal menghapus laporan")
        return jsonify({'error': 'Gagal menghapus laporan'}), 500

@report_bp.route('/delete-multiple', methods=['POST'])
@token_required
def delete_multiple_reports(user_id=None, role=None):
    try:
        data = request.get_json()
        ids = data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return jsonify({'error': 'Tidak ada ID yang valid dikirim'}), 400

        placeholders = ','.join(['%s'] * len(ids))
        cur = mysql.connection.cursor()
        cur.execute(f"DELETE FROM transactions WHERE report_id IN ({placeholders})", tuple(ids))
        cur.execute(f"DELETE FROM reports WHERE id IN ({placeholders})", tuple(ids))
        mysql.connection.commit()
        cur.close()
        return jsonify({'message': f'{len(ids)} laporan berhasil dihapus'})
    except Exception:
        report_logger.exception("Gagal menghapus multiple laporan")
        return jsonify({'error': 'Gagal menghapus laporan'}), 500

@report_bp.route('/update/<int:report_id>', methods=['PUT'])
@token_required
def update_report(report_id, user_id=None, role=None):
    try:
        data = request.get_json()
        judul = data.get('judul')
        bulan = data.get('bulan')
        tahun = data.get('tahun')

        if not all([judul, bulan, tahun]):
            return jsonify({'error': 'Data tidak lengkap'}), 400

        cur = mysql.connection.cursor()
        cur.execute("""
            UPDATE reports SET judul = %s, bulan = %s, tahun = %s WHERE id = %s
        """, (judul, bulan, tahun, report_id))
        if cur.rowcount == 0:
            cur.close()
            return jsonify({'error': 'Laporan tidak ditemukan'}), 404
        mysql.connection.commit()
        cur.close()
        return jsonify({'message': 'Laporan berhasil diperbarui'})
    except Exception:
        report_logger.exception("Gagal memperbarui laporan")
        return jsonify({'error': 'Gagal memperbarui laporan'}), 500

@report_bp.route('/download-excel/<int:report_id>', methods=['GET'])
@token_required
def download_excel(report_id, user_id=None, role=None):
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cur.execute("""
            SELECT a.kode AS akun, a.deskripsi AS deskripsi_akun, p.tanggal, 
            p.deskripsi AS deskripsi_transaksi, p.deskripsi_kegiatan, p.realisasi, d.nama AS divisi
            FROM pengeluaran p
            JOIN akun a ON p.akun_id = a.id
            JOIN divisi d ON p.divisi_id = d.id
            WHERE p.report_id = %s
        """, (report_id,))

        rows = cur.fetchall()
        if not rows:
            cur.close()
            return jsonify({'error': 'Tidak ada data transaksi untuk laporan ini'}), 400

        cur.execute("""
            SELECT judul AS judul_utama, '' AS sub_judul, bulan, tahun
            FROM reports
            WHERE id = %s
        """, (report_id,))
        report_meta = cur.fetchone()
        if not report_meta:
         return jsonify({'error': 'Metadata laporan tidak ditemukan'}), 400

        cur.execute("""
            SELECT nama, jabatan, nik
            FROM penandatangan
            ORDER BY id DESC LIMIT 1
        """)


        signer = cur.fetchone()
        cur.close()

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            workbook = writer.book
            sheet = workbook.add_worksheet('Laporan')
            writer.sheets['Laporan'] = sheet

            sheet.write('A1', report_meta['judul_utama'])
            sheet.write('A2', report_meta['sub_judul'])
            sheet.write('A3', f"Bulan {report_meta['bulan']} {report_meta['tahun']}")

            headers = ["No", "Akun", "Deskripsi", "Tanggal", "Deskripsi Kegiatan", "Realisasi", "Divisi"]
            for col_num, header in enumerate(headers):
                sheet.write(5, col_num, header)

            total = 0
            for i, row in enumerate(rows):
                sheet.write(i + 6, 0, i + 1)
                sheet.write(i + 6, 1, row['akun'])
                sheet.write(i + 6, 2, row['deskripsi_akun'])
                tanggal = row['tanggal']
                if not tanggal or str(tanggal).startswith("0000"):
                        tanggal = "-"
                sheet.write(i + 6, 3, tanggal)
                sheet.write(i + 6, 4, row['deskripsi_kegiatan'])
                sheet.write(i + 6, 5, row['realisasi'])
                sheet.write(i + 6, 6, row['divisi'])
                total += row['realisasi']

            sheet.write(len(rows) + 7, 3, "TOTAL")
            sheet.write(len(rows) + 7, 4, total)

            if signer:
                sheet.write(len(rows) + 9, 0, "Disetujui oleh:")
                sheet.write(len(rows) + 11, 0, signer['nama'])
                sheet.write(len(rows) + 12, 0, signer['jabatan'])
                sheet.write(len(rows) + 13, 0, f"NIK: {signer['nik']}")

        output.seek(0)
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            download_name=f'report_{report_id}.xlsx',
            as_attachment=True
        )

    except Exception:
        report_logger.exception("Gagal mengunduh laporan Excel")
        return jsonify({'error': 'Gagal mengunduh laporan Excel'}), 500

@report_bp.route('/download-pdf/<int:report_id>', methods=['GET'])
@token_required
def download_pdf(report_id, user_id=None, role=None):
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        # Ambil data transaksi laporan
        cur.execute("""
            SELECT a.kode AS akun, a.deskripsi AS deskripsi_akun, p.tanggal, 
                   p.deskripsi AS deskripsi_transaksi, p.deskripsi_kegiatan, 
                   p.realisasi, d.nama AS divisi
            FROM pengeluaran p
            JOIN akun a ON p.akun_id = a.id
            JOIN divisi d ON p.divisi_id = d.id
            WHERE p.report_id = %s
        """, (report_id,))
        rows = cur.fetchall()

        if not rows:
            cur.close()
            return jsonify({'error': 'Tidak ada data transaksi untuk laporan ini'}), 400

        # Ambil metadata laporan
        cur.execute("""
            SELECT judul AS judul_utama, '' AS sub_judul, bulan, tahun
            FROM reports
            WHERE id = %s
        """, (report_id,))
        report_meta = cur.fetchone()

        if not report_meta:
            cur.close()
            return jsonify({'error': 'Metadata laporan tidak ditemukan'}), 400

        # Ambil penandatangan
        cur.execute("""
            SELECT nama, jabatan, nik
            FROM penandatangan
            ORDER BY id DESC LIMIT 1
        """)


        signer = cur.fetchone()
        cur.close()



        bulan_nama = [
            "", "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
            "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
        ]
        bulan_text = bulan_nama[report_meta['bulan']]



        # Generate PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, txt="LEMBAR PERTANGGUNGJAWABAN TRANSAKSI (LPT)", ln=True, align='C')
        pdf.cell(0, 10, txt="KANTOR CABANG BOGOR", ln=True, align='C')
        pdf.cell(0, 10, txt=f"BULAN {bulan_text} {report_meta['tahun']}", ln=True, align='C')
        pdf.ln(10)


        # Header tabel
        pdf.set_font("Arial", "B", 10)
        headers = ["AKUN", "DESKRIPSI", "TANGGAL", "DESKRIPSI KEGIATAN", "REALISASI (RP)", "DEVISI"]
        col_widths = [30, 40, 25, 45, 30, 25]

        for i in range(len(headers)):
            pdf.cell(col_widths[i], 10, headers[i], border=1)
        pdf.ln()


        # Isi tabel
        line_height = 6
        pdf.set_font("Arial", "", 10)
        total = 0

        for i, row in enumerate(rows, start=1):
            tanggal = row['tanggal'] if row['tanggal'] and not str(row['tanggal']).startswith("0000") else "-"
            data_row = [
                row['akun'] or "-",
                row['deskripsi_transaksi'] or "-",
                tanggal,
                row['deskripsi_kegiatan'] or "-",
                f"{row['realisasi']:,.0f}".replace(",", "."),
                row['divisi'] or "-"
            ]


            # Hitung line per kolom
            cell_lines = [
                pdf.multi_cell(col_widths[j], line_height, str(data_row[j]), border=0, align='L', split_only=True)
                for j in range(len(data_row))
            ]
            max_lines = max(len(lines) for lines in cell_lines)
            row_height = line_height * max_lines

            # Simpan posisi awal
            x_start = pdf.get_x()
            y_start = pdf.get_y()

            # 1. Gambar cell kosong (untuk border seragam semua kolom)
            for j in range(len(data_row)):
                pdf.set_xy(x_start + sum(col_widths[:j]), y_start)
                pdf.multi_cell(col_widths[j], row_height, '', border=1)

            # 2. Tulis teks dalam cell tanpa border (supaya tidak dobel garis)
            for j in range(len(data_row)):
                pdf.set_xy(x_start + sum(col_widths[:j]), y_start)
                pdf.multi_cell(col_widths[j], line_height, str(data_row[j]), border=0)

            # 3. Pindahkan ke bawah
            pdf.set_y(y_start + row_height)


            # Tambah total
            total += row['realisasi']

   

        # Total
        pdf.set_font("Arial", "B", 10)
        pdf.cell(sum(col_widths[:4]), 10, "", border=0)
        pdf.cell(col_widths[4], 10, "TOTAL", border=1)
        pdf.cell(col_widths[5], 10, f"{total:,.0f}".replace(",", "."), border=1)
        pdf.ln(15)


        # Tanda tangan
        if signer:
            pdf.set_font("Arial", "", 11)
            pdf.cell(0, 10, tanggal_sekarang, ln=True, align="R")
            pdf.cell(0, 10, "MANAGER UMUM & SDM", ln=True, align="R")
            pdf.ln(15)
            pdf.cell(0, 10, signer['nama'], ln=True, align="R")
            pdf.cell(0, 10, f"NIK: {signer['nik']}", ln=True, align="R")

        # Kirim PDF
        pdf_bytes = pdf.output(dest='S').encode('latin1')  # Ambil PDF sebagai string, lalu encode
        output = io.BytesIO(pdf_bytes)
        output.seek(0)

        return send_file(
            output,
            mimetype='application/pdf',
            download_name=f'report_{report_id}.pdf',
            as_attachment=True
        )


    except Exception as e:
        report_logger.exception("Gagal mengunduh laporan PDF")
        return jsonify({'error': 'Gagal mengunduh laporan PDF', 'message': str(e)}), 500
