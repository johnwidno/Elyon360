import React, { useState, useEffect } from 'react';

const PlanModal = ({ show, onClose, onSave, plan }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        interval: 'monthly',
        billingCycle: 'monthly',
        durationMonths: 1,
        startDate: '',
        endDate: '',
        features: ''
    });

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name,
                price: plan.price,
                interval: plan.interval || 'monthly',
                billingCycle: plan.billingCycle || plan.interval || 'monthly',
                durationMonths: plan.durationMonths || (plan.interval === 'yearly' ? 12 : 1),
                startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '',
                endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
                features: Array.isArray(plan.features) ? plan.features.join('\n') : (plan.features || '')
            });
        } else {
            setFormData({
                name: '',
                price: '',
                interval: 'monthly',
                billingCycle: 'monthly',
                durationMonths: 1,
                startDate: '',
                endDate: '',
                features: ''
            });
        }
    }, [plan]);

    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const featuresArray = formData.features.split('\n').filter(f => f.trim() !== '');

        // Final interval logic
        let interval = 'custom';
        if (formData.billingCycle === 'monthly') interval = 'monthly';
        if (formData.billingCycle === 'yearly') interval = 'yearly';

        onSave({
            ...formData,
            interval,
            features: featuresArray
        });
    };

    const handleCycleChange = (cycle) => {
        let duration = 1;
        if (cycle === 'yearly') duration = 12;
        if (cycle === '2years') duration = 24;
        if (cycle === '3years') duration = 36;

        setFormData({
            ...formData,
            billingCycle: cycle,
            durationMonths: cycle === 'custom' ? formData.durationMonths : duration
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{plan ? 'Modifier Plan' : 'Nouveau Plan'}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Nom du Plan</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="ex: Premium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Prix ($)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-indigo-600"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Facturation</label>
                                <select
                                    value={formData.billingCycle}
                                    onChange={(e) => handleCycleChange(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                >
                                    <option value="monthly">Mensuel (1 mois)</option>
                                    <option value="yearly">Annuel (12 mois)</option>
                                    <option value="2years">Deux Ans (24 mois)</option>
                                    <option value="3years">Trois Ans (36 mois)</option>
                                    <option value="custom">Personnalisé (durée en mois)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Durée (Mois)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.durationMonths}
                                    onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 1 })}
                                    readOnly={formData.billingCycle !== 'custom'}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium ${formData.billingCycle !== 'custom' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>

                        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Période de Validité Fixe (Optionnel)</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Date de Début</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Date de Fin</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-indigo-400 italic">Si ces dates sont définies, elles priment sur la durée calculée lors du paiement.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Fonctionnalités (une par ligne)</label>
                            <textarea
                                rows="4"
                                value={formData.features}
                                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                placeholder="Accès complet&#10;Support 24/7"
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3 border-t border-gray-100 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
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
