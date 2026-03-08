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
import ConfirmModal from '../../../components/ConfirmModal';

const ArrowLeftIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const ExcelIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PDFIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const ReportIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

const SundaySchoolClassDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const [cls, setCls] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showConsultModal, setShowConsultModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [editReportId, setEditReportId] = useState(null);
    const [activeTab, setActiveTab] = useState('members'); // 'members' | 'reports'
    const [memberSubTab, setMemberSubTab] = useState('active'); // 'active' | 'history'
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [memberDateRange, setMemberDateRange] = useState({ start: '', end: '' });
    const [reportDateRange, setReportDateRange] = useState({ start: '', end: '', month: 'all', year: new Date().getFullYear().toString() });
    const [reports, setReports] = useState([]);
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
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
        level: true,
        gender: true,
        maritalStatus: true,
        email: false,
        phone: false
    });

    const exportFieldsConfig = [
        { id: 'memberCode', label: t('participant_code') },
        { id: 'name', label: t('participant_name') },
        { id: 'age', label: t('age') },
        { id: 'gender', label: t('gender', 'Sexe') },
        { id: 'maritalStatus', label: t('marital_status', 'Statut Matrimonial') },
        { id: 'birthDate', label: t('birth_date') },
        { id: 'baptismalStatus', label: t('category', 'Catégorie') },
        { id: 'role', label: t('member_role') },
        { id: 'status', label: t('status') },
        { id: 'level', label: t('level', 'Niveau') },
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

    const buildExportRow = (member) => {
        const row = {};
        if (selectedFields.memberCode) row[t('participant_code')] = member.memberCode || '-';
        if (selectedFields.name) row[t('participant_name')] = `${member.firstName} ${member.lastName}`;
        if (selectedFields.age) row[t('age')] = calculateAge(member.birthDate);
        if (selectedFields.birthDate) row[t('birth_date')] = member.birthDate ? new Date(member.birthDate).toLocaleDateString() : '-';
        if (selectedFields.baptismalStatus) row[t('category', 'Catégorie')] = member.contactSubtype?.name || member.category?.name || t(member.baptismalStatus) || '-';
        if (selectedFields.role) row[t('member_role')] = Array.isArray(member.role) ? (member.role[0] || '-') : member.role;
        if (selectedFields.gender) row[t('gender', 'Sexe')] = t(member.gender?.toLowerCase()) || member.gender || '-';
        if (selectedFields.maritalStatus) row[t('marital_status', 'Statut Matrimonial')] = t(member.maritalStatus?.toLowerCase()) || member.maritalStatus || '-';
        if (selectedFields.status) row[t('status')] = member.status || '-';
        if (selectedFields.level) row[t('level', 'Niveau')] = member.sunday_school_member?.level || 'Actuel';
        if (selectedFields.email) row[t('email', 'Email')] = member.email || '-';
        if (selectedFields.phone) row[t('phone', 'Téléphone')] = member.phone || '-';
        return row;
    };

    const getExportData = () => {
        return cls.classMembers?.filter(m => {
            // 1. Tab Level Filter
            const levelMatch = memberSubTab === 'active'
                ? m.sunday_school_member?.level === 'Actuel'
                : m.sunday_school_member?.level === 'non-actuel';

            if (!levelMatch) return false;

            // 2. Search Term Filter
            const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
            if (memberSearchTerm && !fullName.includes(memberSearchTerm.toLowerCase()) && !m.memberCode?.toLowerCase().includes(memberSearchTerm.toLowerCase())) {
                return false;
            }

            // 3. Date Range Filter
            if (memberDateRange.start || memberDateRange.end) {
                const memberDate = new Date(m.sunday_school_member?.joinedAt);
                if (memberDateRange.start && memberDate < new Date(memberDateRange.start)) return false;
                if (memberDateRange.end) {
                    const endDate = new Date(memberDateRange.end);
                    endDate.setHours(23, 59, 59, 999);
                    if (memberDate > endDate) return false;
                }
            }

            return true;
        }) || [];
    };

    const handleExportExcel = () => {
        if (!cls) return;

        const churchName = cls.church?.name || t('church', 'Mon Église');
        const currentYear = new Date().getFullYear();
        const monitorNames = cls.monitors?.map(m => `${m.user?.firstName} ${m.user?.lastName}`).join(', ') || '-';

        const filteredMembers = getExportData();
        const firstRow = filteredMembers.length > 0 ? buildExportRow(filteredMembers[0]) : {};
        const headers = Object.keys(firstRow);

        const participantCount = memberSubTab === 'active'
            ? (cls.classMembers?.filter(m => m.sunday_school_member?.level === 'Actuel').length || 0)
            : (cls.classMembers?.filter(m => m.sunday_school_member?.level === 'non-actuel').length || 0);

        const headerAOA = [
            [churchName],
            [`École dominicale : ${currentYear}`],
            [`Classe : ${cls.name} : moniteur : ${monitorNames}`],
            [`Total participants : ${participantCount}`],
            [`Liste : ${memberSubTab === 'active' ? `${t('active_members', 'Actuels')} - ${currentYear}` : t('members_history', 'Historique')}`],
            [], // Empty row
        ];

        let dataAOA = [];
        if (memberSubTab === 'active') {
            dataAOA.push(headers);
            filteredMembers.forEach(m => {
                const row = buildExportRow(m);
                dataAOA.push(headers.map(h => row[h]));
            });
        } else {
            // Group by year for History
            const grouped = {};
            filteredMembers.forEach(m => {
                const year = m.sunday_school_member?.leftAt
                    ? new Date(m.sunday_school_member.leftAt).getFullYear()
                    : new Date(m.sunday_school_member?.joinedAt).getFullYear();
                if (!grouped[year]) grouped[year] = [];
                grouped[year].push(m);
            });

            Object.keys(grouped).sort((a, b) => b - a).forEach(yearKey => {
                const year = parseInt(yearKey);
                const relativeText = year === currentYear ? `(${t('current_year', 'Année en cours')})` : `(${t('current_year', 'Année en cours')} - ${currentYear - year})`;
                dataAOA.push([`${t('year', 'Année')} ${year} ${relativeText}`]);
                dataAOA.push(headers);
                grouped[year].forEach(m => {
                    const row = buildExportRow(m);
                    dataAOA.push(headers.map(h => row[h]));
                });
                dataAOA.push([]); // Spacer
            });
        }

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

        const participantCount = memberSubTab === 'active'
            ? (cls.classMembers?.filter(m => m.sunday_school_member?.level === 'Actuel').length || 0)
            : (cls.classMembers?.filter(m => m.sunday_school_member?.level === 'non-actuel').length || 0);

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Total Participants : ${participantCount}`, 20, 58);
        doc.text(`Liste : ${memberSubTab === 'active' ? `${t('active_members', 'Actuels')} - ${currentYear}` : t('members_history', 'Historique')}`, 20, 64);
        doc.text(`Groupe d'âge : ${cls.minAge || 0} - ${cls.maxAge || '∞'} ans`, 80, 58);
        doc.text(`Statut : ${cls.isDynamic ? 'Dynamique' : 'Manuel'}`, 140, 58);

        // Members Table
        const filteredMembers = getExportData();
        const firstRow = filteredMembers.length > 0 ? buildExportRow(filteredMembers[0]) : {};
        const headers = Object.keys(firstRow);

        if (memberSubTab === 'active') {
            const tableBody = filteredMembers.map(m => {
                const row = buildExportRow(m);
                return headers.map(h => row[h]);
            });

            autoTable(doc, {
                head: [headers],
                body: tableBody,
                startY: 75,
                theme: 'striped',
                headStyles: { fillColor: [43, 54, 116] },
                styles: { fontSize: 8, cellPadding: 2 }
            });
        } else {
            // Group by year for History
            const grouped = {};
            filteredMembers.forEach(m => {
                const year = m.sunday_school_member?.leftAt
                    ? new Date(m.sunday_school_member.leftAt).getFullYear()
                    : new Date(m.sunday_school_member?.joinedAt).getFullYear();
                if (!grouped[year]) grouped[year] = [];
                grouped[year].push(m);
            });

            let currentY = 75;
            Object.keys(grouped).sort((a, b) => b - a).forEach(yearKey => {
                const year = parseInt(yearKey);
                const relativeText = year === currentYear ? `(${t('current_year', 'Année en cours')})` : `(${t('current_year', 'Année en cours')} - ${currentYear - year})`;
                doc.setFontSize(12);
                doc.setTextColor(43, 54, 116);
                doc.setFont(undefined, 'bold');
                doc.text(`${t('year', 'Année')} ${year} ${relativeText}`, 14, currentY);
                currentY += 5;

                const tableBody = grouped[year].map(m => {
                    const row = buildExportRow(m);
                    return headers.map(h => row[h]);
                });

                autoTable(doc, {
                    head: [headers],
                    body: tableBody,
                    startY: currentY,
                    theme: 'striped',
                    headStyles: { fillColor: [43, 54, 116] },
                    styles: { fontSize: 8, cellPadding: 2 },
                    margin: { top: 75 }
                });

                currentY = doc.lastAutoTable.finalY + 15;
                if (currentY > 270) {
                    doc.addPage();
                    currentY = 20;
                }
            });
        }

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

    const handleEditReport = (reportId) => {
        setEditReportId(reportId);
        setShowReportModal(true);
    };

    const handleDeleteReport = (reportId) => {
        setConfirmState({
            isOpen: true,
            title: t('delete_report', 'Supprimer le rapport'),
            message: t('confirm_delete_report', 'Êtes-vous sûr de vouloir supprimer ce rapport ?'),
            onConfirm: async () => {
                try {
                    await api.delete(`/sunday-school/reports/${reportId}`);
                    setReports(prev => prev.filter(r => r.id !== reportId));
                    setAlertMessage({ show: true, title: t('success'), message: t('report_deleted_success', 'Rapport supprimé avec succès'), type: 'success' });
                } catch (error) {
                    console.error("Error deleting report:", error);
                    setAlertMessage({ show: true, title: t('error'), message: t('report_delete_error', 'Erreur lors de la suppression'), type: 'error' });
                }
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeleteAllReports = () => {
        setConfirmState({
            isOpen: true,
            title: t('delete_all_reports', 'Supprimer TOUS les rapports'),
            message: t('confirm_delete_all_reports', 'Êtes-vous sûr de vouloir supprimer TOUS les rapports de cette classe ? Cette action est irréversible.'),
            onConfirm: () => {
                // Second confirmation
                setConfirmState({
                    isOpen: true,
                    title: t('final_confirmation', 'Confirmation finale'),
                    message: t('confirm_delete_all_reports_final', 'Confirmez-vous vraiment la suppression de l\'intégralité des rapports ?'),
                    onConfirm: async () => {
                        try {
                            await api.delete(`/sunday-school/reports-bulk/${id}`);
                            setReports([]);
                            setAlertMessage({
                                show: true,
                                title: t('success'),
                                message: t('all_reports_deleted_success', 'Tous les rapports ont été supprimés'),
                                type: 'success'
                            });
                        } catch (error) {
                            console.error("Error deleting all reports:", error);
                            const serverError = error.response?.data?.error;
                            const baseMsg = error.response?.data?.message || t('reports_delete_error', 'Erreur lors de la suppression massive');
                            const finalMsg = serverError ? `${baseMsg} (${serverError})` : baseMsg;

                            setAlertMessage({
                                show: true,
                                title: t('error'),
                                message: finalMsg,
                                type: 'error'
                            });
                        }
                        setConfirmState(prev => ({ ...prev, isOpen: false }));
                    }
                });
            }
        });
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-2 uppercase">{t('age_group')}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {cls.minAge || 0} - {cls.maxAge || '∞'} {t('years')}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-2 uppercase">{t('total_participants')}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {cls.classMembers?.filter(m => m.sunday_school_member?.level === 'Actuel').length || 0}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-2 uppercase">{t('status', 'Statut')}</p>
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-widest ${cls.isDynamic ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                            {cls.isDynamic ? 'DYNAMIQUE' : 'MANUEL'}
                        </span>
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-widest mb-2 uppercase">{t('monitors', 'Moniteur(s)')}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {cls.monitors?.map(m => `${m.user?.firstName} ${m.user?.lastName}`).join(', ') || '-'}
                        </p>
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
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('members')}</h2>
                                <div className="flex gap-4 mt-2">
                                    <button
                                        onClick={() => setMemberSubTab('active')}
                                        className={`text-[11px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${memberSubTab === 'active' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                        {t('active_members', 'Actuels')} ({cls.classMembers?.filter(m => m.sunday_school_member?.level === 'Actuel').length || 0})
                                    </button>
                                    <button
                                        onClick={() => setMemberSubTab('history')}
                                        className={`text-[11px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${memberSubTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                        {t('members_history', 'Historique')} ({cls.classMembers?.filter(m => m.sunday_school_member?.level === 'non-actuel').length || 0})
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap flex-1 justify-center md:justify-end gap-3 px-2">
                                <div className="relative group min-w-[200px]">
                                    <input
                                        type="text"
                                        placeholder={t('search_name', 'Rechercher par nom...')}
                                        value={memberSearchTerm}
                                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-2xl text-[13px] font-bold outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-black transition-all"
                                    />
                                    <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>

                                <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-black/20 border border-gray-100 dark:border-white/5 px-5 py-2.5 rounded-2xl">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('from', 'Du')}</span>
                                    <input
                                        type="date"
                                        value={memberDateRange.start}
                                        onChange={(e) => setMemberDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="bg-transparent text-[13px] font-black text-gray-600 dark:text-gray-300 outline-none uppercase"
                                    />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('to', 'Au')}</span>
                                    <input
                                        type="date"
                                        value={memberDateRange.end}
                                        onChange={(e) => setMemberDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="bg-transparent text-[13px] font-black text-gray-600 dark:text-gray-300 outline-none uppercase"
                                    />
                                </div>

                                <div className="flex gap-2">
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
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-black/20">
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('participant_code')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('participant_name')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('age')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('gender', 'Sexe')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('marital_status', 'Statut Matrimonial')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('category', 'Catégorie')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('member_role')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('status')}</th>
                                        <th className="px-10 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('level', 'Niveau')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {(() => {
                                        // Deduplicate members by ID to prevent repeated rows for the same user
                                        const uniqueMembers = [];
                                        const seenIds = new Set();
                                        if (cls.classMembers) {
                                            for (const m of cls.classMembers) {
                                                if (!seenIds.has(m.id)) {
                                                    seenIds.add(m.id);
                                                    uniqueMembers.push(m);
                                                }
                                            }
                                        }

                                        return uniqueMembers.filter(m => {
                                            // 1. Tab Level Filter
                                            const levelMatch = memberSubTab === 'active'
                                                ? m.sunday_school_member?.level === 'Actuel'
                                                : m.sunday_school_member?.level === 'non-actuel';

                                            if (!levelMatch) return false;

                                            // 2. Search Term Filter
                                            const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
                                            if (memberSearchTerm && !fullName.includes(memberSearchTerm.toLowerCase()) && !m.memberCode?.toLowerCase().includes(memberSearchTerm.toLowerCase())) {
                                                return false;
                                            }

                                            // 3. Date Range Filter
                                            if (memberDateRange.start || memberDateRange.end) {
                                                const memberDate = new Date(m.sunday_school_member?.joinedAt);
                                                if (memberDateRange.start && memberDate < new Date(memberDateRange.start)) return false;
                                                if (memberDateRange.end) {
                                                    const endDate = new Date(memberDateRange.end);
                                                    endDate.setHours(23, 59, 59, 999);
                                                    if (memberDate > endDate) return false;
                                                }
                                            }

                                            return true;
                                        });
                                    })().map(member => (
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
                                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {t(member.gender?.toLowerCase()) || member.gender || '-'}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {t(member.maritalStatus?.toLowerCase()) || member.maritalStatus || '-'}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${member.contactSubtype?.name || member.category?.name ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/10 dark:text-indigo-400' : 'bg-gray-100 text-gray-400 dark:bg-white/5'}`}>
                                                    {member.contactSubtype?.name || member.category?.name || t(member.baptismalStatus) || '-'}
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
                                            <td className="px-10 py-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase ${member.sunday_school_member?.level === 'Actuel'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                                                    }`}>
                                                    {member.sunday_school_member?.level || 'Actuel'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(() => {
                                        const uniqueMembers = [];
                                        const seenIds = new Set();
                                        if (cls.classMembers) {
                                            for (const m of cls.classMembers) {
                                                if (!seenIds.has(m.id)) {
                                                    seenIds.add(m.id);
                                                    uniqueMembers.push(m);
                                                }
                                            }
                                        }
                                        const filteredCount = uniqueMembers.filter(m => {
                                            const levelMatch = memberSubTab === 'active' ? m.sunday_school_member?.level === 'Actuel' : m.sunday_school_member?.level === 'non-actuel';
                                            if (!levelMatch) return false;
                                            const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
                                            if (memberSearchTerm && !fullName.includes(memberSearchTerm.toLowerCase()) && !m.memberCode?.toLowerCase().includes(memberSearchTerm.toLowerCase())) return false;
                                            if (memberDateRange.start || memberDateRange.end) {
                                                const memberDate = new Date(m.sunday_school_member?.joinedAt);
                                                if (memberDateRange.start && memberDate < new Date(memberDateRange.start)) return false;
                                                if (memberDateRange.end) {
                                                    const endDate = new Date(memberDateRange.end);
                                                    endDate.setHours(23, 59, 59, 999);
                                                    if (memberDate > endDate) return false;
                                                }
                                            }
                                            return true;
                                        }).length;
                                        return filteredCount === 0;
                                    })() && (
                                            <tr>
                                                <td colSpan="9" className="px-10 py-20 text-center text-gray-400 font-bold tracking-widest text-[11px]">
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
                        <div className="px-10 py-8 border-b border-gray-50 dark:border-white/5 flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('reports_history', 'Historique des Rapports')}</h2>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    {reports.length > 0 && (
                                        <button
                                            onClick={handleDeleteAllReports}
                                            className="px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800/30 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            {t('delete_all', 'Tout supprimer')}
                                        </button>
                                    )}
                                    <div className="h-4 w-[1px] bg-gray-100 dark:bg-white/10 hidden md:block"></div>
                                    <div className="flex gap-2">
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
                            </div>

                            {/* Reports Filters */}
                            <div className="flex flex-wrap items-end gap-4 p-6 bg-gray-50/50 dark:bg-black/10 rounded-[2rem] border border-gray-100 dark:border-white/5">
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('from', 'Du')}</label>
                                    <input
                                        type="date"
                                        value={reportDateRange.start}
                                        onChange={(e) => setReportDateRange({ ...reportDateRange, start: e.target.value })}
                                        className="w-full bg-white dark:bg-black/20 border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('to', 'Au')}</label>
                                    <input
                                        type="date"
                                        value={reportDateRange.end}
                                        onChange={(e) => setReportDateRange({ ...reportDateRange, end: e.target.value })}
                                        className="w-full bg-white dark:bg-black/20 border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('month', 'Mois')}</label>
                                    <select
                                        value={reportDateRange.month}
                                        onChange={(e) => setReportDateRange({ ...reportDateRange, month: e.target.value })}
                                        className="w-full bg-white dark:bg-black/20 border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all dark:text-white appearance-none cursor-pointer"
                                    >
                                        <option value="all">{t('all', 'Tous')}</option>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Date(2000, i, 1).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('year', 'Année')}</label>
                                    <select
                                        value={reportDateRange.year}
                                        onChange={(e) => setReportDateRange({ ...reportDateRange, year: e.target.value })}
                                        className="w-full bg-white dark:bg-black/20 border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all dark:text-white appearance-none cursor-pointer"
                                    >
                                        {Array.from({ length: 10 }, (_, i) => {
                                            const y = new Date().getFullYear() - 5 + i;
                                            return <option key={y} value={y}>{y}</option>;
                                        })}
                                    </select>
                                </div>
                                {(reportDateRange.start || reportDateRange.end || reportDateRange.month !== 'all') && (
                                    <button
                                        onClick={() => setReportDateRange({ start: '', end: '', month: 'all', year: new Date().getFullYear().toString() })}
                                        className="h-[42px] px-6 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest"
                                    >
                                        {t('clear', 'Réinitialiser')}
                                    </button>
                                )}
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
                                    {reports.filter(r => {
                                        const d = new Date(r.date);
                                        const dateStr = d.toISOString().split('T')[0];

                                        // Range match
                                        const startMatch = !reportDateRange.start || dateStr >= reportDateRange.start;
                                        const endMatch = !reportDateRange.end || dateStr <= reportDateRange.end;

                                        // Month/Year match
                                        const monthMatch = reportDateRange.month === 'all' || (d.getMonth() + 1).toString() === reportDateRange.month;
                                        const yearMatch = !reportDateRange.year || d.getFullYear().toString() === reportDateRange.year;

                                        return startMatch && endMatch && monthMatch && yearMatch;
                                    }).map(report => (
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
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleConsultReport(report.id)}
                                                        title={t('view')}
                                                        className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditReport(report.id)}
                                                        title={t('edit')}
                                                        className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteReport(report.id)}
                                                        title={t('delete')}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
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

            {showReportModal && (
                <SundaySchoolReportForm
                    isOpen={showReportModal}
                    onClose={() => {
                        setShowReportModal(false);
                        setEditReportId(null);
                    }}
                    classData={cls}
                    onReportSubmitted={fetchClassDetails}
                    editId={editReportId}
                />
            )}

            {/* Export Settings Modal */}
            {
                showExportModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExportModal(false)}></div>
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] w-full max-w-3xl p-10 relative z-10 border border-gray-100 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {t('export_options', 'Options d\'exportation')}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {t('select_export_fields', 'Sélectionnez les champs à inclure dans votre rapport.')}
                                    </p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${exportType === 'excel' ? 'bg-green-50 text-green-600 dark:bg-green-900/10' : 'bg-red-50 text-red-600 dark:bg-red-900/10'}`}>
                                    {exportType}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                                {exportFieldsConfig.map(field => (
                                    <label key={field.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-indigo-500/10 hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer group shadow-sm active:scale-[0.98]">
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

                            <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="px-8 py-4 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 font-bold text-[11px] rounded-2xl hover:text-gray-700 dark:hover:text-white transition-all uppercase tracking-widest"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={exportType === 'excel' ? handleExportExcel : handleExportPDF}
                                    className={`flex-1 px-8 py-4 ${exportType === 'excel' ? 'bg-green-600 shadow-green-100' : 'bg-red-600 shadow-red-100'} text-white font-bold text-[13px] rounded-2xl hover:opacity-90 shadow-xl transition-all uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3`}
                                >
                                    {exportType === 'excel' ? <ExcelIcon /> : <PDFIcon />}
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

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
            />
        </AdminLayout >
    );
};

export default SundaySchoolClassDetails;

