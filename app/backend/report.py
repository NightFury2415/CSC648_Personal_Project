from flask import Blueprint, request, jsonify
from auth import token_required
from app import get_db_connection

report_bp = Blueprint('report', __name__, url_prefix='/reports')

@report_bp.route('/users', methods=['POST'])
@token_required
def report_user(current_user):
    try:
        data = request.json
        reported_user_id = data.get('reported_user_id')
        reason = data.get('reason')
        comments = data.get('additional_comments', '')

        if not reported_user_id or not reason:
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO user_reports (reporter_id, reported_user_id, reason, additional_comments)
            VALUES (%s, %s, %s, %s)
        """, (
            current_user['user_id'],
            reported_user_id,
            reason,
            comments
        ))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'User report submitted successfully'}), 201

    except Exception as e:
        print(f"Error reporting user: {e}")
        return jsonify({'error': 'Failed to submit report'}), 500