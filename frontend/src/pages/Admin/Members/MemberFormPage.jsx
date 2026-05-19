import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import AdminLayout from '../../../layouts/AdminLayout';
import AlertModal from '../../../components/ChurchAlertModal';
import SearchableSelect from '../../../components/SearchableSelect';
import { countries } from '../../../utils/countryList';
import { 
    ChevronLeft, ChevronRight, Save, User, Mail, 
    Briefcase, Heart, Globe, ShieldCheck
} from 'lucide-react';

const MemberFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [subtypes, setSubtypes] = useState([]);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [currentStep, setCurrentStep] = useState(1);
    
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
        spouseName: '',
        memberCategoryId: '',
        baptismalStatus: 'not_baptized',
        instagramUrl: '',
        tiktokUrl: '',
        websiteUrl: '',
        emergencyPhone: '',
        emergencyEmail: '',
        secondaryPhone: '',
        secondaryEmail: '',
        bloodGroup: '',
        memberCode: ''
    });

    const [photoMode, setPhotoMode] = useState('url');
    const [spouseSearch, setSpouseSearch] = useState('');
    const [spouseResults, setSpouseResults] = useState([]);
    const [showSpouseDropdown, setShowSpouseDropdown] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subRes] = await Promise.all([
                    api.get('/contacts/classification/subtypes')
                ]);
                
                const filteredSubtypes = (subRes.data || []).filter(s => {
                    const typeName = s.type?.name?.toLowerCase().trim();
                    return typeName === 'membre' || typeName === 'member';
                });
                setSubtypes(filteredSubtypes);

                if (!id && location.state?.prefillData) {
                    setFormData(prev => ({ ...prev, ...location.state.prefillData }));
                    if (location.state.fromVisitor) {
                        setAlertMessage({
                            show: true,
                            title: t('info', 'Info'),
                            message: t('visitor_conversion_info', 'Complétez les informations manquantes pour convertir ce visiteur en membre'),
                            type: 'success'
                        });
                    }
                }

                if (id) {
                    const memberRes = await api.get(`/members/${id}`);
                    const data = memberRes.data;
                    setFormData({
                        ...data,
                        password: '',
                        role: Array.isArray(data.role) ? data.role : [data.role],
                        spouseId: data.spouseId || null
                    });
                    if (data.photo) setPhotoMode('url');
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [id, location.state, t]);

    useEffect(() => {
        if (spouseSearch.length > 2 && showSpouseDropdown) {
            const delaySearch = setTimeout(async () => {
                try {
                    const res = await api.get('/members');
                    const filtered = res.data.filter(m =>
                        (m.firstName.toLowerCase().includes(spouseSearch.toLowerCase()) ||
                            m.lastName.toLowerCase().includes(spouseSearch.toLowerCase())) &&
                        m.id !== parseInt(id)
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
    }, [spouseSearch, showSpouseDropdown, id]);

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
        if (e) e.preventDefault();
        if (!validateStep()) return;
        setLoading(true);
        try {
            if (id) {
                await api.put(`/members/${id}`, formData);
            } else {
                await api.post('/members', formData);
            }
            navigate('/admin/members');
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

    const validateStep = () => {
        if (currentStep === 1) {
            if (!formData.firstName || !formData.lastName) {
                setAlertMessage({ show: true, title: t('error'), message: 'Le prénom et le nom sont obligatoires.', type: 'error' });
                return false;
            }
        }
        if (currentStep === 2) {
            if (!formData.email) {
                setAlertMessage({ show: true, title: t('error'), message: "L'email est obligatoire.", type: 'error' });
                return false;
            }
        }
        if (currentStep === 6) {
            if (!formData.subtypeId || !formData.role || formData.role.length === 0) {
                setAlertMessage({ show: true, title: t('error'), message: 'La catégorie et au moins un rôle sont obligatoires.', type: 'error' });
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setCurrentStep(prev => Math.min(prev + 1, 6));
        }
    };
    
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const steps = [1, 2, 3, 4, 5, 6];
    const availableRoles = ['Admin', 'Staff', 'Member'];

    return (
        <AdminLayout>
            <div className="flex flex-col min-h-[calc(100vh-80px)] bg-[#FDFDFD] dark:bg-[#080808] font-['Inter'] transition-colors">
                {/* Form Body - Full Width Aligned Left */}
                <div className="flex-1 px-4 py-8">
                    <div className="w-full max-w-[1600px] ml-0">
                        <form id="memberForm" onSubmit={handleSubmit} className="animate-fade-in space-y-8">
                            {currentStep === 1 && (
                                <FormSection title="Identité & Personnel" icon={User} color="indigo">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                                        <FormInput label="Prénom" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Jean" />
                                        <FormInput label="Nom" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Dupont" />
                                        <FormSelect label="Sexe" name="gender" value={formData.gender} onChange={handleChange} options={[
                                            { value: 'M', label: 'Masculin' },
                                            { value: 'F', label: 'Féminin' }
                                        ]} />
                                        <FormInput label="Date de naissance" name="birthDate" type="date" value={formData.birthDate || ''} onChange={handleChange} />
                                        <FormSelect label="État civil" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={[
                                            { value: 'Célibataire', label: 'Célibataire' },
                                            { value: 'Marié(e)', label: 'Marié(e)' },
                                            { value: 'Divorcé(e)', label: 'Divorcé(e)' },
                                            { value: 'Veuf/Veuve', label: 'Veuf/Veuve' }
                                        ]} />
                                        
                                        {formData.maritalStatus === 'Marié(e)' && (
                                            <div className="space-y-2 relative">
                                                <label className="text-[13px] font-medium text-gray-500 dark:text-gray-400 ml-1">Conjoint(e)</label>
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
                                                    placeholder="Rechercher..."
                                                    className="w-full px-5 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:border-indigo-500 rounded-xl transition-all outline-none text-[13px] font-bold text-gray-700 dark:text-white"
                                                />
                                                {showSpouseDropdown && spouseResults.length > 0 && (
                                                    <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                                        {spouseResults.map(member => (
                                                            <button key={member.id} type="button" onClick={() => { setFormData(prev => ({ ...prev, spouseName: `${member.firstName} ${member.lastName}`, spouseId: member.id })); setSpouseSearch(`${member.firstName} ${member.lastName}`); setShowSpouseDropdown(false); }} className="w-full px-5 py-3 text-left hover:bg-indigo-50 dark:hover:bg-white/5 transition-all flex items-center gap-4">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-[10px] shrink-0">{member.firstName[0]}{member.lastName[0]}</div>
                                                                <div>
                                                                    <div className="text-[12px] font-black text-gray-900 dark:text-white">{member.firstName} {member.lastName}</div>
                                                                    <div className="text-[10px] text-gray-400">{member.email}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <FormInput label="Lieu de naissance" name="birthPlace" value={formData.birthPlace || ''} onChange={handleChange} placeholder="Ex: Port-au-Prince" />
                                        <FormInput label="Pseudo" name="nickname" value={formData.nickname || ''} onChange={handleChange} placeholder="jean2024" />
                                        <FormInput label="NIF / CIN" name="nifCin" value={formData.nifCin || ''} onChange={handleChange} placeholder="000-000-000-0" />
                                        <FormSelect label="Groupe sanguin" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={[
                                            { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                                            { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                                            { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                                            { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }
                                        ]} />

                                        <div className="space-y-2">
                                            <label className="text-[13px] font-medium text-gray-500 dark:text-gray-400 ml-1 flex justify-between">
                                                <span>Photo</span>
                                                <button type="button" onClick={() => setPhotoMode(photoMode === 'url' ? 'file' : 'url')} className="text-indigo-500 text-[11px] font-black uppercase tracking-widest">
                                                    {photoMode === 'url' ? 'Uploader' : 'URL'}
                                                </button>
                                            </label>
                                            {photoMode === 'url' ? (
                                                <input name="photo" value={formData.photo} onChange={handleChange} className="w-full px-5 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:border-indigo-500 rounded-xl transition-all outline-none text-[13px] text-gray-700 dark:text-white" placeholder="https://..." />
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="photo-upload" />
                                                    <label htmlFor="photo-upload" className="flex-1 px-5 py-3 bg-white dark:bg-black border border-dashed border-gray-200 dark:border-white/10 hover:border-indigo-500 rounded-xl cursor-pointer text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest transition-all">
                                                        {formData.photo && formData.photo.startsWith('data:') ? 'Photo sélectionnée' : 'Choisir image'}
                                                    </label>
                                                    {formData.photo && formData.photo.startsWith('data:') && (
                                                        <div className="w-10 h-10 rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden shrink-0"><img src={formData.photo} className="w-full h-full object-cover" alt="" /></div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </FormSection>
                            )}

                            {currentStep === 2 && (
                                <FormSection title="Coordonnées" icon={Mail} color="emerald">
                                    <div className="space-y-12">
                                        {/* Sub-section: Contact */}
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                Contact
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                                                <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="email@exemple.com" />
                                                <FormInput label="Email secondaire" name="secondaryEmail" type="email" value={formData.secondaryEmail || ''} onChange={handleChange} placeholder="email2@..." />
                                                <FormInput label="Téléphone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+123..." />
                                                <FormInput label="Téléphone secondaire" name="secondaryPhone" value={formData.secondaryPhone || ''} onChange={handleChange} placeholder="+123..." />
                                            </div>
                                        </div>

                                        {/* Sub-section: Adresse */}
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                Adresse
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                                                <div className="space-y-2">
                                                    <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 ml-1">Pays</label>
                                                    <SearchableSelect options={countries} value={formData.country} onChange={(val) => setFormData(prev => ({ ...prev, country: val }))} placeholder="Sélectionner..." displayKey="name" valueKey="name" />
                                                </div>
                                                <FormSelect label="Département" name="department" value={formData.department} onChange={handleChange} options={[
                                                    { value: 'Artibonite', label: 'Artibonite' }, { value: 'Centre', label: 'Centre' },
                                                    { value: 'Grand\'Anse', label: 'Grand\'Anse' }, { value: 'Nippes', label: 'Nippes' },
                                                    { value: 'Nord', label: 'Nord' }, { value: 'Nord-Est', label: 'Nord-Est' },
                                                    { value: 'Nord-Ouest', label: 'Nord-Ouest' }, { value: 'Ouest', label: 'Ouest' },
                                                    { value: 'Sud', label: 'Sud' }, { value: 'Sud-Est', label: 'Sud-Est' }
                                                ]} />
                                                <FormInput label="Ville" name="city" value={formData.city} onChange={handleChange} placeholder="Ville" />
                                                <FormInput label="Adresse (Résidence)" name="address" value={formData.address} onChange={handleChange} placeholder="#, adresse line" />
                                                <FormInput label="Code postal" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="HT-0000" />
                                            </div>
                                        </div>
                                    </div>
                                </FormSection>
                            )}

                            {currentStep === 3 && (
                                <FormSection title="Vie professionnelle" icon={Briefcase} color="amber">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                                        <FormInput label="Adresse professionnelle" name="workAddress" value={formData.workAddress || ''} onChange={handleChange} placeholder="Ville, Pays, Adresse" />
                                        <FormInput label="Email professionnel" name="workEmail" type="email" value={formData.workEmail || ''} onChange={handleChange} placeholder="work@..." />
                                        <FormInput label="Téléphone professionnel" name="workPhone" value={formData.workPhone || ''} onChange={handleChange} placeholder="+123..." />
                                    </div>
                                </FormSection>
                            )}

                            {currentStep === 4 && (
                                <FormSection title="Contacts d'urgence" icon={ShieldCheck} color="rose">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                                        <FormInput label="Nom du contact" name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleChange} placeholder="Nom complet" />
                                        <FormInput label="Téléphone urgence" name="emergencyPhone" value={formData.emergencyPhone || ''} onChange={handleChange} placeholder="+123..." />
                                        <FormInput label="Email urgence" name="emergencyEmail" value={formData.emergencyEmail || ''} onChange={handleChange} placeholder="urgence@..." />
                                    </div>
                                </FormSection>
                            )}

                            {currentStep === 5 && (
                                <FormSection title="Réseaux sociaux" icon={Globe} color="sky">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                                        <SocialInput label="LinkedIn" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} placeholder="linkedin.com/..." />
                                        <SocialInput label="Facebook" name="facebookUrl" value={formData.facebookUrl} onChange={handleChange} placeholder="facebook.com/..." />
                                        <SocialInput label="Instagram" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange} placeholder="instagram.com/..." />
                                        <SocialInput label="TikTok" name="tiktokUrl" value={formData.tiktokUrl} onChange={handleChange} placeholder="tiktok.com/@..." />
                                        <SocialInput label="Website" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} placeholder="https://..." />
                                    </div>
                                </FormSection>
                            )}

                            {currentStep === 6 && (
                                <FormSection title="Information Église" icon={Heart} color="indigo">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                                        <div className="space-y-4 md:col-span-2 lg:col-span-3">
                                            <label className="text-[13px] font-medium text-gray-500 dark:text-gray-400 ml-1">Rôles <span className="text-red-500">*</span></label>
                                            <div className="flex flex-wrap gap-3 pt-2">
                                                {availableRoles.map(r => (
                                                    <label key={r} className={`px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest uppercase cursor-pointer transition-all border-2 active:scale-95 ${formData.role.includes(r.toLowerCase()) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-black text-gray-400 dark:text-gray-600 border-gray-100 dark:border-white/5 hover:border-indigo-500/30'}`}>
                                                        <input type="checkbox" className="hidden" checked={formData.role.includes(r.toLowerCase())} onChange={() => handleRoleChange(r.toLowerCase())} />
                                                        {r}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <FormSelect label="Catégorie *" name="subtypeId" value={formData.subtypeId} onChange={handleChange} required options={subtypes.map(s => ({ value: s.id, label: s.name }))} />
                                        <FormSelect label="Statut" name="status" value={formData.status} onChange={handleChange} options={[
                                            { value: 'Actif', label: 'Actif' }, { value: 'Inactif', label: 'Inactif' },
                                            { value: 'En déplacement', label: 'En déplacement' }, { value: 'Décédé', label: 'Décédé' },
                                            { value: 'Transféré', label: 'Transféré' }, { value: 'Abandonné', label: 'Abandonné' }
                                        ]} />
                                        <FormInput label="Date d'adhésion" name="joinDate" type="date" value={formData.joinDate || ''} onChange={handleChange} />
                                        {!id && (
                                            <FormInput label="Mot de passe" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                                        )}
                                    </div>
                                </FormSection>
                            )}
                        </form>
                    </div>
                </div>

                {/* Fixed Bottom Navigation Bar - PROGRESS IN CENTER */}
                <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-[100] bg-white dark:bg-[#0D0D0D] border-t border-gray-100 dark:border-white/5 px-8 py-5 transition-all shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                    <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                        {/* Previous Button */}
                        <div className="w-1/4">
                            {currentStep > 1 && (
                                <button 
                                    onClick={prevStep}
                                    className="px-8 py-3.5 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl font-black text-[11px] tracking-widest uppercase hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <ChevronLeft size={16} />
                                    Précédent
                                </button>
                            )}
                        </div>

                        {/* STEP NUMBERS CENTERED */}
                        <div className="flex items-center gap-4">
                            {steps.map(step => (
                                <button
                                    key={step}
                                    onClick={() => setCurrentStep(step)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${currentStep === step ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : currentStep > step ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                                >
                                    {step}
                                </button>
                            ))}
                        </div>

                        {/* Next / Save Button */}
                        <div className="w-1/4 flex justify-end">
                            {currentStep < 6 ? (
                                <button 
                                    onClick={nextStep}
                                    className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[11px] tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
                                >
                                    Suivant
                                    <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-12 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[11px] tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {loading ? '...' : (id ? 'Terminer' : 'Enregistrer')}
                                </button>
                            )}
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
        </AdminLayout>
    );
};

const FormSection = ({ title, icon: Icon, color, children }) => {
    const colorClasses = {
        indigo: 'text-indigo-500 bg-indigo-500',
        emerald: 'text-emerald-500 bg-emerald-500',
        amber: 'text-amber-500 bg-amber-500',
        rose: 'text-rose-500 bg-rose-500',
        sky: 'text-sky-500 bg-sky-500'
    };

    return (
        <div className="animate-slide-up-subtle">
            <div className="flex items-center gap-4 mb-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-gray-100 dark:border-white/5 ${colorClasses[color].split(' ')[1].replace('bg-', 'bg-opacity-10 ')} transition-colors`}>
                    <Icon size={20} className={colorClasses[color].split(' ')[0]} />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-tight dark:text-white leading-none uppercase">{title}</h3>
                </div>
            </div>
            <div className="bg-white dark:bg-[#0D0D0D] border border-gray-100 dark:border-white/5 rounded-2xl p-10 shadow-sm transition-colors min-h-[500px]">
                {children}
            </div>
        </div>
    );
};

const FormInput = ({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }) => (
    <div className="space-y-2">
        <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="w-full px-5 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:border-indigo-500 rounded-xl transition-all outline-none text-[13px] font-bold text-gray-700 dark:text-white placeholder-gray-300 dark:placeholder-gray-800"
        />
    </div>
);

const FormSelect = ({ label, name, value, onChange, options, required = false }) => (
    <div className="space-y-2">
        <label className="text-[13px] font-bold text-gray-700 dark:text-gray-300 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-5 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 focus:border-indigo-500 rounded-xl transition-all outline-none text-[13px] font-bold text-gray-700 dark:text-white cursor-pointer appearance-none"
            >
                <option value="">Sélectionner</option>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
        </div>
    </div>
);

const SocialInput = ({ label, name, value, onChange, placeholder }) => (
    <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 focus:border-indigo-500 rounded-xl transition-all outline-none text-[12px] font-bold text-gray-700 dark:text-white placeholder-gray-300 dark:placeholder-gray-800"
        />
    </div>
);

export default MemberFormPage;
