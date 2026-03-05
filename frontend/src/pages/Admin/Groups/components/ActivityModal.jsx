import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import api from '../../../../api/axios';
import SearchableSelect from '../../../../components/SearchableSelect';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import AlertModal from '../../../../components/ChurchAlertModal';

export default function ActivityModal({ activity, onClose, onSave, onAddParticipant, onRemoveParticipant, onUpdateParticipant, members, initialTab = 'details' }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        endDate: '',
        location: '',
        registrationExpiresAt: '',
        coordinatorId: '',
        status: 'planned',
        startTime: '',
        type: 'Formation'
    });
    const [eventTypes, setEventTypes] = useState([]);
    const [otherType, setOtherType] = useState('');

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await api.get('/event-types');
                setEventTypes(res.data);
            } catch (error) {
                console.error("Error fetching event types:", error);
            }
        };
        fetchTypes();
    }, []);
    const [activeTab, setActiveTab] = useState(initialTab); // details, participants
    const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');
    const [addMode, setAddMode] = useState('member'); // member, guest
    const [guestData, setGuestData] = useState({ guestName: '', guestEmail: '', guestPhone: '' });
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        if (activity) {
            setFormData({
                name: activity.name,
                description: activity.description,
                date: new Date(activity.date).toISOString().substr(0, 10),
                endDate: activity.endDate ? new Date(activity.endDate).toISOString().substr(0, 10) : '',
                location: activity.location,
                registrationExpiresAt: activity.registrationExpiresAt ? new Date(activity.registrationExpiresAt).toISOString().split('T')[0] : '',
                coordinatorId: activity.coordinatorId || '',
                status: activity.status,
                startTime: activity.startTime || '',
                type: activity.type || ''
            });
            // If it's a custom type, set otherType
            if (activity.type && !eventTypes.some(t => t.name === activity.type)) {
                setOtherType(activity.type);
            }
        }
    }, [activity, eventTypes]);

    // Handle initialTab changes when reopening modal
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(activity.name, 14, 20);

        doc.setFontSize(11);
        doc.text(`${t('date')}: ${new Date(activity.date).toLocaleDateString()}${activity.endDate ? ' - ' + new Date(activity.endDate).toLocaleDateString() : ''}`, 14, 30);
        doc.text(`${t('location')}: ${activity.location || '-'}`, 14, 36);

        const tableBody = (activity.participants || []).map(p => [
            p.user ? `${p.user.firstName} ${p.user.lastName}` : `${p.guestName} (Invité)`,
            p.user ? p.user.email : (p.guestEmail || '-'),
            p.user ? (p.user.phone || '-') : (p.guestPhone || '-'),
            t(p.status) || p.status
        ]);

        doc.autoTable({
            head: [[t('name'), t('email', 'Email'), t('phone', 'Téléphone'), t('status')]],
            body: tableBody,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [43, 54, 116] }
        });

        doc.save(`${activity.name}_participants.pdf`);
    };

    const handleExportExcel = () => {
        const data = (activity.participants || []).map(p => ({
            [t('name')]: p.user ? `${p.user.firstName} ${p.user.lastName}` : `${p.guestName} (Invité)`,
            [t('status')]: t(p.status) || p.status,
            [t('type')]: p.user ? t('member') : t('guest', 'Invité'),
            [t('email', 'Email')]: p.user ? p.user.email : (p.guestEmail || '-'),
            [t('phone', 'Téléphone')]: p.user ? p.user.phone : (p.guestPhone || '-')
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t('participants'));
        XLSX.writeFile(workbook, `${activity.name}_participants.xlsx`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleAddParticipant = () => {
        if (addMode === 'member' && selectedMemberToAdd) {
            onAddParticipant({ userId: selectedMemberToAdd });
            setSelectedMemberToAdd('');
        } else if (addMode === 'guest' && guestData.guestName) {
            onAddParticipant({ ...guestData });
            setGuestData({ guestName: '', guestEmail: '', guestPhone: '' });
        }
    };

    const getAvailableMembers = () => {
        if (!activity || !activity?.participants) return members;
        return members.filter(m => !activity?.participants?.some(p => p.userId === m.id));
    };

    return (
        <div className="fixed inset-0 z-[160] overflow-y-auto noscrollbar">
            <div className="flex items-center justify-center min-h-screen p-4 text-center">
                <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={onClose}></div>
                <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-5xl w-full border border-gray-100 dark:border-white/10 relative z-10 flex flex-col max-h-[90vh]">

                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 dark:border-white/10">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {activity ? t('edit_activity', "Modifier l'activité") : t('create_activity', "Créer une activité")}
                            </h3>
                            {activity && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'details' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 'text-gray-500'}`}
                                    >
                                        Détails
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('participants')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'participants' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 'text-gray-500'}`}
                                    >
                                        Participants
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto">
                        {activeTab === 'details' ? (
                            <form id="activityForm" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('activity_name')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('description')}</label>
                                    <textarea
                                        rows="3"
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('dates', 'Dates (Début - Fin)')}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-3 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light] cursor-pointer"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    onClick={(e) => e.target.showPicker()}
                                                />
                                                <input
                                                    type="date"
                                                    className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-3 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light] cursor-pointer"
                                                    value={formData.endDate}
                                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                    min={formData.date}
                                                    onClick={(e) => e.target.showPicker()}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('activity_time', 'Heure de l\'activité')}</label>
                                            <input
                                                type="time"
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light] cursor-pointer"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                onClick={(e) => e.target.showPicker()}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('type')}</label>
                                            <select
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none"
                                                value={eventTypes.some(t => t.name === formData.type) ? formData.type : (formData.type ? 'Autre' : '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Autre') {
                                                        setFormData({ ...formData, type: otherType || '' });
                                                    } else {
                                                        setFormData({ ...formData, type: val });
                                                        setOtherType('');
                                                    }
                                                }}
                                            >
                                                <option value="">{t('select_type', 'Sélectionner un type')}</option>
                                                {eventTypes.map(type => (
                                                    <option key={type.id} value={type.name}>{type.name}</option>
                                                ))}
                                                <option value="Autre">{t('other', 'Autre')}</option>
                                            </select>
                                        </div>

                                        {(formData.type === 'Autre' || (formData.type && !eventTypes.some(t => t.name === formData.type))) && (
                                            <div className="animate-in fade-in slide-in-from-top-2">
                                                <label className="block text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-2 ml-1">{t('specify_other', 'Préciser le type')}</label>
                                                <input
                                                    type="text"
                                                    placeholder={t('other_type_placeholder', 'Ex: Retraite spéciale')}
                                                    className="w-full bg-white dark:bg-black border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl px-5 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500 transition-all font-medium"
                                                    value={otherType}
                                                    onChange={(e) => {
                                                        setOtherType(e.target.value);
                                                        setFormData({ ...formData, type: e.target.value });
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('location')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all h-[118px]"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder={t('enter_location', 'Lieu de l\'activité...')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                                        {t('registration_expires_at', "Date limite d'inscription")}
                                        <span className="text-gray-400 text-[10px] ml-2 font-normal normal-case">(Génère un lien public)</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer"
                                        value={formData.registrationExpiresAt}
                                        onChange={(e) => setFormData({ ...formData, registrationExpiresAt: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        onClick={(e) => e.target.showPicker()}
                                    />
                                    {activity?.registrationToken && (
                                        <div className="mt-4 space-y-4">
                                            <div className="text-xs flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-blue-600 dark:text-blue-400">
                                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                <span className="truncate flex-1">Lien de participation généré</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/public/register/${activity.registrationToken}`;
                                                        navigator.clipboard.writeText(url);
                                                        setAlertMessage({ show: true, title: t('success'), message: t('link_copied', 'Lien copié !'), type: 'success' });
                                                    }}
                                                    className="px-2 py-1 bg-white dark:bg-black/20 rounded border border-blue-200 dark:border-blue-800 text-[10px] font-bold"
                                                >
                                                    Copier
                                                </button>
                                            </div>

                                            <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                                <div className="bg-white p-4 rounded-xl shadow-sm">
                                                    <img
                                                        id="activity-qr-code-img"
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/public/register/${activity.registrationToken}`)}`}
                                                        alt="QR Code"
                                                        className="w-[160px] h-[160px]"
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">QR Code de l'activité</p>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/public/register/${activity.registrationToken}`)}`;
                                                                const response = await fetch(qrUrl);
                                                                const blob = await response.blob();
                                                                const url = window.URL.createObjectURL(blob);
                                                                const link = document.createElement('a');
                                                                link.href = url;
                                                                link.download = `QR_Code_${activity.name}.png`;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                                window.URL.revokeObjectURL(url);
                                                            } catch (err) {
                                                                console.error("Error downloading QR:", err);
                                                            }
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-600 dark:text-white hover:bg-gray-50 transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                        Télécharger le QR Code
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('status')}</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="planned">{t('planned', 'Planifiée')}</option>
                                        <option value="completed">{t('completed', 'Terminée')}</option>
                                        <option value="cancelled">{t('cancelled', 'Annulée')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('coordinator', 'Coordonné par')}</label>
                                    <SearchableSelect
                                        options={members.map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName} ${m.memberCode ? `(${m.memberCode})` : ''}` }))}
                                        value={formData.coordinatorId}
                                        onChange={(val) => setFormData({ ...formData, coordinatorId: val })}
                                        placeholder={t('select_coordinator', 'Choisir un coordinateur...')}
                                    />
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                {/* Export Buttons */}
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={handleExportExcel}
                                        className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/30 transition-all flex items-center gap-1"
                                    >
                                        Excel
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center gap-1"
                                    >
                                        PDF
                                    </button>
                                </div>

                                {/* Add Participant */}
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div className="flex gap-4 border-b border-gray-100 dark:border-white/5 pb-2">
                                        <button
                                            onClick={() => setAddMode('member')}
                                            className={`text-xs font-bold ${addMode === 'member' ? 'text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                                        >
                                            {t('add_member', 'Ajouter un Membre')}
                                        </button>
                                        <button
                                            onClick={() => setAddMode('guest')}
                                            className={`text-xs font-bold ${addMode === 'guest' ? 'text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                                        >
                                            {t('add_guest', 'Ajouter un Invité')}
                                        </button>
                                    </div>

                                    {addMode === 'member' ? (
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <SearchableSelect
                                                    options={getAvailableMembers().map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName} ${m.memberCode ? `(${m.memberCode})` : ''}` }))}
                                                    value={selectedMemberToAdd}
                                                    onChange={setSelectedMemberToAdd}
                                                    placeholder="Chercher un membre..."
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddParticipant}
                                                disabled={!selectedMemberToAdd}
                                                className="px-6 bg-indigo-600 text-white rounded-xl font-bold text-xs disabled:opacity-50 hover:bg-indigo-700 transition-all"
                                            >
                                                {t('add')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <input
                                                className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-xs outline-none"
                                                placeholder={t('guest_name', 'Nom de l\'invité *')}
                                                value={guestData.guestName}
                                                onChange={e => setGuestData({ ...guestData, guestName: e.target.value })}
                                            />
                                            <div className="flex gap-3">
                                                <input
                                                    className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-xs outline-none"
                                                    placeholder="Email (optionnel)"
                                                    value={guestData.guestEmail}
                                                    onChange={e => setGuestData({ ...guestData, guestEmail: e.target.value })}
                                                />
                                                <input
                                                    className="w-full bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-xs outline-none"
                                                    placeholder="Téléphone (optionnel)"
                                                    value={guestData.guestPhone}
                                                    onChange={e => setGuestData({ ...guestData, guestPhone: e.target.value })}
                                                />
                                                <button
                                                    onClick={handleAddParticipant}
                                                    disabled={!guestData.guestName}
                                                    className="px-6 bg-indigo-600 text-white rounded-xl font-bold text-xs disabled:opacity-50 hover:bg-indigo-700 transition-all"
                                                >
                                                    {t('add')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Participants List Table */}
                                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/10">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-black/20">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-24">{t('type')}</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('name')}</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('email', 'Email')}</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('phone', 'Téléphone')}</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-24">{t('status')}</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest w-20">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                            {activity?.participants && activity?.participants.map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                    <td className="px-6 py-4">
                                                        {p.user ? (
                                                            <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider">Membre</span>
                                                        ) : (
                                                            <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider">Invité</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-white">
                                                        {p.user ? (
                                                            <div>{p.user.firstName} {p.user.lastName}</div>
                                                        ) : (
                                                            <div>{p.guestName}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                                                        {p.user ? (p.user.email || '-') : (p.guestEmail || '-')}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                                                        {p.user ? (p.user.phone || '-') : (p.guestPhone || '-')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={p.status}
                                                            onChange={(e) => onUpdateParticipant(p.id, e.target.value)}
                                                            className="bg-transparent text-xs font-bold uppercase outline-none cursor-pointer"
                                                        >
                                                            <option value="present">{t('present', 'Présent')}</option>
                                                            <option value="absent">{t('absent', 'Absent')}</option>
                                                            <option value="excused">{t('excused', 'Excusé')}</option>
                                                            <option value="invited">{t('invited', 'Invité')}</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => onRemoveParticipant(p.id)}
                                                            className="text-red-400 hover:text-red-600 text-xs font-bold"
                                                        >
                                                            {t('remove')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!activity?.participants || activity?.participants?.length === 0) && (
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-8 text-center text-xs text-gray-400">
                                                        {t('no_participants')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-8 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-[12px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95 outline-none">{t('cancel')}</button>
                        {activeTab === 'details' && (
                            <button form="activityForm" type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-[12px] font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 outline-none">{t('save')}</button>
                        )}
                    </div>
                </div>
            </div>
            <AlertModal
                isOpen={alertMessage.show}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
            />
        </div >
    );
}
