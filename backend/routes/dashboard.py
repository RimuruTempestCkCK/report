from flask import Blueprint, jsonify, request, current_app
from functools import wraps
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from extensions import mysql
import MySQLdb
import MySQLdb.cursors
from flask_cors import CORS, cross_origin



dashboard_bp = Blueprint('dashboard', __name__)
CORS(dashboard_bp, origins=["http://localhost:3000"], supports_credentials=True)


def verify_jwt(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except (ExpiredSignatureError, InvalidTokenError):
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

@dashboard_bp.route('/summary', methods=['GET'])
@token_required
def get_summary(user_id=None, role=None):
    if not user_id:
        return jsonify({'error': 'User ID not found in token'}), 401

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    cur.execute("""
        SELECT IFNULL(SUM(realisasi), 0) AS total_pengeluaran
        FROM pengeluaran
        WHERE created_by = %s
        AND bulan = MONTH(CURRENT_DATE())
        AND tahun = YEAR(CURRENT_DATE())
    """, (user_id,))
    pengeluaran = cur.fetchone()

    cur.execute("""
        SELECT IFNULL(SUM(jumlah), 0) AS total_pemasukan
        FROM pemasukan
        WHERE user_id = %s
        AND MONTH(tanggal) = MONTH(CURRENT_DATE())
        AND YEAR(tanggal) = YEAR(CURRENT_DATE())
    """, (user_id,))
    pemasukan = cur.fetchone()

    cur.execute("""
        SELECT
            SUM(CASE WHEN status_tandatangan = TRUE THEN 1 ELSE 0 END) AS sudah,
            SUM(CASE WHEN status_tandatangan = FALSE THEN 1 ELSE 0 END) AS belum
        FROM reports
        WHERE user_id = %s
    """, (user_id,))
    tanda = cur.fetchone()
    cur.close()

    return jsonify({
        'total_pemasukan': float(pemasukan['total_pemasukan']),
        'total_pengeluaran': float(pengeluaran['total_pengeluaran']),
        'laporan_sudah_tandatangan': tanda['sudah'],
        'laporan_belum_tandatangan': tanda['belum'],
        'role': role
    })

@dashboard_bp.route('/graph/pemasukan-vs-pengeluaran', methods=['GET'])
@token_required
def graph_pemasukan_vs_pengeluaran(user_id=None, role=None):
    periode = request.args.get('periode', 'bulan')
    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    if periode == 'bulan':
        # Gabungkan pemasukan dan pengeluaran berdasarkan bulan
        cur.execute("""
            SELECT bulan, SUM(pemasukan) AS pemasukan, SUM(pengeluaran) AS pengeluaran
            FROM (
                SELECT MONTH(tanggal) AS bulan, SUM(jumlah) AS pemasukan, 0 AS pengeluaran
                FROM pemasukan
                WHERE user_id = %s
                GROUP BY MONTH(tanggal)

                UNION ALL

                SELECT bulan, 0 AS pemasukan, SUM(realisasi) AS pengeluaran
                FROM pengeluaran
                WHERE created_by = %s
                GROUP BY bulan
            ) AS combined
            GROUP BY bulan
            ORDER BY bulan
        """, (user_id, user_id))
    else:
        # Gabungkan pemasukan dan pengeluaran berdasarkan tahun
        cur.execute("""
            SELECT tahun, SUM(pemasukan) AS pemasukan, SUM(pengeluaran) AS pengeluaran
            FROM (
                SELECT YEAR(tanggal) AS tahun, SUM(jumlah) AS pemasukan, 0 AS pengeluaran
                FROM pemasukan
                WHERE user_id = %s
                GROUP BY YEAR(tanggal)

                UNION ALL

                SELECT tahun, 0 AS pemasukan, SUM(realisasi) AS pengeluaran
                FROM pengeluaran
                WHERE created_by = %s
                GROUP BY tahun
            ) AS combined
            GROUP BY tahun
            ORDER BY tahun
        """, (user_id, user_id))

    rows = cur.fetchall()
    cur.close()

    # Siapkan data untuk grafik
    data = []
    for row in rows:
        if 'bulan' in row:
            label = f"Bulan {int(row['bulan'])}"
        else:
            label = str(row['tahun'])

        data.append({
            'bulan' if 'bulan' in row else 'tahun': label,
            'pemasukan': float(row['pemasukan']),
            'pengeluaran': float(row['pengeluaran']),
        })

    return jsonify(data)


@dashboard_bp.route('/graph/pengeluaran-per-divisi', methods=['GET'])
@token_required
def graph_pengeluaran_per_divisi(user_id=None, role=None):
    periode = request.args.get('periode', 'bulan')
    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    if periode == 'bulan':
        cur.execute("""
            SELECT divisi_id, SUM(realisasi) AS total_pengeluaran
            FROM pengeluaran
            WHERE created_by = %s
              AND bulan = MONTH(CURRENT_DATE())
              AND tahun = YEAR(CURRENT_DATE())
            GROUP BY divisi_id
        """, (user_id,))
    else:
        cur.execute("""
            SELECT divisi_id, SUM(realisasi) AS total_pengeluaran
            FROM pengeluaran
            WHERE created_by = %s
              AND tahun = YEAR(CURRENT_DATE())
            GROUP BY divisi_id
        """, (user_id,))

    rows = cur.fetchall()
    cur.close()
    return jsonify([{
        'divisi': f'Divisi {row["divisi_id"]}',
        'total_pengeluaran': float(row['total_pengeluaran'])
    } for row in rows])


@dashboard_bp.route('/add-pemasukan', methods=['POST'])
@token_required
def add_pemasukan(user_id=None, role=None):
    data = request.get_json()
    nominal = data.get('nominal')
    deskripsi = data.get('deskripsi', '')

    if nominal is None:
        return jsonify({'error': 'Nominal harus diisi'}), 400
    if role not in ['pegawai', 'manajer']:
        return jsonify({'error': 'Role tidak diizinkan input pemasukan'}), 403

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("""
        SELECT id FROM reports
        WHERE user_id = %s AND bulan = MONTH(CURRENT_DATE()) AND tahun = YEAR(CURRENT_DATE())
        LIMIT 1
    """, (user_id,))
    report = cur.fetchone()

    if not report:
        cur.execute("""
            INSERT INTO reports (user_id, judul, bulan, tahun)
            VALUES (%s, %s, MONTH(CURRENT_DATE()), YEAR(CURRENT_DATE()))
        """, (user_id, 'Laporan Bulanan'))
        mysql.connection.commit()

    try:
        cur.execute("""
            INSERT INTO pemasukan (user_id, jumlah, deskripsi, tanggal)
            VALUES (%s, %s, %s, CURDATE())
        """, (user_id, nominal, deskripsi))
        mysql.connection.commit()
    except Exception as e:
        cur.close()
        return jsonify({'error': str(e)}), 500

    cur.close()
    return jsonify({'message': 'Pemasukan berhasil disimpan'}), 201

@dashboard_bp.route('/user', methods=['GET'])
@token_required
def get_user(user_id=None, role=None):
    print("[DEBUG] user_id:", user_id)
    print("[DEBUG] role from token:", role)

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("SELECT full_name, role FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()

    print("[DEBUG] user data from DB:", row)

    if not row:
        return jsonify({'full_name': 'User', 'role': role or 'pegawai'})  # fallback default

    return jsonify({'full_name': row['full_name'], 'role': row['role']})





@dashboard_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications(user_id=None, role=None):
    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    cur.execute("""
        SELECT IFNULL(SUM(realisasi), 0) AS total_pengeluaran
        FROM pengeluaran
        WHERE created_by = %s
        AND bulan = MONTH(CURRENT_DATE())
        AND tahun = YEAR(CURRENT_DATE())
    """, (user_id,))
    result = cur.fetchone()
    total_pengeluaran = result['total_pengeluaran'] if result else 0

    cur.execute("""
        SELECT IFNULL(SUM(jumlah), 0) AS total_pemasukan
        FROM pemasukan
        WHERE user_id = %s
        AND MONTH(tanggal) = MONTH(CURRENT_DATE())
        AND YEAR(tanggal) = YEAR(CURRENT_DATE())
    """, (user_id,))
    result = cur.fetchone()
    total_pemasukan = result['total_pemasukan'] if result else 0

    cur.execute("""
        SELECT IFNULL(SUM(realisasi), 0) AS total_pengeluaran_bulan_lalu
        FROM pengeluaran
        WHERE created_by = %s
        AND (
            (bulan = MONTH(CURRENT_DATE()) - 1 AND tahun = YEAR(CURRENT_DATE()))
            OR (MONTH(CURRENT_DATE()) = 1 AND bulan = 12 AND tahun = YEAR(CURRENT_DATE()) - 1)
        )
    """, (user_id,))
    result = cur.fetchone()
    pengeluaran_lalu = result['total_pengeluaran_bulan_lalu'] if result else 0

    cur.execute("""
        SELECT
            SUM(CASE WHEN status_tandatangan = TRUE THEN 1 ELSE 0 END) AS sudah,
            SUM(CASE WHEN status_tandatangan = FALSE THEN 1 ELSE 0 END) AS belum
        FROM reports
        WHERE user_id = %s
    """, (user_id,))
    tanda = cur.fetchone() or {'sudah': 0, 'belum': 0}
    cur.close()


    notifications = []

    if total_pengeluaran > total_pemasukan:
        notifications.append({'type': 'warning', 'message': 'Pengeluaran bulan ini melebihi pemasukan.'})
    if total_pengeluaran > pengeluaran_lalu:
        notifications.append({'type': 'warning', 'message': 'Pengeluaran bulan ini lebih besar dari bulan sebelumnya.'})
    if float(total_pengeluaran) > 0.8 * float(total_pemasukan):
        notifications.append({'type': 'info', 'message': 'Pengeluaran bulan ini mendekati pemasukan.'})
    if tanda['sudah'] > 0:
        notifications.append({'type': 'success', 'message': f'Ada {tanda["sudah"]} laporan yang sudah ditandatangani.'})
    if tanda['belum'] > 0:
        notifications.append({'type': 'info', 'message': f'Ada {tanda["belum"]} laporan yang belum ditandatangani. Segera lengkapi dan kirim.'})

    return jsonify(notifications)

@dashboard_bp.route('/total_pengeluaran', methods=['GET'])
def total_pengeluaran():
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cur.execute("SELECT SUM(realisasi) AS total FROM pengeluaran")
        result = cur.fetchone()
        cur.close()
        return jsonify({'total_pengeluaran': result['total'] or 0})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


