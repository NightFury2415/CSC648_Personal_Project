# testing authentication system
# test assumes /register endpoint:
# expects JSON with username, email, and password
# returns 201 status on success and 400 for invalid output
# uses JWT and bcrypt for auth

import pytest
import mysql.connector

valid_user = {
    "username": "testuser",
    "email": "testuser@sfsu.edu",
    "password": "Test@1234"
}

invalid_email_user = {
    "username": "bademail",
    "email": "notanemail@gmail.com",
    "password": "Test@1234"
}

weak_password_user = {
    "username": "weakpass",
    "email": "weak@sfsu.edu",
    "password": "123"
}


def test_register_success(client, db_conn):
    response = client.post('/register', json=valid_user)
    assert response.status_code == 201
    assert "message" in response.json

    # Optional: verify DB record
    cursor = db_conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (valid_user["email"],))
    result = cursor.fetchone()
    assert result is not None
    assert result["username"] == valid_user["username"]


def test_register_invalid_email(client):
    response = client.post('/register', json=invalid_email_user)
    assert response.status_code == 400
    assert "error" in response.json or "message" in response.json


def test_register_weak_password(client):
    response = client.post('/register', json=weak_password_user)
    assert response.status_code == 400
    assert "error" in response.json or "message" in response.json


def test_register_duplicate_email(client):
    # First time should succeed
    client.post('/register', json=valid_user)

    # Second time with same email should fail
    response = client.post('/register', json=valid_user)
    assert response.status_code == 400
    assert "error" in response.json or "message" in response.json