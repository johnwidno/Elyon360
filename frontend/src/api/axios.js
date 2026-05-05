import axios from 'axios';

const isLocalhost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname.startsWith('192.168.') || 
    window.location.hostname.startsWith('10.') || 
    window.location.hostname.endsWith('.local');

const backendURL = isLocalhost
    ? `http://${window.location.hostname}:5000/api/`
    : 'https://elyonsyst360.onrender.com/api/';

const api = axios.create({
    baseURL: (process.env.REACT_APP_API_URL || backendURL).endsWith('/') 
        ? (process.env.REACT_APP_API_URL || backendURL) 
        : `${(process.env.REACT_APP_API_URL || backendURL)}/`,
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

            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const base64Url = parts[1];
                    // Correct padding for atob
                    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) {
                        base64 += '=';
                    }
                    
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                    const decoded = JSON.parse(jsonPayload);
                    const tenantId = decoded.churchSubdomain || decoded.church_subdomain || decoded.churchId;
                    if (tenantId) {
                        config.headers['X-Tenant-ID'] = tenantId;
                    }
                }
            } catch (e) {
                console.error('Axios Interceptor Token Decode Error:', e);
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
