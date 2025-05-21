import axios from 'axios';
import config from '../config';

class AuthHelper {
  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static removeToken() {
    localStorage.removeItem('token');
  }

  static getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static removeUser() {
    localStorage.removeItem('user');
  }

  static isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  static logout() {
    this.removeToken();
    this.removeUser();
    localStorage.removeItem('wishlist');
    // Clear any other auth-related data
  }

  static async refreshToken() {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No token to refresh');

      const response = await axios.post(
        `${config.apiUrl}/auth/refresh-token`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update both token and user data
      const newToken = response.data.token;
      this.setToken(newToken);
      
      if (response.data.user) {
        this.setUser(response.data.user);
      }
      
      return newToken;
    } catch (error) {
      // If there's an action code that requires logout, do it
      if (error.response?.data?.action === 'logout') {
        this.logout();
      }
      throw error;
    }
  }

  static async verifyToken() {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await axios.get(
        `${config.apiUrl}/auth/verify-token`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return response.data.valid === true;
    } catch (error) {
      return false;
    }
  }

  static getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export default AuthHelper;