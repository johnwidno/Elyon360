import React, { useState } from 'react';
import PublicLayout from '../../layouts/PublicLayout';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Implement actual contact form submission
        alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6">Contactez-nous</h1>
                    <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
                        Nous sommes là pour vous accompagner dans votre transformation numérique
                    </p>
                </div>
            </div>

            {/* Contact Content */}
            <div className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div className="bg-white p-8 rounded-2xl shadow-lg">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom complet
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Jean Dupont"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="jean.dupont@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                        Sujet
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Question sur ElyonSys 360"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Décrivez votre demande..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition duration-300 shadow-lg"
                                >
                                    Envoyer le message
                                </button>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div className="bg-white p-8 rounded-2xl shadow-lg">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Informations de contact</h2>

                                <div className="space-y-6">
                                    <div className="flex items-start">
                                        <div className="text-3xl mr-4">📧</div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">Email</h3>
                                            <p className="text-gray-600">support@elyonsys360.com</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="text-3xl mr-4">⏰</div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">Heures d'ouverture</h3>
                                            <p className="text-gray-600">Lundi - Vendredi: 9h00 - 17h00</p>
                                            <p className="text-gray-600">Samedi - Dimanche: Fermé</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="text-3xl mr-4">🌍</div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">Disponibilité</h3>
                                            <p className="text-gray-600">Service client disponible dans toute la francophonie</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 rounded-2xl shadow-lg text-white">
                                <h3 className="text-2xl font-bold mb-4">Questions fréquentes ?</h3>
                                <p className="mb-6">
                                    Consultez notre centre d'aide pour trouver des réponses rapides aux questions courantes.
                                </p>
                                <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition duration-300">
                                    Centre d'aide (Bientôt)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default Contact;
