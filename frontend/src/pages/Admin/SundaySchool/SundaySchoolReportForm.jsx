import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import api from '../../../api/axios';
import AlertModal from '../../../components/ChurchAlertModal';

const SundaySchoolReportForm = ({ isOpen, onClose, classData, onReportSubmitted, editId = null }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [attendance, setAttendance] = useState([]);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        title: `Rapport du Dimanche ${new Date().toLocaleDateString()}`,
        lessonTitle: '',
        totalLessonPoints: 0,
        coveredLessonPoints: 0,
        goldenText: '',
        bibleCount: 0,
        hymnalCount: 0,
        offeringAmount: 0,
        monitorExpectations: '',
        participantExpectations: '',
        observations: '',
        spiritualProgress: '',
        submittedById: ''
    });

    useEffect(() => {
        if (classData?.classMembers && !editId) {
            // Filter only active members and deduplicate by ID just in case
            const activeMembers = classData.classMembers.filter(m =>
                m.sunday_school_member?.level === 'Actuel'
            );

            // Deduplicate by member ID
            const uniqueActive = [];
            const seenIds = new Set();

            for (const m of activeMembers) {
                if (!seenIds.has(m.id)) {
                    seenIds.add(m.id);
                    uniqueActive.push(m);
                }
            }

            setAttendance(uniqueActive.map(m => ({
                userId: m.id,
                name: `${m.firstName} ${m.lastName}`,
                status: 'present'
            })));
        }
    }, [classData, editId]);

    useEffect(() => {
        if (editId && isOpen) {
            const fetchReportForEdit = async () => {
                setLoading(true);
                try {
                    const response = await api.get(`/sunday-school/reports/${editId}`);
                    const { report, attendance: attData } = response.data;
                    setFormData({
                        date: report.date,
                        title: report.title,
                        lessonTitle: report.lessonTitle || '',
                        totalLessonPoints: report.totalLessonPoints || 0,
                        coveredLessonPoints: report.coveredLessonPoints || 0,
                        goldenText: report.goldenText || '',
                        bibleCount: report.bibleCount || 0,
                        hymnalCount: report.hymnalCount || 0,
                        offeringAmount: report.offeringAmount || 0,
                        monitorExpectations: report.monitorExpectations || '',
                        participantExpectations: report.participantExpectations || '',
                        observations: report.observations || '',
                        spiritualProgress: report.spiritualProgress || '',
                        submittedById: report.submittedById || ''
                    });
                    setAttendance(attData.map(a => ({
                        userId: a.userId,
                        name: `${a.user?.firstName} ${a.user?.lastName}`,
                        status: a.status
                    })));
                } catch (error) {
                    console.error("Error fetching report for edit:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchReportForEdit();
        }
    }, [editId, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAttendanceChange = (userId, status) => {
        setAttendance(prev => prev.map(a =>
            a.userId === userId ? { ...a, status } : a
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const presentCount = attendance.filter(a => a.status === 'present').length;
            const absentCount = attendance.filter(a => a.status === 'absent').length;
            const excusedCount = attendance.filter(a => a.status === 'excused').length;

            const submittedByIdVal = formData.submittedById ? parseInt(formData.submittedById) : null;

            const reportData = {
                ...formData,
                classId: classData.id,
                presentCount,
                absentCount,
                excusedCount,
                attendance,
                submittedById: (submittedByIdVal && !isNaN(submittedByIdVal)) ? submittedByIdVal : null
            };

            console.log("[SundaySchoolReportForm] Submitting with ID:", reportData.submittedById, reportData);

            console.log("[SundaySchoolReportForm] Submitting with ID:", reportData.submittedById, reportData);

            if (editId) {
                await api.put(`/sunday-school/reports/${editId}`, reportData);
            } else {
                await api.post('/sunday-school/reports', reportData);
            }
            onReportSubmitted();
            onClose();
        } catch (error) {
            console.error("Error submitting report:", error);
            setAlertMessage({ show: true, title: t('error'), message: t('report_submit_error', 'Erreur lors de la soumission du rapport'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-12">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

                <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 dark:border-white/10">
                    <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-10 py-8 border-b border-gray-50 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {t('weekly_report', 'Rapport Hebdomadaire')}
                                </h2>
                                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">
                                    {classData?.name}
                                </p>
                            </div>
                            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-10">
                            {/* General Info */}
                            <section>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                                    {t('general_info', 'Informations Générales')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('meeting_date', 'Date de la Rencontre')}</label>
                                        <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('meeting_title', 'Nom de la rencontre')}</label>
                                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('submitted_by', 'Soumis par')}</label>
                                        <select
                                            name="submittedById"
                                            value={formData.submittedById}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all"
                                        >
                                            <option value="">{t('current_user', 'Utilisateur connecté (Moi)')}</option>
                                            {classData?.monitors?.map(m => (
                                                <option key={m.id} value={m.user?.id || m.userId}>
                                                    {m.user?.firstName} {m.user?.lastName} ({t(m.role)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Lesson Section */}
                            <section>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                                    {t('lesson_details', 'Détails de la Leçon')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('lesson_title_form', 'La leçon vue')}</label>
                                        <input type="text" name="lessonTitle" value={formData.lessonTitle} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('total_lesson_points', 'Nombre de points de la leçon')}</label>
                                        <input type="number" name="totalLessonPoints" value={formData.totalLessonPoints} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('covered_lesson_points', 'Nombre de points vus')}</label>
                                        <input type="number" name="coveredLessonPoints" value={formData.coveredLessonPoints} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('golden_text', 'Texte d\'or')}</label>
                                        <textarea name="goldenText" value={formData.goldenText} onChange={handleInputChange} rows="2" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all resize-none"></textarea>
                                    </div>
                                </div>
                            </section>

                            {/* Attendance */}
                            <section>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                                    {t('attendance_list', 'Liste des Participants')}
                                </h3>
                                <div className="bg-gray-50/50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                <th className="px-6 py-4">{t('name')}</th>
                                                <th className="px-6 py-4 text-center">{t('present')}</th>
                                                <th className="px-6 py-4 text-center">{t('absent')}</th>
                                                <th className="px-6 py-4 text-center">{t('excused')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-[13px]">
                                            {attendance.map(m => (
                                                <tr key={m.userId} className="hover:bg-white dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{m.name}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input type="radio" name={`attend-${m.userId}`} checked={m.status === 'present'} onChange={() => handleAttendanceChange(m.userId, 'present')} className="w-4 h-4 text-indigo-600" />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input type="radio" name={`attend-${m.userId}`} checked={m.status === 'absent'} onChange={() => handleAttendanceChange(m.userId, 'absent')} className="w-4 h-4 text-rose-600" />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input type="radio" name={`attend-${m.userId}`} checked={m.status === 'excused'} onChange={() => handleAttendanceChange(m.userId, 'excused')} className="w-4 h-4 text-amber-600" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Metrics */}
                            <section>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                                    {t('lesson_metrics', 'Indicateurs de Participation')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('bible_count', 'Nombre de bibles')}</label>
                                        <input type="number" name="bibleCount" value={formData.bibleCount} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('hymnal_count', 'Nombre de chants')}</label>
                                        <input type="number" name="hymnalCount" value={formData.hymnalCount} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('offering_collected', 'Quantité d\'offrande ramassée')}</label>
                                        <input type="number" step="0.01" name="offeringAmount" value={formData.offeringAmount} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all" />
                                    </div>
                                </div>
                            </section>

                            {/* Qualitative feedback */}
                            <section className="space-y-6">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                                    {t('feedback_and_expectations', 'Feedback et Attentes')}
                                </h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('monitor_notes', 'Notes du moniteur concernant la leçon')}</label>
                                    <textarea name="observations" value={formData.observations} onChange={handleInputChange} rows="3" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all resize-none"></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('monitor_expectations', 'Attentes du moniteur')}</label>
                                        <textarea name="monitorExpectations" value={formData.monitorExpectations} onChange={handleInputChange} rows="2" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all resize-none"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('participant_expectations', 'Attentes des participants')}</label>
                                        <textarea name="participantExpectations" value={formData.participantExpectations} onChange={handleInputChange} rows="2" className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all resize-none"></textarea>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="px-10 py-8 border-t border-gray-50 dark:border-white/5 flex justify-end gap-4 bg-gray-50/50 dark:bg-black/20">
                            <button type="button" onClick={onClose} className="px-8 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl text-[13px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
                                {t('cancel')}
                            </button>
                            <button type="submit" disabled={loading} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 disabled:opacity-50">
                                {loading ? t('submitting', 'Envoi...') : t('submit_report', 'Soumettre le Rapport')}
                            </button>
                        </div>
                    </form>
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

export default SundaySchoolReportForm;
