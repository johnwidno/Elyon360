import { useState, useMemo } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import AlertModal from '../../../../components/ChurchAlertModal';

export default function ActivityList({ activities, onEdit, onDelete, onView, onViewParticipants }) {
    const { t } = useLanguage();
    const [filter, setFilter] = useState('all'); // all, planned, completed, cancelled
    const [viewMode, setViewMode] = useState('list'); // grid, list
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });

    const filteredActivities = useMemo(() => {
        if (filter === 'all') return activities;
        return activities.filter(a => a.status === filter);
    }, [activities, filter]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'planned': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'completed': return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
            case 'cancelled': return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters & View Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex gap-2 bg-gray-50 dark:bg-black/40 p-1 w-fit rounded-xl">
                    {['all', 'planned', 'completed', 'cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === f
                                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {t(f) || f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 bg-gray-50 dark:bg-black/40 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredActivities.map(activity => (
                        <div
                            key={activity.id}
                            className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all group"
                            onClick={() => onView(activity)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStatusColor(activity.status)}`}>
                                    {t(activity.status) || activity.status}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(activity); }}
                                        className="p-2 bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    {activity.registrationToken && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const url = `${window.location.origin}/public/register/${activity.registrationToken}`;
                                                navigator.clipboard.writeText(url);
                                                setAlertMessage({ show: true, title: t('success'), message: t('link_copied', 'Lien copié !'), type: 'success' });
                                            }}
                                            className="p-2 bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            title={t('copy_public_link', 'Copier le lien public')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}
                                        className="p-2 bg-gray-50 dark:bg-white/5 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{activity.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{activity.description}</p>

                            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-50 dark:border-white/5 pt-4">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    {new Date(activity.date).toLocaleDateString()}
                                    {activity.endDate && ` - ${new Date(activity.endDate).toLocaleDateString()}`}
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {activity.location || '-'}
                                </div>
                                {activity.coordinator && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <span className="text-xs">
                                            Coordonné par: <span className="font-semibold">{activity.coordinator.firstName} {activity.coordinator.lastName}</span>
                                        </span>
                                    </div>
                                )}
                                <div
                                    className="flex items-center gap-2 mt-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-1 -ml-1 rounded-lg transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onViewParticipants(activity); }}
                                >
                                    <span className="flex -space-x-2">
                                        {(activity.participants || []).slice(0, 3).map((p, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white dark:border-[#1A1A1A] flex items-center justify-center text-[8px] font-bold overflow-hidden">
                                                {p.user?.photo ? <img src={p.user.photo} className="w-full h-full object-cover" /> : p.user?.firstName[0]}
                                            </div>
                                        ))}
                                        {(activity.participants || []).length > 3 && (
                                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white dark:border-[#1A1A1A] flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                +{(activity.participants?.length || 0) - 3}
                                            </div>
                                        )}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-500">
                                        {activity.participants?.length || 0} participants
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#1A1A1A]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-black/20">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('name')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('date')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('location')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('coordinator', 'Coordinateur')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('participants', 'Participants')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('status')}</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                {filteredActivities.map(activity => (
                                    <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onView(activity)}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{activity.name}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{activity.description}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            <div>
                                                {new Date(activity.date).toLocaleDateString()}
                                                {activity.endDate && <span className="text-xs text-gray-400 block">au {new Date(activity.endDate).toLocaleDateString()}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {activity.location || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {activity.coordinator ? `${activity.coordinator.firstName} ${activity.coordinator.lastName}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-indigo-400">
                                            {activity.participants?.length || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${getStatusColor(activity.status)}`}>
                                                {t(activity.status) || activity.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(activity); }}
                                                className="p-1.5 bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            {activity.registrationToken && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const url = `${window.location.origin}/public/register/${activity.registrationToken}`;
                                                        navigator.clipboard.writeText(url);
                                                        setAlertMessage({ show: true, title: t('success'), message: t('link_copied', 'Lien copié !'), type: 'success' });
                                                    }}
                                                    className="p-1.5 bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    title={t('copy_public_link', 'Copier le lien public')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}
                                                className="p-1.5 bg-gray-50 dark:bg-white/5 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredActivities.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 text-sm font-medium">
                    {t('no_activities_found', 'Aucune activité trouvée')}
                </div>
            )}
            <AlertModal
                isOpen={alertMessage.show}
                title={alertMessage.title}
                message={alertMessage.message}
                type={alertMessage.type}
                onClose={() => setAlertMessage({ ...alertMessage, show: false })}
            />
        </div>
    );
}
