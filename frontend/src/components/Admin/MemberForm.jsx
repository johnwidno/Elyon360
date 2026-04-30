import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import AlertModal from '../ChurchAlertModal';
import SearchableSelect from '../SearchableSelect';
import { countries } from '../../utils/countryList';

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
        department: '',
        zipCode: '',
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
        spouseId: null,
        memberCategoryId: '',
        baptismalStatus: 'not_baptized',
        instagramUrl: '',
        tiktokUrl: '',
        websiteUrl: '',
        emergencyPhone: '',
        emergencyEmail: '',
        secondaryPhone: '',
        secondaryEmail: '',
        bloodGroup: ''
    });
    const [photoMode, setPhotoMode] = useState('url'); // 'url' or 'file'
    const [spouseSearch, setSpouseSearch] = useState('');
    const [spouseResults, setSpouseResults] = useState([]);
    const [showSpouseDropdown, setShowSpouseDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

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
                firstName: initialData?.firstName || '',
                lastName: initialData?.lastName || '',
                email: initialData?.email || '',
                password: '',
                role: initialData?.role || ['member'],
                subtypeId: initialData?.subtypeId || '',
                phone: initialData?.phone || '',
                address: initialData?.address || '',
                city: initialData?.city || '',
                department: initialData?.department || '',
                zipCode: initialData?.zipCode || '',
                country: initialData?.country || '',
                gender: initialData?.gender || '',
                birthDate: initialData?.birthDate || '',
                maritalStatus: initialData?.maritalStatus || '',
                photo: initialData?.photo || '',
                status: initialData?.status || 'Actif',
                nifCin: initialData?.nifCin || '',
                birthPlace: initialData?.birthPlace || '',
                nickname: initialData?.nickname || '',
                joinDate: initialData?.joinDate || '',
                notes: initialData?.notes || '',
                workAddress: initialData?.workAddress || '',
                workEmail: initialData?.workEmail || '',
                workPhone: initialData?.workPhone || '',
                emergencyContact: initialData?.emergencyContact || '',
                facebookUrl: initialData?.facebookUrl || '',
                linkedinUrl: initialData?.linkedinUrl || '',
                spouseName: initialData?.spouseName || '',
                spouseId: initialData?.spouseId || null,
                memberCategoryId: initialData?.memberCategoryId || '',
                baptismalStatus: initialData?.baptismalStatus || 'not_baptized',
                instagramUrl: initialData?.instagramUrl || '',
                tiktokUrl: initialData?.tiktokUrl || '',
                websiteUrl: initialData?.websiteUrl || '',
                emergencyPhone: initialData?.emergencyPhone || '',
                emergencyEmail: initialData?.emergencyEmail || '',
                secondaryPhone: initialData?.secondaryPhone || '',
                secondaryEmail: initialData?.secondaryEmail || '',
                bloodGroup: initialData?.bloodGroup || ''
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
            let response;
            if (editId) {
                response = await api.put(`/members/${editId}`, formData);
            } else {
                response = await api.post('/members', formData);
            }
            onSuccess(response.data);
            onClose();
        } catch (error) {
            console.error("Error saving member:", error);
            setAlertMessage({
                show: true,
                title: t('error', 'Erreur'),
                message: error.response?.data?.message || t('error_saving', "Erreur lors de l'enregistrement"),
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const availableRoles = ['Admin', 'Staff', 'Member'];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/90 backdrop-blur-xl transition-all">
            <div className="bg-white dark:bg-[#0D0D0D] rounded-[3.5rem] w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col animate-scale-in border border-transparent dark:border-white/5 transition-colors">
                <div className="flex justify-between items-center px-12 py-10 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0D0D0D] shrink-0 transition-colors">
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                            {editId ? t('edit_member', 'Modifier le membre') : t('new_member', 'Nouveau membre')}
                        </h2>
                        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-2">
                            {t('fill_info_desc', 'Remplissez les informations ci-dessous')}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-black flex items-center justify-center text-gray-400 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 border border-transparent dark:border-white/5 transition-all font-black active:scale-95 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 noscrollbar transition-colors bg-white dark:bg-[#0D0D0D]">
                    <form id="memberForm" onSubmit={handleSubmit} className="space-y-20 transition-colors max-w-4xl mx-auto pb-10">
                        {/* Section 1: Identity */}
                        <section className="relative pl-12">
                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-indigo-500 via-indigo-500/10 to-transparent"></div>
                            <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-white dark:bg-[#0D0D0D] border-4 border-indigo-500 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            </div>

                            <div className="mb-12">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">
                                    {t('identity_personnel', 'Identité & Personnel')}
                                </h3>
                                <p className="text-[11px] font-bold text-gray-400 mb-3">{t('basic_info', 'Informations de base')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                <FormInput label={t('first_name')} name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Ex: Jean" />
                                <FormInput label={t('last_name')} name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Ex: Dupont" />
                                <FormSelect label={t('gender_label', 'Sexe')} name="gender" value={formData.gender} onChange={handleChange} options={[
                                    { value: 'M', label: t('masculine', 'Masculin') },
                                    { value: 'F', label: t('feminine', 'Féminin') }
                                ]} />
                                <FormInput label={t('birth_date')} name="birthDate" type="date" value={formData.birthDate || ''} onChange={handleChange} />
                                <FormSelect label={t('marital_status_label', 'État Civil')} name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={[
                                    { value: 'Célibataire', label: t('single', 'Célibataire') },
                                    { value: 'Marié(e)', label: t('married', 'Marié(e)') },
                                    { value: 'Divorcé(e)', label: t('divorced', 'Divorcé(e)') },
                                    { value: 'Veuf/Veuve', label: t('widowed', 'Veuf/Veuve') }
                                ]} />

                                {formData.maritalStatus === 'Marié(e)' && (
                                    <div className="space-y-4 relative">
                                        <label className="text-[11px] font-bold text-gray-400 ml-1">{t('spouse_name', 'Nom du conjoint / de l\'épouse')}</label>
                                        <input
                                            type="text"
                                            name="spouseName"
                                            value={formData.spouseName || spouseSearch}
                                            onChange={(e) => {
                                                setSpouseSearch(e.target.value);
                                                setFormData(prev => ({ ...prev, spouseName: e.target.value, spouseId: null }));
                                                setShowSpouseDropdown(true);
                                            }}
                                            onFocus={() => setShowSpouseDropdown(true)}
                                            placeholder="Rechercher un membre..."
                                            className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-bold text-gray-700 dark:text-white"
                                        />
                                        {showSpouseDropdown && spouseResults.length > 0 && (
                                            <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                                                {spouseResults.map(member => (
                                                    <button
                                                        key={member.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                spouseName: `${member.firstName} ${member.lastName}`,
                                                                spouseId: member.id
                                                            }));
                                                            setSpouseSearch(`${member.firstName} ${member.lastName}`);
                                                            setShowSpouseDropdown(false);
                                                        }}
                                                        className="w-full px-8 py-4 text-left hover:bg-indigo-50 dark:hover:bg-white/5 transition-all flex items-center gap-4"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                                                            {member.firstName[0]}{member.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="text-[13px] font-black text-gray-900 dark:text-white">{member.firstName} {member.lastName}</div>
                                                            <div className="text-[10px] text-gray-400">{member.email}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <FormInput label={t('birth_place_label', 'Lieu de naissance')} name="birthPlace" value={formData.birthPlace || ''} onChange={handleChange} placeholder="Ex: Port-au-Prince" />
                                <FormInput label={t('nickname_label', 'Nickname / Pseudo')} name="nickname" value={formData.nickname || ''} onChange={handleChange} placeholder="Ex: jean2024" />
                                <FormInput label={t('member_code_label', 'Code Permanent / Membre')} name="memberCode" value={formData.memberCode || ''} onChange={handleChange} placeholder="Ex: M-2026-001" />
                                <FormInput label={t('nif_cin_label', 'NIF / CIN')} name="nifCin" value={formData.nifCin || ''} onChange={handleChange} placeholder="Ex: 000-000-000-0" />
                                <FormSelect label={t('blood_group_label', 'Groupe Sanguin')} name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={[
                                    { value: 'A+', label: 'A+' },
                                    { value: 'A-', label: 'A-' },
                                    { value: 'B+', label: 'B+' },
                                    { value: 'B-', label: 'B-' },
                                    { value: 'AB+', label: 'AB+' },
                                    { value: 'AB-', label: 'AB-' },
                                    { value: 'O+', label: 'O+' },
                                    { value: 'O-', label: 'O-' }
                                ]} />

                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold text-gray-400 ml-1 flex justify-between">
                                        <span>{t('photo')}</span>
                                        <button type="button" onClick={() => setPhotoMode(photoMode === 'url' ? 'file' : 'url')} className="text-indigo-500 hover:text-indigo-600 font-black">
                                            {photoMode === 'url' ? t('upload_file', 'Uploader') : t('use_url', 'Utiliser URL')}
                                        </button>
                                    </label>
                                    {photoMode === 'url' ? (
                                        <input name="photo" value={formData.photo} onChange={handleChange} className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-medium text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-800" placeholder="https://..." />
                                    ) : (
                                        <div className="flex items-center gap-5 transition-colors">
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="photo-upload" />
                                            <label htmlFor="photo-upload" className="flex-1 px-8 py-5 bg-gray-50 dark:bg-black border-2 border-dashed border-gray-100 dark:border-white/5 hover:border-indigo-500 rounded-2xl cursor-pointer text-center text-[12px] font-semibold text-gray-400 hover:text-indigo-600 transition-all">
                                                {formData.photo && formData.photo.startsWith('data:') ? t('photo_selected', 'Photo sélectionnée') : t('choose_image', 'Choisir une image')}
                                            </label>
                                            {formData.photo && formData.photo.startsWith('data:') && (
                                                <div className="w-16 h-16 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex-shrink-0 shadow-sm transition-all">
                                                    <img src={formData.photo} className="w-full h-full object-cover" alt="" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Contact & Location */}
                        <section className="relative pl-12">
                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-emerald-500 via-emerald-500/10 to-transparent"></div>
                            <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-white dark:bg-[#0D0D0D] border-4 border-emerald-500 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            </div>

                            <div className="mb-12">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">
                                    {t('contact_info', 'Coordonnées')}
                                </h3>
                                <p className="text-[11px] font-bold text-gray-400 mb-3">{t('reach_member', 'Contact & Localisation')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                <FormInput label={t('email')} name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="email@exemple.com" />
                                <FormInput label={`${t('secondary_email', 'Email secondaire')} *`} name="secondaryEmail" type="email" value={formData.secondaryEmail || ''} onChange={handleChange} placeholder="email2@exemple.com" />
                                <FormInput label={t('phone')} name="phone" value={formData.phone} onChange={handleChange} placeholder="+123456789" />
                                <FormInput label={`${t('secondary_phone', 'Téléphone secondaire')} *`} name="secondaryPhone" value={formData.secondaryPhone || ''} onChange={handleChange} placeholder="+123456789" />
                                <FormInput label={t('address', 'Adresse (Home)')} name="address" value={formData.address} onChange={handleChange} placeholder="#, adresse line" />
                                <FormInput label={t('city')} name="city" value={formData.city} onChange={handleChange} placeholder="Ville" />
                                <FormSelect label={t('department', 'Département')} name="department" value={formData.department} onChange={handleChange} options={[
                                    { value: 'Artibonite', label: 'Artibonite' },
                                    { value: 'Centre', label: 'Centre' },
                                    { value: 'Grand\'Anse', label: 'Grand\'Anse' },
                                    { value: 'Nippes', label: 'Nippes' },
                                    { value: 'Nord', label: 'Nord' },
                                    { value: 'Nord-Est', label: 'Nord-Est' },
                                    { value: 'Nord-Ouest', label: 'Nord-Ouest' },
                                    { value: 'Ouest', label: 'Ouest' },
                                    { value: 'Sud', label: 'Sud' },
                                    { value: 'Sud-Est', label: 'Sud-Est' }
                                ]} />
                                <FormInput label={t('zip_code', 'Code Postal')} name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="HT-0000" />
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('country', 'Pays')}</label>
                                    <SearchableSelect
                                        options={countries}
                                        value={formData.country}
                                        onChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
                                        placeholder={t('select_country', 'Sélectionner un pays')}
                                        displayKey="name"
                                        valueKey="name"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Work & Professional */}
                        <section className="relative pl-12">
                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-amber-500 via-amber-500/10 to-transparent"></div>
                            <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-white dark:bg-[#0D0D0D] border-4 border-amber-500 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            </div>

                            <div className="mb-12">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">
                                    {t('professional_info', 'Vie Professionnelle')}
                                </h3>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('work_details', 'Détails du travail')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                <FormInput label={t('work_address', 'Adresse (Work)')} name="workAddress" value={formData.workAddress || ''} onChange={handleChange} placeholder="Ville, Pays, Adresse" />
                                <FormInput label={t('work_email', 'Email (Work)')} name="workEmail" type="email" value={formData.workEmail || ''} onChange={handleChange} placeholder="work@exemple.com" />
                                <FormInput label={t('work_phone', 'Téléphone (Work)')} name="workPhone" value={formData.workPhone || ''} onChange={handleChange} placeholder="+123456789" />
                            </div>
                        </section>

                        {/* Section 4: Emergency Contacts */}
                        <section className="relative pl-12">
                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-rose-500 via-rose-500/10 to-transparent"></div>
                            <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-white dark:bg-[#0D0D0D] border-4 border-rose-500 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            </div>

                            <div className="mb-12">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">
                                    {t('emergency_contacts_title', 'Contacts d\'urgence')}
                                </h3>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('emergency_info', 'Informations en cas d\'urgence')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                <FormInput label={t('emergency_contacts', 'Nom Contact Urgence')} name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleChange} placeholder="Ex: Jean Dupont" />
                                <FormInput label={t('phone_emergency', 'Tel Urgence')} name="emergencyPhone" value={formData.emergencyPhone || ''} onChange={handleChange} placeholder="+123..." />
                                <FormInput label={t('email_emergency', 'Email Urgence')} name="emergencyEmail" value={formData.emergencyEmail || ''} onChange={handleChange} placeholder="urgence@..." />
                            </div>
                        </section>

                        {/* Section 5: Social Networks */}
                        <section className="relative pl-12">
                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-sky-500 via-sky-500/10 to-transparent"></div>
                            <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-white dark:bg-[#0D0D0D] border-4 border-sky-500 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            </div>

                            <div className="mb-12">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">
                                    {t('social_networks', 'Réseaux Sociaux')}
                                </h3>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('social_presence', 'Présence en ligne')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 bg-gray-50 dark:bg-black rounded-3xl border border-gray-100 dark:border-white/5">
                                <SocialInput label="LinkedIn" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} placeholder="linkedin.com/..." />
                                <SocialInput label="Facebook" name="facebookUrl" value={formData.facebookUrl} onChange={handleChange} placeholder="fb.com/..." />
                                <SocialInput label="Instagram" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange} placeholder="instagram.com/..." />
                                <SocialInput label="TikTok" name="tiktokUrl" value={formData.tiktokUrl} onChange={handleChange} placeholder="tiktok.com/@..." />
                                <SocialInput label="Website" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} placeholder="https://..." />
                            </div>
                        </section>

                        {/* Section 6: Church Info */}
                        <section className="relative pl-12">
                            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-indigo-500 via-indigo-500/10 to-transparent"></div>
                            <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-white dark:bg-[#0D0D0D] border-4 border-indigo-500 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            </div>

                            <div className="mb-12">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">
                                    {t('church_info', 'Information Église')}
                                </h3>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('church_membership', 'Appartenance à l\'église')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
                                <div className="space-y-4 md:col-span-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('roles')} <span className="text-red-500">*</span></label>
                                    <div className="flex flex-wrap gap-4 pt-2">
                                        {availableRoles.map(r => (
                                            <label key={r} className={`px-8 py-4 rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase cursor-pointer transition-all border-2 active:scale-95 ${formData.role.includes(r.toLowerCase()) ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20' : 'bg-gray-50 dark:bg-black text-gray-400 dark:text-gray-600 border-transparent dark:border-white/5 hover:border-indigo-500/30'}`}>
                                                <input type="checkbox" className="hidden" checked={formData.role.includes(r.toLowerCase())} onChange={() => handleRoleChange(r.toLowerCase())} />
                                                {r}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <FormSelect 
                                    label={`${t('category', 'Catégorie')} *`} 
                                    name="subtypeId" 
                                    value={formData.subtypeId} 
                                    onChange={handleChange} 
                                    required 
                                    options={subtypes.map(s => ({ value: s.id, label: s.name }))} 
                                />
                                <FormSelect label={t('status')} name="status" value={formData.status} onChange={handleChange} options={[
                                    { value: 'Actif', label: t('active') },
                                    { value: 'Inactif', label: t('inactive') },
                                    { value: 'En déplacement', label: t('traveling') },
                                    { value: 'Décédé', label: t('deceased') },
                                    { value: 'Transféré', label: t('transferred') },
                                    { value: 'Abandonné', label: t('abandoned') }
                                ]} />
                                <FormInput label={t('join_date_label', 'Date d\'adhésion')} name="joinDate" type="date" value={formData.joinDate || ''} onChange={handleChange} />
                                {!editId && (
                                    <FormInput label={t('password')} name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                                )}
                            </div>
                        </section>
                    </form>
                </div>

                <div className="flex justify-end bg-gray-50 dark:bg-[#080808] px-12 py-10 border-t border-gray-100 dark:border-white/5 shrink-0">
                    <div className="flex gap-6 w-full md:w-auto">
                        <button type="button" onClick={onClose} className="flex-1 md:flex-none px-12 py-5 bg-white dark:bg-black border border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 font-black text-[11px] tracking-widest uppercase rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95 shadow-sm">
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            form="memberForm"
                            disabled={loading}
                            className="flex-1 md:flex-none px-16 py-5 bg-indigo-600 text-white font-black text-[11px] tracking-widest uppercase rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? t('saving', 'Enregistrement...') : (editId ? t('update') : t('save'))}
                        </button>
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
        </div>
    );
};

/* Helper Components */
const FormInput = ({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }) => (
    <div className="space-y-4">
        <label className="text-[11px] font-bold text-gray-400 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-bold text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-700 [color-scheme:light] dark:[color-scheme:dark]"
        />
    </div>
);

const FormSelect = ({ label, name, value, onChange, options, required = false }) => (
    <div className="space-y-4">
        <label className="text-[11px] font-bold text-gray-400 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-8 py-5 bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 focus:border-indigo-500/30 rounded-2xl transition-all outline-none text-[15px] font-bold text-gray-700 dark:text-white cursor-pointer appearance-none"
            >
                <option value="">Sélectionner</option>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    </div>
);

const SocialInput = ({ label, name, value, onChange, placeholder }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1">{label}</label>
        <input
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-5 py-3.5 bg-white dark:bg-[#0D0D0D] border border-gray-100 dark:border-white/5 focus:border-indigo-500/30 rounded-xl transition-all outline-none text-[13px] font-bold text-gray-700 dark:text-white placeholder-gray-300 dark:placeholder-gray-800"
        />
    </div>
);

export default MemberForm;
