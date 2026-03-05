import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import api from '../../../../api/axios';
import SearchableSelect from '../../../../components/SearchableSelect';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import AlertModal from '../../../../components/ChurchAlertModal';

export default function EventModal({ event, onClose, onSave, onAddParticipant, onRemoveParticipant, onUpdateParticipant, members, rooms = [], initialTab = 'details' }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        type: 'service',
        status: 'planned',
        registrationExpiresAt: '',
        roomId: ''
    });
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');
    const [addMode, setAddMode] = useState('member'); // member, guest
    const [guestData, setGuestData] = useState({ guestName: '', guestEmail: '', guestPhone: '' });
    const [eventTypes, setEventTypes] = useState([]);
    const [otherType, setOtherType] = useState('');
    const [loadingParticipant, setLoadingParticipant] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

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

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description || '',
                startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
                endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
                location: event.location || '',
                type: event.type || '',
                status: event.status || 'planned',
                registrationExpiresAt: event.registrationExpiresAt ? new Date(event.registrationExpiresAt).toISOString().split('T')[0] : '',
                roomId: event.roomId || ''
            });
            // If it's a custom type, set otherType
            if (event.type && !eventTypes.some(t => t.name === event.type)) {
                setOtherType(event.type);
            }
        }
    }, [event, eventTypes]);

    // Handle initialTab changes
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(event?.title || '', 14, 20);

        doc.setFontSize(11);
        doc.text(`${t('date')}: ${event?.startDate ? new Date(event.startDate).toLocaleString() : ''}${event?.endDate ? ' - ' + new Date(event.endDate).toLocaleString() : ''}`, 14, 30);
        doc.text(`${t('location')}: ${event?.location || '-'}`, 14, 36);

        const tableBody = (event?.eventParticipants || []).map(p => [
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

        doc.save(`${event?.title || 'event'}_participants.pdf`);
    };

    const handleExportExcel = () => {
        const data = (event?.eventParticipants || []).map(p => ({
            [t('name')]: p.user ? `${p.user.firstName} ${p.user.lastName}` : `${p.guestName} (Invité)`,
            [t('status')]: t(p.status) || p.status,
            [t('type')]: p.user ? t('member') : t('guest', 'Invité'),
            [t('email', 'Email')]: p.user ? p.user.email : (p.guestEmail || '-'),
            [t('phone', 'Téléphone')]: p.user ? p.user.phone : (p.guestPhone || '-')
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t('participants'));
        XLSX.writeFile(workbook, `${event?.title || 'event'}_participants.xlsx`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleAddParticipant = async () => {
        setLoadingParticipant(true);
        try {
            if (addMode === 'member' && selectedMemberToAdd) {
                await onAddParticipant({ userId: selectedMemberToAdd });
                setSelectedMemberToAdd('');
            } else if (addMode === 'guest' && guestData.guestName) {
                await onAddParticipant({ ...guestData });
                setGuestData({ guestName: '', guestEmail: '', guestPhone: '' });
            }
        } finally {
            setLoadingParticipant(false);
        }
    };

    const getAvailableMembers = () => {
        const participants = event?.eventParticipants || [];
        return members.filter(m => !participants.some(p => p.userId === m.id));
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
                                {event ? t('edit_event') : t('new_event')}
                            </h3>
                            {event && (
                                <div className="flex gap-2">
                                    <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'details' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 'text-gray-500'}`}>{t('details', 'Détails')}</button>
                                    <button onClick={() => setActiveTab('participants')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'participants' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 'text-gray-500'}`}>{t('participants', 'Participants')}</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto">
                        {activeTab === 'details' ? (
                            <form id="eventForm" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('title')}</label>
                                    <input type="text" required className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('description')}</label>
                                    <textarea rows="3" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('start')}</label>
                                                <input type="datetime-local" required className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light]" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('end_optional')}</label>
                                                <input type="datetime-local" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all [color-scheme:light]" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
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
                                                        className="w-full bg-white dark:bg-black border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl px-5 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500 transition-all"
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

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Salle (Optionnel)</label>
                                            <select
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer appearance-none"
                                                value={formData.roomId}
                                                onChange={(e) => {
                                                    const rId = e.target.value;
                                                    const room = rooms.find(r => r.id.toString() === rId.toString());
                                                    setFormData({
                                                        ...formData,
                                                        roomId: rId,
                                                        location: room ? room.name : formData.location
                                                    });
                                                }}
                                            >
                                                <option value="">Sélectionner une salle</option>
                                                {rooms.map(room => (
                                                    <option key={room.id} value={room.id}>{room.name} {room.building ? `(${room.building.name})` : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">{t('location')} (Texte)</label>
                                            <input
                                                type="text"
                                                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder={t('enter_location')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                                            {t('registration_expires_at')}
                                            <span className="text-gray-400 text-[10px] ml-2 font-normal normal-case">(Génère un lien public)</span>
                                        </label>
                                        <input type="date" className="w-full bg-white dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer" value={formData.registrationExpiresAt} onChange={(e) => setFormData({ ...formData, registrationExpiresAt: e.target.value })} min={new Date().toISOString().split('T')[0]} onClick={(e) => e.target.showPicker()} />
                                    </div>

                                    {event?.registrationToken && (
                                        <div className="space-y-4">
                                            <div className="text-xs flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-blue-600 dark:text-blue-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                <span className="truncate flex-1">Lien de participation généré</span>
                                                <button type="button" onClick={() => {
                                                    const url = `${window.location.origin}/public/event/register/${event.registrationToken}`;
                                                    navigator.clipboard.writeText(url);
                                                    setAlertMessage({ show: true, title: t('success'), message: t('link_copied'), type: 'success' });
                                                }} className="px-2 py-1 bg-white dark:bg-black/20 rounded border border-blue-200 dark:border-blue-800 text-[10px] font-bold">Copier</button>
                                            </div>

                                            <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-black/40 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                                <div className="bg-white p-4 rounded-xl shadow-sm">
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/public/event/register/${event.registrationToken}`)}`} alt="QR Code" className="w-[160px] h-[160px]" />
                                                </div>
                                                <button type="button" onClick={async () => {
                                                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/public/event/register/${event.registrationToken}`)}`;
                                                    const response = await fetch(qrUrl);
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url; link.download = `QR_Code_${event.title}.png`;
                                                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                                                    window.URL.revokeObjectURL(url);
                                                }} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-600 dark:text-white hover:bg-gray-100 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Télécharger le QR Code</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{event?.eventParticipants?.length || 0} {t('participants')}</h4>
                                    <div className="flex gap-2">
                                        <button onClick={handleExportExcel} className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-100">Excel</button>
                                        <button onClick={handleExportPDF} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100">PDF</button>
                                    </div>
                                </div>

                                <div className="space-y-3 p-6 bg-white dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex gap-6 border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
                                        <button onClick={() => setAddMode('member')} className={`text-xs font-extrabold uppercase tracking-widest ${addMode === 'member' ? 'text-indigo-600 dark:text-white' : 'text-gray-400'}`}>{t('add_member')}</button>
                                        <button onClick={() => setAddMode('guest')} className={`text-xs font-extrabold uppercase tracking-widest ${addMode === 'guest' ? 'text-indigo-600 dark:text-white' : 'text-gray-400'}`}>{t('add_guest')}</button>
                                    </div>

                                    {addMode === 'member' ? (
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <SearchableSelect options={getAvailableMembers().map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName} (${m.memberCode || '-'})` }))} value={selectedMemberToAdd} onChange={setSelectedMemberToAdd} placeholder={t('select_member')} />
                                            </div>
                                            <button
                                                onClick={handleAddParticipant}
                                                disabled={!selectedMemberToAdd || loadingParticipant}
                                                className="px-6 bg-indigo-600 text-white rounded-xl font-bold text-xs disabled:opacity-50 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                            >
                                                {loadingParticipant && <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                                {t('add')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <input className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3 text-sm outline-none" placeholder={t('name') + " *"} value={guestData.guestName} onChange={e => setGuestData({ ...guestData, guestName: e.target.value })} />
                                            <div className="flex gap-4">
                                                <input className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3 text-sm outline-none" placeholder="Email" value={guestData.guestEmail} onChange={e => setGuestData({ ...guestData, guestEmail: e.target.value })} />
                                                <input className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-5 py-3 text-sm outline-none" placeholder={t('phone')} value={guestData.guestPhone} onChange={e => setGuestData({ ...guestData, guestPhone: e.target.value })} />
                                                <button
                                                    onClick={handleAddParticipant}
                                                    disabled={!guestData.guestName || loadingParticipant}
                                                    className="px-8 bg-indigo-600 text-white rounded-xl font-bold text-xs disabled:opacity-50 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                                >
                                                    {loadingParticipant && <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                                    {t('add')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-black/20">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-black/40">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('type')}</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('name')}</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('contact')}</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest w-24 text-right">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                            {(event?.eventParticipants || []).map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 capitalize font-bold text-[10px] tracking-widest text-indigo-500">{p.userId ? t('member') : t('guest')}</td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{p.user ? `${p.user.firstName} ${p.user.lastName}` : p.guestName}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">{p.user?.email || p.guestEmail || '-'}</div>
                                                        <div className="text-[10px] text-gray-400">{p.user?.phone || p.guestPhone || ''}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => onRemoveParticipant(p.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">{t('remove')}</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-8 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-all">{t('cancel')}</button>
                        {activeTab === 'details' && (
                            <button form="eventForm" type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-[12px] font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95">{t('save')}</button>
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
