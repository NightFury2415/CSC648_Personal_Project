import pytest
from app.backend.app import app as flask_app
import mysql.connector
import os

@pytest.fixture(scope='session')
def app():
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = False
    flask_app.config['JWT_SECRET_KEY'] = 'test-secret'

    yield flask_app

@pytest.fixture()
def client(app):
    return app.test_client()

@pytest.fixture()
def db_conn():
    conn = mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        user=os.getenv("MYSQL_TEST_USER", "csc648test"),
        password=os.getenv("MYSQL_TEST_PASSWORD", "Csc648_P@ss!"),
        database=os.getenv("MYSQL_TEST_DATABASE", "gator_market_test")
    )
    yield conn
    conn.close()