import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                        Une solution divine pour une gestion <span className="text-yellow-300">moderne</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-indigo-100 mb-4 max-w-3xl mx-auto font-light">
                        La vision complète pour l'église d'aujourd'hui et de demain.
                    </p>
                    <p className="text-lg md:text-xl text-indigo-200 mb-10 max-w-4xl mx-auto">
                        ElyonSys 360 offre tous les outils pour gérer vos membres, vos événements,
                        vos finances et votre site web en un seul endroit.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/register-church" className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                            Créer mon église gratuitement
                        </Link>
                        <Link to="/login" className="bg-transparent border-2 border-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-indigo-700 transition duration-300">
                            Se connecter
                        </Link>
                    </div>
                </div>
            </div>

            {/* À Propos Section */}
            <div className="py-20 bg-white" id="about">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">À propos d'ElyonSys 360</h2>
                        <div className="w-24 h-1 bg-indigo-600 mx-auto mb-8"></div>
                        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            ElyonSys 360 est une plateforme SaaS conçue pour faciliter la <strong>gestion administrative, spirituelle et communautaire</strong> des églises modernes. Grâce à une interface intuitive et sécurisée, chaque église dispose de son propre espace personnalisé pour gérer ses membres, ses activités, ses finances et sa croissance spirituelle.
                        </p>
                    </div>
                </div>
            </div>

            {/* Fonctionnalités Section */}
            <div className="py-20 bg-gray-50" id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Fonctionnalités clés</h2>
                        <div className="w-24 h-1 bg-indigo-600 mx-auto mb-8"></div>
                        <p className="mt-4 text-lg text-gray-500">Une suite complète d'outils pour servir votre communauté.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="text-5xl mb-4">👥</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">Gestion des membres & profils</h3>
                            <p className="text-gray-600">Suivez les parcours spirituels, les baptêmes et l'engagement de vos fidèles avec des profils complets.</p>
                        </div>

                        <div className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="text-5xl mb-4">📅</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">Planification des cultes et activités</h3>
                            <p className="text-gray-600">Organisez vos cultes, gérez les inscriptions et coordonnez toutes vos activités depuis un seul endroit.</p>
                        </div>

                        <div className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="text-5xl mb-4">📊</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">Tableau de bord administratif</h3>
                            <p className="text-gray-600">Visualisez toutes les données importantes et prenez des décisions éclairées pour votre église.</p>
                        </div>

                        <div className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="text-5xl mb-4">💳</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">Gestion des finances / dons</h3>
                            <p className="text-gray-600">Gérez les dîmes, les offrandes et la comptabilité en toute transparence et sécurité.</p>
                        </div>

                        <div className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="text-5xl mb-4">📈</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">Statistiques en temps réel</h3>
                            <p className="text-gray-600">Accédez à des rapports détaillés et des analyses pour mesurer la croissance de votre communauté.</p>
                        </div>

                        <div className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="text-5xl mb-4">👤</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">Espace membre personnalisé</h3>
                            <p className="text-gray-600">Chaque membre dispose d'un espace personnel pour suivre son parcours et ses contributions.</p>
                        </div>

                        <div className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 md:col-span-2 lg:col-span-1">
                            <div className="text-5xl mb-4">🌐</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">Accès par sous-domaine</h3>
                            <p className="text-gray-600">Votre église dispose de son propre sous-domaine personnalisé (ex: assemblee.elyonsys360.com)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vision/Objectif Section */}
            <div className="py-20 bg-indigo-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Notre Objectif</h2>
                            <div className="w-24 h-1 bg-indigo-600 mb-8"></div>
                            <p className="text-xl text-gray-700 leading-relaxed mb-6">
                                Offrir aux églises un <strong className="text-indigo-700">outil numérique puissant, centralisé, et accessible</strong> pour mieux organiser leur vision, suivre leurs fidèles, et impacter leur communauté.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Nous croyons que chaque église mérite d'avoir accès aux meilleures technologies pour accomplir sa mission. ElyonSys 360 est votre partenaire de confiance pour une gestion efficace et spirituellement enrichissante.
                            </p>
                        </div>
                        <div className="lg:w-1/2">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 rounded-2xl shadow-2xl text-white">
                                <h3 className="text-2xl font-bold mb-6">Pourquoi choisir ElyonSys 360 ?</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start">
                                        <span className="text-yellow-300 text-2xl mr-3">✓</span>
                                        <span className="text-lg">Interface intuitive et facile à utiliser</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-yellow-300 text-2xl mr-3">✓</span>
                                        <span className="text-lg">Sécurité et confidentialité garanties</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-yellow-300 text-2xl mr-3">✓</span>
                                        <span className="text-lg">Support technique réactif</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-yellow-300 text-2xl mr-3">✓</span>
                                        <span className="text-lg">Mises à jour régulières et nouvelles fonctionnalités</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-yellow-300 text-2xl mr-3">✓</span>
                                        <span className="text-lg">Personnalisation selon vos besoins</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gray-900 py-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
                <div className="relative z-10 max-w-4xl mx-auto px-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Prêt à transformer votre gestion ?</h2>
                    <p className="text-xl text-gray-300 mb-10">Rejoignez les églises qui font confiance à ElyonSys 360</p>
                    <Link to="/register-church" className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                        Créer mon église maintenant
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
};

export default Home;