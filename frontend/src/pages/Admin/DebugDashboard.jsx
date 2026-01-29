import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';

export default function DebugDashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/churches/dashboard-stats')
            .then(res => {
                console.log("Debug Response:", res);
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Debug Error:", err);
                setError(err.message || "Unknown error");
                setLoading(false);
            });
    }, []);

    return (
        <AdminLayout>
            <div className="p-8 bg-white text-black">
                <h1 className="text-2xl font-bold mb-4">Debug Dashboard Stats</h1>

                {loading && <div>Loading API...</div>}

                {error && (
                    <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
                        <b>Error:</b> {error}
                    </div>
                )}

                {data && (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-100 text-green-800 rounded">
                            <b>Success! Data received.</b>
                        </div>
                        <h2 className="text-xl font-bold">Raw Data:</h2>
                        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs font-mono max-h-[500px]">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
