import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../auth/AuthProvider';
import toast from 'react-hot-toast';
import {
    Database,
    Columns,
    Filter,
    Save,
    FileText,
    Search,
    Download,
    X,
    ChevronDown,
    Check,
    Plus,
    Trash2,
    ArrowLeft,
    ArrowRight,
    ArrowUpDown,
    SortAsc,
    SortDesc,
    Calendar,
    Settings2,
    Clock,
    User as UserIcon,
    Table as TableIcon
} from 'lucide-react';

const getOperators = (t) => [
    { value: 'equals', label: t('op_equals', '= (égal)') },
    { value: 'not_equals', label: t('op_not_equals', '≠ (différent)') },
    { value: 'greater_than', label: t('op_greater_than', '> (supérieur)') },
    { value: 'less_than', label: t('op_less_than', '< (inférieur)') },
    { value: 'greater_equal', label: t('op_greater_equal', '>= (sup. ou égal)') },
    { value: 'less_equal', label: t('op_less_equal', '<= (inf. ou égal)') },
    { value: 'contains', label: t('op_contains', 'Contient') },
    { value: 'starts_with', label: t('op_starts_with', 'Commence par') },
    { value: 'ends_with', label: t('op_ends_with', 'Termine par') },
    { value: 'in', label: t('op_in', 'Dans la liste (a,b,c)') }
];

const getDateOperators = (t) => [
    { value: 'today', label: t('op_today', "Aujourd'hui") },
    { value: 'this_month', label: t('op_this_month', "Ce mois-ci") },
    { value: 'this_year', label: t('op_this_year', "Cette année") },
    { value: 'date_range', label: t('op_date_range', "Période personnalisée") },
    { value: 'greater_than', label: t('op_after', 'Après le...') },
    { value: 'less_than', label: t('op_before', 'Avant le...') },
    { value: 'equals', label: t('op_exact_day', 'Au jour près...') }
];

