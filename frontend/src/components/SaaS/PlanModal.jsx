import React, { useState, useEffect } from 'react';

const PlanModal = ({ show, onClose, onSave, plan }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        interval: 'monthly',
        features: ''
    });

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name,
                price: plan.price,
                interval: plan.interval,
                features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features
            });
        } else {
            setFormData({
                name: '',
                price: '',
                interval: 'monthly',
                features: ''
            });
        }
    }, [plan]);

    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert features string back to array if needed, or keep as simple string if backend handles it
        // Let's split by newline for array
        const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');
        onSave({ ...formData, features: featuresArray });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{plan ? 'Modifier Plan' : 'Nouveau Plan'}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Plan</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="ex: Premium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prix ($)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Facturation</label>
                                <select
                                    value={formData.interval}
                                    onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                >
                                    <option value="monthly">Mensuel</option>
                                    <option value="yearly">Annuel</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fonctionnalités (une par ligne)</label>
                            <textarea
                                rows="4"
                                value={formData.features}
                                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Accès complet&#10;Support 24/7"
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            {plan ? 'Mettre à jour' : 'Créer le Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PlanModal;
