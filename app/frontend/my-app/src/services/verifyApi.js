import axios from "axios";
import config from "../config";

// POST  /verify/send     → body: { email }
export const sendVerificationEmail = (email) =>
  axios.post(`${config.apiUrl}/verify/send`, { email });

// GET   /verify/confirm?token=...   → returns {message}
export const confirmVerification = (token) =>
  axios.get(`${config.apiUrl}/verify/confirm`, { params: { token } });