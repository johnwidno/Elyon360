import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import AlertModal from '../../../components/ChurchAlertModal';
import { useAuth } from '../../../auth/AuthProvider';
import { useLanguage } from '../../../context/LanguageContext';

export default function Settings() {
    const { t } = useLanguage();
    const { updateUser } = useAuth();
    const navigate = useNavigate();
    const [church, setChurch] = useState({
        name: '',
        acronym: '',
        description: '',
        address: '',
        city: '',
        contactEmail: '',
        contactPhone: '',
        heroImageUrl: '',
        missionTitle: '',
        mission: '',
        missionImageUrl: '',
        visionTitle: '',
        vision: '',
        visionImageUrl: '',
        values: '',
        valuesImageUrl: '',
        socialLinks: { facebook: '', youtube: '', instagram: '', whatsapp: '', liveServiceUrl: '', liveServicePlatform: '' },
        logoUrl: '',
        recentActivities: [],
        schedules: [],
        pastoralTeam: [],
        supportedCurrencies: ['HTG', 'USD'],
        donationTypes: ['offrande', 'dime', 'don_special', 'promesse'],
        paymentMethods: ['CASH', 'VIREMENT', 'CHEQUE', 'CARTE DE CREDIT'],
        setupCompleted: false,
        pastorName: '',
        churchEmail: ''
    });
    const [donationStats, setDonationStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

    // Roles state
    const [roles, setRoles] = useState([]);
    const [newRole, setNewRole] = useState({ name: '', permissions: [] });
    const [isAddingRole, setIsAddingRole] = useState(false);

    // Contact Classification State
    const [contactTypes, setContactTypes] = useState([]);
    const [contactSubtypes, setContactSubtypes] = useState([]);
    const [newContactType, setNewContactType] = useState('');
    const [newContactSubtype, setNewContactSubtype] = useState({ name: '', contactTypeId: '' });

    // Event Types State
    const [eventTypes, setEventTypes] = useState([]);
    const [newEventType, setNewEventType] = useState('');

    const availablePermissions = [
        { id: 'members', name: t('members'), icon: '👥' },
        { id: 'events', name: t('events'), icon: '📅' },
        { id: 'groups', name: t('groups'), icon: 'users' },
        { id: 'finances', name: t('finances_and_donations'), icon: '💰' },
        { id: 'sunday-school', name: t('sunday_school'), icon: '🏫' },
        { id: 'inventory', name: t('inventory'), icon: '📦' },
        { id: 'ceremonies', name: t('ceremonies'), icon: '🕊️' },
        { id: 'settings', name: t('settings'), icon: '⚙️' },
    ];

    // Master Accordion State
    const [openMasterSections, setOpenMasterSections] = useState({
        website: false,
        finances: false,
        users: false,
        contacts: false,
        eventTypes: false
    });

    // Sub-Accordion State
    const [openSections, setOpenSections] = useState({
        info: true,
        appearance: false,
        social: false,
        activities: false,
        contact: false,
        currencies: false,
        donationTypes: false,
        paymentMethods: false,
        pastoral: false,
        schedules: false
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchSettings();
    }, []);

    // Show welcome alert if setup is not completed
    useEffect(() => {
        if (!loading && church.setupCompleted === false) {
            setAlert({
                show: true,
                message: t('setup_incomplete_warning'),
                type: 'warning'
            });

            // Auto-dismiss after 15 seconds
            const timer = setTimeout(() => {
                setAlert(prev => ({ ...prev, show: false }));
            }, 15000);

            return () => clearTimeout(timer);
        }
    }, [loading, church.setupCompleted]);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/churches/settings');
            let churchData = res.data.church;

            // Robust parsing for JSON fields
            const jsonFields = ['pastoralTeam', 'schedules', 'recentActivities', 'socialLinks', 'supportedCurrencies', 'donationTypes', 'paymentMethods'];
            jsonFields.forEach(field => {
                if (churchData[field]) {
                    if (typeof churchData[field] === 'string') {
                        try {
                            churchData[field] = JSON.parse(churchData[field]);
                        } catch (e) {
                            console.error(`Failed to parse ${field}:`, e);
                            churchData[field] = field === 'socialLinks' ? { facebook: '', youtube: '', instagram: '', whatsapp: '', liveServiceUrl: '', liveServicePlatform: '' } :
                                (field === 'supportedCurrencies' ? ['HTG', 'USD'] :
                                    (field === 'donationTypes' ? ['offrande', 'dime', 'don_special', 'promesse'] :
                                        (field === 'paymentMethods' ? ['CASH', 'VIREMENT', 'CHEQUE', 'CARTE DE CREDIT'] : [])));
                        }
                    }
                } else {
                    churchData[field] = field === 'socialLinks' ? { facebook: '', youtube: '', instagram: '', whatsapp: '', liveServiceUrl: '', liveServicePlatform: '' } :
                        (field === 'supportedCurrencies' ? ['HTG', 'USD'] :
                            (field === 'donationTypes' ? ['offrande', 'dime', 'don_special', 'promesse'] :
                                (field === 'paymentMethods' ? ['CASH', 'VIREMENT', 'CHEQUE', 'CARTE DE CREDIT'] : [])));
                }
            });

            setChurch(churchData);

            // Also fetch donation stats to check balances
            const statsRes = await api.get('/donations/stats');
            setDonationStats(statsRes.data);

            const rolesRes = await api.get('/roles');
            setRoles(rolesRes.data);

            const typesRes = await api.get('/contacts/classification/types');
            setContactTypes(typesRes.data);

            const subtypesRes = await api.get('/contacts/classification/subtypes');
            setContactSubtypes(subtypesRes.data);

            const eventTypesRes = await api.get('/event-types');
            setEventTypes(eventTypesRes.data);
        } catch (error) {
            console.error("Error fetching settings:", error);
            setAlert({ show: true, message: t('settings_load_error'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const toggleMasterSection = (section) => {
        setOpenMasterSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCreateRole = async () => {
        if (!newRole.name) return setAlert({ show: true, message: t('role_name_required'), type: 'error' });
        try {
            const res = await api.post('/roles', newRole);
            setRoles([...roles, res.data]);
            setNewRole({ name: '', permissions: [] });
            setIsAddingRole(false);
            setAlert({ show: true, message: t('role_created_success'), type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: t('role_creation_error'), type: 'error' });
        }
    };

    const handleDeleteRole = async (id) => {
        try {
            await api.delete(`/roles/${id}`);
            setRoles(roles.filter(r => r.id !== id));
            setAlert({ show: true, message: t('role_deleted'), type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: t('role_delete_error'), type: 'error' });
        }
    };

    const togglePermission = (permId) => {
        setNewRole(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId]
        }));
    };

    const handleAddContactType = async () => {
        if (!newContactType) return;
        try {
            const res = await api.post('/contacts/classification/types', { name: newContactType });
            setContactTypes([...contactTypes, { ...res.data, subtypes: [] }]);
            setNewContactType('');
            setAlert({ show: true, message: t('contact_type_added'), type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: t('contact_type_delete_error'), type: 'error' });
        }
    };

    const handleDeleteContactType = async (id) => {
        try {
            await api.delete(`/contacts/classification/types/${id}`);
            setContactTypes(contactTypes.filter(t => t.id !== id));
            setAlert({ show: true, message: t('type_deleted'), type: 'success' });
        } catch (error) {
            const msg = error.response?.data?.message || "Erreur lors de la suppression";
            setAlert({ show: true, message: msg, type: 'error' });
        }
    };

    const handleAddContactSubtype = async () => {
        if (!newContactSubtype.name || !newContactSubtype.contactTypeId) return;
        try {
            const res = await api.post('/contacts/classification/subtypes', newContactSubtype);
            setContactSubtypes([...contactSubtypes, res.data]);
            // Also update contactTypes local state to show the new subtype in the list if nested
            setContactTypes(contactTypes.map(t => {
                if (t.id === parseInt(newContactSubtype.contactTypeId)) {
                    return { ...t, subtypes: [...(t.subtypes || []), res.data] };
                }
                return t;
            }));
            setNewContactSubtype({ ...newContactSubtype, name: '' });
            setAlert({ show: true, message: t('subtype_added'), type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: t('contact_type_delete_error'), type: 'error' });
        }
    };

    const handleDeleteContactSubtype = async (id) => {
        try {
            await api.delete(`/contacts/classification/subtypes/${id}`);
            setContactSubtypes(contactSubtypes.filter(s => s.id !== id));
            // Update local types nested state too if needed
            setContactTypes(contactTypes.map(t => ({
                ...t,
                subtypes: t.subtypes?.filter(s => s.id !== id) || []
            })));
            setAlert({ show: true, message: t('subtype_delete_success'), type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: "Erreur lors de la suppression", type: 'error' });
        }
    };

    const handleAddEventType = async () => {
        if (!newEventType) return;
        try {
            const res = await api.post('/event-types', { name: newEventType });
            setEventTypes([...eventTypes, res.data]);
            setNewEventType('');
            setAlert({ show: true, message: t('event_type_added', 'Type d\'événement ajouté'), type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: t('error_operation', 'Erreur lors de l\'opération'), type: 'error' });
        }
    };

    const handleDeleteEventType = async (id) => {
        try {
            await api.delete(`/event-types/${id}`);
            setEventTypes(eventTypes.filter(t => t.id !== id));
            setAlert({ show: true, message: t('event_type_deleted', 'Type supprimé'), type: 'success' });
        } catch (error) {
            setAlert({ show: true, message: t('error_operation', 'Erreur lors de l\'opération'), type: 'error' });
        }
    };

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        // Frontend validation
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setAlert({ show: true, message: t('image_format_error'), type: 'error' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setAlert({ show: true, message: t('image_size_error'), type: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            setSaving(true);
            const res = await api.post('/churches/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setChurch({ ...church, [field]: res.data.filePath });
            setAlert({ show: true, message: t('image_upload_success'), type: 'success' });
        } catch (error) {
            console.error("Upload Error:", error);
            const msg = error.response?.data?.message || t('upload_error');
            setAlert({ show: true, message: msg, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleImageRemove = (field) => {
        setChurch({ ...church, [field]: '' });
        setAlert({ show: true, message: t('image_removed'), type: 'success' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const handleSave = async () => {
            const requiredFields = [
                { key: 'name', label: t('church_name') },
                { key: 'missionTitle', label: t('mission_title_label') },
                { key: 'mission', label: t('mission_desc_label') },
                { key: 'visionTitle', label: t('vision_title_label') },
                { key: 'vision', label: t('vision_desc_label') },
                { key: 'values', label: t('our_values') },
                { key: 'address', label: t('address') },
                { key: 'city', label: t('city') }
            ];

            const missing = requiredFields.filter(f => !church[f.key] || (typeof church[f.key] === 'string' && church[f.key].trim() === ''));

            if (missing.length > 0) {
                const newErrors = {};
                missing.forEach(f => { newErrors[f.key] = true; });
                setErrors(newErrors);

                setAlert({
                    show: true,
                    message: `${t('fill_required_fields_error', 'Veuillez remplir les champs obligatoires')} : ${missing.map(m => m.label).join(', ')}`,
                    type: 'error'
                });
                // Scroll to top to see alert
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            setErrors({});
            setSaving(true);
            try {
                // If we reached here, all required fields are filled
                const payload = {
                    ...church,
                    setupCompleted: true
                };

                const res = await api.put('/churches/settings', payload);
                setChurch(res.data.church);

                // Update local storage
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    user.setupCompleted = true;
                    localStorage.setItem('user', JSON.stringify(user));
                }

                updateUser({ setupCompleted: true });

                setAlert({
                    show: true,
                    message: t('settings_saved_success'),
                    type: 'success',
                    onClose: () => navigate('/admin')
                });

                // Auto redirect after 2 seconds if alert not closed
                setTimeout(() => {
                    navigate('/admin');
                }, 2000);
            } catch (error) {
                console.error(error);
                setAlert({ show: true, message: t('error_saving'), type: 'error' });
            } finally {
                setSaving(false);
            }
        };
        handleSave();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black transition-colors">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-semibold animate-pulse text-app-micro">{t('loading_config')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-32 pt-10 px-4">
            <header className="mb-14 flex flex-col md:flex-row justify-between items-center md:items-end gap-6 text-center md:text-left animate-fade-in">
                <div className="space-y-2">
                    <h1 className="text-app-title font-bold text-gray-900 dark:text-white leading-none tracking-tight transition-colors">{t('settings')}</h1>
                    <p className="text-gray-400 dark:text-gray-500 font-semibold text-app-meta flex items-center justify-center md:justify-start transition-colors">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2.5"></span>
                        {t('global_config_desc')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-12 border-l border-gray-200 dark:border-white/5 hidden md:block mx-4 transition-colors"></div>
                    <button
                        type="button"
                        onClick={() => {
                            if (church.setupCompleted) {
                                navigate('/admin');
                            }
                        }}
                        disabled={!church.setupCompleted}
                        className={`px-8 py-3.5 rounded-xl text-app-meta font-semibold transition-all shadow-lg active:scale-95 ${church.setupCompleted
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none'
                            }`}
                        title={church.setupCompleted ? t('return_dashboard') : t('complete_setup_hint')}
                    >
                        {t('admin_panel')}
                    </button>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* MASTER MODULE 1: WEBSITE */}
                <MasterAccordion
                    id="website"
                    title={t('church_settings_website')}
                    subtitle={t('identity_appearance_comm')}
                    icon="🌐"
                    color="bg-indigo-600 text-white"
                    isOpen={openMasterSections.website}
                    onToggle={() => toggleMasterSection('website')}
                >
                    <AccordionSection
                        id="info"
                        title={t('basic_info')}
                        icon="📁"
                        description={t('identity_global_desc')}
                        isOpen={openSections.info}
                        onToggle={() => toggleSection('info')}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                            <div className="group">
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('church_name')} <span className="text-red-500">*</span></label>
                                <div className={`flex items-center bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-red-500' : 'border-gray-100 dark:border-white/10'} focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black transition-all rounded-xl shadow-sm overflow-hidden`}>
                                    <span className="pl-4 text-gray-400 font-semibold text-app-micro italic opacity-40">{t('name_hint', 'Name')}</span>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                        value={church.name || ''}
                                        onChange={(e) => {
                                            setChurch({ ...church, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: false });
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('acronym_label')} <span className="text-red-500">*</span></label>
                                <div className={`flex items-center bg-gray-50 dark:bg-black/20 border ${errors.acronym ? 'border-red-500' : 'border-gray-100 dark:border-white/10'} focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black transition-all rounded-xl shadow-sm overflow-hidden`}>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                        value={church.acronym || ''}
                                        onChange={(e) => {
                                            setChurch({ ...church, acronym: e.target.value.toUpperCase() });
                                            if (errors.acronym) setErrors({ ...errors, acronym: false });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 mb-2.5">{t('pastor_name_label', 'Nom du Pasteur')}</label>
                                <div className="flex items-center bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black transition-all rounded-xl shadow-sm overflow-hidden">
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                        placeholder="Ex: Rev. Jean Baptiste"
                                        value={church.pastorName || ''}
                                        onChange={(e) => setChurch({ ...church, pastorName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 mb-2.5">{t('church_email_label', 'Email de l\'église')}</label>
                                <div className="flex items-center bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black transition-all rounded-xl shadow-sm overflow-hidden">
                                    <input
                                        type="email"
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                        placeholder="eglise@exemple.com"
                                        value={church.churchEmail || ''}
                                        onChange={(e) => setChurch({ ...church, churchEmail: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('subdomain_label')}</label>
                                <div className="flex items-center bg-gray-100 dark:bg-white/5 border border-transparent rounded-xl shadow-sm overflow-hidden opacity-70 cursor-not-allowed transition-colors">
                                    <span className="pl-4 text-gray-500 font-semibold text-app-micro italic">{t('url_hint', 'URL')}</span>
                                    <input
                                        type="text"
                                        readOnly
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        value={`${church.subdomain}.elyonsys360.com`}
                                    />
                                    <span className="pr-4">🔒</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('owner_email_label')}</label>
                                <div className="flex items-center bg-gray-100 dark:bg-white/5 border border-transparent rounded-xl shadow-sm overflow-hidden opacity-70 cursor-not-allowed transition-colors">
                                    <span className="pl-4 text-gray-500 font-semibold text-app-micro italic">@</span>
                                    <input
                                        type="email"
                                        readOnly
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        value={church.contactEmail || ''}
                                    />
                                    <span className="pr-4">🔒</span>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('description_who_we_are')}</label>
                                <textarea
                                    rows="4"
                                    className="w-full bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 p-4 rounded-xl focus:border-indigo-500 transition-all outline-none text-app-meta font-semibold text-gray-800 dark:text-white resize-none"
                                    value={church.description || ''}
                                    onChange={(e) => setChurch({ ...church, description: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection
                        id="appearance"
                        title={t('appearance')}
                        icon="🎨"
                        description={t('visual_identity_desc')}
                        isOpen={openSections.appearance}
                        onToggle={() => toggleSection('appearance')}
                    >
                        <div className="space-y-8 mt-2">
                            {/* Church Logo Upload */}
                            <div>
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('church_logo_label', 'Logo de l\'église')}</label>
                                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                                    <div className="w-32 h-32 rounded-3xl bg-gray-50 dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden relative group/logo shadow-sm shrink-0">
                                        {church.logoUrl ? (
                                            <>
                                                <img
                                                    src={church.logoUrl.startsWith('http') ? church.logoUrl : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${church.logoUrl}`}
                                                    alt="Logo Preview"
                                                    className="w-full h-full object-contain p-2"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleImageRemove('logoUrl')}
                                                    className="absolute inset-0 bg-red-600/60 text-white opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    <span className="text-app-micro font-black uppercase tracking-widest">{t('remove', 'Supprimer')}</span>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-gray-300 dark:text-gray-700 font-black text-2xl">LOGO</div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                placeholder={t('logo_url_placeholder', 'URL du logo')}
                                                className="flex-1 bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 p-4 rounded-xl focus:border-indigo-500 transition-all outline-none text-app-meta font-medium dark:text-white"
                                                value={church.logoUrl || ''}
                                                onChange={(e) => setChurch({ ...church, logoUrl: e.target.value })}
                                            />
                                            <label className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-app-micro font-semibold hover:bg-indigo-700 cursor-pointer transition-all active:scale-95 flex items-center shadow-lg whitespace-nowrap">
                                                <span>{t('upload')}</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'logoUrl')}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-app-micro text-gray-400 font-semibold transition-colors">{t('logo_hint', 'Format carré recommandé pour un meilleur affichage.')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-white/5 w-full"></div>

                            <div>
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('hero_image_label')}</label>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                placeholder={t('hero_image_placeholder')}
                                                className="flex-1 bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 p-4 rounded-xl focus:border-indigo-500 transition-all outline-none text-app-meta font-medium dark:text-white"
                                                value={church.heroImageUrl || ''}
                                                onChange={(e) => setChurch({ ...church, heroImageUrl: e.target.value })}
                                            />
                                            <label className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-app-micro font-semibold hover:bg-indigo-700 cursor-pointer transition-all active:scale-95 flex items-center shadow-lg">
                                                <span>{t('upload')}</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'heroImageUrl')}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-app-micro text-gray-400 font-semibold transition-colors">{t('hero_image_hint')}</p>
                                    </div>
                                    {church.heroImageUrl && (
                                        <div className="flex flex-col gap-4">
                                            <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-lg flex-shrink-0 group relative transition-colors">
                                                <img src={church.heroImageUrl.startsWith('http') ? church.heroImageUrl : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${church.heroImageUrl}`} alt="Hero Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-app-micro text-white font-semibold transition-colors">{t('current_preview')}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleImageRemove('heroImageUrl')}
                                                className="text-app-micro font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span>✕ {t('remove_image')}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-app-micro font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2.5 transition-colors">{t('mission_title_label')} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder={t('mission_title_placeholder')}
                                            className={`w-full p-4 bg-white dark:bg-black/20 border ${errors.missionTitle ? 'border-red-500' : 'border-gray-100 dark:border-white/10'} rounded-xl focus:border-indigo-500 transition-all outline-none text-app-meta font-semibold dark:text-white shadow-sm`}
                                            value={church.missionTitle || ''}
                                            onChange={(e) => {
                                                setChurch({ ...church, missionTitle: e.target.value });
                                                if (errors.missionTitle) setErrors({ ...errors, missionTitle: false });
                                            }}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('mission_desc_label')} <span className="text-red-500">*</span></label>
                                        <textarea
                                            rows="4"
                                            className={`w-full p-6 bg-white dark:bg-black/20 border ${errors.mission ? 'border-red-500' : 'border-gray-100 dark:border-white/10'} rounded-2xl focus:border-indigo-500 transition-all outline-none text-app-meta font-semibold dark:text-white shadow-sm leading-relaxed resize-none`}
                                            value={church.mission || ''}
                                            onChange={(e) => {
                                                setChurch({ ...church, mission: e.target.value });
                                                if (errors.mission) setErrors({ ...errors, mission: false });
                                            }}
                                        ></textarea>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-app-micro font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2 transition-colors">{t('mission_bg_image')}</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder={t('hero_image_placeholder')}
                                                className="flex-1 bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 p-4 rounded-xl focus:border-indigo-500 text-app-meta font-medium dark:text-white transition-all shadow-sm"
                                                value={church.missionImageUrl || ''}
                                                onChange={(e) => setChurch({ ...church, missionImageUrl: e.target.value })}
                                            />
                                            <label className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-4 py-4 rounded-2xl text-app-micro font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white cursor-pointer transition-all flex items-center shadow-sm">
                                                <span>{t('upload_short', 'UP')}</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'missionImageUrl')}
                                                />
                                            </label>
                                        </div>
                                        {church.missionImageUrl && (
                                            <div className="h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative group">
                                                <img src={church.missionImageUrl.startsWith('http') ? church.missionImageUrl : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${church.missionImageUrl}`} alt="Mission Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleImageRemove('missionImageUrl')}
                                                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-app-micro font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2.5 transition-colors">{t('vision_title_label')} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder={t('vision_title_placeholder')}
                                            className={`w-full p-4 bg-white dark:bg-black/20 border ${errors.visionTitle ? 'border-red-500' : 'border-gray-100 dark:border-white/10'} rounded-xl focus:border-indigo-500 transition-all outline-none text-app-meta font-semibold dark:text-white shadow-sm`}
                                            value={church.visionTitle || ''}
                                            onChange={(e) => {
                                                setChurch({ ...church, visionTitle: e.target.value });
                                                if (errors.visionTitle) setErrors({ ...errors, visionTitle: false });
                                            }}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('vision_desc_label')} <span className="text-red-500">*</span></label>
                                        <textarea
                                            rows="4"
                                            className={`w-full p-6 bg-white dark:bg-black/20 border ${errors.vision ? 'border-red-500' : 'border-gray-100 dark:border-white/10'} rounded-2xl focus:border-indigo-500 transition-all outline-none text-app-meta font-semibold dark:text-white shadow-sm leading-relaxed resize-none`}
                                            value={church.vision || ''}
                                            onChange={(e) => {
                                                setChurch({ ...church, vision: e.target.value });
                                                if (errors.vision) setErrors({ ...errors, vision: false });
                                            }}
                                        ></textarea>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-app-micro font-semibold text-gray-400 dark:text-gray-500 transition-colors mb-2">{t('vision_bg_image')}</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder={t('hero_image_placeholder')}
                                                className="flex-1 bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 p-4 rounded-xl focus:border-indigo-500 text-app-meta font-medium dark:text-white transition-all shadow-sm"
                                                value={church.visionImageUrl || ''}
                                                onChange={(e) => setChurch({ ...church, visionImageUrl: e.target.value })}
                                            />
                                            <label className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl text-app-micro font-semibold hover:bg-indigo-700 cursor-pointer transition-all flex items-center shadow-lg">
                                                <span>{t('upload')}</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'visionImageUrl')}
                                                />
                                            </label>
                                        </div>
                                        {church.visionImageUrl && (
                                            <div className="h-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative group">
                                                <img src={church.visionImageUrl.startsWith('http') ? church.visionImageUrl : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${church.visionImageUrl}`} alt="Vision Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleImageRemove('visionImageUrl')}
                                                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">{t('our_values')} <span className="text-red-500">*</span></label>
                                            <textarea
                                                rows="4"
                                                className={`w-full p-4 bg-white dark:bg-black/20 border ${errors.values ? 'border-red-500' : 'border-gray-100 dark:border-white/10'} rounded-xl focus:border-indigo-500 transition-all outline-none text-app-meta font-semibold dark:text-white shadow-sm resize-none leading-relaxed`}
                                                placeholder={t('values_placeholder')}
                                                value={church.values || ''}
                                                onChange={(e) => {
                                                    setChurch({ ...church, values: e.target.value });
                                                    if (errors.values) setErrors({ ...errors, values: false });
                                                }}
                                            ></textarea>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-app-micro font-semibold text-gray-400 dark:text-gray-500 transition-colors mb-2">{t('values_image')}</label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder={t('hero_image_placeholder')}
                                                    className="flex-1 bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 p-4 rounded-xl focus:border-indigo-500 text-app-meta font-medium dark:text-white transition-all shadow-sm"
                                                    value={church.valuesImageUrl || ''}
                                                    onChange={(e) => setChurch({ ...church, valuesImageUrl: e.target.value })}
                                                />
                                                <label className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl text-app-micro font-semibold hover:bg-indigo-700 cursor-pointer transition-all flex items-center shadow-lg">
                                                    <span>{t('upload')}</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, 'valuesImageUrl')}
                                                    />
                                                </label>
                                            </div>
                                            {church.valuesImageUrl && (
                                                <div className="h-24 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm relative group transition-colors">
                                                    <img src={church.valuesImageUrl.startsWith('http') ? church.valuesImageUrl : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${church.valuesImageUrl}`} alt="Values Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImageRemove('valuesImageUrl')}
                                                        className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-center bg-indigo-50/30 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-white/5 transition-colors">
                                            <div className="text-3xl mb-4">💎</div>
                                            <h4 className="text-app-meta font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-tight mb-2">{t('design_tip')}</h4>
                                            <p className="text-app-micro text-indigo-700/70 dark:text-indigo-500 font-semibold leading-relaxed">
                                                {t('values_image_tip')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection
                        id="pastoral"
                        title={t('pastoral_team')}
                        icon="👥"
                        description={t('leadership_members')}
                        isOpen={openSections.pastoral}
                        onToggle={() => toggleSection('pastoral')}
                    >
                        <JsonField
                            label={t('pastoral_team')}
                            description={t('pastoral_team_json_desc')}
                            value={church.pastoralTeam}
                            onChange={(val) => setChurch({ ...church, pastoralTeam: val })}
                        />
                    </AccordionSection>

                    <AccordionSection
                        id="schedules"
                        title={t('service_schedules')}
                        icon="⏰"
                        description={t('weekly_appointments')}
                        isOpen={openSections.schedules}
                        onToggle={() => toggleSection('schedules')}
                    >
                        <JsonField
                            label={t('service_schedules')}
                            description={t('schedules_json_desc')}
                            value={church.schedules}
                            onChange={(val) => setChurch({ ...church, schedules: val })}
                        />
                    </AccordionSection>

                    <AccordionSection
                        id="social"
                        title={t('social_links_and_links')}
                        icon="🌐"
                        description={t('online_presence_live')}
                        isOpen={openSections.social}
                        onToggle={() => toggleSection('social')}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                            <div className="group">
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">Facebook</label>
                                <div className="flex items-center bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl focus-within:border-blue-500 transition-all shadow-sm">
                                    <span className="pl-4 text-blue-500 font-bold text-app-micro opacity-50">/</span>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                        value={church.socialLinks?.facebook || ''}
                                        onChange={(e) => setChurch({ ...church, socialLinks: { ...church.socialLinks, facebook: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">YouTube</label>
                                <div className="flex items-center bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl focus-within:border-red-500 transition-all shadow-sm">
                                    <span className="pl-4 text-red-500 font-bold text-app-micro opacity-50">/</span>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                        value={church.socialLinks?.youtube || ''}
                                        onChange={(e) => setChurch({ ...church, socialLinks: { ...church.socialLinks, youtube: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">Instagram</label>
                                <div className="flex items-center bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl focus-within:border-pink-500 transition-all shadow-sm">
                                    <span className="pl-4 text-pink-500 font-bold text-app-micro opacity-50">/</span>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                        value={church.socialLinks?.instagram || ''}
                                        onChange={(e) => setChurch({ ...church, socialLinks: { ...church.socialLinks, instagram: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-app-micro font-semibold text-gray-500 dark:text-gray-400 transition-colors mb-2.5">WhatsApp</label>
                                <div className="flex items-center bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-2xl focus-within:border-green-500 transition-all shadow-sm">
                                    <span className="pl-4 text-green-500 font-bold text-app-micro opacity-50">+</span>
                                    <input
                                        type="text"
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                        value={church.socialLinks?.whatsapp || ''}
                                        onChange={(e) => setChurch({ ...church, socialLinks: { ...church.socialLinks, whatsapp: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="group md:col-span-1">
                                <label className="block text-app-micro font-semibold text-indigo-400 transition-colors mb-2.5 group-focus-within:text-indigo-600 transition-colors">{t('platform_name') || 'Nom de la Plateforme (Ex: YouTube, Facebook)'}</label>
                                <div className="flex items-center bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-white/5 rounded-2xl focus-within:border-indigo-500 transition-all shadow-sm">
                                    <span className="pl-4 text-indigo-500 font-bold text-app-micro opacity-50">📱</span>
                                    <input
                                        type="text"
                                        placeholder={t('platform_name_placeholder')}
                                        className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                        value={church.socialLinks?.liveServicePlatform || ''}
                                        onChange={(e) => setChurch({ ...church, socialLinks: { ...church.socialLinks, liveServicePlatform: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="group md:col-span-2">
                                <label className="block text-app-micro font-black text-indigo-400 uppercase tracking-widest mb-2.5 group-focus-within:text-indigo-600 transition-colors">{t('live_service_link_label')}</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-white/5 rounded-2xl focus-within:border-indigo-500 transition-all shadow-sm overflow-hidden">
                                        <span className="pl-4 text-indigo-500 font-bold text-app-micro opacity-50">🔗</span>
                                        <input
                                            type="text"
                                            placeholder={t('url_placeholder')}
                                            className="w-full p-4 bg-transparent outline-none text-app-meta font-semibold dark:text-white"
                                            value={church.socialLinks?.liveServiceUrl || ''}
                                            onChange={(e) => setChurch({ ...church, socialLinks: { ...church.socialLinks, liveServiceUrl: e.target.value } })}
                                        />
                                        {church.socialLinks?.liveServiceUrl && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(church.socialLinks.liveServiceUrl);
                                                    setAlert({ show: true, message: t('link_copied'), type: 'success' });
                                                }}
                                                className="pr-4 text-indigo-500 hover:text-indigo-700 font-bold text-app-micro transition-colors"
                                                title={t('copy')}
                                            >
                                                {t('copy')}
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const text = await navigator.clipboard.readText();
                                                if (text) {
                                                    setChurch({ ...church, socialLinks: { ...church.socialLinks, liveServiceUrl: text } });
                                                    setAlert({ show: true, message: t('link_pasted'), type: 'success' });
                                                }
                                            } catch (err) {
                                                setAlert({ show: true, message: t('paste_error'), type: 'error' });
                                            }
                                        }}
                                        className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4 rounded-2xl text-app-micro font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm"
                                    >
                                        {t('paste')}
                                    </button>
                                </div>
                                <p className="mt-2 text-app-micro text-gray-400 font-medium italic">{t('live_link_hint')}</p>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection
                        id="activities"
                        title={t('recent_activities')}
                        icon="📢"
                        description={t('public_site_news')}
                        isOpen={openSections.activities}
                        onToggle={() => toggleSection('activities')}
                    >
                        <JsonField
                            label={t('recent_activities')}
                            description={t('activities_json_desc')}
                            value={church.recentActivities}
                            onChange={(val) => setChurch({ ...church, recentActivities: val })}
                        />
                    </AccordionSection>

                    <AccordionSection
                        id="contact"
                        title={t('contact_location')}
                        icon="📍"
                        description={t('coords_physical_address')}
                        isOpen={openSections.contact}
                        onToggle={() => toggleSection('contact')}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                            <div className="md:col-span-2">
                                <label className="block text-app-micro font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2.5">{t('full_address')} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder={t('address_placeholder_miracles')}
                                    className={`w-full p-4 bg-white dark:bg-black/20 border ${errors.address ? 'border-red-500' : 'border-gray-50 dark:border-white/10'} rounded-2xl focus:border-indigo-500 transition-all outline-none text-app-meta font-semibold dark:text-white shadow-sm`}
                                    value={church.address || ''}
                                    onChange={(e) => {
                                        setChurch({ ...church, address: e.target.value });
                                        if (errors.address) setErrors({ ...errors, address: false });
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-app-micro font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2.5">{t('city')} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder={t('city_placeholder_pap')}
                                    className={`w-full p-4 bg-white dark:bg-black/20 border ${errors.city ? 'border-red-500' : 'border-gray-50 dark:border-white/10'} rounded-2xl focus:border-indigo-500 transition-all outline-none text-app-meta font-semibold dark:text-white shadow-sm`}
                                    value={church.city || ''}
                                    onChange={(e) => {
                                        setChurch({ ...church, city: e.target.value });
                                        if (errors.city) setErrors({ ...errors, city: false });
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-app-micro font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2.5">{t('contact_email')}</label>
                                <input
                                    type="email"
                                    className="w-full bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 p-4 rounded-2xl focus:border-indigo-500 text-app-meta font-semibold dark:text-white"
                                    value={church.contactEmail || ''}
                                    onChange={(e) => setChurch({ ...church, contactEmail: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-app-micro font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-2.5">{t('phone')}</label>
                                <input
                                    type="text"
                                    className="w-full bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 p-4 rounded-2xl focus:border-indigo-500 text-app-meta font-semibold dark:text-white"
                                    value={church.contactPhone || ''}
                                    onChange={(e) => setChurch({ ...church, contactPhone: e.target.value })}
                                />
                            </div>
                        </div>
                    </AccordionSection>

                    <div className="mt-10 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl text-app-micro font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:bg-gray-200 dark:disabled:bg-white/5"
                        >
                            {saving ? t('saving') : t('save_section')}
                        </button>
                    </div>
                </MasterAccordion>


                {/* MASTER MODULE 2: FINANCES */}
                <MasterAccordion
                    id="finances"
                    title={t('finance_settings')}
                    subtitle={t('currencies_donations_accounting')}
                    icon="💰"
                    color="bg-green-600 text-white"
                    isOpen={openMasterSections.finances}
                    onToggle={() => toggleMasterSection('finances')}
                >
                    <AccordionSection
                        id="currencies"
                        title={t('currencies_and_money')}
                        icon="💱"
                        description={t('accepted_currencies_management')}
                        isOpen={openSections.currencies}
                        onToggle={() => toggleSection('currencies')}
                    >
                        <div className="mt-2 space-y-6">
                            <div className="flex flex-wrap gap-3">
                                {church.supportedCurrencies?.map((curr, idx) => (
                                    <div key={idx} className="group relative flex items-center bg-white py-3 pl-5 pr-3 rounded-2xl border-2 border-gray-50 shadow-sm hover:border-indigo-200 transition-all">
                                        <span className="text-gray-900 dark:text-white font-black text-app-meta tracking-widest transition-colors">{curr}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (curr === 'HTG' || curr === 'USD') {
                                                    setAlert({ show: true, message: t('mandatory_currencies_error'), type: 'error' });
                                                    return;
                                                }
                                                const balance = donationStats[curr]?.total || 0;
                                                if (balance > 0) {
                                                    setAlert({ show: true, message: `${t('cannot_delete_currency_balance')} (${balance}).`, type: 'error' });
                                                    return;
                                                }
                                                setChurch({ ...church, supportedCurrencies: church.supportedCurrencies.filter((_, i) => i !== idx) });
                                            }}
                                            className="ml-4 w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all active:scale-95"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50/50 dark:bg-white/5 p-6 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-white/10 transition-colors">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            id="newCurrency"
                                            placeholder={t('currency_code_placeholder')}
                                            className="w-full bg-white dark:bg-black/20 border-2 border-transparent p-4 rounded-2xl focus:border-green-500 outline-none text-app-meta font-black tracking-[0.2em] uppercase placeholder:font-medium placeholder:tracking-normal dark:text-white shadow-sm transition-all"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('newCurrency');
                                            const val = input.value.toUpperCase().trim();
                                            if (val && !church.supportedCurrencies.includes(val)) {
                                                setChurch({ ...church, supportedCurrencies: [...church.supportedCurrencies, val] });
                                                input.value = '';
                                            }
                                        }}
                                        className="bg-green-600 text-white px-10 py-4 rounded-2xl text-app-micro font-black uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-200 dark:shadow-none active:scale-95 transition-all"
                                    >
                                        {t('add_currency')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection
                        id="donationTypes"
                        title={t('donation_types_settings')}
                        icon="🎁"
                        description={t('custom_categories')}
                        isOpen={openSections.donationTypes}
                        onToggle={() => toggleSection('donationTypes')}
                    >
                        <div className="mt-2 space-y-6">
                            <div className="flex flex-wrap gap-3">
                                {church.donationTypes?.map((typ, idx) => {
                                    const isMandatory = ['offrande', 'dime', 'don_special', 'promesse'].includes(typ.toLowerCase());
                                    return (
                                        <div key={idx} className={`flex items-center py-3 pl-5 pr-3 rounded-2xl border transition-all ${isMandatory ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 opacity-60' : 'bg-white dark:bg-green-900/20 border-green-50 dark:border-green-900/30 hover:border-green-200 shadow-sm'}`}>
                                            <span className={`text-app-micro font-black uppercase tracking-widest ${isMandatory ? 'text-gray-400' : 'text-green-700 dark:text-green-400'}`}>{typ}</span>
                                            {!isMandatory && (
                                                <button
                                                    type="button"
                                                    onClick={() => setChurch({ ...church, donationTypes: church.donationTypes.filter((_, i) => i !== idx) })}
                                                    className="ml-4 w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="bg-green-50/30 p-6 rounded-[2rem] border-2 border-dashed border-green-100">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input
                                        type="text"
                                        id="newDonationType"
                                        placeholder={t('donation_category_placeholder')}
                                        className="flex-1 bg-white dark:bg-black/20 border-2 border-transparent p-4 rounded-2xl focus:border-green-500 outline-none text-app-meta font-medium dark:text-white shadow-sm transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('newDonationType');
                                            const val = input.value.trim();
                                            if (val && !church.donationTypes.some(t => t.toLowerCase() === val.toLowerCase())) {
                                                setChurch({ ...church, donationTypes: [...church.donationTypes, val] });
                                                input.value = '';
                                            }
                                        }}
                                        className="bg-green-600 text-white px-10 py-4 rounded-2xl text-app-micro font-black uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-100 dark:shadow-none active:scale-95 transition-all"
                                    >
                                        {t('new_type')}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </AccordionSection>

                    <AccordionSection
                        id="paymentMethods"
                        title={t('payment_methods_settings')}
                        icon="💳"
                        description={t('accepted_payment_methods')}
                        isOpen={openSections.paymentMethods}
                        onToggle={() => toggleSection('paymentMethods')}
                    >
                        <div className="mt-2 space-y-6">
                            <div className="flex flex-wrap gap-3">
                                {church.paymentMethods?.map((typ, idx) => {
                                    const isMandatory = ['CASH', 'VIREMENT', 'CHEQUE', 'CARTE DE CREDIT'].includes(typ.toUpperCase());
                                    return (
                                        <div key={idx} className={`flex items-center py-3 pl-5 pr-3 rounded-2xl border transition-all ${isMandatory ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 opacity-60' : 'bg-white dark:bg-blue-900/20 border-blue-50 dark:border-blue-900/30 hover:border-blue-200 shadow-sm'}`}>
                                            <span className={`text-app-micro font-black uppercase tracking-widest ${isMandatory ? 'text-gray-400' : 'text-blue-700 dark:text-blue-400'}`}>{typ}</span>
                                            {!isMandatory && (
                                                <button
                                                    type="button"
                                                    onClick={() => setChurch({ ...church, paymentMethods: church.paymentMethods.filter((_, i) => i !== idx) })}
                                                    className="ml-4 w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="bg-blue-50/30 p-6 rounded-[2rem] border-2 border-dashed border-blue-100">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input
                                        type="text"
                                        id="newPaymentMethod"
                                        placeholder={t('payment_method_placeholder')}
                                        className="flex-1 bg-white dark:bg-black/20 border-2 border-transparent p-4 rounded-2xl focus:border-blue-500 outline-none text-app-meta font-medium dark:text-white shadow-sm transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('newPaymentMethod');
                                            const val = input.value.trim();
                                            if (val && !church.paymentMethods.some(t => t.toLowerCase() === val.toLowerCase())) {
                                                setChurch({ ...church, paymentMethods: [...church.paymentMethods, val] });
                                                input.value = '';
                                            }
                                        }}
                                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-app-micro font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 dark:shadow-none active:scale-95 transition-all"
                                    >
                                        {t('new_method')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </AccordionSection>

                    <div className="mt-10 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl text-app-micro font-black uppercase tracking-widest shadow-lg shadow-green-100 dark:shadow-none transition-all active:scale-95 disabled:bg-gray-200 dark:disabled:bg-white/5"
                        >
                            {saving ? t('saving') : t('save_section')}
                        </button>
                    </div>
                </MasterAccordion>

                {/* USERS & ROLES */}
                <MasterAccordion
                    id="users"
                    title={t('users_roles_management')}
                    description={t('roles_permissions_desc')}
                    icon="🔐"
                    color="bg-orange-600 text-white"
                    isOpen={openMasterSections.users}
                    onToggle={() => toggleMasterSection('users')}
                >
                    <div className="space-y-8 py-6">
                        {/* List Existing Roles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {roles.map((role) => (
                                <div key={role.id} className="bg-white p-6 rounded-3xl border-2 border-orange-50 hover:border-orange-200 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-black text-gray-900 dark:text-white italic tracking-tight transition-colors">{role.name}</h4>
                                            <p className="text-app-micro text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">
                                                {role.permissions?.length || 0} {t('permissions_granted')}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteRole(role.id)}
                                            className="w-8 h-8 rounded-xl bg-orange-50 text-orange-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions?.map(p => (
                                            <span key={p} className="text-app-micro font-black uppercase tracking-tighter bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full border border-orange-100/50 dark:border-orange-900/30 transition-colors">
                                                {availablePermissions.find(ap => ap.id === p)?.name || p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => setIsAddingRole(true)}
                                className="border-4 border-dashed border-orange-100 dark:border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center text-orange-300 dark:text-orange-900/40 hover:border-orange-300 dark:hover:border-orange-800 hover:text-orange-500 dark:hover:text-orange-700 transition-all group"
                            >
                                <span className="text-4xl mb-2 group-hover:scale-125 transition-transform">➕</span>
                                <span className="text-app-micro font-black uppercase tracking-[0.2em]">{t('new_role')}</span>
                            </button>
                        </div>

                        {/* Add Role Modal/Form */}
                        {isAddingRole && (
                            <div className="bg-orange-50/50 border-2 border-orange-100 p-10 rounded-[2.5rem] relative animate-in fade-in slide-in-from-bottom-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingRole(false)}
                                    className="absolute top-8 right-8 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>

                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 italic uppercase tracking-tighter transition-colors">{t('create_role')}</h3>

                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-app-micro font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-4 transition-colors">{t('role_name_label')}</label>
                                        <input
                                            type="text"
                                            value={newRole.name}
                                            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                            className="w-full bg-white dark:bg-black/20 border-2 border-orange-100 dark:border-white/10 p-5 rounded-2xl focus:border-orange-400 outline-none font-black text-gray-900 dark:text-white transition-all shadow-sm"
                                            placeholder={t('role_name_placeholder')}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-app-micro font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-6 transition-colors">{t('permissions_access')}</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {availablePermissions.map((perm) => (
                                                <button
                                                    key={perm.id}
                                                    type="button"
                                                    onClick={() => togglePermission(perm.id)}
                                                    className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${newRole.permissions.includes(perm.id)
                                                        ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200 dark:shadow-none'
                                                        : 'bg-white dark:bg-black/20 border-orange-50 dark:border-white/5 text-gray-500 hover:border-orange-200'
                                                        }`}
                                                >
                                                    <span className="text-xl">{perm.icon}</span>
                                                    <span className="text-app-micro font-black uppercase tracking-widest text-left leading-tight">{perm.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="button"
                                            onClick={handleCreateRole}
                                            className="w-full md:w-auto bg-gray-900 dark:bg-indigo-600 text-white px-12 py-5 rounded-2xl text-app-micro font-black uppercase tracking-[0.3em] hover:bg-black dark:hover:bg-indigo-700 transition-all shadow-2xl active:scale-95"
                                        >
                                            {t('save_role')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </MasterAccordion>

                {/* CONTACT CLASSIFICATION */}
                <MasterAccordion
                    id="contacts"
                    title={t('contact_classification')}
                    subtitle={t('custom_types_subtypes')}
                    icon="🏷️"
                    color="bg-purple-600 text-white"
                    isOpen={openMasterSections.contacts}
                    onToggle={() => toggleMasterSection('contacts')}
                >
                    <div className="space-y-10 py-4">
                        {/* Manage Types */}
                        <div className="bg-purple-50/30 dark:bg-purple-900/10 p-8 rounded-[2.5rem] border border-purple-100 dark:border-purple-900/30 transition-colors">
                            <h3 className="text-app-meta font-black text-purple-900 dark:text-purple-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 bg-white dark:bg-black/20 rounded-xl flex items-center justify-center shadow-sm dark:text-white transition-colors">1</span>
                                {t('global_types')}
                            </h3>
                            <div className="flex flex-wrap gap-3 mb-8">
                                {contactTypes.map(type => (
                                    <div key={type.id} className={`flex items-center bg-white dark:bg-black/20 border transition-all rounded-2xl shadow-sm ${type.isSystem ? 'opacity-60 grayscale-[0.5] border-gray-100 dark:border-white/5' : 'border-purple-50 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-800'}`}>
                                        <span className="text-app-micro font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 px-5 transition-colors">{type.name}</span>
                                        {!type.isSystem && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteContactType(type.id)}
                                                className="ml-0 w-7 h-7 mr-3 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder={t('new_type_placeholder')}
                                    className="flex-1 bg-white dark:bg-black/20 border-2 border-transparent p-4 rounded-2xl focus:border-purple-500 outline-none text-app-meta font-medium dark:text-white transition-all shadow-sm"
                                    value={newContactType}
                                    onChange={(e) => setNewContactType(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddContactType}
                                    className="bg-purple-600 text-white px-8 py-4 rounded-2xl text-app-micro font-black uppercase tracking-widest hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-100 dark:shadow-none"
                                >
                                    {t('add')}
                                </button>
                            </div>
                        </div>

                        {/* Manage Sub-types */}
                        <div className="bg-white dark:bg-black/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 transition-colors">
                            <h3 className="text-app-meta font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center shadow-sm dark:text-gray-400 transition-colors">2</span>
                                {t('contact_subtypes')}
                            </h3>

                            <div className="space-y-6">
                                {contactTypes.map(type => (
                                    <div key={type.id} className="border-l-4 border-purple-200 pl-6 pb-2">
                                        <h4 className="text-app-micro font-black text-purple-400 uppercase tracking-[0.2em] mb-4 bg-purple-50/50 inline-block px-3 py-1 rounded-full">
                                            {type.name}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {contactSubtypes.filter(s => s.contactTypeId === type.id).map(subtype => (
                                                <div key={subtype.id} className="group flex items-center bg-gray-50 dark:bg-white/5 py-2 pl-4 pr-2 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-black hover:border-purple-100 dark:hover:border-purple-900/30 transition-all">
                                                    <span className="text-app-micro font-bold text-gray-600 dark:text-gray-400 group-hover:text-purple-600 transition-colors">{subtype.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteContactSubtype(subtype.id)}
                                                        className="ml-3 w-5 h-5 rounded-md text-gray-300 hover:text-red-500 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            {contactSubtypes.filter(s => s.contactTypeId === type.id).length === 0 && (
                                                <span className="text-app-micro text-gray-300 dark:text-gray-600 italic font-medium transition-colors">{t('no_subtypes_defined')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 p-6 bg-gray-50/50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-100 dark:border-white/10 transition-colors">
                                <p className="text-app-micro font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 transition-colors">{t('add_subtype')}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select
                                        className="bg-white dark:bg-black/20 border-2 border-transparent p-4 rounded-2xl focus:border-purple-500 outline-none text-app-meta font-semibold text-gray-700 dark:text-gray-300 transition-all"
                                        value={newContactSubtype.contactTypeId}
                                        onChange={(e) => setNewContactSubtype({ ...newContactSubtype, contactTypeId: e.target.value })}
                                    >
                                        <option value="">{t('select_type_placeholder')}</option>
                                        {contactTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={t('subtype_name_placeholder')}
                                            className="flex-1 bg-white dark:bg-black/20 border-2 border-transparent p-4 rounded-2xl focus:border-purple-500 outline-none text-app-meta font-medium dark:text-white transition-all shadow-sm"
                                            value={newContactSubtype.name}
                                            onChange={(e) => setNewContactSubtype({ ...newContactSubtype, name: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddContactSubtype}
                                            className="bg-gray-900 dark:bg-indigo-600 text-white px-6 py-4 rounded-2xl text-app-micro font-black uppercase tracking-widest hover:bg-black dark:hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-gray-200 dark:shadow-none"
                                        >
                                            {t('ok')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </MasterAccordion>

                {/* EVENT TYPES */}
                <MasterAccordion
                    id="eventTypes"
                    title={t('event_activity_types', 'Types d\'Événements & Activités')}
                    subtitle={t('manage_custom_event_types', 'Gérer les types personnalisés')}
                    icon="📅"
                    color="bg-indigo-600 text-white"
                    isOpen={openMasterSections.eventTypes}
                    onToggle={() => toggleMasterSection('eventTypes')}
                >
                    <div className="space-y-6 py-4">
                        <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
                            <h3 className="text-app-meta font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-6">{t('available_types', 'Types disponibles')}</h3>
                            <div className="flex flex-wrap gap-3 mb-8">
                                {eventTypes.map(type => (
                                    <div key={type.id} className="flex items-center bg-white dark:bg-black/20 border border-indigo-50 dark:border-white/10 rounded-2xl shadow-sm px-4 py-2">
                                        <span className="text-app-micro font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 mr-3">{type.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteEventType(type.id)}
                                            className="w-6 h-6 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder={t('new_event_type_placeholder', 'Nouveau type (ex: Retraite)')}
                                    className="flex-1 bg-white dark:bg-black/20 border-2 border-transparent p-4 rounded-2xl focus:border-indigo-500 outline-none text-app-meta font-medium dark:text-white transition-all shadow-sm"
                                    value={newEventType}
                                    onChange={(e) => setNewEventType(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddEventType}
                                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-app-micro font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
                                >
                                    {t('add')}
                                </button>
                            </div>
                        </div>
                    </div>
                </MasterAccordion>


                {/* STICKY SAVE BAR */}
                <div className="sticky bottom-10 left-0 right-0 z-50 flex justify-center px-4">
                    <div className="bg-gray-900/95 dark:bg-black/95 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2 group transition-all">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex items-center gap-4 px-12 py-5 rounded-xl font-semibold text-app-meta transition-all relative overflow-hidden ${saving ? 'bg-indigo-600 cursor-not-allowed opacity-80' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}
                        >
                            <span className="relative z-10">{saving ? t('saving') : t('save_all_settings')}</span>
                            {!saving && (
                                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white transition-transform group-hover:scale-110">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </button>
                    </div>
                    <p className="text-app-micro text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest animate-pulse transition-colors">{t('success')} ⚡</p>
                </div>

            </form>

            <AlertModal
                isOpen={alert.show}
                onClose={() => {
                    setAlert({ ...alert, show: false });
                    if (alert.onClose) alert.onClose();
                }}
                title={alert.type === 'success' ? t('success') : t('warning')}
                message={alert.message}
                type={alert.type}
            />

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
            `}</style>
        </div >
    );
}

const MasterAccordion = ({ id, title, subtitle, icon, color, children, isOpen, onToggle }) => (
    <div className={`mb-10 bg-white dark:bg-[#1A1A1A] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 transition-all duration-300 ${isOpen ? 'shadow-xl' : 'shadow-sm'}`}>
        <button
            type="button"
            onClick={onToggle}
            className={`w-full flex items-center justify-between p-8 text-left transition-colors ${isOpen ? 'bg-gray-50/50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
            <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-sm transform transition-all duration-300 ${isOpen ? 'scale-105' : ''} ${color}`}>
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight transition-colors">{title}</h2>
                    <p className="text-app-micro font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 opacity-70 transition-colors uppercase">{subtitle}</p>
                </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-indigo-600 text-white rotate-180' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg>
            </div>
        </button>
        <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[8000px] opacity-100 border-t border-gray-50 dark:border-white/5' : 'max-h-0 opacity-0'} overflow-hidden`}>
            <div className="p-8 space-y-6">
                {children}
            </div>
        </div>
    </div>
);

const AccordionSection = ({ id, title, icon, description, children, isOpen, onToggle }) => (
    <div className={`border border-gray-50 dark:border-white/5 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-white/5 transition-all duration-300 ${isOpen ? 'shadow-md bg-white dark:bg-black/20' : 'hover:bg-gray-100/50 dark:hover:bg-white/10'}`}>
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-center justify-between p-5 bg-transparent text-left"
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-gray-100 dark:bg-white/5 text-gray-400 opacity-60'}`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`font-black text-app-micro uppercase tracking-widest transition-colors ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{title}</h3>
                    {description && <p className="text-app-micro text-gray-400 dark:text-gray-600 uppercase tracking-widest font-black mt-1 opacity-60">{description}</p>}
                </div>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-gray-300 grayscale'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" /></svg>
            </div>
        </button>
        <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
            <div className="p-6 pt-0">
                <div className="h-px w-full bg-gray-50 dark:bg-white/5 mb-6"></div>
                {children}
            </div>
        </div>
    </div>
);

const JsonField = ({ label, description, value, onChange }) => {
    const [localValue, setLocalValue] = useState(JSON.stringify(value, null, 2));

    useEffect(() => {
        setLocalValue(JSON.stringify(value, null, 2));
    }, [value]);

    const handleLocalChange = (e) => {
        const newVal = e.target.value;
        setLocalValue(newVal);
        try {
            const parsed = JSON.parse(newVal);
            onChange(parsed);
        } catch (err) {
            // Keep editing local string even if invalid
        }
    };

    return (
        <div className="mt-2 space-y-4">
            <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-2xl flex items-start gap-3">
                <span className="text-xl">💡</span>
                <p className="text-app-micro font-bold text-indigo-700 leading-relaxed uppercase tracking-tighter">
                    {description}
                </p>
            </div>
            <textarea
                rows="6"
                className="w-full bg-gray-900 text-indigo-300 p-6 rounded-3xl font-mono text-app-micro focus:ring-4 focus:ring-indigo-100 outline-none shadow-2xl leading-relaxed"
                value={localValue}
                onChange={handleLocalChange}
            ></textarea>
        </div>
    );
};
