import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiXCircle } from "react-icons/hi2";

const PaymentCancelled = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
                    <HiXCircle className="h-16 w-16 text-red-500" />
                </div>

                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                    Paiement Annulé
                </h2>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    La transaction a été annulée. Votre inscription n'a pas été complétée.
                    Aucun montant n'a été débité.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/register-church')}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    >
                        Réessayer l'inscription
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-white border-2 border-gray-200 text-gray-600 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition duration-300"
                    >
                        Retourner à l'accueil
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancelled;
