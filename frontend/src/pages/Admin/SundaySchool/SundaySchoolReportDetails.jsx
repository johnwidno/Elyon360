import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import api from '../../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SundaySchoolReportDetails = ({ isOpen, onClose, reportId }) => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const handleExportDetailedPDF = () => {
        if (!data?.report) return;
        const { report, attendance } = data;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(43, 54, 116);
        doc.text(report.title || t('weekly_report'), 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Classe : ${report.class?.name}`, 14, 28);
        doc.text(`Date : ${new Date(report.date).toLocaleDateString()}`, 14, 34);
        doc.text(`Soumis par : ${report.submittedBy?.firstName} ${report.submittedBy?.lastName}`, 14, 40);

        // Stats Summary
        doc.setDrawColor(200);
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, 48, 180, 25, 3, 3, 'FD');

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Présents : ${report.presentCount}`, 20, 58);
        doc.text(`Offrande : ${report.offeringAmount} HTG`, 80, 58);
        doc.text(`Leçon : ${report.coveredLessonPoints}/${report.totalLessonPoints}`, 140, 58);
        doc.text(`Bibles : ${report.bibleCount}`, 20, 65);
        doc.text(`Chants : ${report.hymnalCount}`, 80, 65);

        // Lesson Info
        doc.setFontSize(12);
        doc.setTextColor(43, 54, 116);
        doc.text(`Leçon : ${report.lessonTitle || '-'}`, 14, 85);

        doc.setFontSize(10);
        doc.setTextColor(100);
        const splitText = doc.splitTextToSize(`Texte d'or : "${report.goldenText || '-'}"`, 180);
        doc.text(splitText, 14, 92);

        // Observations Section
        doc.text(`Observations : ${report.observations || '-'}`, 14, 110);
        doc.text(`Progrès Spirituel : ${report.spiritualProgress || '-'}`, 14, 120);

        // Attendance Table
        const tableBody = attendance.map(a => [
            `${a.user?.firstName} ${a.user?.lastName}`,
            a.user?.memberCode || '-',
            t(a.status)
        ]);

        autoTable(doc, {
            head: [[t('name'), t('code'), t('status')]],
            body: tableBody,
            startY: 130,
            theme: 'striped',
            headStyles: { fillColor: [43, 54, 116] },
            styles: { fontSize: 9, cellPadding: 3 }
        });

        doc.save(`Report_${report.class?.name}_${new Date(report.date).toLocaleDateString()}.pdf`);
    };

    useEffect(() => {
        if (isOpen && reportId) {
            setLoading(true);
            const fetchReportDetails = async () => {
                try {
                    const response = await api.get(`/sunday-school/reports/${reportId}`);
                    setData(response.data);
                } catch (error) {
                    console.error("Error fetching report details:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchReportDetails();
        }
    }, [isOpen, reportId]);

    if (!isOpen) return null;

    const report = data?.report;
    const attendance = data?.attendance || [];

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-12">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

                <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 dark:border-white/10">
                    {loading ? (
                        <div className="p-20 text-center text-gray-400 font-bold tracking-widest text-[11px] animate-pulse">
                            {t('loading')}...
                        </div>
                    ) : !report ? (
                        <div className="p-20 text-center text-gray-400 font-bold tracking-widest text-[11px]">
                            {t('report_not_found', 'Rapport non trouvé')}
                        </div>
                    ) : (
                        <div className="flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="px-10 py-8 border-b border-gray-50 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                        {report.title || t('weekly_report')}
                                    </h2>
                                    <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1">
                                        {report.class?.name} • {new Date(report.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {data?.canExport && (
                                        <button
                                            type="button"
                                            onClick={handleExportDetailedPDF}
                                            className="p-3 bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 text-gray-400 hover:text-red-500 rounded-2xl transition-all active:scale-95 shadow-sm flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            {t('export_pdf')}
                                        </button>
                                    )}
                                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-12 text-left">
                                {/* Qualitative Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gray-50/50 dark:bg-black/20 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                                        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">{t('attendance')}</p>
                                        <div className="flex justify-between items-end">
                                            <span className="text-2xl font-black text-emerald-500">{report.presentCount}</span>
                                            <span className="text-[11px] font-bold text-gray-400">{t('present')}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-black/20 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                                        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">{t('offering')}</p>
                                        <div className="flex justify-between items-end">
                                            <span className="text-2xl font-black text-indigo-500">{report.offeringAmount}</span>
                                            <span className="text-[11px] font-bold text-gray-400">{t('currency', 'HTG')}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-black/20 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                                        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">{t('lesson_completion', 'Complétion')}</p>
                                        <div className="flex justify-between items-end">
                                            <span className="text-2xl font-black text-amber-500">
                                                {report.totalLessonPoints > 0 ? Math.round((report.coveredLessonPoints / report.totalLessonPoints) * 100) : 0}%
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-400">{report.coveredLessonPoints}/{report.totalLessonPoints}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Lesson Details */}
                                <section>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-white/5 pb-4">{t('lesson_details')}</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">{t('lesson_title')}</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">{report.lessonTitle || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('golden_text')}</p>
                                            <p className="text-sm italic text-gray-600 dark:text-gray-300 leading-relaxed bg-amber-50/50 dark:bg-amber-900/5 p-4 rounded-2xl border border-amber-100/50 dark:border-amber-900/10">
                                                "{report.goldenText || '-'}"
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Detailed Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <section>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-white/5 pb-4">{t('participation_metrics', 'Indicateurs')}</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-black/10 rounded-2xl">
                                                <span className="text-[11px] font-bold text-gray-500">{t('bible_count')}</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-white">{report.bibleCount}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-black/10 rounded-2xl">
                                                <span className="text-[11px] font-bold text-gray-500">{t('hymnal_count')}</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-white">{report.hymnalCount}</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-white/5 pb-4">{t('feedback', 'Observations')}</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">{t('observations')}</p>
                                                <p className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-3">{report.observations || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">{t('spiritual_progress')}</p>
                                                <p className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-3">{report.spiritualProgress || '-'}</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Attendance List */}
                                {data?.canViewAttendance && (
                                    <section>
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-white/5 pb-4">{t('attendance_list')}</h3>
                                        <div className="bg-white dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 dark:bg-black/40">
                                                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        <th className="px-6 py-4">{t('name')}</th>
                                                        <th className="px-6 py-4">{t('code')}</th>
                                                        <th className="px-6 py-4 text-center">{t('status')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                                    {attendance.map(a => (
                                                        <tr key={a.id} className="text-[13px]">
                                                            <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">
                                                                {a.user?.firstName} {a.user?.lastName}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-400 font-mono text-[11px]">
                                                                {a.user?.memberCode || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${a.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                                                                    a.status === 'absent' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                                                    }`}>
                                                                    {t(a.status)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-10 py-8 border-t border-gray-50 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                                <div className="text-[11px] font-medium text-gray-400">
                                    {t('submitted_by')}: <span className="font-bold text-gray-600 dark:text-gray-300">{report.submittedBy?.firstName} {report.submittedBy?.lastName}</span>
                                    <span className="mx-2">•</span>
                                    {new Date(report.createdAt).toLocaleString()}
                                </div>
                                <button type="button" onClick={onClose} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95">
                                    {t('close', 'Fermer')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SundaySchoolReportDetails;
