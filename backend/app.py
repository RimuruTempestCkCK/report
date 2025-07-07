from flask import Flask, jsonify
from extensions import mysql
from flask_cors import CORS
from config import Config
from flask_jwt_extended import JWTManager

app = Flask(__name__)
app.config.from_object(Config)

mysql.init_app(app)

CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

jwt = JWTManager(app)

from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.add import add_bp
from routes.select import select_bp
from routes.report import report_bp


app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(add_bp, url_prefix='/api/add')
app.register_blueprint(select_bp, url_prefix='/api/select')
app.register_blueprint(report_bp, url_prefix='/api/report')


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE')
    return response





@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Token expired"}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    return jsonify({"error": "Invalid token"}), 422

@jwt.unauthorized_loader
def missing_token_callback(error_string):
    return jsonify({"error": "Missing token"}), 401

@app.route('/')
def index():
    return "Backend running..."

if __name__ == '__main__':
    app.run(debug=True)
