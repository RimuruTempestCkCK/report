from flask import Blueprint, request, jsonify, current_app
from functools import wraps
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
import logging
import MySQLdb.cursors

add_bp = Blueprint('add', __name__)
add_logger = logging.getLogger(__name__)

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

@add_bp.route('/akun', methods=['GET'])
@token_required
def get_akun(user_id=None, role=None):
    from app import mysql
    cur = mysql.connection.cursor()
    cur.execute("SELECT id, kode, deskripsi FROM akun")
    rows = cur.fetchall()
    cur.close()

    if rows and isinstance(rows[0], dict):
        data = [{'id': r['id'], 'kode': r['kode'], 'deskripsi': r['deskripsi']} for r in rows]
    else:
        data = [{'id': r[0], 'kode': r[1], 'deskripsi': r[2]} for r in rows]
    return jsonify(data)

@add_bp.route('/divisi', methods=['GET'])
@token_required
def get_divisi(user_id=None, role=None):
    from app import mysql
    cur = mysql.connection.cursor()
    cur.execute("SELECT id, kode, nama FROM divisi")
    rows = cur.fetchall()
    cur.close()

    if rows and isinstance(rows[0], dict):
        data = [{'id': r['id'], 'kode': r['kode'], 'nama': r['nama']} for r in rows]
    else:
        data = [{'id': r[0], 'kode': r[1], 'nama': r[2]} for r in rows]
    return jsonify(data)

@add_bp.route('/akun', methods=['POST'])
@token_required
def add_akun(user_id=None, role=None):
    from app import mysql
    data = request.json

    if not data or 'kode' not in data or 'deskripsi' not in data:
        return jsonify({"error": "Kode dan deskripsi akun diperlukan"}), 400

    kode = data['kode']
    deskripsi = data['deskripsi']

    if role not in ['pegawai', 'manajer']:
        return jsonify({'error': 'Role tidak diizinkan menambah akun'}), 403

    cur = mysql.connection.cursor()
    try:
        cur.execute("INSERT INTO akun (kode, deskripsi) VALUES (%s, %s)", (kode, deskripsi))
        mysql.connection.commit()
        return jsonify({"message": "Akun berhasil ditambahkan"}), 201
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": f"Error saat menambah akun: {str(e)}"}), 500
    finally:
        cur.close()

@add_bp.route('/divisi', methods=['POST'])
@token_required
def add_divisi(user_id=None, role=None):
    from app import mysql
    data = request.json

    if not data or 'kode' not in data or 'nama' not in data:
        return jsonify({"error": "Kode dan nama divisi diperlukan"}), 400

    kode = data['kode']
    nama = data['nama']

    if role not in ['pegawai', 'manajer']:
        return jsonify({'error': 'Role tidak diizinkan menambah divisi'}), 403

    cur = mysql.connection.cursor()
    try:
        cur.execute("INSERT INTO divisi (kode, nama) VALUES (%s, %s)", (kode, nama))
        mysql.connection.commit()
        return jsonify({"message": "Divisi berhasil ditambahkan"}), 201
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": f"Error saat menambah divisi: {str(e)}"}), 500
    finally:
        cur.close()

@add_bp.route('/pengeluaran', methods=['POST'])
@token_required
def add_pengeluaran(user_id=None, role=None):
    from app import mysql
    add_logger.info(f"add_pengeluaran requested by user_id={user_id}, role={role}")
    data = request.json

    if not data:
        add_logger.error("No JSON data received in add_pengeluaran request.")
        return jsonify({"error": "Request body must be JSON"}), 400

    required_fields = ['judul_utama', 'sub_judul', 'bulan', 'tahun', 'akun_id', 'tanggal', 'realisasi', 'divisi_id']
    for field in required_fields:
        if field not in data or data.get(field) is None:
            add_logger.error(f"Missing or empty required field: {field}")
            return jsonify({"error": f"{field} is required"}), 400

    judul_utama = data['judul_utama']
    sub_judul = data['sub_judul']
    bulan = int(data['bulan'])
    tahun = int(data['tahun'])
    akun_id = int(data['akun_id'])
    deskripsi = data.get('deskripsi', "")
    tanggal = data['tanggal']
    deskripsi_kegiatan = data.get('deskripsi_kegiatan', "")
    realisasi = float(data['realisasi'])
    divisi_id = int(data['divisi_id'])

    created_by = user_id

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    try:
        cur.execute(
            """INSERT INTO pengeluaran
            (akun_id, deskripsi, tanggal, deskripsi_kegiatan, realisasi, divisi_id, created_by, judul_utama, sub_judul, bulan, tahun)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (akun_id, deskripsi, tanggal, deskripsi_kegiatan, realisasi, divisi_id, created_by, judul_utama, sub_judul, bulan, tahun)
        )

        mysql.connection.commit()
        add_logger.info("Pengeluaran successfully added to database.")
        return jsonify({"message": "Pengeluaran berhasil ditambahkan"}), 201

    except Exception as e:
        mysql.connection.rollback()
        add_logger.error(f"Database error during add_pengeluaran: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    finally:
        cur.close()


@add_bp.route('/pemasukan', methods=['POST'])
@token_required
def add_pemasukan(user_id=None, role=None):
    from app import mysql
    data = request.json

    jumlah = data.get('jumlah')
    tanggal = data.get('tanggal')
    deskripsi = data.get('deskripsi', '')  # optional

    if jumlah is None or tanggal is None:
        return jsonify({'error': 'Jumlah dan tanggal wajib diisi'}), 400

    try:
        jumlah = float(jumlah)
    except ValueError:
        return jsonify({'error': 'Jumlah harus berupa angka'}), 400

    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO pemasukan (jumlah, tanggal, user_id, deskripsi)
            VALUES (%s, %s, %s, %s)
        """, (jumlah, tanggal, user_id, deskripsi))
        mysql.connection.commit()
        cur.close()
        return jsonify({'message': 'Pemasukan berhasil disimpan'}), 201
    except Exception as e:
        return jsonify({'error': 'Gagal menyimpan pemasukan', 'message': str(e)}), 500

