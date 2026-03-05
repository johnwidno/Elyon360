import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import AlertModal from '../../../components/ChurchAlertModal';

export default function ChurchPublicHome({ subdomain }) {
    const [church, setChurch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [visitorForm, setVisitorForm] = useState({ firstName: '', lastName: '', email: '', phone: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [errorMsg, setErrorMsg] = useState('Ce site n\'existe pas ou n\'est plus actif.');

    useEffect(() => {
        const fetchChurchInfo = async () => {
            try {
                const res = await api.get(`/saas/church-public-info/${subdomain}`);
                let churchData = res.data.church;

                // Robust parsing for JSON fields
                const jsonFields = ['pastoralTeam', 'schedules', 'recentActivities', 'socialLinks'];
                jsonFields.forEach(field => {
                    if (churchData[field]) {
                        if (typeof churchData[field] === 'string') {
                            try {
                                churchData[field] = JSON.parse(churchData[field]);
                            } catch (e) {
                                console.error(`Failed to parse ${field}:`, e);
                                churchData[field] = field === 'socialLinks' ? {} : [];
                            }
                        }
                    } else {
                        churchData[field] = field === 'socialLinks' ? {} : [];
                    }
                });

                setChurch(churchData);
                setEvents(res.data.events || []);
            } catch (error) {
                console.error("Erreur lors du chargement du site public:", error);
                if (error.response?.data?.message) {
                    setErrorMsg(error.response.data.message);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchChurchInfo();
    }, [subdomain]);

    const handleVisitorSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/visitors/register', {
                ...visitorForm,
                churchId: church.id
            });
            setAlert({ show: true, message: "Merci ! Nous avons bien reçu vos informations. Nous vous contacterons bientôt.", type: 'success' });
            setVisitorForm({ firstName: '', lastName: '', email: '', phone: '', description: '' });
        } catch (error) {
            setAlert({ show: true, message: "Une erreur est survenue. Veuillez réessayer.", type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        return `${apiBase}${url}`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!church) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full text-center">
                <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Église non trouvée</h2>
                <p className="text-gray-600 mb-8">{errorMsg}</p>
                <Link to="/" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition">
                    Retour à ElyonSys 360
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Playfair+Display:ital,wght@1,900&display=swap');
                
                body { font-family: 'Outfit', sans-serif; }
                .font-script { font-family: 'Playfair+Display', serif; }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeInUp { animation: fadeInUp 0.8s ease-out forwards; }
                .animate-fadeIn { animation: fadeIn 1.2s ease-out forwards; }

                .nav-link {
                    font-size: 0.75rem;
                    font-weight: 800;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #4b5563;
                    transition: all 0.3s;
                }
                .nav-link:hover { color: #4f46e5; }
            `}</style>

            {/* Nav - Menu en Francais */}
            <nav className="bg-white sticky top-0 z-50 border-b border-gray-100 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-12">
                        <div className="flex items-center space-x-3 cursor-pointer">
                            {church.logoUrl ? (
                                <img
                                    src={getImageUrl(church.logoUrl)}
                                    alt="Logo"
                                    className="w-12 h-12 object-contain"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white p-2 shadow-sm italic font-black text-xl">
                                    {(church.acronym || 'E')[0]}
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-gray-900 tracking-tighter leading-none">
                                    {church.acronym || 'ELYONSYS'}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400  tracking-widest mt-1">
                                    {church.name}
                                </span>
                            </div>
                        </div>

                        <div className="hidden lg:flex space-x-8 items-center text-xs">
                            <a href="#about" className="nav-link">À propos de nous</a>
                            <a href="#services" className="nav-link">Services</a>
                            <a href="#events" className="nav-link">Événements</a>
                            <a href="#activities" className="nav-link">Média</a>
                            <a href="#contact" className="nav-link">Contact</a>
                        </div>

                        <div className="flex items-center space-x-6">
                            <div className="flex space-x-4 items-center">
                                {church.socialLinks?.facebook && (
                                    <a href={church.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] transition-colors" title="Facebook">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z" />
                                        </svg>
                                    </a>
                                )}
                                {church.socialLinks?.youtube && (
                                    <a href={church.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF0000] transition-colors" title="YouTube">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    </a>
                                )}
                                {church.socialLinks?.instagram && (
                                    <a href={church.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E4405F] transition-colors" title="Instagram">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.355 2.618 6.778 6.98 6.977 1.28.057 1.688.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.983.058-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4.162 4.162 0 1 1 0-8.324 4.162 4.162 0 0 1 0 8.324zM18.406 4.413a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                            <Link to="/login" className="bg-indigo-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">Connexion</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={getImageUrl(church.heroImageUrl) || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=2000"}
                        alt="Hero"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>

                <div className="relative z-10 text-center text-white px-4 animate-fadeInUp">
                    <h1 className="font-script text-7xl md:text-[9rem] mb-6 drop-shadow-2xl">Bienvenue</h1>
                    <div className="space-y-6 mt-12 flex flex-col items-center">
                        <div className={`grid grid-cols-1 ${church.socialLinks?.liveServiceUrl ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 items-center justify-center max-w-5xl mx-auto`}>
                            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-4 rounded-[1.5rem] border border-white/20">
                                <div className="text-2xl">🕒</div>
                                <div className="text-left">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/60">Services</p>
                                    <p className="text-sm font-black italic">
                                        {church.schedules?.find(s => s.day.toLowerCase().includes('dimanche'))?.time || '08:00 & 10:30'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 bg-indigo-600/20 backdrop-blur-md p-4 rounded-[1.5rem] border border-indigo-500/30">
                                <div className="text-2xl">📍</div>
                                <div className="text-left">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/60">Localisation</p>
                                    <p className="text-sm font-black italic truncate max-w-[120px]">{church.city || 'Notre Ville'}</p>
                                </div>
                            </div>
                            {church.socialLinks?.liveServiceUrl && (
                                <a
                                    href={church.socialLinks.liveServiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 bg-red-600/20 backdrop-blur-md p-4 rounded-[1.5rem] border border-red-500/30 hover:bg-red-600/40 transition-all group"
                                >
                                    <div className="text-2xl group-hover:scale-110 transition-transform">📽️</div>
                                    <div className="text-left">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/60">En Ligne</p>
                                        <p className="text-sm font-black italic">
                                            {church.socialLinks?.liveServicePlatform ? `Suivez nous sur ${church.socialLinks.liveServicePlatform}` : 'Suivez nos lives'}
                                        </p>
                                    </div>
                                </a>
                            )}
                        </div>
                        <a href="#contact" className="mt-8 bg-white text-gray-900 px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-2xl">Rejoignez-nous</a>
                    </div>
                </div>
            </section>

            {/* Section Mission & Vision - Design Sophistiqué */}
            <section id="about" className="py-32 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">

                    {/* Mission */}
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="relative group animate-fadeInUp">
                            <div className="absolute -inset-4 bg-green-50 rounded-[4rem] -rotate-2 opacity-50 transition-transform group-hover:rotate-0"></div>
                            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-square">
                                <img
                                    src={getImageUrl(church.missionImageUrl) || "https://images.unsplash.com/photo-1529070532789-70dc1ca9070a?auto=format&fit=crop&q=80&w=1500"}
                                    alt="Mission"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                        </div>
                        <div className="space-y-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-green-600 bg-green-50 px-5 py-2 rounded-full">Notre Mission</span>
                            <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight italic tracking-tighter">{church.missionTitle || ""}</h2>
                            <p className="text-lg text-gray-500 leading-relaxed font-medium italic border-l-4 border-green-500 pl-6 bg-gray-50 p-8 rounded-r-3xl">
                                "{church.mission || ""}"
                            </p>
                        </div>
                    </div>

                    {/* Vision */}
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="lg:order-2 relative group animate-fadeInUp">
                            <div className="absolute -inset-4 bg-indigo-50 rounded-[4rem] rotate-2 opacity-50 transition-transform group-hover:rotate-0"></div>
                            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-square">
                                <img
                                    src={getImageUrl(church.visionImageUrl) || "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=1500"}
                                    alt="Vision"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                        </div>
                        <div className="lg:order-1 space-y-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 bg-indigo-50 px-5 py-2 rounded-full">Notre Vision</span>
                            <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight italic tracking-tighter">{church.visionTitle || ""}</h2>
                            <p className="text-lg text-gray-500 leading-relaxed font-medium italic border-l-4 border-indigo-600 pl-6 bg-gray-50 p-8 rounded-r-3xl">
                                "{church.vision || ""}"
                            </p>
                        </div>
                    </div>

                    {/* Values Section - NEW */}
                    <div className="py-20 bg-indigo-900 rounded-[4rem] text-white px-8 md:px-20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative z-10 grid lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-1 space-y-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Nos Valeurs</span>
                                <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-tight">Ce qui nous définit.</h2>
                                <p className="text-indigo-200/60 font-medium italic">L'essence de notre communauté repose sur des principes fondamentaux qui guident chacune de nos actions.</p>
                            </div>
                            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-8">
                                {church.values ? (
                                    church.values.split('\n').filter(v => v.trim()).map((val, idx) => {
                                        const [title, ...descParts] = val.split(':');
                                        const description = descParts.join(':').trim();
                                        const icons = ['🤝', '📖', '⭐', '🔥', '💎', '🕊️', '🔋', '🌈'];
                                        return (
                                            <div key={idx} className="space-y-4 p-8 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/5">
                                                <div className="text-3xl">{icons[idx % icons.length]}</div>
                                                <h4 className="text-xl font-bold italic uppercase">{title.trim()}</h4>
                                                {description && <p className="text-sm text-indigo-100/50 leading-relaxed">{description}</p>}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-2 text-center py-10 opacity-40 italic font-medium">
                                        Aucune valeur configurée pour le moment.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.5em]">Nos Services hebdomadaires</h2>
                        <h3 className="text-5xl font-black text-gray-900 italic tracking-tighter">Rejoignez-nous en personne</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {(church.schedules || []).map((s, idx) => (
                            <div key={idx} className="bg-white p-12 rounded-[3.5rem] shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">{s.day}</p>
                                <p className="text-4xl font-black text-gray-900 mb-2 italic tracking-tighter">{s.time}</p>
                                <div className="h-px bg-gray-100 my-6"></div>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{s.type}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Media / Activities */}
            {church.recentActivities && church.recentActivities.length > 0 && (
                <section id="activities" className="py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dernières nouvelles</span>
                                <h2 className="text-5xl font-black text-gray-900 italic tracking-tighter">Média & Activités</h2>
                            </div>
                            <div className="w-32 h-1 bg-indigo-100 rounded-full"></div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-10">
                            {church.recentActivities.map((activity, idx) => (
                                <div key={idx} className="group bg-gray-50 p-10 rounded-[3rem] border border-transparent hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                                    <div className="text-xs font-black text-indigo-600 mb-6 flex justify-between uppercase">
                                        <span>{activity.type || 'Événement'}</span>
                                        <span className="text-gray-400">{activity.date}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-4 italic uppercase">{activity.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{activity.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Evenements Section */}
            {events && events.length > 0 && (
                <section id="events" className="py-32 bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[150px] opacity-20 -mr-48 -mt-48"></div>
                    <div className="max-w-7xl mx-auto px-4 relative z-10">
                        <div className="text-center mb-20 space-y-4">
                            <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em]">À ne pas manquer</h2>
                            <h3 className="text-5xl font-black italic tracking-tighter">Événements Prochains</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(events || [])
                                .filter(event => {
                                    const now = new Date();
                                    const eventEnd = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
                                    return eventEnd >= now;
                                })
                                .map(event => (
                                    <div key={event.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[3rem] hover:bg-white/10 transition-all">
                                        <div className="text-3xl font-black text-indigo-400 mb-4">
                                            {new Date(event.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase()}
                                        </div>
                                        <h4 className="text-xl font-bold mb-3 italic">{event.title}</h4>
                                        <p className="text-white/50 text-sm mb-6 line-clamp-2">{event.description}</p>
                                        <div className="flex justify-between items-center">
                                            <button className="text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/20 pb-1">En savoir plus</button>
                                            {event.registrationToken && (
                                                <Link
                                                    to={`/public/event/register/${event.registrationToken}`}
                                                    className="bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
                                                >
                                                    Participer
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Registration Form */}
            <section id="contact" className="py-32 bg-white relative">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="bg-gray-900 p-12 md:p-24 rounded-[4rem] text-white text-center space-y-12 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter">Venez nous rendre visite !</h2>
                            <p className="text-white/50 font-medium max-w-lg mx-auto">La beauté de la famille, c'est quand vous en faites partie. Inscrivez-vous pour que nous puissions bien vous accueillir.</p>
                        </div>

                        <form className="relative z-10 grid md:grid-cols-1 gap-6 max-w-xl mx-auto" onSubmit={handleVisitorSubmit}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <input
                                    type="text"
                                    placeholder="Prénom"
                                    className="bg-white/10 border border-white/10 p-6 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold placeholder:text-white/30"
                                    value={visitorForm.firstName}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, firstName: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Nom"
                                    className="bg-white/10 border border-white/10 p-6 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold placeholder:text-white/30"
                                    value={visitorForm.lastName}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, lastName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <input
                                    type="email"
                                    placeholder="Adresse email"
                                    className="bg-white/10 border border-white/10 p-6 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold placeholder:text-white/30"
                                    value={visitorForm.email}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, email: e.target.value })}
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Téléphone"
                                    className="bg-white/10 border border-white/10 p-6 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold placeholder:text-white/30"
                                    value={visitorForm.phone}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                                />
                            </div>
                            <textarea
                                placeholder="Ajoutez une note ou une raison de votre visite (optionnel)"
                                className="bg-white/10 border border-white/10 p-6 rounded-2xl outline-none focus:bg-white/20 transition-all font-bold placeholder:text-white/30 h-32 resize-none"
                                value={visitorForm.description}
                                onChange={(e) => setVisitorForm({ ...visitorForm, description: e.target.value })}
                            />
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-white text-gray-900 py-6 rounded-2xl font-black text-lg hover:bg-indigo-600 hover:text-white transition-all shadow-xl disabled:bg-gray-400"
                            >
                                {submitting ? "PATIENTEZ..." : "JE M'INSCRIS COMME VISITEUR"}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 bg-white border-t border-gray-50 flex flex-col items-center gap-12 text-center">
                <div className="flex items-center space-x-3 italic">
                    {church.logoUrl ? (
                        <img
                            src={getImageUrl(church.logoUrl)}
                            alt="Logo"
                            className="w-12 h-12 object-contain"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                            {(church.acronym || 'E')[0]}
                        </div>
                    )}
                    <div>
                        <p className="text-xl font-black text-gray-900 tracking-tighter leading-none">{church.acronym || 'ELYONSYS'}</p>
                        <p className="text-[9px] font-bold text-gray-400 tracking-[0.3em] uppercase mt-1">Établi en 2026</p>
                    </div>
                </div>
                <div className="flex space-x-12">
                    <a href="#about" className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 tracking-widest">À propos</a>
                    <a href="#services" className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 tracking-widest">Services</a>
                    <a href="#contact" className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 tracking-widest">Contact</a>
                </div>
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">© 2026 ElyonSys 360. Tous droits réservés.</p>
            </footer>

            {alert.show && (
                <AlertModal
                    isOpen={alert.show}
                    onClose={() => setAlert({ ...alert, show: false })}
                    title={alert.type === 'success' ? "Succès" : "Erreur"}
                    message={alert.message}
                    type={alert.type}
                />
            )}
        </div>
    );
}
