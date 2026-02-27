import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://split-backend-3ysv.onrender.com/api',
    withCredentials: true,
});

export default api;
