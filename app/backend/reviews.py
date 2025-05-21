from flask import Blueprint, request, jsonify
from app import get_db_connection
from auth import token_required

reviews_bp = Blueprint('reviews', __name__, url_prefix='/reviews')

# Post a review
@reviews_bp.route('/', methods=['POST'])
@token_required
def create_review(current_user):
    data = request.json
    required_fields = ['seller_id', 'rating', 'comment']
    
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    if not (1 <= int(data['rating']) <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO reviews (seller_id, rating, comment)
        VALUES (%s, %s, %s)
    """, (data['seller_id'], data['rating'], data['comment']))
    conn.commit()

    cursor.close()
    conn.close()
    return jsonify({'message': 'Review created successfully'}), 201

# Get reviews for a seller
@reviews_bp.route('/<int:seller_id>', methods=['GET'])
def get_reviews_for_seller(seller_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT review_id, rating, comment, created_at
        FROM reviews
        WHERE seller_id = %s
        ORDER BY created_at DESC
    """, (seller_id,))
    reviews = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(reviews)