import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Link } from 'react-router-dom';

const Services = () => {
    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6">Nos Services</h1>
                    <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
                        Des solutions complètes pour transformer la gestion de votre église
                    </p>
                </div>
            </div>

            {/* Services Grid */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Service 1 */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-5xl mb-4">👥</div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">Gestion des Membres & Profils</h3>
                            <p className="text-gray-700 mb-4">
                                Centralisez toutes les informations de vos membres dans un système sécurisé et facile à utiliser.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-indigo-600 mr-2">✓</span>
                                    <span>Profils détaillés avec photos et informations personnelles</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 mr-2">✓</span>
                                    <span>Historique des baptêmes et événements spirituels</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 mr-2">✓</span>
                                    <span>Suivi des rôles et responsabilités</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 mr-2">✓</span>
                                    <span>Gestion des groupes et ministères</span>
                                </li>
                            </ul>
                        </div>

                        {/* Service 2 */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-5xl mb-4">📅</div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">Planification des Cultes et Activités</h3>
                            <p className="text-gray-700 mb-4">
                                Organisez tous vos événements et activités avec un calendrier intégré et des outils de communication.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">✓</span>
                                    <span>Calendrier centralisé pour tous les événements</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">✓</span>
                                    <span>Gestion des inscriptions et confirmations</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">✓</span>
                                    <span>Notifications automatiques aux participants</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">✓</span>
                                    <span>Planification des services de culte</span>
                                </li>
                            </ul>
                        </div>

                        {/* Service 3 */}
                        <div className="bg-gradient-to-br from-green-50 to-teal-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-5xl mb-4">📊</div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">Tableau de Bord Administratif</h3>
                            <p className="text-gray-700 mb-4">
                                Visualisez et analysez toutes les données de votre église en temps réel.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">✓</span>
                                    <span>Vue d'ensemble de toutes les activités</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">✓</span>
                                    <span>Rapports personnalisables et exportables</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">✓</span>
                                    <span>Indicateurs de croissance et d'engagement</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">✓</span>
                                    <span>Tableaux de bord par rôle (admin, staff, member)</span>
                                </li>
                            </ul>
                        </div>

                        {/* Service 4 */}
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-5xl mb-4">💳</div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">Gestion des Finances / Dons</h3>
                            <p className="text-gray-700 mb-4">
                                Gérez les contributions financières en toute transparence et sécurité.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-yellow-600 mr-2">✓</span>
                                    <span>Suivi des dîmes et offrandes</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-yellow-600 mr-2">✓</span>
                                    <span>Rapports financiers détaillés</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-yellow-600 mr-2">✓</span>
                                    <span>Gestion des méthodes de paiement</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-yellow-600 mr-2">✓</span>
                                    <span>Historique des transactions sécurisé</span>
                                </li>
                            </ul>
                        </div>

                        {/* Service 5 */}
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-5xl mb-4">📈</div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">Statistiques en Temps Réel</h3>
                            <p className="text-gray-700 mb-4">
                                Mesurez la croissance de votre communauté avec des données précises.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-pink-600 mr-2">✓</span>
                                    <span>Graphiques et visualisations interactives</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-pink-600 mr-2">✓</span>
                                    <span>Tendances de présence et d'engagement</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-pink-600 mr-2">✓</span>
                                    <span>Analyses démographiques</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-pink-600 mr-2">✓</span>
                                    <span>Rapports d'impact et de croissance</span>
                                </li>
                            </ul>
                        </div>

                        {/* Service 6 */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-5xl mb-4">👤</div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900">Espace Membre Personnalisé</h3>
                            <p className="text-gray-700 mb-4">
                                Offrez à chaque membre un espace personnel pour suivre son parcours spirituel.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-purple-600 mr-2">✓</span>
                                    <span>Profil personnel modifiable</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-purple-600 mr-2">✓</span>
                                    <span>Historique de contributions et présences</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-purple-600 mr-2">✓</span>
                                    <span>Accès aux événements et ressources</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-purple-600 mr-2">✓</span>
                                    <span>Communication avec l'église</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sous-domaine Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white p-12 rounded-2xl shadow-xl">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-6">🌐</div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Accès par Sous-Domaine Personnalisé</h2>
                            <div className="w-24 h-1 bg-indigo-600 mx-auto mb-8"></div>
                        </div>
                        <p className="text-xl text-gray-700 text-center leading-relaxed mb-8">
                            Chaque église bénéficie de son propre sous-domaine unique pour une identité numérique professionnelle.
                        </p>
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-xl">
                            <p className="text-center text-2xl font-mono font-bold text-indigo-700 mb-4">
                                votre-eglise.elyonsys360.com
                            </p>
                            <ul className="space-y-3 text-gray-700 max-w-2xl mx-auto">
                                <li className="flex items-start">
                                    <span className="text-indigo-600 text-xl mr-3">✓</span>
                                    <span>URL personnalisée et professionnelle</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 text-xl mr-3">✓</span>
                                    <span>Isolation complète des données entre églises</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 text-xl mr-3">✓</span>
                                    <span>Sécurité et confidentialité garanties</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 text-xl mr-3">✓</span>
                                    <span>Branding personnalisé pour votre église</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="bg-indigo-700 py-20 text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-4xl font-bold text-white mb-6">Prêt à découvrir tous nos services ?</h2>
                    <p className="text-xl text-indigo-100 mb-10">Commencez votre essai gratuit dès aujourd'hui</p>
                    <Link to="/register-church" className="inline-block bg-yellow-400 text-gray-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 transition duration-300 shadow-lg">
                        Créer mon église
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
};

export default Services;
