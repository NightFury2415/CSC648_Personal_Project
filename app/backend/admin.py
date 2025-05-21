from flask import Blueprint, jsonify, request
from auth import token_required, admin_required
from app import get_db_connection

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# Get pending products for approval
@admin_bp.route('/products/pending', methods=['GET'])
@admin_required
def get_pending_products(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.*, u.username as seller_username
        FROM products p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.approval_status = 'pending'
        ORDER BY p.created_at DESC
    """)
    
    products = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(products)

# Approve or reject a product
@admin_bp.route('/products/<int:product_id>/moderate', methods=['PUT'])
@admin_required
def moderate_product(current_user, product_id):
    data = request.json
    
    if 'status' not in data:
        return jsonify({'error': 'Status field is required'}), 400
        
    if data['status'] not in ['approved', 'rejected']:
        return jsonify({'error': 'Invalid status value'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Update the product approval status
    cursor.execute("UPDATE products SET approval_status = %s WHERE product_id = %s", 
               (data['status'], product_id))
    
    # Log the admin action
    cursor.execute("""
        INSERT INTO admin_actions (admin_id, action_type, target_entity, action_description)
        VALUES (%s, %s, %s, %s)
    """, (
        current_user['user_id'],
        f"product_{data['status']}",
        f"product_{product_id}",
        f"Product {product_id} {data['status']}"
    ))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'message': f'Product {data["status"]} successfully'})

# Get all listing reports
@admin_bp.route('/reports', methods=['GET'])
@admin_required
def get_reports(current_user):
    status = request.args.get('status', 'all')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT r.*, u.username as reporter_username, p.name as product_name
        FROM listing_reports r
        JOIN users u ON r.reporter_id = u.user_id
        JOIN products p ON r.product_id = p.product_id
    """
    
    if status != 'all':
        query += " WHERE r.status = %s"
        cursor.execute(query, (status,))
    else:
        cursor.execute(query)
    
    reports = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(reports)

# Update report status
@admin_bp.route('/reports/<int:report_id>', methods=['PUT'])
@admin_required
def update_report(current_user, report_id):
    data = request.json
    
    if 'status' not in data:
        return jsonify({'error': 'Status field is required'}), 400
        
    if data['status'] not in ['pending', 'reviewed', 'resolved']:
        return jsonify({'error': 'Invalid status value'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Update the report status
    cursor.execute("UPDATE listing_reports SET status = %s WHERE report_id = %s", 
               (data['status'], report_id))
    
    # Log the admin action
    cursor.execute("""
        INSERT INTO admin_actions (admin_id, action_type, target_entity, action_description)
        VALUES (%s, %s, %s, %s)
    """, (
        current_user['user_id'],
        "update_report",
        f"report_{report_id}",
        f"Report status changed to {data['status']}"
    ))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'message': 'Report updated successfully'})

# Get admin action logs
@admin_bp.route('/actions', methods=['GET'])
@admin_required
def get_admin_actions(current_user):
    limit = int(request.args.get('limit', 100))
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT a.*, u.username as admin_username
        FROM admin_actions a
        JOIN users u ON a.admin_id = u.user_id
        ORDER BY a.timestamp DESC
        LIMIT %s
    """, (limit,))
    
    actions = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(actions)

# Admin dashboard statistics
@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard_stats(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    stats = {}
    
    # User stats
    cursor.execute("SELECT COUNT(*) as total FROM users")
    stats['total_users'] = cursor.fetchone()['total']
    
    # Product stats
    cursor.execute("SELECT approval_status, COUNT(*) as count FROM products GROUP BY approval_status")
    stats['products_by_status'] = cursor.fetchall()
    
    # Report stats
    cursor.execute("SELECT status, COUNT(*) as count FROM listing_reports GROUP BY status")
    stats['reports_by_status'] = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(stats)