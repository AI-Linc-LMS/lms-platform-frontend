import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://be-app.ailinc.com/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to include the access token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    let token = null;
    if (user) {
      try {
        token = JSON.parse(user).access_token;
      } catch (e) {
        token = null;
      }
    }
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance; 