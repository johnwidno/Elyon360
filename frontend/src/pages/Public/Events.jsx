import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Link } from 'react-router-dom';

const Events = () => {
    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6">Événements</h1>
                    <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
                        Découvrez les événements et activités de notre communauté
                    </p>
                </div>
            </div>

            {/* Coming Soon Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="text-8xl mb-8">📅</div>
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Bientôt Disponible</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
                        La section événements publics sera bientôt disponible. Vous pourrez y découvrir tous les événements organisés par les églises de la communauté ElyonSys 360.
                    </p>
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-8 rounded-2xl max-w-3xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Fonctionnalités à venir</h3>
                        <ul className="space-y-3 text-left text-gray-700">
                            <li className="flex items-start">
                                <span className="text-indigo-600 text-xl mr-3">✓</span>
                                <span>Calendrier des événements publics</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-indigo-600 text-xl mr-3">✓</span>
                                <span>Inscriptions en ligne</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-indigo-600 text-xl mr-3">✓</span>
                                <span>Notifications pour les événements à venir</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-indigo-600 text-xl mr-3">✓</span>
                                <span>Galerie photos des événements passés</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gray-900 py-16 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">Créez votre église dès maintenant</h2>
                <p className="text-xl text-gray-300 mb-8">Et commencez à organiser vos propres événements</p>
                <Link to="/register-church" className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition duration-300 shadow-lg">
                    Créer mon église
                </Link>
            </div>
        </PublicLayout>
    );
};

export default Events;
