from flask import Blueprint, jsonify, request
from app import get_db_connection
from auth import token_required
from datetime import datetime
import json
import mysql.connector

messaging_bp = Blueprint('messaging', __name__, url_prefix='/messaging')

# Get unread message count
@messaging_bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute("""
                SELECT COUNT(*) as count 
                FROM messages m
                JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
                WHERE cp.user_id = %s 
                AND m.sender_id != %s
                AND (m.sent_at > cp.last_read_at OR cp.last_read_at IS NULL)
            """, (current_user['user_id'], current_user['user_id']))
            
            result = cursor.fetchone()
            return jsonify({'count': result['count'] if result else 0})
        except mysql.connector.Error as e:
            # Handle table not found errors
            if "Table 'gator_market.conversation_participants' doesn't exist" in str(e):
                print(f"Database error: {e}")
                return jsonify({'count': 0, 'error': 'Messaging system not initialized'}), 200
            else:
                raise e
    except Exception as e:
        print(f"Error getting unread count: {e}")
        return jsonify({'count': 0, 'error': str(e)}), 200
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

# Get recent conversations
@messaging_bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    user_id = current_user['user_id']
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Get conversations where user is a participant
            cursor.execute("""
                SELECT 
                    c.*,
                    (
                        SELECT COUNT(*) 
                        FROM messages m 
                        WHERE m.conversation_id = c.conversation_id AND 
                              m.sender_id != %s AND 
                              (m.sent_at > cp.last_read_at OR cp.last_read_at IS NULL)
                    ) as unread_count,
                    (
                        SELECT COUNT(*) 
                        FROM messages m 
                        WHERE m.conversation_id = c.conversation_id
                    ) as message_count,
                    (
                        SELECT MAX(m.sent_at) 
                        FROM messages m 
                        WHERE m.conversation_id = c.conversation_id
                    ) as last_message_time,
                    (
                        SELECT m.message_text 
                        FROM messages m 
                        WHERE m.conversation_id = c.conversation_id 
                        ORDER BY m.sent_at DESC LIMIT 1
                    ) as last_message_text,
                    p.name as product_name,
                    p.price as product_price,
                    p.product_id
                FROM conversations c
                JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
                JOIN products p ON c.product_id = p.product_id
                WHERE cp.user_id = %s
                ORDER BY last_message_time DESC
            """, (user_id, user_id))
            
            conversations = cursor.fetchall()
            
            # Get images and other participant for each conversation
            for convo in conversations:
                # Fetch product images
                cursor.execute("""
                    SELECT image_url 
                    FROM product_images 
                    WHERE product_id = %s 
                    ORDER BY image_id ASC
                """, (convo['product_id'],))
                images = cursor.fetchall()
                
                # Get other participant for each conversation
                cursor.execute("""
                    SELECT cp.user_id, cp.role, u.username, u.profile_picture_url
                    FROM conversation_participants cp
                    JOIN users u ON cp.user_id = u.user_id
                    WHERE cp.conversation_id = %s AND cp.user_id != %s
                """, (convo['conversation_id'], user_id))
                
                other_participant = cursor.fetchone()
                
                # Format the conversation data
                convo['product'] = {
                    'product_id': convo['product_id'],
                    'name': convo['product_name'],
                    'images': [img['image_url'] for img in images],
                    'price': float(convo['price']) if convo.get('price') else None
                }
                
                convo['other_participant'] = other_participant
                
                # Clean up duplicate fields
                del convo['product_id']
                del convo['product_name']
                if 'price' in convo:
                    del convo['price']
            
            return jsonify(conversations)
            
        except mysql.connector.Error as e:
            # Check for missing tables error
            if "Table 'gator_market.conversations' doesn't exist" in str(e) or \
               "Table 'gator_market.conversation_participants' doesn't exist" in str(e):
                print(f"Database table error: {e}")
                return jsonify([]), 200
            else:
                raise e
    except Exception as e:
        print(f"Error getting conversations: {e}")
        return jsonify([]), 200
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Create a new conversation
@messaging_bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation(current_user):
    user_id = current_user['user_id']
    data = request.json
    
    required_fields = ['product_id', 'recipient_id', 'subject', 'initial_message']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    conn = None
    cursor = None

    if len(data['initial_message']) > 1000:  # Example max length
        return jsonify({'error': 'Message is too long'}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Check if tables exist
            try:
                cursor.execute("SHOW TABLES LIKE 'conversations'")
                if not cursor.fetchone():
                    # Create necessary tables if they don't exist
                    with open('messaging_tables.sql', 'r') as f:
                        sql_commands = f.read()
                        for command in sql_commands.split(';'):
                            if command.strip():
                                cursor.execute(command)
                    conn.commit()
            except Exception as e:
                print(f"Error checking/creating tables: {e}")
                return jsonify({'error': 'Messaging system not initialized. Please contact administrator.'}), 500
            
            # First, check if a conversation already exists between these users for this product
            cursor.execute("""
                SELECT c.conversation_id
                FROM conversations c
                JOIN conversation_participants cp1 ON c.conversation_id = cp1.conversation_id AND cp1.user_id = %s
                JOIN conversation_participants cp2 ON c.conversation_id = cp2.conversation_id AND cp2.user_id = %s
                WHERE c.product_id = %s AND c.status = 'active'
            """, (user_id, data['recipient_id'], data['product_id']))
            
            existing_conversation = cursor.fetchone()
            
            if existing_conversation:
                # If conversation exists, add a new message to it
                conversation_id = existing_conversation[0]
                
                # Add the new message
                cursor.execute("""
                    INSERT INTO messages (conversation_id, sender_id, message_text)
                    VALUES (%s, %s, %s)
                """, (conversation_id, user_id, data['initial_message']))
                
                cursor.execute("""
                    UPDATE conversations
                    SET last_updated_at = CURRENT_TIMESTAMP
                    WHERE conversation_id = %s
                """, (conversation_id,))
                
                conn.commit()
                
                return jsonify({
                    'message': 'Message added to existing conversation',
                    'conversation_id': conversation_id
                }), 200
            
            # Create new conversation
            cursor.execute("""
                INSERT INTO conversations (product_id, subject, status)
                VALUES (%s, %s, 'active')
            """, (data['product_id'], data['subject']))
            
            conversation_id = cursor.lastrowid
            
            # Add participants
            cursor.execute("""
                INSERT INTO conversation_participants (conversation_id, user_id, role)
                VALUES (%s, %s, 'buyer')
            """, (conversation_id, user_id))
            
            cursor.execute("""
                INSERT INTO conversation_participants (conversation_id, user_id, role)
                VALUES (%s, %s, 'seller')
            """, (conversation_id, data['recipient_id']))
            
            # Add initial message
            cursor.execute("""
                INSERT INTO messages (conversation_id, sender_id, message_text)
                VALUES (%s, %s, %s)
            """, (conversation_id, user_id, data['initial_message']))
            
            conn.commit()
            
            return jsonify({
                'message': 'Conversation created successfully',
                'conversation_id': conversation_id
            }), 201
        except mysql.connector.Error as e:
            # Check for missing tables error and try to create them
            conn.rollback()
            print(f"Database error in create_conversation: {e}")
            return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        print(f"Error creating conversation:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# NEW ENDPOINT: Get a specific conversation
@messaging_bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@token_required
def get_conversation(current_user, conversation_id):
    user_id = current_user['user_id']
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # First check if the user is a participant in this conversation
        cursor.execute("""
            SELECT cp.role
            FROM conversation_participants cp
            WHERE cp.conversation_id = %s AND cp.user_id = %s
        """, (conversation_id, user_id))
        
        participant = cursor.fetchone()
        if not participant:
            return jsonify({'error': 'You are not a participant in this conversation'}), 403
        
        # Get conversation details
        cursor.execute("""
            SELECT c.*, 
                   p.name as product_name,
                   p.description as product_description,
                   p.price as product_price,
                   p.product_id,
                   p.status as product_status
            FROM conversations c
            JOIN products p ON c.product_id = p.product_id
            WHERE c.conversation_id = %s
        """, (conversation_id,))
        
        conversation = cursor.fetchone()
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Fetch all product images
        cursor.execute("""
            SELECT image_url 
            FROM product_images 
            WHERE product_id = %s 
            ORDER BY image_id ASC
        """, (conversation['product_id'],))
        images = cursor.fetchall()
        
        # Get the other participant
        cursor.execute("""
            SELECT cp.user_id, cp.role, u.username, u.profile_picture_url
            FROM conversation_participants cp
            JOIN users u ON cp.user_id = u.user_id
            WHERE cp.conversation_id = %s AND cp.user_id != %s
        """, (conversation_id, user_id))
        
        other_participant = cursor.fetchone()
        
        # Format the conversation data
        conversation['product'] = {
            'product_id': conversation['product_id'],
            'name': conversation['product_name'],
            'description': conversation['product_description'],
            'images': [img['image_url'] for img in images],
            'price': float(conversation['product_price']) if conversation.get('product_price') else None,
            'status': conversation['product_status']
        }
        
        conversation['other_participant'] = other_participant
        
        # Clean up duplicate fields
        del conversation['product_id']
        del conversation['product_name']
        del conversation['product_description']
        del conversation['product_price']
        del conversation['product_status']
        
        return jsonify(conversation)
    except Exception as e:
        print(f"Error getting conversation: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
# NEW ENDPOINT: Get messages for a conversation
@messaging_bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@token_required
def get_messages(current_user, conversation_id):
    user_id = current_user['user_id']
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # First check if the user is a participant in this conversation
        cursor.execute("""
            SELECT cp.role
            FROM conversation_participants cp
            WHERE cp.conversation_id = %s AND cp.user_id = %s
        """, (conversation_id, user_id))
        
        participant = cursor.fetchone()
        if not participant:
            return jsonify({'error': 'You are not a participant in this conversation'}), 403
        
        # Get messages for this conversation
        cursor.execute("""
            SELECT m.*, u.username as sender_username
            FROM messages m
            JOIN users u ON m.sender_id = u.user_id
            WHERE m.conversation_id = %s
            ORDER BY m.sent_at ASC
        """, (conversation_id,))
        
        messages = cursor.fetchall()
        
        return jsonify(messages)
    except Exception as e:
        print(f"Error getting messages: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# NEW ENDPOINT: Send a message to a conversation
@messaging_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@token_required
def send_message(current_user, conversation_id):
    user_id = current_user['user_id']
    data = request.json
    
    if 'message_text' not in data or not data['message_text'].strip():
        return jsonify({'error': 'Message text is required'}), 400
    
    if len(data['message_text']) > 1000:  # Example max length
        return jsonify({'error': 'Message is too long'}), 400
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # First check if the user is a participant in this conversation
        cursor.execute("""
            SELECT cp.role
            FROM conversation_participants cp
            WHERE cp.conversation_id = %s AND cp.user_id = %s
        """, (conversation_id, user_id))
        
        participant = cursor.fetchone()
        if not participant:
            return jsonify({'error': 'You are not a participant in this conversation'}), 403
        
        # Insert the new message
        cursor.execute("""
            INSERT INTO messages (conversation_id, sender_id, message_text)
            VALUES (%s, %s, %s)
        """, (conversation_id, user_id, data['message_text']))
        
        # Update the conversation's last_updated_at timestamp
        cursor.execute("""
            UPDATE conversations
            SET last_updated_at = CURRENT_TIMESTAMP
            WHERE conversation_id = %s
        """, (conversation_id,))
        
        conn.commit()
        
        return jsonify({'message': 'Message sent successfully'}), 201
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error sending message: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# NEW ENDPOINT: Mark messages as read
@messaging_bp.route('/conversations/<int:conversation_id>/read', methods=['POST'])
@token_required
def mark_as_read(current_user, conversation_id):
    user_id = current_user['user_id']
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update the last_read_at timestamp for this user in this conversation
        cursor.execute("""
            UPDATE conversation_participants
            SET last_read_at = CURRENT_TIMESTAMP
            WHERE conversation_id = %s AND user_id = %s
        """, (conversation_id, user_id))
        
        conn.commit()
        
        return jsonify({'message': 'Messages marked as read'}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error marking messages as read: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()