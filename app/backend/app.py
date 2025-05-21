from flask import Flask
from flask_cors import CORS
from flask import send_from_directory
from dotenv import load_dotenv
import mysql.connector
import os
from flask_apscheduler import APScheduler
from flask import jsonify


load_dotenv()

app = Flask(__name__)

# Improved CORS configuration with proper preflight handling
CORS(app, 
     resources={r"/*": {
         "origins": ["http://localhost:5173", "https://csc648g1.me"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Authorization", "Content-Type"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 3600
     }})

from flask_jwt_extended import JWTManager
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'your-secret-key')
jwt = JWTManager(app)

def get_db_connection():
    try:
        return mysql.connector.connect(
            host=os.getenv('MYSQL_HOST'),  
            user=os.getenv('MYSQL_USER'),
            password=os.getenv('MYSQL_PASSWORD'),
            database=os.getenv('MYSQL_DATABASE')
        )
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

# Register product routes
from products import products_bp
app.register_blueprint(products_bp)

# Handle preflight OPTIONS requests explicitly
@app.route('/', methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path=None):
    return '', 204

@app.route('/')
def hello():
    return {"message": "Gator Market Backend is live!"}

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

from auth import auth_bp
app.register_blueprint(auth_bp)

from admin import admin_bp
app.register_blueprint(admin_bp)

from reviews import reviews_bp
app.register_blueprint(reviews_bp)

from messaging import messaging_bp
app.register_blueprint(messaging_bp)

from email_verification import email_bp
app.register_blueprint(email_bp)

from wishlist import wishlist_bp
app.register_blueprint(wishlist_bp)

from report import report_bp
app.register_blueprint(report_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)