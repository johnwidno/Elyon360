import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';

const MemberForm = ({ isOpen, onClose, onSuccess, editId = null, initialData = null, roles = [], subtypes = [], memberCategories = [] }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: ['member'],
        subtypeId: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        gender: '',
        birthDate: '',
        maritalStatus: '',
        photo: '',
        status: 'Actif',
        nifCin: '',
        birthPlace: '',
        nickname: '',
        joinDate: '',
        notes: '',
        workAddress: '',
        workEmail: '',
        workPhone: '',
        emergencyContact: '',
        facebookUrl: '',
        linkedinUrl: '',
        spouseName: '',
        spouseId: null,
        memberCategoryId: '',
        baptismalStatus: 'not_baptized'
    });
    const [photoMode, setPhotoMode] = useState('url'); // 'url' or 'file'
    const [spouseSearch, setSpouseSearch] = useState('');
    const [spouseResults, setSpouseResults] = useState([]);
    const [showSpouseDropdown, setShowSpouseDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editId && initialData) {
            setFormData({
                ...initialData,
                password: '', // Don't fill password on edit
                role: Array.isArray(initialData.role) ? initialData.role : [initialData.role],
                spouseId: initialData.spouseId || null
            });
            if (initialData.photo) setPhotoMode('url');
        } else if (!editId) {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: ['member'],
                subtypeId: '',
                phone: '',
                address: '',
                city: '',
                country: '',
                gender: '',
                birthDate: '',
                maritalStatus: '',
                photo: '',
                status: 'Actif',
                nifCin: '',
                birthPlace: '',
                nickname: '',
                joinDate: '',
                notes: '',
                workAddress: '',
                workEmail: '',
                workPhone: '',
                emergencyContact: '',
                facebookUrl: '',
                linkedinUrl: '',
                spouseName: '',
                spouseId: null,
                memberCategoryId: '',
                baptismalStatus: 'not_baptized'
            });
        }
    }, [editId, initialData, isOpen]);

    // Spouse Search Effect
    useEffect(() => {
        if (spouseSearch.length > 2 && showSpouseDropdown) {
            const delaySearch = setTimeout(async () => {
                try {
                    const res = await api.get('/members');
                    const filtered = res.data.filter(m =>
                        (m.firstName.toLowerCase().includes(spouseSearch.toLowerCase()) ||
                            m.lastName.toLowerCase().includes(spouseSearch.toLowerCase())) &&
                        m.id !== editId // Exclude self if editing
                    );
                    setSpouseResults(filtered.slice(0, 5));
                } catch (error) {
                    console.error("Spouse search error:", error);
                }
            }, 300);
            return () => clearTimeout(delaySearch);
        } else {
            setSpouseResults([]);
        }
    }, [spouseSearch, showSpouseDropdown, editId]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (roleName) => {
        setFormData(prev => {
            const currentRoles = [...prev.role];
            const index = currentRoles.indexOf(roleName);
            if (index > -1) {
                if (currentRoles.length > 1) currentRoles.splice(index, 1);
            } else {
                currentRoles.push(roleName);
            }
            return { ...prev, role: currentRoles };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editId) {
                await api.put(`/members/${editId}`, formData);
            } else {
                await api.post('/members', formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving member:", error);
            alert(error.response?.data?.message || t('error_saving', "Erreur lors de l'enregistrement"));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter out SuperAdmin from roles
    const availableRoles = ['Admin', 'Staff', 'Member'];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/90 backdrop-blur-xl transition-all">
            <div className="bg-white dark:bg-[#0D0D0D] rounded-[3.5rem] w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col animate-scale-in border border-transparent dark:border-white/5 transition-colors">
                <div className="flex justify-between items-center px-12 py-10 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0D0D0D] shrink-0 transition-colors">
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none transition-colors">
                            {editId ? t('edit_member', 'Modifier le membre') : t('new_member', 'Nouveau membre')}
                        </h2>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2 transition-colors">
                            {t('fill_info_desc', 'Remplissez les informations ci-dessous')}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-black flex items-center justify-center text-gray-400 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 border border-transparent dark:border-white/5 transition-all font-bold active:scale-95 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 noscrollbar transition-colors bg-white dark:bg-[#0D0D0D]">
                    <form id="memberForm" onSubmit={handleSubmit} className="space-y-16 transition-colors">
                        <section>
                            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight mb-10 border-b border-gray-50 dark:border-white/5 pb-5 transition-colors">
                                {t('identity_personnel', 'Identité & Personnel')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 transition-colors">
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('first_name')} <span className="text-red-500">*</span></label>
                                    <input name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder={t('first_name_placeholder', "Ex: Jean")} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('last_name')} <span className="text-red-500">*</span></label>
                                    <input name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder={t('last_name_placeholder', "Ex: Dupont")} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('gender_label', 'Sexe')}</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white cursor-pointer appearance-none">
                                        <option value="">{t('select')}</option>
                                        <option value="M">{t('masculine', 'Masculin')}</option>
                                        <option value="F">{t('feminine', 'Féminin')}</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('birth_date')}</label>
                                    <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white [color-scheme:dark]" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('marital_status_label', 'État Civil')}</label>
                                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white cursor-pointer appearance-none">
                                        <option value="">{t('select')}</option>
                                        <option value="Célibataire">{t('single', 'Célibataire')}</option>
                                        <option value="Marié(e)">{t('married', 'Marié(e)')}</option>
                                        <option value="Divorcé(e)">{t('divorced', 'Divorcé(e)')}</option>
                                        <option value="Veuf/Veuve">{t('widowed', 'Veuf/Veuve')}</option>
                                    </select>
                                </div>
                                {(formData.maritalStatus === 'Marié(e)' || formData.maritalStatus === 'Marié') && (
                                    <div className="space-y-4 relative">
                                        <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('spouse_name', 'Nom du Conjoint(e)')}</label>
                                        <div className="relative">
                                            <input
                                                name="spouseName"
                                                value={formData.spouseName || ''}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, spouseName: e.target.value, spouseId: null });
                                                    setSpouseSearch(e.target.value);
                                                    setShowSpouseDropdown(true);
                                                }}
                                                onFocus={() => {
                                                    setSpouseSearch(formData.spouseName || '');
                                                    setShowSpouseDropdown(true);
                                                }}
                                                className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800"
                                                placeholder={t('spouse_placeholder', "Rechercher un membre ou entrer un nom")}
                                                autoComplete="off"
                                            />
                                            {formData.spouseId && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-xs font-bold px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                    Linked
                                                </div>
                                            )}
                                        </div>

                                        {/* Spouse Dropdown */}
                                        {showSpouseDropdown && spouseResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/5 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                                                {spouseResults.map(person => (
                                                    <div
                                                        key={person.id}
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                spouseName: `${person.firstName} ${person.lastName}`,
                                                                spouseId: person.id
                                                            });
                                                            setShowSpouseDropdown(false);
                                                            setSpouseResults([]);
                                                        }}
                                                        className="px-6 py-3 hover:bg-indigo-50 dark:hover:bg-white/5 cursor-pointer flex items-center justify-between group"
                                                    >
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 transition-colors">
                                                            {person.firstName} {person.lastName}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">
                                                            Membre
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Overlay to close dropdown */}
                                        {showSpouseDropdown && (
                                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowSpouseDropdown(false)} />
                                        )}
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 flex justify-between transition-colors">
                                        <span>{t('photo')}</span>
                                        <button type="button" onClick={() => setPhotoMode(photoMode === 'url' ? 'file' : 'url')} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
                                            {photoMode === 'url' ? t('upload_file', 'Uploader') : t('use_url', 'Utiliser URL')}
                                        </button>
                                    </label>
                                    {photoMode === 'url' ? (
                                        <input name="photo" value={formData.photo} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="https://..." />
                                    ) : (
                                        <div className="flex items-center gap-5 transition-colors">
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="photo-upload" />
                                            <label htmlFor="photo-upload" className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-dashed border-gray-100 dark:border-white/5 hover:border-indigo-500 rounded-2xl cursor-pointer text-center text-[12px] font-semibold text-gray-400 hover:text-indigo-600 transition-all">
                                                {formData.photo && formData.photo.startsWith('data:') ? t('photo_selected', 'Photo sélectionnée') : t('choose_image', 'Choisir une image')}
                                            </label>
                                            {formData.photo && formData.photo.startsWith('data:') && (
                                                <div className="w-16 h-16 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex-shrink-0 transition-all shadow-sm">
                                                    <img src={formData.photo} className="w-full h-full object-cover" alt="" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('birth_place_label', 'Lieu de naissance')}</label>
                                    <input name="birthPlace" value={formData.birthPlace || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="Ex: Port-au-Prince" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('nickname_label', 'Nickname / Pseudo')}</label>
                                    <input name="nickname" value={formData.nickname || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="Ex: jean2024" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('nif_cin_label', 'NIF / CIN')}</label>
                                    <input name="nifCin" value={formData.nifCin || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="Ex: 000-000-000-0" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight mb-10 border-b border-gray-50 dark:border-white/5 pb-5 transition-colors">
                                {t('contact_info', 'Coordonnées')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 transition-colors">
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('email')} <span className="text-red-500">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="email@exemple.com" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('phone')}</label>
                                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="+123456789" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('city')}</label>
                                    <input name="city" value={formData.city} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white" placeholder="Ville" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('country', 'Pays')}</label>
                                    <input name="country" value={formData.country} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white" placeholder="Pays" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('address', 'Adresse (Home)')}</label>
                                    <input name="address" value={formData.address} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white" placeholder="#, adresse line" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 mt-12 transition-colors">
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('work_address', 'Adresse (Work)')}</label>
                                    <input name="workAddress" value={formData.workAddress || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="Ville, Pays, Adresse" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('work_email', 'Email (Work)')}</label>
                                    <input type="email" name="workEmail" value={formData.workEmail || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="work@exemple.com" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('work_phone', 'Téléphone (Work)')}</label>
                                    <input name="workPhone" value={formData.workPhone || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="+123456789" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('emergency_contact', 'Urgence (Nom/Tel)')}</label>
                                    <input name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="Nom - Téléphone" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('linkedin_url', 'LinkedIn URL')}</label>
                                    <input name="linkedinUrl" value={formData.linkedinUrl || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="linkedin.com/private/..." />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('facebook_url', 'Facebook URL')}</label>
                                    <input name="facebookUrl" value={formData.facebookUrl || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="fb.com/..." />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight mb-10 border-b border-gray-50 dark:border-white/5 pb-5 transition-colors">
                                {t('church_info', 'Information Église')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 transition-colors">
                                <div className="space-y-4 lg:col-span-1">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('roles')} <span className="text-red-500">*</span></label>
                                    <div className="flex flex-wrap gap-4 pt-3 transition-colors">
                                        {availableRoles.map(r => (
                                            <label key={r} className={`px-6 py-3 rounded-xl text-[11px] font-bold tracking-widest cursor-pointer transition-all border-2 active:scale-95 ${formData.role.includes(r.toLowerCase()) ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100 dark:shadow-none' : 'bg-gray-50 dark:bg-black text-gray-400 dark:text-gray-600 border-transparent dark:border-white/5 hover:border-indigo-500/30'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={formData.role.includes(r.toLowerCase())}
                                                    onChange={() => handleRoleChange(r.toLowerCase())}
                                                />
                                                {r}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('category', 'Catégorie')} (Type de membre) <span className="text-red-500">*</span></label>
                                    <select name="subtypeId" value={formData.subtypeId} onChange={handleChange} required className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white cursor-pointer transition-colors appearance-none">
                                        <option value="">{t('select')}</option>
                                        {subtypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('status')}</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white cursor-pointer transition-colors appearance-none">
                                        <option value="Actif">{t('active')}</option>
                                        <option value="Inactif">{t('inactive')}</option>
                                        <option value="En déplacement">{t('traveling')}</option>
                                        <option value="Décédé">{t('deceased')}</option>
                                        <option value="Transféré">{t('transferred')}</option>
                                        <option value="Abandonné">{t('abandoned')}</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('join_date_label', 'Date d\'adhésion')}</label>
                                    <input type="date" name="joinDate" value={formData.joinDate || ''} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white [color-scheme:dark]" />
                                </div>
                                {!editId && (
                                    <div className="space-y-4">
                                        <label className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 ml-1 transition-colors">{t('password')}</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="••••••••" />
                                    </div>
                                )}
                            </div>
                        </section>
                    </form>
                </div>

                <div className="flex justify-end bg-gray-50 dark:bg-[#080808] px-12 py-10 border-t border-gray-100 dark:border-white/5 transition-colors shrink-0">
                    <div className="flex gap-6 w-full md:w-auto transition-colors">
                        <button type="button" onClick={onClose} className="flex-1 md:flex-none px-10 py-5 bg-white dark:bg-black border border-gray-200 dark:border-transparent text-gray-500 dark:text-gray-600 font-bold text-[11px] tracking-widest rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95 shadow-sm">
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            form="memberForm"
                            disabled={loading}
                            className="flex-1 md:flex-none px-14 py-5 bg-indigo-600 text-white font-bold text-[11px] tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 dark:shadow-none disabled:opacity-50 active:scale-95 transition-colors"
                        >
                            {loading ? t('saving', 'Enregistrement...') : (editId ? t('update') : t('save'))}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberForm;
