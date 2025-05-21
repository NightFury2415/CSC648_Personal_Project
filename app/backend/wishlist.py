from flask import Blueprint, request, jsonify
from auth import token_required
from app import get_db_connection
import logging

# Fix the Blueprint initialization
wishlist_bp = Blueprint('wishlist', __name__, url_prefix='/wishlist')

@wishlist_bp.route('/add', methods=['POST'])
@token_required
def add_to_wishlist(current_user):
    data = request.json
    if not data or 'product_id' not in data:
        return jsonify({'error': 'Missing product_id'}), 400
        
    product_id = data.get('product_id')
    user_id = current_user['user_id']
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if product exists and is approved
        cursor.execute("SELECT approval_status FROM products WHERE product_id = %s", (product_id,))
        row = cursor.fetchone()

        if not row:
            return jsonify({'error': 'Product not found'}), 404

        if row[0] != 'approved':
            return jsonify({'error': 'Can only bookmark approved products'}), 400

        
        # Add to wishlist using separate queries to avoid SQL injection risks
        cursor.execute("""
            INSERT IGNORE INTO wishlist_tracking (user_id, product_id)
            VALUES (%s, %s)
        """, (current_user['user_id'], product_id))
        
        conn.commit()
        return jsonify({'message': 'Added to wishlist'}), 200
    except Exception as e:
        logging.error(f"Error adding to wishlist: {str(e)}")
        return jsonify({'error': 'Failed to add item to wishlist'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@wishlist_bp.route('/user', methods=['GET'])
@token_required
def get_user_wishlist(current_user):
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT p.product_id, p.name,
                       (
                            SELECT pi.image_url
                            FROM product_images pi
                            WHERE pi.product_id = p.product_id
                            ORDER BY pi.image_id ASC
                            LIMIT 1
                        ) as image_url,
                        p.status
            FROM wishlist_tracking w
            JOIN products p ON w.product_id = p.product_id
            WHERE w.user_id = %s AND w.archived = FALSE
        """, (current_user['user_id'],)) 
        
        wishlist_items = cursor.fetchall()
        return jsonify(wishlist_items)
    except Exception as e:
        logging.error(f"Error fetching wishlist: {str(e)}")
        return jsonify({'error': 'Failed to fetch wishlist'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@wishlist_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT w.product_id, p.name,
                       (
                            SELECT pi.image_url
                            FROM product_images pi
                            WHERE pi.product_id = p.product_id
                            ORDER BY pi.image_id ASC
                            LIMIT 1
                        ) as image_url
            FROM wishlist_tracking w
            JOIN products p ON w.product_id = p.product_id
            WHERE w.user_id = %s AND p.status = 'sold' AND w.notified = FALSE
        """, (current_user['user_id'],))
        
        notifications = cursor.fetchall()
        
        # Mark as notified - safely handle empty list case
        product_ids = [row['product_id'] for row in notifications]
        if product_ids:
            # Use a safer approach with parameterized placeholders
            placeholders = ', '.join(['%s'] * len(product_ids))
            params = [current_user['user_id']] + product_ids
            
            query = f"""
                UPDATE wishlist_tracking
                SET notified = TRUE
                WHERE user_id = %s AND product_id IN ({placeholders})
            """
            cursor.execute(query, params)
            conn.commit()
            
        return jsonify(notifications)
    except Exception as e:
        logging.error(f"Error fetching notifications: {str(e)}")
        return jsonify({'error': 'Failed to fetch notifications'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@wishlist_bp.route('/archive/<int:product_id>', methods=['PUT'])
@token_required
def archive_wishlist_item(current_user, product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE wishlist_tracking 
            SET archived = TRUE 
            WHERE user_id = %s AND product_id = %s
        """, (current_user['user_id'], product_id))
        conn.commit()
        return jsonify({'message': 'Wishlist item archived'}), 200
    except Exception as e:
        logging.error(f"Error archiving wishlist item: {str(e)}")
        return jsonify({'error': 'Failed to archive item'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@wishlist_bp.route('/archived', methods=['GET'])
@token_required
def get_archived_wishlist(current_user):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT p.product_id, p.name,
                   (
                        SELECT pi.image_url
                        FROM product_images pi
                        WHERE pi.product_id = p.product_id
                        ORDER BY pi.image_id ASC
                        LIMIT 1
                    ) as image_url,
                    p.status
            FROM wishlist_tracking w
            JOIN products p ON w.product_id = p.product_id
            WHERE w.user_id = %s AND w.archived = TRUE
        """, (current_user['user_id'],))

        archived_items = cursor.fetchall()
        return jsonify(archived_items)
    except Exception as e:
        logging.error(f"Error fetching archived wishlist: {str(e)}")
        return jsonify({'error': 'Failed to fetch archived wishlist'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()