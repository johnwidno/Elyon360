import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ChurchRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        churchName: '',
        subdomain: '',
        acronym: '',
        adminEmail: '',
        adminPassword: '',
        contactPhone: '',
        plan: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/saas/plans');
                setPlans(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, plan: res.data[0].id }));
                }
            } catch (err) {
                console.error("Error fetching plans", err);
            }
        };
        fetchPlans();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/saas/register-church', formData);
            alert(`Église créée avec succès ! \n\nVous pouvez maintenant vous connecter.`);
            navigate('/login');
        } catch (err) {
            console.error("Register Error:", err);
            const msg = err.response?.data?.message || "Erreur lors de l'inscription.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-6 lg:px-8 font-['Outfit']">
            <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-10">
                <h2 className="text-5xl font-black text-gray-900 italic tracking-tighter uppercase mb-2">
                    ElyonSys <span className="text-indigo-600">360</span>
                </h2>
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Inscrivez votre communauté</p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-2xl animate-fadeInUp">
                <div className="bg-white py-12 px-12 rounded-[3.5rem] shadow-2xl shadow-indigo-100/50 border border-gray-100">
                    {error && (
                        <div className="bg-red-50 border-2 border-red-100 text-red-600 px-6 py-4 rounded-2xl font-bold text-sm mb-8 animate-shake text-center uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSubmit}>
                        {/* Non Legliz */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-black text-indigo-700 uppercase tracking-[0.2em] mb-3 block ml-1">Nom de l'Église</label>
                            <input type="text" name="churchName" required
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-6 py-5 transition-all outline-none font-bold text-gray-800 text-lg shadow-sm"
                                placeholder="Ex: Église Évangélique de la Grâce"
                                onChange={handleChange} />
                        </div>

                        {/* Sigle */}
                        <div>
                            <label className="text-sm font-black text-indigo-700 uppercase tracking-[0.2em] mb-3 block ml-1">Sigle / Acronyme</label>
                            <input type="text" name="acronym" required
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-6 py-5 transition-all outline-none font-black text-gray-800 text-lg shadow-sm uppercase placeholder:normal-case"
                                placeholder="Ex: EEG"
                                onChange={(e) => setFormData({ ...formData, acronym: e.target.value.toUpperCase() })} />
                        </div>

                        {/* Telephone */}
                        <div>
                            <label className="text-sm font-black text-indigo-700 uppercase tracking-[0.2em] mb-3 block ml-1">Téléphone Contact</label>
                            <input type="tel" name="contactPhone" required
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-6 py-5 transition-all outline-none font-bold text-gray-800 text-lg shadow-sm"
                                placeholder="+509 ..."
                                onChange={handleChange} />
                        </div>

                        {/* Sous-domaine */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-black text-indigo-700 uppercase tracking-[0.2em] mb-3 block ml-1">Adresse Web Souhaitée</label>
                            <div className="flex bg-gray-50 rounded-2xl overflow-hidden border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-sm">
                                <input type="text" name="subdomain" required
                                    className="flex-1 min-w-0 bg-transparent px-6 py-5 outline-none font-bold text-gray-800 text-lg"
                                    placeholder="ma-paroisse" onChange={handleChange} />
                                <span className="bg-indigo-50 text-indigo-600 font-black text-sm flex items-center px-6 italic border-l border-indigo-100">
                                    .elyonsys360.com
                                </span>
                            </div>
                        </div>

                        {/* Email Admin */}
                        <div>
                            <label className="text-sm font-black text-indigo-700 uppercase tracking-[0.2em] mb-3 block ml-1">Email Administrateur</label>
                            <input type="email" name="adminEmail" required
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-6 py-5 transition-all outline-none font-bold text-gray-800 text-lg shadow-sm"
                                placeholder="admin@eglise.com"
                                onChange={handleChange} />
                        </div>

                        {/* Password Admin */}
                        <div>
                            <label className="text-sm font-black text-indigo-700 uppercase tracking-[0.2em] mb-3 block ml-1">Mot de passe</label>
                            <input type="password" name="adminPassword" required
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-6 py-5 transition-all outline-none font-bold text-gray-800 text-lg shadow-sm"
                                placeholder="••••••••"
                                onChange={handleChange} />
                        </div>

                        {/* Plan Selection */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-black text-indigo-700 uppercase tracking-[0.2em] mb-3 block ml-1">Choisir un Forfait</label>
                            <select name="plan"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-6 py-5 transition-all outline-none font-bold text-gray-800 text-lg cursor-pointer h-[70px] appearance-none"
                                onChange={handleChange} value={formData.plan}>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} — {p.price} HTG / {p.interval === 'monthly' ? 'Mois' : 'An'}
                                    </option>
                                ))}
                                {plans.length === 0 && <option value="">Chargement des forfaits...</option>}
                            </select>
                        </div>

                        <div className="md:col-span-2 pt-6">
                            <button type="submit" disabled={loading}
                                className="w-full bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] py-6 rounded-[2.5rem] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-[0.98]">
                                {loading ? 'Initialisation en cours...' : 'Lancer ma Plateforme'}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="mt-10 text-center text-xs font-black text-gray-400 uppercase tracking-[0.4em]">
                    &copy; 2026 ElyonSys 360 &bull; Tous droits réservés
                </p>
            </div>
        </div>
    );
};

export default ChurchRegister;
