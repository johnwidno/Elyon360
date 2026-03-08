import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    Users,
    CalendarDays,
    LayoutGrid,
    DollarSign,
    BarChart3,
    UserCircle,
    Globe,
    Settings,
    Shield,
    Headphones,
    RefreshCw,
    CheckCircle2,
    Sparkles
} from 'lucide-react';

const Home = () => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const isDark = theme === 'dark';

    const features = [
        { icon: Users, titleKey: 'feat_1_title', descKey: 'feat_1_desc' },
        { icon: CalendarDays, titleKey: 'feat_2_title', descKey: 'feat_2_desc' },
        { icon: LayoutGrid, titleKey: 'feat_3_title', descKey: 'feat_3_desc' },
        { icon: DollarSign, titleKey: 'feat_4_title', descKey: 'feat_4_desc' },
        { icon: BarChart3, titleKey: 'feat_5_title', descKey: 'feat_5_desc' },
        { icon: UserCircle, titleKey: 'feat_6_title', descKey: 'feat_6_desc' },
        { icon: Globe, titleKey: 'feat_7_title', descKey: 'feat_7_desc' },
        { icon: Settings, titleKey: 'feat_8_title', descKey: 'feat_8_desc' },
    ];

    const objectives = [
        { icon: Sparkles, textKey: 'obj_item_1' },
        { icon: Shield, textKey: 'obj_item_2' },
        { icon: Headphones, textKey: 'obj_item_3' },
        { icon: RefreshCw, textKey: 'obj_item_4' },
        { icon: CheckCircle2, textKey: 'obj_item_5' },
    ];

    const gradientBg = 'linear-gradient(135deg, #0f133d 0%, #2b2060 40%, #191e57 100%)';
    const jakartaFont = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

    return (
        <PublicLayout>
            {/* ===== HERO ===== */}
            <section className="relative overflow-hidden min-h-[90vh] sm:min-h-0 flex flex-col justify-center" style={{ background: gradientBg }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 -left-24 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-[#ea762a]/5 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 -right-24 w-72 sm:w-[400px] h-72 sm:h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 text-center py-16 sm:py-32 md:py-40">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="text-[1.75rem] sm:text-4xl md:text-[3.25rem] lg:text-[3.75rem] font-extrabold text-white leading-[1.2] tracking-tight mb-8 sm:mb-12"
                        style={jakartaFont}
                    >
                        {t('hero_title_1')}{' '}
                        <br className="hidden sm:block" />
                        {t('hero_title_2') && <>{t('hero_title_2')} </>}
                        <span className="text-[#ea762a] italic">{t('hero_title_accent')}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="text-sm sm:text-base md:text-lg text-gray-300/90 mb-12 sm:mb-16 max-w-xl sm:max-w-2xl mx-auto leading-[1.8] px-2"
                    >
                        {t('hero_desc')}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="flex flex-col sm:flex-row justify-center items-center gap-4"
                    >
                        <Link to="/register-church" className="w-full sm:w-auto bg-[#ea762a] text-white px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base shadow-xl shadow-[#ea762a]/20 hover:bg-[#d56820] transition-all hover:scale-[1.03] active:scale-95 text-center">
                            {t('hero_cta')}
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full border-2 border-white/20 text-white font-bold text-sm sm:text-base hover:bg-white/5 transition-all text-center">
                            {t('hero_login')}
                        </Link>
                    </motion.div>
                </div>

                {/* Wave */}
                <div className="absolute bottom-0 left-0 w-full">
                    <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
                        <path d="M0 60C360 100 1080 0 1440 60V100H0V60Z" fill={isDark ? '#111638' : '#f0f0f5'} />
                    </svg>
                </div>
            </section>

            {/* ===== À PROPOS ===== */}
            <section className={`py-16 sm:py-24 md:py-28 transition-colors duration-300 ${isDark ? 'bg-[#111638]' : 'bg-[#f0f0f5]'}`} id="about">
                <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                        <h2 className={`text-2xl sm:text-3xl md:text-[2.5rem] font-extrabold mb-10 ${isDark ? 'text-white' : 'text-[#1a1f4d]'}`} style={jakartaFont}>
                            {t('about_title')}
                        </h2>
                        <div className="w-16 h-1 bg-[#ea762a] mx-auto rounded-full mb-12 sm:mb-16" />
                        <p className={`text-sm sm:text-base md:text-lg leading-[1.8] mt-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('about_desc')}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ===== FONCTIONNALITÉS ===== */}
            <section className={`py-16 sm:py-24 md:py-28 transition-colors duration-300 ${isDark ? 'bg-[#0d1030]' : 'bg-[#f0f0f5]'}`} id="services">
                <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className={`text-2xl sm:text-3xl md:text-[2.5rem] font-extrabold mb-8 ${isDark ? 'text-white' : 'text-[#1a1f4d]'}`} style={jakartaFont}>
                            {t('features_title')}
                        </h2>
                        <div className="w-16 h-1 bg-[#ea762a] mx-auto rounded-full mb-8" />
                        <p className={`text-sm sm:text-base mt-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('features_subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                className={`rounded-2xl p-6 sm:p-7 border transition-all group hover:shadow-lg ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100 hover:shadow-gray-200/50'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center mb-5 transition-colors ${isDark ? 'border-white/15 group-hover:border-[#ea762a]/50' : 'border-[#1a1f4d]/15 group-hover:border-[#ea762a]/30'
                                    }`}>
                                    <feature.icon className={`w-6 h-6 transition-colors ${isDark ? 'text-gray-400 group-hover:text-[#ea762a]' : 'text-[#1a1f4d]/70 group-hover:text-[#ea762a]'}`} strokeWidth={1.5} />
                                </div>
                                <h3 className={`text-sm sm:text-base font-bold mb-3 ${isDark ? 'text-white' : 'text-[#1a1f4d]'}`} style={jakartaFont}>
                                    {t(feature.titleKey)}
                                </h3>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t(feature.descKey)}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== OBJECTIF ===== */}
            <section className={`py-16 sm:py-24 md:py-28 transition-colors duration-300 ${isDark ? 'bg-[#111638]' : 'bg-white'}`}>
                <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-20">
                        <div className="lg:w-1/2 w-full">
                            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                                <h2 className={`text-2xl sm:text-3xl md:text-[2.5rem] font-extrabold mb-10 leading-tight ${isDark ? 'text-white' : 'text-[#1a1f4d]'}`} style={jakartaFont}>
                                    {t('obj_title')}
                                </h2>
                                <p className={`text-base sm:text-lg leading-relaxed mb-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {t('obj_desc_1')}
                                </p>
                                <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('obj_desc_2')}
                                </p>
                            </motion.div>
                        </div>
                        <div className="lg:w-1/2 w-full">
                            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                                className="rounded-3xl p-7 sm:p-10 relative overflow-hidden"
                                style={{ background: gradientBg }}
                            >
                                <div className="space-y-5 sm:space-y-6">
                                    {objectives.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ea762a] flex items-center justify-center shrink-0">
                                                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                            </div>
                                            <span className="text-white text-sm sm:text-base font-medium">{t(item.textKey)}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="py-16 sm:py-24 md:py-28 text-center" style={{ background: gradientBg }}>
                <div className="max-w-3xl mx-auto px-5">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                        <h2 className="text-2xl sm:text-3xl md:text-[2.5rem] font-extrabold text-white mb-10 sm:mb-12" style={jakartaFont}>
                            {t('cta_title')}
                        </h2>
                        <p className="text-gray-300 text-sm sm:text-base mb-12 sm:mb-16">
                            {t('cta_desc')}
                        </p>
                        <Link to="/register-church" className="inline-block bg-[#ea762a] text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base shadow-xl shadow-[#ea762a]/20 hover:bg-[#d56820] transition-all hover:scale-[1.03]">
                            {t('cta_btn')}
                        </Link>
                    </motion.div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default Home;