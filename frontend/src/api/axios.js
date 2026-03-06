import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const backendURL = isLocalhost
    ? 'http://localhost:5000/api'
    : 'https://elyonsyst360.onrender.com/api';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || backendURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor pou ajoute token an
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`Axios Interceptor: Attaching token to ${config.method.toUpperCase()} ${config.url}`);

            // TENTANT SIMULATION (Localhost)
            // Si nou sou localhost, nou pa gen sous-domèn nan URL la.
            // Nou dwe voye subdomain lan nan header pou backend la konnen ki legliz n ap jere.
            try {
                // Decode token pou jwenn subdomain
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const decoded = JSON.parse(jsonPayload);
                if (decoded.church_subdomain) {
                    config.headers['X-Tenant-ID'] = decoded.church_subdomain;
                }
            } catch (e) {
                // Ignore decoding error
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor pou jere erè 401 (Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            // Nou ka ajoute yon lojik pou redireksyon isit la si nesesè
        }

        // Handle Inactive Church
        if (error.response && error.response.status === 403 && error.response.data?.code === 'CHURCH_INACTIVE') {
            // Optional: Redirect to a suspended page or just let the toast/error handle it
            console.error("Platform SUSPENDED:", error.response.data.message);
        }

        return Promise.reject(error);
    }
);

export default api;
