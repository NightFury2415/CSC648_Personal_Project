from flask import Blueprint, jsonify, request
import bcrypt
import jwt
import datetime
from functools import wraps
import os
import uuid
from app import get_db_connection

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = 'HS256'

def generate_token(user_id, username, user_role):
    """Generate a JWT token with unique identifier"""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=4),
        'iat': datetime.datetime.utcnow(),
        'jti': str(uuid.uuid4()),  # Unique identifier for each token
        'sub': user_id,
        'username': username,
        'role': user_role
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                # Support both "Bearer TOKEN" and "TOKEN" formats
                token = auth_header.split(" ")[1] if ' ' in auth_header else auth_header
            except IndexError:
                return jsonify({'error': 'Bearer token malformed', 'code': 'INVALID_TOKEN'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing', 'code': 'NO_TOKEN'}), 401
        
        try:
            # Decode the token
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # Get user from database
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE user_id = %s", (data['sub'],))
            current_user = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not current_user:
                return jsonify({'error': 'User not found', 'code': 'USER_NOT_FOUND'}), 401
                
            # Check if account is active
            if current_user.get('account_status') != 'active':
                return jsonify({'error': 'Account is not active', 'code': 'ACCOUNT_INACTIVE'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired', 'code': 'TOKEN_EXPIRED'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'error': f'Invalid token: {str(e)}', 'code': 'INVALID_TOKEN'}), 401
        except Exception as e:
            return jsonify({'error': f'Authentication failed: {str(e)}', 'code': 'AUTH_FAILED'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated(*args, **kwargs):
        @token_required
        def inner_function(current_user, *args, **kwargs):
            if current_user.get('user_role') != 'admin':
                return jsonify({'error': 'Admin privileges required', 'code': 'ADMIN_REQUIRED'}), 403
            return f(current_user, *args, **kwargs)
        return inner_function(*args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        
        # Check required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate fields with regex (your existing validation logic)
        import re
        patterns = {
            'username': r'^[a-zA-Z0-9_]{4,20}$',
            'email': r'^[a-zA-Z0-9._-]+@sfsu\.edu$',
            'password': r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$',
            'name': r'^[a-zA-Z\s\'-]{2,30}$',
        }
        
        validation_errors = {}
        
        if not re.match(patterns['username'], data['username']):
            validation_errors['username'] = "Username must be 4-20 characters, only letters, numbers, and underscores"
        
        if not re.match(patterns['email'], data['email']):
            validation_errors['email'] = "Please enter a valid SFSU email (@sfsu.edu)"
        
        if not re.match(patterns['password'], data['password']):
            validation_errors['password'] = "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
        
        if not re.match(patterns['name'], data['first_name']):
            validation_errors['first_name'] = "Please enter a valid first name (2-30 letters)"
        
        if not re.match(patterns['name'], data['last_name']):
            validation_errors['last_name'] = "Please enter a valid last name (2-30 letters)"
        
        if validation_errors:
            return jsonify({'errors': validation_errors}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO users (username, password_hash, email, first_name, last_name)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                data['username'],
                password_hash.decode('utf-8'),
                data['email'],
                data['first_name'],
                data['last_name']
            ))
            conn.commit()
            new_user_id = cursor.lastrowid
            
            # Generate token
            token = generate_token(new_user_id, data['username'], 'user')
            
            return jsonify({
                'message': 'User registered successfully', 
            }), 201
            
        except Exception as e:
            conn.rollback()
            if 'Duplicate entry' in str(e):
                if 'username' in str(e):
                    return jsonify({'error': 'Username already exists'}), 409
                elif 'email' in str(e):
                    return jsonify({'error': 'Email already exists'}), 409
            return jsonify({'error': str(e)}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        data = request.json
        
        # Check required fields
        required_fields = ['username', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Get user by username
            cursor.execute("SELECT * FROM users WHERE username = %s", (data['username'],))
            user = cursor.fetchone()
            
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Check account status
            if user.get('account_status') != 'active':
                return jsonify({'error': 'Account is not active'}), 401
            
            # Verify password
            if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password_hash'].encode('utf-8')):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Check verification status AFTER password verification
            # This ensures we don't reveal if an account exists when providing verification errors
            if user.get('verification_status') != 'verified':
                return jsonify({
                    'error': 'Your email is not verified. Please check your email for verification link.',
                    'unverified_email': user['email']
                }), 403
            
            # Update last login
            update_cursor = conn.cursor()
            update_cursor.execute(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = %s", 
                (user['user_id'],)
            )
            conn.commit()
            update_cursor.close()
            
            # Generate token
            token = generate_token(user['user_id'], user['username'], user['user_role'])
            
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'role': user['user_role'],
                    'verification_status': 'verified'
                },
                'token': token
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/refresh-token', methods=['POST'])
@token_required
def refresh_token(current_user):
    """Refresh JWT token"""
    try:
        # First validate the incoming token format
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1] if ' ' in auth_header else auth_header
            except IndexError:
                return jsonify({
                    'error': 'Invalid token format',
                    'code': 'INVALID_TOKEN_FORMAT',
                    'action': 'logout'
                }), 401

        if not token:
            return jsonify({
                'error': 'Token is required',
                'code': 'NO_TOKEN',
                'action': 'logout'
            }), 401

        # Check if user account is still active before refreshing
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute(
                "SELECT account_status, verification_status FROM users WHERE user_id = %s", 
                (current_user['user_id'],)
            )
            user = cursor.fetchone()

            if not user:
                return jsonify({
                    'error': 'User not found',
                    'code': 'USER_NOT_FOUND',
                    'action': 'logout'
                }), 401

            if user['account_status'] != 'active':
                return jsonify({
                    'error': 'Account is not active',
                    'code': 'ACCOUNT_INACTIVE',
                    'action': 'logout'
                }), 401

            if user['verification_status'] != 'verified':
                return jsonify({
                    'error': 'Account is not verified',
                    'code': 'ACCOUNT_UNVERIFIED',
                    'action': 'logout'
                }), 401

            # Generate a new token with extended expiration
            new_token = generate_token(
                current_user['user_id'], 
                current_user['username'], 
                current_user['user_role']
            )
            
            return jsonify({
                'token': new_token,
                'user': {
                    'user_id': current_user['user_id'],
                    'username': current_user['username'],
                    'role': current_user['user_role']
                },
                'message': 'Token refreshed successfully'
            }), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        return jsonify({
            'error': 'Token refresh failed',
            'code': 'REFRESH_FAILED',
            'action': 'logout',
            'message': str(e)
        }), 401
    
@auth_bp.route('/verify-token', methods=['GET'])
@token_required
def verify_token(current_user):
    """Verify if token is still valid"""
    return jsonify({
        'valid': True,
        'user_id': current_user['user_id'],
        'username': current_user['username'],
        'role': current_user['user_role']
    }), 200


@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get current user profile"""
    try:
        profile = {
            'user_id': current_user['user_id'],
            'username': current_user['username'],
            'email': current_user['email'],
            'first_name': current_user['first_name'],
            'last_name': current_user['last_name'],
            'verification_status': current_user.get('verification_status', 'unverified'),
            'profile_picture_url': current_user.get('profile_picture_url'),
            'date_joined': current_user['date_joined'].isoformat() if current_user.get('date_joined') else None,
            'last_login': current_user['last_login'].isoformat() if current_user.get('last_login') else None,
            'user_role': current_user['user_role']
        }
        return jsonify(profile)
    except Exception as e:
        return jsonify({'error': f'Failed to get profile: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    # blacklist the token
    return jsonify({'message': 'Successfully logged out'})


@auth_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT user_id, username, email, first_name, last_name, verification_status, date_joined, last_login, user_role, account_status FROM users")
    users = cursor.fetchall()
    for user in users:
        if isinstance(user['date_joined'], datetime.datetime):
            user['date_joined'] = user['date_joined'].isoformat()
        if user['last_login'] and isinstance(user['last_login'], datetime.datetime):
            user['last_login'] = user['last_login'].isoformat()
    cursor.close()
    conn.close()
    return jsonify(users)

@auth_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(current_user, user_id):
    data = request.json
    if 'role' not in data or data['role'] not in ['user', 'moderator', 'admin']:
        return jsonify({'error': 'Invalid role value'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET user_role = %s WHERE user_id = %s", (data['role'], user_id))
    cursor.execute("""
        INSERT INTO admin_actions (admin_id, action_type, target_entity, action_description)
        VALUES (%s, %s, %s, %s)
    """, (current_user['user_id'], "update_user_role", f"user_{user_id}", f"Changed user role to {data['role']}"))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'User role updated successfully'})

@auth_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@admin_required
def update_user_status(current_user, user_id):
    data = request.json
    if 'status' not in data or data['status'] not in ['active', 'inactive/banned', 'deleted']:
        return jsonify({'error': 'Invalid status value'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET account_status = %s WHERE user_id = %s", (data['status'], user_id))
    cursor.execute("""
        INSERT INTO admin_actions (admin_id, action_type, target_entity, action_description)
        VALUES (%s, %s, %s, %s)
    """, (current_user['user_id'], "update_user_status", f"user_{user_id}", f"Changed user status to {data['status']}"))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'User status updated successfully'})

@auth_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    profile = {
        'user_id': user['user_id'],
        'username': user['username'],
        'email': user['email'],
        'first_name': user['first_name'],
        'last_name': user['last_name'],
        'verification_status': user['verification_status'],
        'profile_picture_url': user['profile_picture_url'],
        'date_joined': user['date_joined'].isoformat() if user['date_joined'] else None,
        'last_login': user['last_login'].isoformat() if user['last_login'] else None,
        'user_role': user['user_role'],
        'rating': float(user.get('rating', 0.0))
    }

    return jsonify(profile)

# ✅ REVIEWS ROUTE — SQL JOIN VERSION
@auth_bp.route("/reviews/<int:user_id>", methods=["GET"])
def get_reviews_for_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.review_id, r.rating, r.comment, r.created_at, u.username AS reviewer_username
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.user_id
            WHERE r.seller_id = %s
        """, (user_id,))
        reviews = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(reviews), 200
    except Exception as e:
        print("Error fetching reviews:", e)
        return jsonify({"error": "Failed to fetch reviews"}), 500

# ✅ BOOKMARKS ROUTES
# Add a bookmark
@auth_bp.route('/bookmarks', methods=['POST'])
@token_required
def add_bookmark(current_user):
    data = request.json
    if 'product_id' not in data:
        return jsonify({'error': 'Missing product_id'}), 400
    
    product_id = data['product_id']
    user_id = current_user['user_id']
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if product exists and is approved
        cursor.execute("SELECT * FROM products WHERE product_id = %s", (product_id,))
        product = cursor.fetchone()
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if product[11] != 'approved':  # approval_status is the 12th column (index 11)
            return jsonify({'error': 'Can only bookmark approved products'}), 400
        
        # Add to bookmarks
        cursor.execute("""
            UPDATE users 
            SET bookmarked_products = CASE 
                WHEN bookmarked_products IS NULL THEN JSON_ARRAY(%s)
                WHEN JSON_SEARCH(bookmarked_products, 'one', %s) IS NULL THEN JSON_ARRAY_APPEND(bookmarked_products, '$', %s)
                ELSE bookmarked_products
            END
            WHERE user_id = %s
        """, (product_id, str(product_id), product_id, user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Product bookmarked successfully'})
    except Exception as e:
        print(f"Error adding bookmark: {e}")
        return jsonify({'error': str(e)}), 500

# Remove a bookmark
@auth_bp.route('/bookmarks/<int:product_id>', methods=['DELETE'])
@token_required
def remove_bookmark(current_user, product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users 
            SET bookmarked_products = JSON_REMOVE(
                bookmarked_products, 
                JSON_SEARCH(bookmarked_products, 'one', %s)
            )
            WHERE user_id = %s
        """, (str(product_id), current_user['user_id']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Bookmark removed successfully'})
    except Exception as e:
        print(f"Error removing bookmark: {e}")
        return jsonify({'error': str(e)}), 500

# Get all bookmarked products for a user
@auth_bp.route('/bookmarks', methods=['GET'])
@token_required
def get_bookmarks(current_user):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get bookmarked products with details
        cursor.execute("""
            SELECT p.*, u.username,
                   (SELECT AVG(rating) FROM reviews WHERE seller_id = p.user_id) as seller_rating
            FROM products p
            JOIN users u ON p.user_id = u.user_id
            WHERE JSON_CONTAINS(
                (SELECT bookmarked_products FROM users WHERE user_id = %s),
                CAST(p.product_id AS JSON)
            )
            AND p.approval_status = 'approved'
            ORDER BY p.created_at DESC
        """, (current_user['user_id'],))
        
        products = cursor.fetchall()
        
        # Format ratings for each product
        for product in products:
            if product['seller_rating'] is not None:
                product['seller_rating'] = float(product['seller_rating'])
            else:
                product['seller_rating'] = 0.0
        
        cursor.close()
        conn.close()
        
        return jsonify(products)
    except Exception as e:
        print(f"Error getting bookmarks: {e}")
        return jsonify({'error': str(e)}), 500

# Check if a product is bookmarked
@auth_bp.route('/bookmarks/check/<int:product_id>', methods=['GET'])
@token_required
def check_bookmark(current_user, product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT JSON_CONTAINS(
                (SELECT bookmarked_products FROM users WHERE user_id = %s),
                CAST(%s AS JSON)
            ) AS is_bookmarked
        """, (current_user['user_id'], product_id))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return jsonify({'is_bookmarked': bool(result['is_bookmarked'])})
    except Exception as e:
        print(f"Error checking bookmark: {e}")
        return jsonify({'error': str(e)}), 500
    
def verified_user_required(f):
    """Decorator to require both valid JWT token and verified email"""
    @wraps(f)
    def decorated(*args, **kwargs):
        @token_required
        def inner_function(current_user, *args, **kwargs):
            if current_user.get('verification_status') != 'verified':
                return jsonify({
                    'error': 'Email verification required', 
                    'code': 'EMAIL_NOT_VERIFIED'
                }), 403
            return f(current_user, *args, **kwargs)
        return inner_function(*args, **kwargs)
    return decorated

@auth_bp.route('/cleanup-unverified', methods=['POST'])
@admin_required
def cleanup_unverified_users(current_user):
    """Delete unverified users older than 24 hours"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Find unverified users older than 24 hours
        cursor.execute("""
            SELECT user_id, username, email FROM users
            WHERE verification_status = 'unverified'
            AND date_joined < DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """)
        
        users_to_delete = cursor.fetchall()
        deleted_count = 0
        
        for user in users_to_delete:
            try:
                # Delete the user
                cursor.execute("DELETE FROM users WHERE user_id = %s", (user['user_id'],))
                deleted_count += 1
                
                # Log the action
                cursor.execute("""
                    INSERT INTO admin_actions (admin_id, action_type, target_entity, action_description)
                    VALUES (%s, %s, %s, %s)
                """, (
                    current_user['user_id'], 
                    "cleanup_unverified", 
                    f"user_{user['user_id']}", 
                    f"Deleted unverified user {user['username']} with email {user['email']} after 24 hours"
                ))
            except Exception as e:
                print(f"Error deleting user {user['user_id']}: {e}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': f'Deleted {deleted_count} unverified users',
            'deleted_users_count': deleted_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to cleanup unverified users: {str(e)}'}), 500