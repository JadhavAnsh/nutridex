import axios from 'axios';

const API_URL = 'http://localhost:8000';
let authTokenGetter = null;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = getter;
};

// Request interceptor for adding the Clerk bearer token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = authTokenGetter ? await authTokenGetter() : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosInstance;
