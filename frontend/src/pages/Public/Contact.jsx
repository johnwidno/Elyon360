import React, { useState } from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import AlertModal from '../../components/ChurchAlertModal';
import {
    Mail,
    Clock,
    Globe2,
    Send,
    User,
    MessageSquare,
    HelpCircle,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Contact = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setAlertMessage({
            show: true,
            title: t('message_sent_success', 'Message envoyé !'),
            message: t('thanks_message', 'Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.'),
            type: 'success'
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <PublicLayout>
            <div className="animate-in slide-in-from-top-12 duration-1000 ease-out fill-mode-both">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-800 text-white py-24 sm:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTSAzMCAwIEwgMzAgNjAgTSAwIDMwIEwgNjAgMzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-20"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
                            <Sparkles size={16} className="text-purple-300" />
                            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em]">{t('contact_available', 'Support 24/7')}</span>
                        </div>
                        <h1 className="text-4xl sm:text-7xl font-black mb-8 leading-[0.9] tracking-tighter italic uppercase">
                            {t('contact_us', 'Contactez-nous')} <br className="sm:hidden" /> <span className="text-purple-300">Aujourd'hui</span>
                        </h1>
                        <p className="text-lg sm:text-2xl text-indigo-100 max-w-3xl mx-auto font-medium leading-relaxed">
                            {t('contact_subtitle', 'Nous sommes là pour vous accompagner dans votre transformation numérique.')}
                        </p>
                    </div>
                </div>

                {/* Contact Content */}
                <div className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            {/* Contact Form */}
                            <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 relative z-10">
                                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-10 tracking-tight">
                                    {t('send_message_title', 'Envoyez-nous un message')}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <FormField
                                            label={t('full_name_label', 'Nom complet')}
                                            id="name"
                                            icon={<User size={18} />}
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder={t('placeholder_full_name', 'Jean Dupont')}
                                        />
                                        <FormField
                                            label={t('email_label', 'Email')}
                                            id="email"
                                            type="email"
                                            icon={<Mail size={18} />}
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder={t('placeholder_email', 'jean@example.com')}
                                        />
                                    </div>

                                    <FormField
                                        label={t('subject_label', 'Sujet')}
                                        id="subject"
                                        icon={<MessageSquare size={18} />}
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder={t('placeholder_subject', 'Question sur ElyonSys 360')}
                                    />

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                                            {t('message_label', 'Message')}
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows="6"
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white resize-none"
                                            placeholder={t('placeholder_message', 'Décrivez votre demande...')}
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black text-lg hover:bg-indigo-500 transition-all shadow-xl hover:-translate-y-1"
                                    >
                                        {t('submit_btn', 'Envoyer le message')}
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-col justify-center space-y-10">
                                <div className="space-y-8">
                                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">
                                        {t('get_in_touch', 'Restons en contact')}
                                    </h2>

                                    <ContactInfoItem
                                        icon={<Mail className="text-indigo-600" />}
                                        title={t('email_label', 'Email')}
                                        desc="support@elyonsys360.com"
                                    />

                                    <ContactInfoItem
                                        icon={<Clock className="text-purple-600" />}
                                        title={t('opening_hours_title', "Heures d'ouverture")}
                                        desc={t('mon_fri', 'Lundi - Vendredi: 9h00 - 17h00')}
                                        subDesc={t('sat_sun_closed', 'Samedi - Dimanche: Fermé')}
                                    />

                                    <ContactInfoItem
                                        icon={<Globe2 className="text-blue-600" />}
                                        title={t('availability_title', 'Disponibilité')}
                                        desc={t('global_availability_desc', 'Service client disponible dans toute la francophonie')}
                                    />
                                </div>

                                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="relative z-10">
                                        <HelpCircle size={48} className="mb-6 opacity-30" />
                                        <h3 className="text-3xl font-black mb-4 tracking-tight">{t('faq_title', 'Questions fréquentes ?')}</h3>
                                        <p className="text-indigo-100 text-lg mb-8 font-medium leading-relaxed">
                                            {t('faq_desc', "Consultez notre centre d'aide pour trouver des réponses rapides aux questions courantes.")}
                                        </p>
                                        <button className="flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-black hover:bg-indigo-50 transition-all group-hover:gap-3">
                                            {t('help_center_btn', "Centre d'aide (Bientôt)")}
                                            <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />
        </PublicLayout>
    );
};

const FormField = ({ label, id, type = "text", icon, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            {label}
        </label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                {icon}
            </div>
            <input
                type={type}
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                required
                className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder={placeholder}
            />
        </div>
    </div>
);

const ContactInfoItem = ({ icon, title, desc, subDesc }) => (
    <div className="flex items-start gap-6 p-6 bg-white dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-800 hover:scale-[1.02] transition-transform shadow-sm">
        <div className="shrink-0 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner">
            {React.cloneElement(icon, { size: 32 })}
        </div>
        <div>
            <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 leading-tight uppercase tracking-tight italic">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">{desc}</p>
            {subDesc && <p className="text-gray-500 dark:text-gray-500 text-base">{subDesc}</p>}
        </div>
    </div>
);

export default Contact;
