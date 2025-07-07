from flask import Blueprint, request, jsonify, current_app
import bcrypt
import jwt
import datetime
import MySQLdb.cursors

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    from app import mysql
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email dan password wajib diisi'}), 400

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()

    if not user:
        return jsonify({'error': 'User tidak ditemukan'}), 404

    if not user.get('password') or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password salah'}), 401

    payload = {
        'user_id': user['id'],
        'email': user['email'],
        'full_name': user['full_name'],
        'role': user['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=6)
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'message': 'Login berhasil',
        'token': token,
        'user': {
            'id': user['id'],
            'full_name': user['full_name'],
            'email': user['email'],
            'role': user['role']
        }
    }), 200

@auth_bp.route('/signup', methods=['POST'])
def signup():
    from app import mysql

    data = request.json
    full_name = data.get('fullName')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role').lower()


    if not full_name or not email or not password or not role:
        return jsonify({'error': 'Semua field harus diisi'}), 400

    if role not in ['pegawai', 'manajer']:
        return jsonify({'error': 'Role tidak valid'}), 400

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    if cur.fetchone():
        return jsonify({'error': 'Email sudah terdaftar'}), 409

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    cur.execute(
        "INSERT INTO users (full_name, email, password, role) VALUES (%s, %s, %s, %s)",
        (full_name, email, hashed_password.decode('utf-8'), role)
    )
    mysql.connection.commit()
    cur.close()

    return jsonify({'message': 'Signup berhasil, silakan login'}), 201

