import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import AdminLayout from '../../../layouts/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';
import * as XLSX from 'xlsx';
import SundaySchoolReportForm from './SundaySchoolReportForm';
import AlertModal from '../../../components/ChurchAlertModal';

import SundaySchoolReportDetails from './SundaySchoolReportDetails';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ArrowLeftIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const ExcelIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PDFIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const ReportIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

const SundaySchoolClassDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [cls, setCls] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showConsultModal, setShowConsultModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [activeTab, setActiveTab] = useState('members'); // 'members' | 'reports'
    const [reports, setReports] = useState([]);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState('excel'); // 'excel' | 'pdf'
    const [selectedFields, setSelectedFields] = useState({
        memberCode: true,
        name: true,
        age: true,
        birthDate: false,
        baptismalStatus: true,
        role: true,
        status: true,
        email: false,
        phone: false
    });

    const exportFieldsConfig = [
        { id: 'memberCode', label: t('participant_code') },
        { id: 'name', label: t('participant_name') },
        { id: 'age', label: t('age') },
        { id: 'birthDate', label: t('birth_date') },
        { id: 'baptismalStatus', label: t('category', 'Catégorie') },
        { id: 'role', label: t('member_role') },
        { id: 'status', label: t('status') },
        { id: 'email', label: t('email', 'Email') },
        { id: 'phone', label: t('phone', 'Téléphone') }
    ];

    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const getExportData = () => {
        return (cls.classMembers || []).map(member => {
            const row = {};
            if (selectedFields.memberCode) row[t('participant_code')] = member.memberCode || '-';
            if (selectedFields.name) row[t('participant_name')] = `${member.firstName} ${member.lastName}`;
            if (selectedFields.age) row[t('age')] = calculateAge(member.birthDate);
            if (selectedFields.birthDate) row[t('birth_date')] = member.birthDate ? new Date(member.birthDate).toLocaleDateString() : '-';
            if (selectedFields.baptismalStatus) row[t('category', 'Catégorie')] = member.category?.name || t(member.baptismalStatus) || '-';
            if (selectedFields.role) row[t('member_role')] = Array.isArray(member.role) ? member.role.join(', ') : member.role;
            if (selectedFields.status) row[t('status')] = member.status || '-';
            if (selectedFields.email) row[t('email', 'Email')] = member.email || '-';
            if (selectedFields.phone) row[t('phone', 'Téléphone')] = member.phone || '-';
            return row;
        });
    };

    const handleExportExcel = () => {
        if (!cls) return;

        const churchName = cls.church?.name || t('church', 'Mon Église');
        const currentYear = new Date().getFullYear();
        const monitorNames = cls.monitors?.map(m => `${m.user?.firstName} ${m.user?.lastName}`).join(', ') || '-';

        const data = getExportData();
        const headers = Object.keys(data[0] || {});

        const headerAOA = [
            [churchName],
            [`École dominicale : ${currentYear}`],
            [`Classe : ${cls.name} : moniteur : ${monitorNames}`],
            [`Total participants : ${cls.classMembers?.length || 0}`],
            [], // Empty row
            headers
        ];

        const dataAOA = data.map(row => headers.map(h => row[h]));
        const fullAOA = [...headerAOA, ...dataAOA];
        const worksheet = XLSX.utils.aoa_to_sheet(fullAOA);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport");

        XLSX.writeFile(workbook, `Report_${cls.name}_${currentYear}.xlsx`);
        setShowExportModal(false);
    };

    const handleExportPDF = () => {
        if (!cls) return;

        const doc = new jsPDF();
        const churchName = cls.church?.name || t('church', 'Mon Église');
        const currentYear = new Date().getFullYear();
        const monitorNames = cls.monitors?.map(m => `${m.user?.firstName} ${m.user?.lastName}`).join(', ') || '-';

        // Header Title
        doc.setFontSize(22);
        doc.setTextColor(43, 54, 116); // #2B3674
        doc.text(cls.name, 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(churchName, 14, 28);
        doc.text(`École dominicale : ${currentYear}`, 14, 34);
        doc.text(`Moniteur(s) : ${monitorNames}`, 14, 40);

        // Summary Statistics Box
        doc.setDrawColor(200);
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, 48, 180, 20, 3, 3, 'FD');

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Total Participants : ${cls.classMembers?.length || 0}`, 20, 58);
        doc.text(`Groupe d'âge : ${cls.minAge || 0} - ${cls.maxAge || '∞'} ans`, 80, 58);
        doc.text(`Statut : ${cls.isDynamic ? 'Dynamique' : 'Manuel'}`, 140, 58);

        // Members Table
        const data = getExportData();
        const headers = Object.keys(data[0] || {});
        const tableBody = data.map(row => headers.map(h => row[h]));

        autoTable(doc, {
            head: [headers],
            body: tableBody,
            startY: 75,
            theme: 'striped',
            headStyles: { fillColor: [43, 54, 116] },
            styles: { fontSize: 9, cellPadding: 3 }
        });

        const time = new Date().getTime();
        doc.save(`${cls.name}_Report_${time}.pdf`);
        setShowExportModal(false);
    };

    const openExportSettings = (type) => {
        setExportType(type);
        setShowExportModal(true);
    };

    const handleExportReportsExcel = () => {
        if (reports.length === 0) return;
        const currentYear = new Date().getFullYear();
        const data = reports.map(r => ({
            [t('date')]: new Date(r.date).toLocaleDateString(),
            [t('title')]: r.title || '-',
            [t('lesson_title')]: r.lessonTitle,
            [t('attendance')]: `${r.presentCount} / ${(r.presentCount || 0) + (r.absentCount || 0) + (r.excusedCount || 0)}`,
            [t('offering')]: `${r.offeringAmount} HTG`,
            [t('submitted_by')]: `${r.submittedBy?.firstName} ${r.submittedBy?.lastName}`
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rapports");
        XLSX.writeFile(workbook, `Reports_History_${cls.name}_${currentYear}.xlsx`);
    };

    const handleExportReportsPDF = () => {
        if (reports.length === 0) return;
        const doc = new jsPDF();
        const churchName = cls.church?.name || t('church', 'Mon Église');
        const currentYear = new Date().getFullYear();

        doc.setFontSize(22);
        doc.setTextColor(43, 54, 116);
        doc.text(`Historique des Rapports : ${cls.name}`, 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(churchName, 14, 28);
        doc.text(`Généré le : ${new Date().toLocaleString()}`, 14, 34);

        const tableBody = reports.map(r => [
            new Date(r.date).toLocaleDateString(),
            r.title || '-',
            `${r.presentCount} / ${(r.presentCount || 0) + (r.absentCount || 0) + (r.excusedCount || 0)}`,
            `${r.offeringAmount} HTG`,
            `${r.submittedBy?.firstName} ${r.submittedBy?.lastName}`
        ]);

        autoTable(doc, {
            head: [[t('date'), t('title'), t('attendance'), t('offering'), t('submitted_by')]],
            body: tableBody,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [43, 54, 116] },
            styles: { fontSize: 9, cellPadding: 3 }
        });

        doc.save(`Reports_History_${cls.name}_${currentYear}.pdf`);
    };

    const fetchClassDetails = async () => {
        try {
            const response = await api.get(`/sunday-school/classes/${id}`);
            setCls(response.data);
        } catch (error) {
            console.error("Error fetching class details:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            const response = await api.get(`/sunday-school/reports?classId=${id}`);
            setReports(response.data);
        } catch (error) {
            console.error("Error fetching reports:", error);
        }
    };

    useEffect(() => {
        fetchClassDetails();
        fetchReports();
    }, [id]);

    const handleConsultReport = (reportId) => {
        setSelectedReportId(reportId);
        setShowConsultModal(true);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="p-8 flex items-center justify-center min-h-[60vh]">
                    <div className="text-gray-400 font-bold tracking-widest text-[11px] animate-pulse">{t('loading')}</div>
                </div>
            </AdminLayout>
        );
    }

    if (!cls) {
        return (
            <AdminLayout>
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Classe non trouvée</h2>
                    <button onClick={() => navigate('/admin/sunday-school/classes')} className="text-indigo-600 font-bold hover:underline">
                        Retour à la liste
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
                    <button
                        onClick={() => navigate('/admin/sunday-school/classes')}
                        className="p-4 text-gray-400 hover:text-indigo-600 bg-white dark:bg-[#151515] hover:bg-gray-50 dark:hover:bg-black border border-gray-100 dark:border-white/5 rounded-2xl transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeftIcon />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                            {cls.name}
                        </h1>
                        <p className="text-[14px] font-medium text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-[10px] bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                                {cls.church?.name || t('church')}
                            </span>
                            • {cls.description || t('class_details')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="w-full md:w-auto px-6 py-4 bg-indigo-600 text-white font-bold text-[13px] rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        <ReportIcon />
                        {t('new_weekly_report', 'Nouveau Rapport Hebdomadaire')}
                    </button>
                </div>

                {/* Class Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-2 uppercase">{t('age_group')}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {cls.minAge || 0} - {cls.maxAge || '∞'} {t('years')}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-2 uppercase">{t('total_participants')}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {cls.classMembers?.length || 0}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-2 uppercase">{t('status', 'Statut')}</p>
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-widest ${cls.isDynamic ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                            {cls.isDynamic ? 'DYNAMIQUE' : 'MANUEL'}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'members'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg'
                            : 'bg-white dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white border border-gray-50 dark:border-white/5'
                            }`}
                    >
                        {t('members')}
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'reports'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg'
                            : 'bg-white dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white border border-gray-50 dark:border-white/5'
                            }`}
                    >
                        {t('reports', 'Rapports')} ({reports.length})
                    </button>
                </div>

                {/* Main Content Area */}
                {activeTab === 'members' ? (
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-10 py-8 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('members')}</h2>
                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => openExportSettings('excel')}
                                    title={t('export_excel')}
                                    className="p-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-95 border border-green-100 dark:border-green-800/30"
                                >
                                    <ExcelIcon />
                                </button>
                                <button
                                    onClick={() => openExportSettings('pdf')}
                                    title={t('export_pdf')}
                                    className="p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 border border-red-100 dark:border-red-800/30"
                                >
                                    <PDFIcon />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-black/20">
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('participant_code')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('participant_name')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('age')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('category', 'Catégorie')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('member_role')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {cls.classMembers?.map(member => (
                                        <tr
                                            key={member.id}
                                            className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/admin/members/${member.id}`)}
                                        >
                                            <td className="px-10 py-6">
                                                <span className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-white/5 transition-all group-hover:scale-105 inline-block">
                                                    {member.memberCode || '-'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="font-bold text-gray-900 dark:text-white transition-colors group-hover:text-indigo-600">
                                                    {member.firstName} {member.lastName}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {calculateAge(member.birthDate)} {t('years')}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${member.category?.name ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/10 dark:text-indigo-400' : 'bg-gray-100 text-gray-400 dark:bg-white/5'}`}>
                                                    {member.category?.name || t(member.baptismalStatus) || '-'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className="px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-bold tracking-widest uppercase">
                                                    {Array.isArray(member.role) ? member.role[0] : member.role}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase ${member.status === 'Actif' || member.status === 'Active'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400'
                                                    : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                                                    }`}>
                                                    {member.status || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!cls.classMembers || cls.classMembers.length === 0) && (
                                        <tr>
                                            <td colSpan="7" className="px-10 py-20 text-center text-gray-400 font-bold tracking-widest text-[11px]">
                                                {t('no_members_found')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-10 py-8 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('reports_history', 'Historique des Rapports')}</h2>
                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <button
                                    onClick={handleExportReportsExcel}
                                    title={t('export_excel')}
                                    className="p-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-95 border border-green-100 dark:border-green-800/30"
                                >
                                    <ExcelIcon />
                                </button>
                                <button
                                    onClick={handleExportReportsPDF}
                                    title={t('export_pdf')}
                                    className="p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 border border-red-100 dark:border-red-800/30"
                                >
                                    <PDFIcon />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-black/20">
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('date')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('title')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('attendance')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('offering')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('submitted_by')}</th>
                                        <th className="px-10 py-5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {reports.map(report => (
                                        <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-10 py-6 text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                {new Date(report.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{report.title || '-'}</div>
                                                <div className="text-[11px] text-gray-400 line-clamp-1">{report.lessonTitle}</div>
                                            </td>
                                            <td className="px-10 py-6 text-sm font-bold text-emerald-500">
                                                {report.presentCount} / {(report.presentCount || 0) + (report.absentCount || 0) + (report.excusedCount || 0)}
                                            </td>
                                            <td className="px-10 py-6 text-sm font-bold text-amber-500">
                                                {report.offeringAmount} HTG
                                            </td>
                                            <td className="px-10 py-6 text-sm font-medium text-gray-500">
                                                {report.submittedBy?.firstName} {report.submittedBy?.lastName}
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <button
                                                    onClick={() => handleConsultReport(report.id)}
                                                    className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
                                                >
                                                    {t('view', 'Consulter')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {reports.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-10 py-20 text-center text-gray-400 font-bold tracking-widest text-[11px]">
                                                {t('no_reports_found', 'Aucun rapport disponible')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <SundaySchoolReportForm
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                classData={cls}
                onReportSubmitted={() => {
                    fetchReports(); // Refresh history
                    setAlertMessage({ show: true, title: t('success'), message: t('report_submitted_success', 'Rapport soumis avec succès !'), type: 'success' });
                }}
            />

            {/* Export Settings Modal */}
            {
                showExportModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExportModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] w-full max-w-md p-10 relative z-10 border border-gray-100 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('export_options', 'Options d\'exportation')}
                            </h3>
                            <p className="text-sm text-gray-500 mb-8">
                                {t('select_export_fields', 'Sélectionnez les champs à inclure dans votre rapport.')}
                            </p>

                            <div className="grid grid-cols-1 gap-3 mb-10">
                                {exportFieldsConfig.map(field => (
                                    <label key={field.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-indigo-500/30 transition-all cursor-pointer group">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{field.label}</span>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={selectedFields[field.id]}
                                                onChange={() => setSelectedFields({ ...selectedFields, [field.id]: !selectedFields[field.id] })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="flex-1 px-8 py-4 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 font-bold text-[13px] rounded-2xl hover:text-gray-700 dark:hover:text-white transition-all uppercase tracking-widest"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={exportType === 'excel' ? handleExportExcel : handleExportPDF}
                                    className={`flex-1 px-8 py-4 ${exportType === 'excel' ? 'bg-green-600 shadow-green-100' : 'bg-red-600 shadow-red-100'} text-white font-bold text-[13px] rounded-2xl hover:opacity-90 shadow-xl transition-all uppercase tracking-widest active:scale-95`}
                                >
                                    {t('export', 'Exporter')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <SundaySchoolReportDetails
                isOpen={showConsultModal}
                onClose={() => setShowConsultModal(false)}
                reportId={selectedReportId}
            />

            <AlertModal
                isOpen={alertMessage.show}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
            />
        </AdminLayout >
    );
};

export default SundaySchoolClassDetails;
