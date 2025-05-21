from flask import Blueprint, request, jsonify
from app import get_db_connection
import uuid
import boto3
from botocore.exceptions import ClientError
import os
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from auth import generate_token


email_bp = Blueprint('email_verification', __name__, url_prefix='/verify')

# Initialize AWS SES client
aws_region = os.getenv("AWS_REGION", "us-west-1") 
ses_client = boto3.client('ses', region_name=aws_region)

def cleanup_expired_tokens():
    """Clean up expired verification tokens and unverified accounts"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Get expired unverified accounts
        cursor.execute("""
            SELECT user_id 
            FROM users 
            WHERE verification_status = 'unverified'
            AND verification_token_created_at < NOW() - INTERVAL 24 HOUR
            FOR UPDATE
        """)
        expired_users = cursor.fetchall()

        for user in expired_users:
            user_id = user[0]
            
            # Clean up related records
            cursor.execute("DELETE FROM wishlist_tracking WHERE user_id = %s", (user_id,))
            cursor.execute("DELETE FROM messages WHERE sender_id = %s", (user_id,))
            cursor.execute("DELETE FROM conversation_participants WHERE user_id = %s", (user_id,))
            cursor.execute("DELETE FROM admin_actions WHERE admin_id = %s", (user_id,))
            cursor.execute("DELETE FROM reviews WHERE seller_id = %s", (user_id,))
            cursor.execute("DELETE FROM listing_reports WHERE reporter_id = %s", (user_id,))
            
            # Delete product images and products
            cursor.execute("""
                DELETE pi FROM product_images pi
                INNER JOIN products p ON pi.product_id = p.product_id
                WHERE p.user_id = %s
            """, (user_id,))
            cursor.execute("DELETE FROM products WHERE user_id = %s", (user_id,))
            
            # Delete the user
            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))

        conn.commit()
    except Exception as e:
        print(f"Error cleaning up expired tokens and accounts: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

# Endpoint to send email verification
@email_bp.route('/send', methods=['POST'])
def send_verification_email():
    # Clean up expired tokens first
    cleanup_expired_tokens()
    
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if user exists and is unverified
        cursor.execute("""
            SELECT verification_status, verification_token_created_at 
            FROM users 
            WHERE email = %s
        """, (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404
        if user['verification_status'] == 'verified':
            return jsonify({'error': 'Email already verified'}), 400

        # Optional throttle: check if last token was sent within 5 minutes
        last_sent = user['verification_token_created_at']
        if last_sent:
            now = datetime.now(timezone.utc)
            if (now - last_sent).total_seconds() < 90:
                return jsonify({'error': 'Please wait a few minutes before requesting another email'}), 429

        # Generate and store new token
        token = str(uuid.uuid4())
        cursor.execute("""
            UPDATE users 
            SET verification_token = %s, verification_token_created_at = NOW()
            WHERE email = %s
        """, (token, email))
        conn.commit()

        # Send email using SES
        subject = "Verify your email"
        frontend_origin = os.getenv("FRONTEND_ORIGIN", "https://csc648g1.me")
        verification_url = f"{frontend_origin}/verify-email?token={token}"
        delete_url = f"{frontend_origin}/delete-account?token={token}"
        
        # For better email formatting, use both text and HTML versions
        text_body = f"""
            Click the link to verify your email: {verification_url}

            If you did not create this account, click here to delete it: {delete_url}
            """
        html_body = f"""
        <html>
            <body>
                <h2>Welcome to Gator Market!</h2>
                <p>Please click the link below to verify your email address:</p>
                <p><a href="{verification_url}" style="padding: 10px 20px; background-color: #FFCC00; color: #2E0854; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
                <p>Or copy and paste this URL into your browser:</p>
                <p>{verification_url}</p>
                <p>This link will expire in 24 hours.</p>
                <hr style="margin: 20px 0; border: 1px solid #eee;">
                <p style="color: #666;">If you didn't create an account with Gator Market, please click below to delete this account:</p>
                <p><a href="{delete_url}" style="padding: 10px 20px; background-color: #ff4444; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Delete Account</a></p>
            </body>
        </html>
        """
        
        success = send_email_ses(email, subject, text_body, html_body)
        
        if success:
            return jsonify({'message': 'Verification email sent'}), 200
        else:
            return jsonify({'error': 'Failed to send email'}), 500

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Endpoint to confirm verification (unchanged)
@email_bp.route('/confirm', methods=['GET'])
def confirm_verification():
    token = request.args.get('token')
    if not token:
        return jsonify({'error': 'Token is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Get user and token info in one query
        cursor.execute("""
            SELECT user_id, verification_status, verification_token_created_at 
            FROM users 
            WHERE verification_token = %s
            FOR UPDATE
        """, (token,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 400
            
        if user['verification_status'] == 'verified':
            return jsonify({'error': 'Email already verified'}), 400

        # Check token age
        token_time = user['verification_token_created_at']
        if token_time:
            now = datetime.now(timezone.utc)
            if token_time.tzinfo is None:
                token_time = token_time.replace(tzinfo=timezone.utc)
            
            age_seconds = (now - token_time).total_seconds()
            if age_seconds > 86400:  # 24 hours
                return jsonify({'error': 'Token has expired'}), 400

        # Update verification status and clear token
        cursor.execute("""
            UPDATE users 
            SET verification_status = 'verified',
                verification_token = NULL,
                verification_token_created_at = NULL
            WHERE user_id = %s
        """, (user['user_id'],))
        
        conn.commit()
        return jsonify({'message': 'Email verified successfully'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# AWS SES email sending function
def send_email_ses(to_email, subject, text_body, html_body=None):
    """
    Send email using AWS SES
    """
    sender = os.getenv("SES_FROM_EMAIL", "noreply@gator.market")
    
    # Create message container
    message = MIMEMultipart('alternative')
    message['Subject'] = subject
    message['From'] = sender
    message['To'] = to_email
    
    # Create plain text part
    text_part = MIMEText(text_body, 'plain')
    message.attach(text_part)
    
    # Create HTML part if provided
    if html_body:
        html_part = MIMEText(html_body, 'html')
        message.attach(html_part)
    
    try:
        # Send email
        response = ses_client.send_raw_email(
            Source=sender,
            Destinations=[to_email],
            RawMessage={'Data': message.as_string()}
        )
        print(f"Email sent! Message ID: {response['MessageId']}")
        return True
    except ClientError as e:
        print(f"Error sending email: {e.response['Error']['Message']}")
        return False

# Fallback SMTP function (keep for backup/testing)
def send_email_smtp(to_email, subject, body):
    """
    Fallback SMTP email sending
    """
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = os.getenv("SMTP_FROM", "noreply@gator.market")
    msg["To"] = to_email

    try:
        with smtplib.SMTP(os.getenv("SMTP_SERVER", "localhost"), 587) as server:
            server.starttls()
            server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email via SMTP: {e}")
        return False
    

@email_bp.route('/get-token', methods=['POST'])
def get_token_after_verification():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if user exists and is verified
        cursor.execute("""
            SELECT user_id, username, user_role, verification_status
            FROM users 
            WHERE email = %s
        """, (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if user['verification_status'] != 'verified':
            return jsonify({'error': 'Email not verified'}), 403
            
        # Generate token for verified user
        token = generate_token(user['user_id'], user['username'], user['user_role'])
        
        return jsonify({
            'token': token,
            'user': {
                'user_id': user['user_id'],
                'username': user['username'],
                'verification_status': 'verified',
                'role': user['user_role']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@email_bp.route('/get-verified-user', methods=['POST'])
def get_verified_user():
    data = request.json
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Token is required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT verification_status
            FROM users 
            WHERE verification_token = %s
        """, (token,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found or token expired'}), 404
            
        return jsonify({
            'verification_status': user['verification_status']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()



@email_bp.route('/delete-account', methods=['GET'])
def delete_unverified_account():
    token = request.args.get('token')
    if not token:
        return jsonify({'error': 'Token is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Get user and token info in one query with row lock
        cursor.execute("""
            SELECT user_id, verification_status, verification_token_created_at 
            FROM users 
            WHERE verification_token = %s
            FOR UPDATE
        """, (token,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 400
            
        if user['verification_status'] == 'verified':
            return jsonify({'error': 'Cannot delete verified accounts through this method'}), 403

        # Check token age
        token_time = user['verification_token_created_at']
        if token_time:
            now = datetime.now(timezone.utc)
            if token_time.tzinfo is None:
                token_time = token_time.replace(tzinfo=timezone.utc)
            
            age_seconds = (now - token_time).total_seconds()
            if age_seconds > 86400:  # 24 hours
                return jsonify({'error': 'Token has expired'}), 400

        # Clean up related records in order to maintain referential integrity
        user_id = user['user_id']
        
        # Delete wishlist entries first
        cursor.execute("DELETE FROM wishlist_tracking WHERE user_id = %s", (user_id,))
        
        # Delete any messages sent by the user
        cursor.execute("DELETE FROM messages WHERE sender_id = %s", (user_id,))
        
        # Remove from conversations
        cursor.execute("DELETE FROM conversation_participants WHERE user_id = %s", (user_id,))
        
        # Delete any admin actions (if any)
        cursor.execute("DELETE FROM admin_actions WHERE admin_id = %s", (user_id,))
        
        # Delete any reviews
        cursor.execute("DELETE FROM reviews WHERE seller_id = %s", (user_id,))
        
        # Delete any listing reports
        cursor.execute("DELETE FROM listing_reports WHERE reporter_id = %s", (user_id,))
        
        # Delete product images for any products owned by user
        cursor.execute("""
            DELETE pi FROM product_images pi
            INNER JOIN products p ON pi.product_id = p.product_id
            WHERE p.user_id = %s
        """, (user_id,))
        
        # Delete products
        cursor.execute("DELETE FROM products WHERE user_id = %s", (user_id,))
        
        # Finally delete the user
        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        
        conn.commit()
        return jsonify({'message': 'Account successfully deleted'}), 200

    except Exception as e:
        conn.rollback()
        print(f"Error deleting unverified account: {e}")  # Add logging
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()