// ─── Accordion Component ─────────────────────────────────────────
const Accordion = ({ title, icon, badge, defaultOpen, headerRight, children, accentColor = 'indigo' }) => {
    const [open, setOpen] = useState(defaultOpen !== false);
    return (
        <div className={`rounded-[1.5rem] border-l-4 ${accentColor === 'indigo' ? 'border-l-indigo-500' : accentColor === 'violet' ? 'border-l-violet-500' : accentColor === 'emerald' ? 'border-l-emerald-500' : 'border-l-amber-500'} bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 overflow-hidden`}>
            <button
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-2.5">
                    {icon && <span className="text-indigo-500">{icon}</span>}
                    <span className={`text-[10px] font-black tracking-widest ${open ? (accentColor === 'indigo' ? 'text-indigo-600' : accentColor === 'violet' ? 'text-violet-600' : accentColor === 'emerald' ? 'text-emerald-600' : 'text-amber-600') : 'text-gray-500 dark:text-gray-300'}`}>
                        {title}
                    </span>
                    {badge !== undefined && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black">{badge}</span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {headerRight}
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {open && (
                <div className="px-5 pb-4 pt-1 animate-accordion-down">
                    {children}
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────
const AdvancedSearchBuilder = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const { user } = useAuth();

    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [columns, setColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [filters, setFilters] = useState([]);
    const [joins, setJoins] = useState([]);
    const [sortBy, setSortBy] = useState('');
    const [sortDirection, setSortDirection] = useState('DESC');

    const [results, setResults] = useState([]);
    const [executing, setExecuting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    const [savedSearches, setSavedSearches] = useState([]);
    const [searchName, setSearchName] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
    const [focusedModule, setFocusedModule] = useState(null);
    const [fieldValues, setFieldValues] = useState({}); // { fieldId: [values] }

    // Search & Filter for Saved Models
    const [templateSearchTerm, setTemplateSearchTerm] = useState('');
    const [templateFilterDate, setTemplateFilterDate] = useState('');
    const [templateFilterDateEnd, setTemplateFilterDateEnd] = useState('');

    const tableContainerRef = React.useRef(null);
    const topScrollRef = React.useRef(null);

    // Sync scroll between top mirror bar and main table
    useEffect(() => {
        const top = topScrollRef.current;
        const bottom = tableContainerRef.current;
        if (!top || !bottom) return;
        const onTop = () => { bottom.scrollLeft = top.scrollLeft; };
        const onBottom = () => { top.scrollLeft = bottom.scrollLeft; };
        top.addEventListener('scroll', onTop);
        bottom.addEventListener('scroll', onBottom);
        return () => { top.removeEventListener('scroll', onTop); bottom.removeEventListener('scroll', onBottom); };
    }, [results]);

    // Initial load
    useEffect(() => {
        api.get('/search-builder/tables').then(r => setTables(r.data)).catch(() => { });
        api.get('/search-builder/saved').then(r => setSavedSearches(r.data)).catch(() => { });
    }, []);

    const fetchColumns = useCallback(async (tableId, activeJoins) => {
        if (!tableId) return;
        try {
            const params = new URLSearchParams();
            activeJoins.forEach(j => params.append('joinedTableIds', j));
            const res = await api.get(`/search-builder/columns/${tableId}?${params.toString()}`);
            setColumns(res.data);
        } catch {
            toast.error(t('error_loading_columns', 'Erreur chargement des colonnes'));
        }
    }, [t]);

    useEffect(() => {
        fetchColumns(selectedTable, joins);
    }, [selectedTable, joins, fetchColumns]);

    const handleTableChange = (tableId) => {
        setSelectedTable(tableId);
        setSelectedColumns([]);
        setFilters([]);
        setResults([]);
        setJoins([]);
        setSortBy('');
    };

    const toggleJoin = (assocAs) => {
        if (joins.includes(assocAs)) {
            setJoins(joins.filter(j => j !== assocAs));
            setSelectedColumns(selectedColumns.filter(c => !c.startsWith(`${assocAs}.`)));
        } else {
            setJoins([...joins, assocAs]);
        }
    };

    const groupedColumns = columns.reduce((acc, col) => {
        const key = col.tableName;
        if (!acc[key]) acc[key] = [];
        acc[key].push(col);
        return acc;
    }, {});

    const selectAllForTable = (cols) => {
        const ids = cols.map(c => c.id);
        const allSelected = ids.every(id => selectedColumns.includes(id));
        if (allSelected) {
            setSelectedColumns(selectedColumns.filter(c => !ids.includes(c)));
        } else {
            const newSet = [...new Set([...selectedColumns, ...ids])];
            setSelectedColumns(newSet);
        }
    };

    const toggleColumn = (colId) => {
        if (selectedColumns.includes(colId)) setSelectedColumns(selectedColumns.filter(c => c !== colId));
        else setSelectedColumns([...selectedColumns, colId]);
    };

    const handleSearch = async (targetPage = 1) => {
        if (!selectedTable) return toast.error(t('select_a_table', 'Sélectionnez une table'));
        if (selectedColumns.length === 0) return toast.error(t('choose_at_least_one_column', 'Choisissez au moins une colonne'));
        setExecuting(true);
        try {
            const res = await api.post('/search-builder/execute', {
                table: selectedTable,
                columns: selectedColumns,
                filters: filters.filter(f => f.field && (f.value !== '' || ['today', 'this_month', 'this_year'].includes(f.operator))),
                joins,
                page: targetPage,
                limit: 50,
                order_by: sortBy || undefined,
                order_direction: sortDirection
            });
            setResults(res.data.data);
            setTotalResults(res.data.total);
            setTotalPages(res.data.totalPages);
            setPage(targetPage);
            toast.success(`${res.data.total} ${t('results_found', 'résultat(s) trouvé(s)')}`);
        } catch (err) {
            toast.error(err.response?.data?.message || t('execution_error', "Erreur d'exécution"));
        } finally {
            setExecuting(false);
        }
    };

    const handleExport = async (format) => {
        if (results.length === 0) return toast.error(t('no_results_to_export', "Aucun résultat à exporter"));
        try {
            toast.loading(t('exporting', "Exportation..."), { id: 'export' });
            const res = await api.post('/search-builder/export', {
                format, table: selectedTable,
                columns: selectedColumns,
                filters: filters.filter(f => f.field && (f.value !== '' || ['today', 'this_month', 'this_year'].includes(f.operator))),
                joins,
                order_by: sortBy || undefined,
                order_direction: sortDirection
            }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `export-${selectedTable}-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
            link.click();
            toast.success(t('file_downloaded', "Fichier téléchargé"), { id: 'export' });
        } catch {
            toast.error(t('export_error', "Erreur d'export"), { id: 'export' });
        }
    };

    const saveCurrentSearch = async () => {
        if (!searchName.trim()) return toast.error(t('give_config_name', "Donnez un nom à cette configuration"));
        try {
            const saved = await api.post('/search-builder/saved', {
                name: searchName,
                table: selectedTable,
                columns: selectedColumns,
                filters: filters.filter(f => f.field),
                joins
            });
            setSavedSearches(prev => [saved.data, ...prev]);
            setShowSaveModal(false);
            setSearchName('');
            toast.success(t('config_saved', "Configuration sauvegardée !"));
            api.get('/search-builder/saved').then(r => setSavedSearches(r.data));
        } catch {
            toast.error(t('save_error', "Erreur de sauvegarde"));
        }
    };

    const loadSavedSearch = async (s) => {
        await handleTableChange(s.tableName);
        setTimeout(() => {
            setSelectedColumns(s.columns || []);
            setFilters(s.filters || []);
            setJoins(s.joins || []);
        }, 300);
        setShowTemplatesPanel(false);
        toast.success(`${t('loaded', 'Chargé')} : "${s.name}"`);
    };

    const deleteSavedSearch = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm(t('confirm_delete_model', "Voulez-vous vraiment supprimer ce modèle ?"))) return;
        try {
            await api.delete(`/search-builder/saved/${id}`);
            setSavedSearches(prev => prev.filter(s => s.id !== id));
            toast.success(t('model_deleted', "Modèle supprimé"));
        } catch {
            toast.error(t('delete_error', "Erreur de suppression"));
        }
    };

    // ─── Filter Helpers ───────────────────────────────────────────
    const handleFilterChange = async (idx, key, value) => {
        const newFilters = [...filters];
        newFilters[idx][key] = value;

        // If field changed, fetch potential values
        if (key === 'field' && value) {
            try {
                const res = await api.get(`/search-builder/field-values/${value}`, { params: { table: selectedTable } });
                if (res.data && res.data.length > 0) {
                    setFieldValues(prev => ({ ...prev, [value]: res.data }));
                    // If current value is empty or not in new options, clear it
                    if (!newFilters[idx].value || !res.data.includes(newFilters[idx].value)) {
                        // Special case: if it's a list, don't clear if it's 'in' operator? Actually, safer to clear
                        // newFilters[idx].value = ''; 
                    }
                }
            } catch (err) {
                console.error("Error fetching field values:", err);
            }
        }

        if (key === 'operator' && ['today', 'this_month', 'this_year'].includes(value)) {
            newFilters[idx].value = '';
        }

        if (key === 'operator' && value === 'date_range') {
            newFilters[idx].value = [new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]];
        }

        setFilters(newFilters);
    };

    // ─── Templates Filtering Logic ──────────────────────────────
    const filteredSavedSearches = savedSearches.filter(s => {
        const matchesName = s.name.toLowerCase().includes(templateSearchTerm.toLowerCase());
        const createdAt = new Date(s.createdAt);

        let matchesDate = true;
        if (templateFilterDate) {
            const start = new Date(templateFilterDate);
            start.setHours(0, 0, 0, 0);
            matchesDate = createdAt >= start;
        }
        if (templateFilterDateEnd && matchesDate) {
            const end = new Date(templateFilterDateEnd);
            end.setHours(23, 59, 59, 999);
            matchesDate = createdAt <= end;
        }

        return matchesName && matchesDate;
    });

    const isDateType = (fieldId) => {
        const col = columns.find(c => c.id === fieldId);
        if (!col) return false;
        const type = col.type.toLowerCase();
        return type.includes('date') || type.includes('time');
    };

    const availableAssocs = tables.find(t => t.id === selectedTable)?.associations || [];
    const selectedColCount = selectedColumns.length;

    return (
        <AdminLayout>
            <div className="space-y-8 pb-20">
                {/* ── Header ─────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 tracking-[0.2em]">
                            <span className="w-8 h-[2px] bg-indigo-600"></span>
                            <span>{t('query_architect_pro', 'Requête Architecture Pro')}</span>
                        </div>
                        <h1 className="text-3xl font-black dark:text-white tracking-tight">{t('relational_explorer', 'Recherche avancée')}</h1>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">{t('explorer_subtitle', 'Jointures · Filtres avancés · Export')}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowTemplatesPanel(true)}
                            className="px-5 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[10px] font-black tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                        >
                            <FileText size={14} /> {t('my_models', 'Mes modèles')} <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px]">{savedSearches.length}</span>
                        </button>
                        <button
                            onClick={() => selectedTable && setShowSaveModal(true)}
                            disabled={!selectedTable}
                            className="px-5 py-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-black tracking-widest hover:bg-gray-50 dark:hover:bg-white/10 transition-all disabled:opacity-30 flex items-center gap-2"
                        >
                            <Save size={14} /> {t('save_btn', 'Sauvegarder')}
                        </button>
                        <button
                            onClick={toggleLanguage}
                            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white text-[10px] font-black tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                        >
                            {language === 'fr' ? 'EN' : 'FR'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* ── Sidebar (Config) ─────────────────────────── */}
                    <div className={`xl:col-span-4 space-y-5 transition-all duration-500 ${focusedModule === 'config' ? 'xl:scale-[1.01] z-10' : ''}`} onMouseEnter={() => setFocusedModule('config')} onMouseLeave={() => setFocusedModule(null)}>
                        {/* 1. Source */}
                        <div className={`bg-white dark:bg-[#111111] p-6 rounded-[2.5rem] border transition-all duration-500 shadow-sm space-y-4 ${focusedModule === 'config' ? 'border-indigo-400 shadow-indigo-500/10 shadow-xl' : 'border-gray-100 dark:border-white/5'}`}>
                            <h3 className="text-[10px] font-black tracking-widest text-gray-400 flex items-center gap-2">
                                <Database size={12} className="text-indigo-500" /> 1. {t('data_source', 'Source de données')}
                            </h3>
                            <select
                                value={selectedTable}
                                onChange={e => handleTableChange(e.target.value)}
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] border-none text-sm font-black appearance-none dark:text-white dark:ring-1 dark:ring-white/10 cursor-pointer"
                            >
                                <option value="" className="dark:bg-[#1a1a1a]">{t('choose_a_table', 'Choisir une table...')}</option>
                                {tables.map(t => <option key={t.id} value={t.id} className="dark:bg-[#1a1a1a]">{t.label}</option>)}
                            </select>

                            {selectedTable && availableAssocs.length > 0 && (
                                <div className="pt-2 space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{t('joins', 'Jointures')} :</p>
                                    <div className="flex flex-wrap gap-2">
                                        {availableAssocs.map(assoc => (
                                            <button key={assoc.as} onClick={() => toggleJoin(assoc.as)} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all flex items-center gap-1.5 ${joins.includes(assoc.as) ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/30' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                                {joins.includes(assoc.as) ? <Check size={10} /> : <Plus size={10} />} {assoc.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Column Picker Accordion */}
                        {columns.length > 0 && (
                            <div className={`bg-white dark:bg-[#111111] p-5 rounded-[2.5rem] border transition-all duration-500 shadow-sm space-y-3 max-h-[60vh] overflow-y-auto noscrollbar ${focusedModule === 'config' ? 'border-indigo-400/40' : 'border-gray-100 dark:border-white/5'}`}>
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-[10px] font-black tracking-widest text-gray-400 flex items-center gap-2">
                                        <Columns size={12} className="text-indigo-500" /> 2. {t('column_selection', 'Sélection des colonnes')}
                                    </h3>
                                    {selectedColCount > 0 && <button onClick={() => setSelectedColumns([])} className="text-[9px] font-black text-rose-500 uppercase">{t('clear', 'Effacer')}</button>}
                                </div>
                                {Object.entries(groupedColumns).map(([tableName, cols], idx) => (
                                    <Accordion key={tableName} title={tableName} defaultOpen={idx === 0} badge={cols.filter(c => selectedColumns.includes(c.id)).length} icon={<TableIcon size={14} />} headerRight={
                                        <button onClick={e => { e.stopPropagation(); selectAllForTable(cols); }} className="px-2 py-1 rounded-xl text-[8px] font-black bg-gray-50 dark:bg-white/5 border dark:border-white/10 text-gray-400 hover:text-indigo-600 uppercase">{t('all', 'Tout')}</button>
                                    }>
                                        <div className="space-y-0.5 mt-2">
                                            {cols.map(col => (
                                                <label key={col.id} className={`flex items-start gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${selectedColumns.includes(col.id) ? 'bg-indigo-50 dark:bg-indigo-900/15' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                                    <input type="checkbox" checked={selectedColumns.includes(col.id)} onChange={() => toggleColumn(col.id)} className="w-4 h-4 mt-0.5 accent-indigo-600 rounded-md" />
                                                    <div className="flex flex-col">
                                                        <span className={`text-[11px] font-black uppercase ${selectedColumns.includes(col.id) ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-300'}`}>{col.label.split('] ').pop()}</span>
                                                        <span className="text-[7px] text-gray-400 font-bold uppercase">{col.type}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </Accordion>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Main Panel (Logic) ─────────────────────────── */}
                    <div className={`xl:col-span-8 space-y-6 transition-all duration-500 ${focusedModule === 'logic' ? 'xl:scale-[1.005] z-10' : ''}`} onMouseEnter={() => setFocusedModule('logic')} onMouseLeave={() => setFocusedModule(null)}>

                        {/* 3. Filters & Sort */}
                        <div className={`bg-white dark:bg-[#111111] p-8 rounded-[3rem] border border-l-4 border-l-indigo-600 transition-all duration-500 shadow-sm space-y-6 ${focusedModule === 'logic' ? 'border-indigo-400' : 'border-gray-100 dark:border-white/5'}`}>

                            {/* Sort Section */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-white/5 pb-6">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <ArrowUpDown size={12} className="text-indigo-500" /> {t('sorted_by', 'Trier par')}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={sortBy}
                                            onChange={e => setSortBy(e.target.value)}
                                            className="p-2 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-none text-[11px] font-black outline-none cursor-pointer placeholder:text-gray-400 dark:text-white"
                                        >
                                            <option value="" className="dark:bg-[#111111]">{t('no_sorting', 'Aucun tri')}</option>
                                            {selectedColumns.map(id => {
                                                const col = columns.find(c => c.id === id);
                                                const label = col?.label.split('] ').pop() || id;
                                                return (
                                                    <option key={id} value={id} className="dark:bg-[#111111]">
                                                        {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {sortBy && (
                                            <button
                                                onClick={() => setSortDirection(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                                                className="p-2 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-[10px] font-black uppercase flex items-center gap-2"
                                            >
                                                {sortDirection === 'DESC' ? <SortDesc size={14} /> : <SortAsc size={14} />}
                                                {sortDirection === 'DESC' ? t('descending', 'Décroissant') : t('ascending', 'Croissant')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setFilters([...filters, { field: '', operator: 'equals', value: '' }])} disabled={!selectedTable} className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black rounded-2xl shadow-lg flex items-center gap-2 hover:translate-y-[-2px] transition-all">
                                    <Plus size={14} /> {t('new_filter', 'Nouveau filtre')}
                                </button>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                                    <Filter size={12} className="text-indigo-500" /> {t('dynamic_filters', 'Filtres dynamiques')} {filters.length > 0 && `(${filters.length})`}
                                </h3>
                                <div className="space-y-4">
                                    {filters.map((f, idx) => {
                                        const isDate = isDateType(f.field);
                                        const ops = isDate ? getDateOperators(t) : getOperators(t);

                                        return (
                                            <div key={idx} className="flex flex-wrap items-center gap-3 p-4 rounded-[2rem] bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 relative group">
                                                <select value={f.field} onChange={e => handleFilterChange(idx, 'field', e.target.value)} className="flex-1 min-w-[180px] p-3 rounded-2xl bg-white dark:bg-[#1a1a1a] text-[11px] font-black uppercase outline-none dark:text-white border-none cursor-pointer">
                                                    <option value="" className="dark:bg-[#1a1a1a]">{t('select_a_field', 'Sélectionner un champ...')}</option>
                                                    {Object.entries(groupedColumns).map(([tName, cols]) => (
                                                        <optgroup key={tName} label={`▸ ${tName}`} className="dark:bg-[#0f0f0f]">
                                                            {cols.map(c => {
                                                                const label = c.label.split('] ').pop();
                                                                return (
                                                                    <option key={c.id} value={c.id} className="dark:bg-[#1a1a1a]">
                                                                        {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}
                                                                    </option>
                                                                );
                                                            })}
                                                        </optgroup>
                                                    ))}
                                                </select>

                                                <select value={f.operator} onChange={e => handleFilterChange(idx, 'operator', e.target.value)} className="w-[180px] p-3 rounded-2xl bg-white dark:bg-[#1a1a1a] text-[11px] font-black outline-none dark:text-white border-none cursor-pointer">
                                                    {ops.map(o => <option key={o.value} value={o.value} className="dark:bg-[#1a1a1a]">{o.label}</option>)}
                                                </select>

                                                {!['today', 'this_month', 'this_year'].includes(f.operator) && (
                                                    <div className="flex-1 min-w-[200px] flex items-center gap-2">
                                                        {f.operator === 'date_range' ? (
                                                            <>
                                                                <input type="date" value={f.value[0] || ''} onChange={e => { const val = [...f.value]; val[0] = e.target.value; handleFilterChange(idx, 'value', val); }} className="flex-1 p-3 rounded-2xl bg-white dark:bg-white/10 text-[11px] font-black outline-none dark:text-white border-none" />
                                                                <span className="text-gray-400 font-black">→</span>
                                                                <input type="date" value={f.value[1] || ''} onChange={e => { const val = [...f.value]; val[1] = e.target.value; handleFilterChange(idx, 'value', val); }} className="flex-1 p-3 rounded-2xl bg-white dark:bg-white/10 text-[11px] font-black outline-none dark:text-white border-none" />
                                                            </>
                                                        ) : fieldValues[f.field] ? (
                                                            <select
                                                                value={f.value}
                                                                onChange={e => handleFilterChange(idx, 'value', e.target.value)}
                                                                className="w-full p-3 rounded-2xl bg-white dark:bg-[#1a1a1a] text-[11px] font-black outline-none dark:text-white border-none cursor-pointer"
                                                            >
                                                                <option value="">{t('choose_value', 'Choisir une valeur...')}</option>
                                                                {fieldValues[f.field].map(item => (
                                                                    <option key={item.value} value={item.value} className="dark:bg-[#1a1a1a]">
                                                                        {item.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input type={isDate ? "date" : "text"} placeholder={t('value_placeholder', "Valeur...")} value={f.value} onChange={e => handleFilterChange(idx, 'value', e.target.value)} className="w-full p-3 rounded-2xl bg-white dark:bg-white/10 text-[11px] font-black outline-none dark:text-white border-none" />
                                                        )}
                                                    </div>
                                                )}

                                                <button onClick={() => setFilters(filters.filter((_, i) => i !== idx))} className="w-10 h-10 rounded-full border border-rose-100 dark:border-rose-900/30 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><X size={16} /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 border-t dark:border-white/5 flex items-center justify-between flex-wrap gap-4">
                                <button onClick={() => handleSearch(1)} disabled={executing || !selectedTable} className="px-12 py-4 bg-indigo-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                    {executing ? <Settings2 className="animate-spin" size={16} /> : <Search size={16} />}
                                    {executing ? t('searching', 'Recherche en cours...') : t('find_now', 'Lancer la recherche')}
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={() => handleExport('excel')} disabled={results.length === 0} className="px-6 py-3 bg-emerald-500/10 text-emerald-600 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2">
                                        <Download size={14} /> Excel
                                    </button>
                                    <button onClick={() => handleExport('pdf')} disabled={results.length === 0} className="px-6 py-3 bg-rose-500/10 text-rose-600 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2">
                                        <Download size={14} /> PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4. Result Table */}
                        {results.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{totalResults} {t('results', 'résultats')} • {t('page', 'Page')} {page}/{totalPages}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSearch(page - 1)} disabled={page === 1} className="p-2 px-4 bg-white dark:bg-white/5 rounded-lg border dark:border-white/10 text-[10px] font-black disabled:opacity-30 flex items-center gap-2 uppercase tracking-tighter">
                                            <ArrowLeft size={12} /> {t('prev', 'Précédent')}
                                        </button>
                                        <button onClick={() => handleSearch(page + 1)} disabled={page >= totalPages} className="p-2 px-4 bg-white dark:bg-white/5 rounded-lg border dark:border-white/10 text-[10px] font-black disabled:opacity-30 flex items-center gap-2 uppercase tracking-tighter">
                                            {t('next', 'Suivant')} <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Visible Top Scrollbar updated */}
                                <div
                                    ref={topScrollRef}
                                    className="overflow-x-auto h-[14px] bg-gray-100 dark:bg-white/5 rounded-full mx-1 custom-scrollbar"
                                >
                                    <div style={{ width: selectedColumns.length * 190 + 'px', height: 1 }}></div>
                                </div>

                                <div ref={tableContainerRef} className="bg-white dark:bg-[#111111] rounded-[2.5rem] border dark:border-white/5 overflow-x-auto custom-scrollbar shadow-2xl">
                                    <table className="text-left w-full border-collapse" style={{ minWidth: selectedColumns.length * 190 + 'px' }}>
                                        <thead>
                                            <tr className="bg-gray-50/50 dark:bg-white/[0.04]">
                                                {selectedColumns.map(id => (
                                                    <th key={id} className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 border-b dark:border-white/5 w-[190px]">
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] text-indigo-400 mb-0.5 uppercase tracking-widest">{columns.find(c => c.id === id)?.tableName}</span>
                                                            <span className="flex items-center gap-1.5">
                                                                {columns.find(c => c.id === id)?.label.split('] ').pop()}
                                                                {sortBy === id && (sortDirection === 'DESC' ? <SortDesc size={10} /> : <SortAsc size={10} />)}
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((row, rIdx) => (
                                                <tr key={rIdx} className="border-b dark:border-white/5 hover:bg-indigo-50/10 dark:hover:bg-indigo-900/10 transition-colors">
                                                    {selectedColumns.map(id => {
                                                        let val;
                                                        if (id.includes('.')) {
                                                            const parts = id.split('.');
                                                            val = parts.length === 3 ? row?.[parts[0]]?.[parts[1]]?.[parts[2]] : row?.[parts[0]]?.[parts[1]];
                                                        } else val = row[id];
                                                        return (
                                                            <td key={id} className="px-6 py-4 text-[11px] font-bold text-gray-600 dark:text-gray-400 truncate max-w-[190px]">
                                                                {val === null || val === undefined ? <span className="opacity-30">—</span> : String(val)}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div >

            {/* ── Models Panel (Wide Version) ────────────────────────── */}
            {
                showTemplatesPanel && (
                    <div className="fixed inset-0 z-[100] flex" onClick={() => setShowTemplatesPanel(false)}>
                        <div className="flex-1 bg-black/40 backdrop-blur-sm transition-all"></div>
                        <div className="w-full max-w-lg bg-white dark:bg-[#0f0f0f] h-full shadow-2xl overflow-y-auto flex flex-col p-8 animate-slide-in-right border-l dark:border-white/5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-8 pb-4 border-b dark:border-white/5">
                                <div>
                                    <h2 className="text-xl font-black dark:text-white tracking-tight flex items-center gap-3">
                                        <FileText size={24} className="text-indigo-500" /> {t('my_saved_models', 'Mes modèles sauvegardés')}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-widest">{t('manage_search_configs', 'Gérez vos configurations de recherche personnalisées')}</p>
                                </div>
                                <button onClick={() => setShowTemplatesPanel(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all font-black text-xl">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Search & Filter Bar for Models */}
                            <div className="mb-6 flex flex-col gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder={t('search_by_name', 'Chercher par nom...')}
                                        value={templateSearchTerm}
                                        onChange={e => setTemplateSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border-none text-[11px] font-bold outline-none ring-1 ring-gray-100 dark:ring-white/10 focus:ring-2 focus:ring-indigo-500/30 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="date"
                                            value={templateFilterDate}
                                            onChange={e => setTemplateFilterDate(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border-none text-[10px] font-bold outline-none ring-1 ring-gray-100 dark:ring-white/10 dark:text-white"
                                        />
                                    </div>
                                    <span className="text-gray-400 font-black">→</span>
                                    <div className="flex-1 relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="date"
                                            value={templateFilterDateEnd}
                                            onChange={e => setTemplateFilterDateEnd(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border-none text-[10px] font-bold outline-none ring-1 ring-gray-100 dark:ring-white/10 dark:text-white"
                                        />
                                    </div>
                                    {(templateFilterDate || templateFilterDateEnd || templateSearchTerm) && (
                                        <button
                                            onClick={() => { setTemplateSearchTerm(''); setTemplateFilterDate(''); setTemplateFilterDateEnd(''); }}
                                            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-rose-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {filteredSavedSearches.length === 0 ? (
                                    <div className="text-center py-24 space-y-4 opacity-30">
                                        <Search size={64} className="mx-auto text-gray-400" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('no_models_found', "Aucun modèle trouvé")}</p>
                                    </div>
                                ) : (
                                    filteredSavedSearches.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => loadSavedSearch(s)}
                                            className="p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] hover:border-indigo-500 hover:bg-white dark:hover:bg-white/[0.05] cursor-pointer transition-all group relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 min-w-0 mr-4">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate group-hover:text-indigo-600 transition-colors tracking-tight">{s.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <UserIcon size={10} className="text-indigo-400" />
                                                        <p className="text-[9px] text-indigo-500 font-bold">
                                                            {t('by_admin', 'Par Admin Principal')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={e => deleteSavedSearch(s.id, e)}
                                                    className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                                    title={t('delete_model', "Supprimer ce modèle")}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className="px-3 py-1 rounded-full bg-white dark:bg-black/20 text-[9px] font-bold text-gray-500 ring-1 ring-gray-200 dark:ring-white/5 flex items-center gap-1.5">
                                                    <Database size={8} /> {s.tableName?.toLowerCase()}
                                                </span>
                                                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-[9px] font-bold text-indigo-600 flex items-center gap-1.5">
                                                    <Columns size={8} /> {s.columns?.length} {t('cols_abbr', 'col.')}
                                                </span>
                                                {s.filters?.length > 0 && (
                                                    <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-[9px] font-bold text-amber-600 flex items-center gap-1.5">
                                                        <Filter size={8} /> {s.filters.length} {t('filter_abbr', 'fil.')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-[8px] text-gray-400 font-bold pt-4 border-t dark:border-white/5">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={10} />
                                                    <span>{t('created_on', 'Créé le')} {new Date(s.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <span className="text-indigo-600 font-black group-hover:translate-x-1 transition-transform">{t('load_model_arrow', 'Charger →')}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ── Save Modal ──────────────────────────── */}
            {
                showSaveModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                        <div className="bg-white dark:bg-[#111111] w-full max-w-md rounded-[3.5rem] p-10 space-y-8 shadow-2xl border dark:border-white/10 scale-up">
                            <div>
                                <div className="w-16 h-16 rounded-[2rem] bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mb-6">
                                    <Save size={32} />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight dark:text-white">{t('save_title', 'Sauvegarder')}</h3>
                                <p className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-widest">{t('save_description', 'Enregistrez cette requête pour plus tard')}</p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">{t('query_name', 'Nom de votre requête')}</label>
                                <input
                                    type="text"
                                    value={searchName}
                                    onChange={e => setSearchName(e.target.value)}
                                    className="w-full p-5 rounded-[2rem] bg-gray-50 dark:bg-white/5 border-none font-bold outline-none dark:text-white text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300"
                                    placeholder={t('query_placeholder', 'Ex: Dons du trimestre...')}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowSaveModal(false)} className="flex-1 py-5 text-[11px] font-black text-gray-400 uppercase hover:bg-gray-100 dark:hover:bg-white/5 rounded-[2rem] transition-all tracking-widest">{t('cancel', 'Annuler')}</button>
                                <button onClick={saveCurrentSearch} className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] text-[11px] font-black shadow-2xl shadow-indigo-600/30 uppercase hover:scale-105 active:scale-95 transition-all tracking-widest flex items-center justify-center gap-2">
                                    <Check size={16} /> {t('save_action', 'Sauvegarder')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
                .noscrollbar::-webkit-scrollbar { display: none; }
                .noscrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #6366f130; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }
                
                @keyframes accordion-down { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
                .animate-accordion-down { animation: accordion-down 0.2s ease-out; }
                
                @keyframes slide-in-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .animate-slide-in-right { animation: slide-in-right 0.5s cubic-bezier(0.2, 1, 0.3, 1); }

                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }

                .scale-up { animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </AdminLayout >
    );
};

export default AdvancedSearchBuilder;
