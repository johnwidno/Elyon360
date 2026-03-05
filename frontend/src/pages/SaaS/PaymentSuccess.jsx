import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { HiCheckCircle, HiXCircle, HiSparkles, HiArrowPath } from "react-icons/hi2";

const PaymentSuccess = () => {
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Vérification du paiement en cours...');
    const [retrying, setRetrying] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const verifyPayment = useCallback(async () => {
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get('session_id');       // Stripe
        const transactionId = queryParams.get('transactionId'); // MonCash
        const orderIdFromUrl = queryParams.get('orderId');
        const orderIdFromStorage = localStorage.getItem('pendingOrderId');
        const orderId = orderIdFromUrl || orderIdFromStorage;

        console.log(`[PaymentSuccess] Verification started. session_id: ${sessionId}, transactionId: ${transactionId}, orderId: ${orderId}`);

        try {
            let response;

            if (sessionId) {
                // Stripe verification
                console.log("[PaymentSuccess] Calling Stripe verification...");
                response = await api.get(
                    `/saas/payment/stripe/verify?session_id=${sessionId}&orderId=${orderId || ''}`
                );
            } else if (transactionId || orderId) {
                // MonCash verification
                console.log("[PaymentSuccess] Calling MonCash verification...");
                const params = new URLSearchParams();
                if (transactionId) params.set('transactionId', transactionId);
                if (orderId) params.set('orderId', orderId);

                try {
                    response = await api.get(`/saas/payment/verify?${params.toString()}`);
                } catch (verifyErr) {
                    // If standard verify fails (400), try manual fallback if we have an orderId
                    if (orderId) {
                        console.warn("[PaymentSuccess] Standard verify failed, trying manual verify fallback with orderId:", orderId);
                        response = await api.post('/saas/payment/verify-pending', { orderId });
                    } else {
                        throw verifyErr;
                    }
                }
            } else {
                console.error("[PaymentSuccess] No identifiers found.");
                setStatus('error');
                setMessage("Aucun identifiant de transaction trouvé. Veuillez contacter le support.");
                return;
            }

            if (response.data.success) {
                console.log("[PaymentSuccess] ✅ Verification Successful:", response.data);
                setStatus('success');
                setMessage(response.data.message || "Votre église a été activée avec succès.");
                localStorage.removeItem('pendingOrderId');
                // Redirect to login after 3 seconds
                setTimeout(() => navigate('/login'), 3500);
            } else {
                console.error("[PaymentSuccess] ❌ Verification failed:", response.data);
                setStatus('error');
                setMessage(response.data.message || "Le paiement n'a pas pu être vérifié.");
            }
        } catch (error) {
            console.error("[PaymentSuccess] ❌ Critical Error during verification:", error);
            setStatus('error');
            const errorMsg = error.response?.data?.message || "Erreur lors de la communication avec le serveur.";
            setMessage(errorMsg);
        }
    }, [location.search, navigate]);

    useEffect(() => {
        verifyPayment();
    }, [verifyPayment]);

    const handleRetry = async () => {
        setRetrying(true);
        console.log("[PaymentSuccess] Manual retry triggered...");
        await verifyPayment();
        setRetrying(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transition-all transform duration-500 hover:scale-[1.01]">

                {status === 'verifying' && (
                    <div className="p-10 flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute top-0 w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 animate-pulse">{message}</h2>
                        <p className="text-gray-500 text-sm mt-2">Veuillez patienter un instant...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="p-8 text-center">
                        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6 shadow-green-200 shadow-lg animate-bounce">
                            <HiCheckCircle className="h-16 w-16 text-green-600" />
                        </div>

                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500 mb-2">
                            Merci !
                        </h2>

                        <p className="text-lg text-gray-600 font-medium mb-6">
                            L'inscription est confirmée.
                        </p>

                        <div className="bg-green-50 rounded-2xl p-6 mb-8 border border-green-100 shadow-inner">
                            <div className="flex items-center justify-center space-x-2 text-green-800 mb-2">
                                <HiSparkles className="h-5 w-5" />
                                <span className="font-bold">Compte Activé</span>
                            </div>
                            <p className="text-sm text-green-700 leading-relaxed">
                                {message} Vous pouvez dès maintenant accéder à votre tableau de bord.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                        >
                            Accéder à mon compte
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="p-10 text-center">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6 animate-pulse">
                            <HiXCircle className="h-12 w-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oups !</h2>
                        <p className="text-red-600 font-medium mb-6 bg-red-50 p-4 rounded-xl border border-red-100">
                            {message}
                        </p>

                        {/* Retry button — critical for MonCash where redirect may fail */}
                        <button
                            onClick={handleRetry}
                            disabled={retrying}
                            className="w-full mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <HiArrowPath className={`h-5 w-5 ${retrying ? 'animate-spin' : ''}`} />
                            {retrying ? 'Vérification...' : 'Vérifier mon paiement'}
                        </button>

                        <button
                            onClick={() => navigate('/register-church')}
                            className="w-full bg-white border-2 border-indigo-600 text-indigo-600 font-bold py-3 px-6 rounded-xl hover:bg-indigo-50 transition duration-300"
                        >
                            Retourner à l'inscription
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
