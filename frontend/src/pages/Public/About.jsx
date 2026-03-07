import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6">À propos d'ElyonSys 360</h1>
                    <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
                        Une solution divine pour une gestion moderne de votre église
                    </p>
                </div>
            </div>

            {/* Mission Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Notre Mission</h2>
                            <div className="w-24 h-1 bg-indigo-600 mb-8"></div>
                            <p className="text-xl text-gray-700 leading-relaxed mb-6">
                                ElyonSys 360 est une plateforme SaaS conçue pour faciliter la <strong className="text-indigo-700">gestion administrative, spirituelle et communautaire</strong> des églises modernes.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                Grâce à une interface intuitive et sécurisée, chaque église dispose de son propre espace personnalisé pour gérer ses membres, ses activités, ses finances et sa croissance spirituelle.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Nous croyons fermement que la technologie doit servir la mission de l'église, et non la compliquer. C'est pourquoi ElyonSys 360 a été pensé pour être accessible, puissant et centré sur les besoins réels des communautés de foi.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-12 rounded-2xl">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Nos Valeurs</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <span className="text-indigo-600 text-2xl mr-4">🙏</span>
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-900">Spiritualité</h4>
                                        <p className="text-gray-600">Au service de la mission spirituelle de chaque église</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 text-2xl mr-4">🤝</span>
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-900">Communauté</h4>
                                        <p className="text-gray-600">Faciliter les liens et l'engagement des fidèles</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 text-2xl mr-4">💡</span>
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-900">Innovation</h4>
                                        <p className="text-gray-600">Technologies modernes au service de la foi</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 text-2xl mr-4">🔒</span>
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-900">Sécurité</h4>
                                        <p className="text-gray-600">Protection des données et confidentialité garanties</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Objectif Section */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Notre Objectif</h2>
                        <div className="w-24 h-1 bg-indigo-600 mx-auto mb-8"></div>
                    </div>
                    <div className="bg-white p-12 rounded-2xl shadow-xl max-w-4xl mx-auto">
                        <p className="text-2xl text-gray-700 text-center leading-relaxed mb-6">
                            Offrir aux églises un <strong className="text-indigo-700">outil numérique puissant, centralisé, et accessible</strong> pour mieux organiser leur vision, suivre leurs fidèles, et impacter leur communauté.
                        </p>
                        <p className="text-lg text-gray-600 text-center leading-relaxed">
                            Nous nous engageons à accompagner chaque église dans sa transformation numérique, en fournissant des outils qui s'adaptent à leurs besoins spécifiques et évoluent avec leur croissance.
                        </p>
                    </div>
                </div>
            </div>

            {/* Vision Section */}
            <div className="py-20 bg-indigo-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-extrabold mb-6">La vision complète pour l'église d'aujourd'hui et de demain</h2>
                    <p className="text-xl text-indigo-100 max-w-3xl mx-auto mb-10">
                        Nous imaginons un futur où chaque église, quelle que soit sa taille, dispose des mêmes outils que les plus grandes organisations pour accomplir sa mission.
                    </p>
                    <Link to="/register-church" className="inline-block bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 transition duration-300 shadow-lg">
                        Rejoignez-nous dès aujourd'hui
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
};

export default About;
