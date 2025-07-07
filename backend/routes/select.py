from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError

from MySQLdb.cursors import DictCursor  # ✅ pakai DictCursor

select_bp = Blueprint('select', __name__)

def verify_jwt(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except ExpiredSignatureError:
        return None
    except InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
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

@select_bp.route('/data', methods=['GET'])
@token_required
def get_select_data(user_id=None, role=None):
    from app import mysql
    try:
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("""
            SELECT 
                p.id, 
                a.kode AS akun, 
                a.deskripsi, 
                p.tanggal, 
                p.deskripsi_kegiatan AS kegiatan, 
                p.realisasi, 
                d.kode AS divisi
            FROM pengeluaran p
            JOIN akun a ON p.akun_id = a.id
            JOIN divisi d ON p.divisi_id = d.id
            ORDER BY p.tanggal DESC
        """)
        rows = cur.fetchall()
        cur.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@select_bp.route('/signature', methods=['POST'])
@token_required
def save_signature_info(user_id=None, role=None):
    from app import mysql
    data = request.json
    required = ['judul_dokumen', 'nama', 'jabatan', 'nik']

    if not all(k in data and data[k] for k in required):
        return jsonify({'error': 'Semua field penandatangan harus diisi'}), 400

    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO penandatangan (judul_dokumen, nama, jabatan, nik)
            VALUES (%s, %s, %s, %s)
        """, (data['judul_dokumen'], data['nama'], data['jabatan'], data['nik']))
        mysql.connection.commit()
        cur.close()
        return jsonify({
            'message': 'Informasi penandatangan berhasil disimpan'
        }), 200



    except Exception as e:
        return jsonify({'error': str(e)}), 500

@select_bp.route('/submit', methods=['POST'])
@token_required
def submit_selected_data(user_id=None, role=None):
    from app import mysql
    data = request.json
    pengeluaran_ids = data.get('laporan_ids', [])

    if not pengeluaran_ids:
        return jsonify({'error': 'Tidak ada data pengeluaran yang dipilih'}), 400

    try:
        cur = mysql.connection.cursor(DictCursor)

        cur.execute("""
            SELECT judul_utama, sub_judul, bulan, tahun 
            FROM pengeluaran WHERE id = %s
        """, (pengeluaran_ids[0],))
        meta = cur.fetchone()
        if not meta:
            return jsonify({'error': 'Data pengeluaran tidak ditemukan'}), 400

        judul_utama, sub_judul, bulan, tahun = (
            meta['judul_utama'],
            meta['sub_judul'],
            meta['bulan'],
            meta['tahun']
        )
        judul = f"{judul_utama} - {sub_judul}"

        cur.execute("""
            SELECT id FROM reports
            WHERE user_id = %s AND bulan = %s AND tahun = %s AND judul = %s
        """, (user_id, bulan, tahun, judul))
        report = cur.fetchone()

        if not report:
            cur.execute("""
                INSERT INTO reports (user_id, judul, bulan, tahun)
                VALUES (%s, %s, %s, %s)
            """, (user_id, judul, bulan, tahun))
            report_id = cur.lastrowid
        else:
            report_id = report['id']
        print("📝 USER_ID:", user_id)
        print("📦 PENGELUARAN IDs:", pengeluaran_ids)
        print("📄 REPORT_ID:", report_id)
        if not pengeluaran_ids:
            print("⚠️ Tidak ada pengeluaran_ids dikirim.")
            return jsonify({'error': 'Tidak ada data pengeluaran yang dipilih'}), 400

        for laporan_id in pengeluaran_ids:
            cur.execute("""
                UPDATE pengeluaran 
                SET is_selected = TRUE, report_id = %s 
                WHERE id = %s
            """, (report_id, laporan_id))


        mysql.connection.commit()
        cur.close()
        return jsonify({
            'message': 'Laporan berhasil ditandai dan disimpan',
            'report_ids': [report_id]  # <- ini kunci agar React bisa ambil
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@select_bp.route("/delete", methods=["DELETE"])
@token_required
def delete_selected_data(user_id=None, role=None):
    from app import mysql
    try:
        data = request.get_json()
        ids_to_delete = data.get("laporan_ids", [])

        if not ids_to_delete:
            return jsonify({"error": "Tidak ada ID yang dikirim"}), 400

        placeholders = ', '.join(['%s'] * len(ids_to_delete))
        query = f"DELETE FROM pengeluaran WHERE id IN ({placeholders})"

        cur = mysql.connection.cursor()
        cur.execute(query, tuple(ids_to_delete))
        mysql.connection.commit()
        cur.close()

        return jsonify({"message": "Data berhasil dihapus!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@select_bp.route('/signer', methods=['POST'])
@token_required
def add_signer(user_id=None, role=None):
    from app import mysql
    data = request.json
    nama = data.get('nama')
    jabatan = data.get('jabatan')
    nik = data.get('nik')

    if not nama or not jabatan or not nik:
        return jsonify({'error': 'Semua field harus diisi'}), 400

    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO penandatangan (nama, jabatan, nik)
            VALUES (%s, %s, %s)
        """, (nama, jabatan, nik))
        mysql.connection.commit()
        cur.close()
        return jsonify({'message': 'Penandatangan baru berhasil ditambahkan'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@select_bp.route('/signers', methods=['GET'])
@token_required
def get_signers(user_id=None, role=None):
    from app import mysql
    try:
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("SELECT nama, jabatan, nik FROM penandatangan ORDER BY id DESC")
        rows = cur.fetchall()
        cur.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@select_bp.route('/update', methods=['PUT'])
@token_required
def update_data(user_id=None, role=None):
    from app import mysql
    data = request.json
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            UPDATE pengeluaran
            SET 
                deskripsi_kegiatan = %s,
                realisasi = %s,
                tanggal = %s
            WHERE id = %s
        """, (
            data['kegiatan'],
            data['realisasi'],
            data['tanggal'],
            data['id']
        ))
        mysql.connection.commit()
        cur.close()
        return jsonify({"message": "Data berhasil diperbarui"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500








@select_bp.route('/download-multi', methods=['POST'])
@token_required
def download_multi_reports(user_id=None, role=None):
    from app import mysql
    import io
    from fpdf import FPDF
    from flask import send_file

    data = request.get_json()
    ids = data.get("report_ids", [])

    if not ids:
        return jsonify({"error": "Tidak ada report ID yang dikirim"}), 400

    try:
        cur = mysql.connection.cursor(DictCursor)
        placeholders = ','.join(['%s'] * len(ids))
        cur.execute(f"""
            SELECT p.report_id, a.kode AS akun, a.deskripsi  AS deskripsi_akun, p.tanggal,
                p.deskripsi, p.deskripsi_kegiatan, p.realisasi, d.nama AS divisi
            FROM pengeluaran p
            JOIN akun a ON p.akun_id = a.id
            JOIN divisi d ON p.divisi_id = d.id
            WHERE p.report_id IN ({placeholders})
        """, tuple(ids))
        rows = cur.fetchall()
        cur.close()

        if not rows:
            return jsonify({'error': 'Tidak ada data laporan ditemukan'}), 400


        # Ambil metadata dari salah satu laporan (misalnya report pertama)
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("SELECT bulan, tahun FROM reports WHERE id = %s", (ids[0],))
        periode = cur.fetchone()
        cur.close()  # ✅ tutup cursor setelah ambil data

        if not periode:
            return jsonify({"error": "Periode laporan tidak ditemukan"}), 400

        bulan = periode['bulan']
        tahun = periode['tahun']


        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, "LAPORAN PERTANGGUNGJAWABAN TRANSAKSI", ln=True, align="C")
        pdf.set_font("Arial", "", 11)
        pdf.cell(0, 7, "Nama Kegiatan: ...", ln=True, align="L")  # ← bisa kamu ganti dinamis
        pdf.cell(0, 7, f"Periode: {bulan} {tahun}", ln=True, align="L")  # ← ambil dari report
        pdf.ln(5)


        pdf.set_font("Arial", "B", 9)
        col_widths = [10, 25, 40, 25, 50, 20, 20]  # Lebar kolom
        headers = ["No", "Akun", "Deskripsi", "Tanggal", "Kegiatan", "Divisi", "Realisasi"]

        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 10, header, border=1, align='C')
        pdf.ln()

        pdf.set_font("Arial", "", 9)
        total = 0

        for i, row in enumerate(rows, 1):
            row_data = [
                str(i),
                row["akun"],
                row["deskripsi_akun"],
                str(row["tanggal"]),
                row["deskripsi_kegiatan"],
                row["divisi"],
                f"{row['realisasi']:,.2f}"
            ]
            max_lines = max([len(pdf.multi_cell(col_widths[idx], 5, str(col), border=0, align='L', split_only=True)) for idx, col in enumerate(row_data)])
            
            y_before = pdf.get_y()
            for idx, col in enumerate(row_data):
                x_before = pdf.get_x()
                pdf.multi_cell(col_widths[idx], 5, str(col), border=1, align='L', max_line_height=pdf.font_size)
                pdf.set_xy(x_before + col_widths[idx], y_before)
            pdf.ln(5 * max_lines)
            total += row['realisasi']


        pdf.cell(190, 10, f"TOTAL: {total}", ln=True)

        output = io.BytesIO()
        pdf_bytes = pdf.output(dest='S').encode('latin-1')
        output.write(pdf_bytes)
        output.seek(0)

        return send_file(
            output,
            mimetype='application/pdf',
            download_name='laporan_gabungan.pdf',
            as_attachment=True
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500
