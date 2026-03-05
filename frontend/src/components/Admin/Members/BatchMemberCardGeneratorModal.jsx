import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../auth/AuthProvider';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CARD_WIDTH = 324;
const CARD_HEIGHT = 204;

const BatchMemberCardGeneratorModal = ({ members, onClose, onSuccess }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [churchInfo, setChurchInfo] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');

    // We'll use this ref to render each card off-screen one by one
    const renderAreaRef = useRef();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templatesRes, churchRes] = await Promise.all([
                    api.get('/card-templates'),
                    api.get('/churches/settings')
                ]);
                setTemplates(templatesRes.data);
                const active = templatesRes.data.find(t => t.isActive);
                if (active) setSelectedTemplateId(active.id);
                setChurchInfo(churchRes.data.church);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching batch data", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const selectedTemplate = templates.find(t => t.id === parseInt(selectedTemplateId));

    const renderFieldValue = (field, member) => {
        if (field.type === 'image') {
            const isLogo = field.label === '{church.logo}' || field.id === 'churchLogo' || field.label?.toLowerCase().includes('logo');
            const isPhoto = field.label === '{member.photo}' || field.id === 'photo' || field.label?.toLowerCase().includes('photo') || field.label?.toLowerCase().includes('portrait');

            const getImageUrl = (url) => {
                if (!url) return null;
                if (url.startsWith('http') || url.startsWith('data:')) return url;
                return `${api.defaults.baseURL?.replace('/api', '') || ''}${url}`;
            };

            const imageStyle = {
                borderRadius: field.borderRadius ? `${field.borderRadius}px` : '0px',
                mixBlendMode: field.multiply ? 'multiply' : 'normal',
                width: '100%',
                height: '100%',
                objectFit: isLogo ? 'contain' : 'cover'
            };

            if (isLogo) {
                const logoUrl = getImageUrl(user?.churchLogo || churchInfo?.logoUrl);
                return logoUrl ? <img src={logoUrl} alt="logo" style={imageStyle} crossOrigin="anonymous" /> : <div className="w-full h-full bg-gray-200 text-[10px] flex items-center justify-center">Logo Église</div>;
            }
            if (isPhoto) {
                const photoUrl = getImageUrl(member.photo);
                return photoUrl ? <img src={photoUrl} alt="avatar" style={imageStyle} crossOrigin="anonymous" /> : <div className="w-full h-full bg-gray-200 text-[10px] flex items-center justify-center">Photo</div>;
            }
            if (field.imageUrl) {
                return <img src={getImageUrl(field.imageUrl)} alt="custom" style={imageStyle} crossOrigin="anonymous" />;
            }
            return <div className="w-full h-full bg-gray-200 text-[10px] flex items-center justify-center">IMG</div>;
        }
        if (field.type === 'shape') {
            return (
                <div style={{
                    width: '100%', height: '100%',
                    backgroundColor: field.color || '#indigo-500',
                    opacity: field.opacity || 1,
                    borderRadius: field.shapeType === 'circle' ? '100%' : '0',
                    clipPath: field.shapeType === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                    borderBottom: field.shapeType === 'line' ? `2px solid ${field.color}` : 'none',
                    height: field.shapeType === 'line' ? '2px' : '100%'
                }} />
            );
        }
        if (field.type === 'qrcode') {
            let qrValue = field.label || '{member.id}';
            if (qrValue === 'custom' && field.qrValue) {
                qrValue = field.qrValue;
            } else {
                qrValue = qrValue.replace('{member.id}', member.id || '');
                qrValue = qrValue.replace('{member.code}', member.permanentCode || member.id || '');
            }
            return <QRCodeSVG value={qrValue} width="100%" height="100%" fgColor={field.color || '#000000'} />;
        }
        if (field.type === 'text') {
            let val = field.label || '';
            const safeReplace = (str, pattern, replacement) => str.replace(new RegExp(pattern, 'g'), replacement || '');
            val = safeReplace(val, '{member.fullName}', `${member.firstName || ''} ${member.lastName || ''}`);
            val = safeReplace(val, '{member.firstName}', member.firstName);
            val = safeReplace(val, '{member.lastName}', member.lastName);
            val = safeReplace(val, '{member.id}', member.id);
            val = safeReplace(val, '{member.code}', member.memberCode || member.code || '-');
            val = safeReplace(val, '{member.phone}', member.phone || '-');
            val = safeReplace(val, '{member.email}', member.email || '-');
            val = safeReplace(val, '{member.gender}', member.gender || '-');
            val = safeReplace(val, '{member.bloodGroup}', member.bloodGroup || '-');
            val = safeReplace(val, '{member.nif}', member.nifCin || member.nif || member.cin || '-');
            val = safeReplace(val, '{member.address}', member.address || '-');
            const birthDateStr = member.birthDate ? new Date(member.birthDate).toLocaleDateString() : '-';
            val = safeReplace(val, '{member.birthDate}', birthDateStr);
            val = safeReplace(val, '{church.name}', user?.churchName || churchInfo?.name || 'Église');
            val = safeReplace(val, '{church.pastor}', user?.pastorName || churchInfo?.pastorName || 'Pasteur');
            val = safeReplace(val, '{church.acronym}', user?.churchAcronym || churchInfo?.acronym || 'Église');
            val = safeReplace(val, '{church.phone}', churchInfo?.contactPhone || 'Téléphone');
            val = safeReplace(val, '{church.email}', user?.churchEmail || churchInfo?.churchEmail || churchInfo?.contactEmail || 'Email');
            val = safeReplace(val, '{church.address}', churchInfo?.address ? `${churchInfo.address}, ${churchInfo.city || ''}` : 'Adresse');

            return (
                <div style={{
                    color: field.color || '#000',
                    fontSize: `${Math.min(30, Math.max(1, field.fontSize || 1))}px`,
                    fontFamily: field.fontFamily || 'Arial',
                    fontWeight: field.bold ? 'bold' : 'normal',
                    fontStyle: field.italic ? 'italic' : 'normal',
                    textTransform: field.textTransform || 'none',
                    textAlign: field.textAlign || 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: field.textAlign === 'center' ? 'center' : field.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    width: '100%',
                    height: '100%',
                    padding: '0 4px',
                    lineHeight: '1.2'
                }}>
                    {val}
                </div>
            );
        }
        return null;
    };

    const handleGenerateBatch = async () => {
        if (!selectedTemplate) return;
        setProcessing(true);
        setProgress(0);
        setStatusMessage("Initialisation du PDF...");

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [85.7, 54.0]
        });

        try {
            for (let i = 0; i < members.length; i++) {
                const member = members[i];
                const currentProgress = Math.round((i / members.length) * 100);
                setProgress(currentProgress);
                setStatusMessage(`Génération pour ${member.firstName} ${member.lastName}...`);

                // Create temporary containers for this specific member
                const container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.left = '-2000px';
                container.style.top = '-2000px';
                document.body.appendChild(container);

                const renderCardToCanvas = async (side) => {
                    const cardDiv = document.createElement('div');
                    cardDiv.style.width = `${CARD_WIDTH}px`;
                    cardDiv.style.height = `${CARD_HEIGHT}px`;
                    cardDiv.style.position = 'relative';
                    cardDiv.style.backgroundColor = 'white';
                    cardDiv.style.overflow = 'hidden';
                    container.appendChild(cardDiv);

                    // Background
                    const bgUrl = side === 'front' ? selectedTemplate.frontBackgroundUrl : selectedTemplate.backBackgroundUrl;
                    if (bgUrl) {
                        const img = document.createElement('img');
                        img.src = bgUrl.startsWith('http') ? bgUrl : `${api.defaults.baseURL?.replace('/api', '') || ''}${bgUrl}`;
                        img.crossOrigin = "anonymous";
                        const bgConfig = side === 'front' ? selectedTemplate.layoutConfig?.frontBgConfig : selectedTemplate.layoutConfig?.backBgConfig;
                        img.style.position = 'absolute';
                        img.style.left = `${bgConfig?.x || 0}px`;
                        img.style.top = `${bgConfig?.y || 0}px`;
                        img.style.width = `${bgConfig?.width || CARD_WIDTH}px`;
                        img.style.height = `${bgConfig?.height || CARD_HEIGHT}px`;
                        img.style.objectFit = 'fill';
                        img.style.zIndex = '0';
                        cardDiv.appendChild(img);
                        // Wait for bg image
                        await new Promise((resolve) => {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });
                    }

                    // Fields
                    const fields = selectedTemplate.layoutConfig?.fields?.filter(f => f.side === side) || [];
                    // We need to render React components to DOM. 
                    // To keep it simple and avoid complex ReactDOM server rendering, we'll just wait a bit for the DOM to settle
                    // OR we can use a simpler approach of creating elements manually, but that's error prone.
                    // Better: Let's use a hidden React root if possible, or just a small timeout.

                    // Actually, let's use a hidden div in the component and render it there via state.
                    // But that's hard to loop.

                    // Let's use a "Single Current Member" state and render it in the component's visible ref.
                    return cardDiv;
                };

                // REVISED STRATEGY: 
                // We'll update a `currentProcessingMember` state.
                // React will re-render the card in `renderAreaRef`.
                // We'll use a `useEffect` or a series of `await nextTick` to capture it.
                // This is safer.
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- REVISED APPROACH FOR BATCH GENERATION ---
    const [currentIdx, setCurrentIdx] = useState(-1);
    const frontRef = useRef();
    const backRef = useRef();

    useEffect(() => {
        if (currentIdx >= 0 && currentIdx < members.length) {
            const capture = async () => {
                const member = members[currentIdx];
                const pdf = window.batchPdf;

                // Small delay to ensure images in the card are loaded
                await new Promise(r => setTimeout(r, 1000));

                const scale = 3.126; // HD
                const frontCanvas = await html2canvas(frontRef.current, { scale, useCORS: true });
                const backCanvas = await html2canvas(backRef.current, { scale, useCORS: true });

                if (currentIdx > 0) pdf.addPage();
                pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, 85.7, 54.0);
                pdf.addPage();
                pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, 85.7, 54.0);

                const nextIdx = currentIdx + 1;
                if (nextIdx < members.length) {
                    setProgress(Math.round((nextIdx / members.length) * 100));
                    setStatusMessage(`Génération pour ${members[nextIdx].firstName} ${members[nextIdx].lastName}...`);
                    setCurrentIdx(nextIdx);
                } else {
                    setStatusMessage("Finalisation...");
                    pdf.save(`Batch_Cards_${Date.now()}.pdf`);
                    window.batchPdf = null;
                    setProcessing(false);
                    setCurrentIdx(-1);
                    if (onSuccess) onSuccess();
                    onClose();
                }
            };
            capture();
        }
    }, [currentIdx]);

    const startBatch = () => {
        if (!selectedTemplateId) return;
        window.batchPdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [85.7, 54.0]
        });
        setProcessing(true);
        setCurrentIdx(0);
        setStatusMessage(`Démarrage...`);
    };

    if (loading) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Génération en masse</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{members.length} membres sélectionnés</p>
                    </div>
                    {!processing && <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-xl font-black">✕</button>}
                </div>

                {!processing ? (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Choisir un modèle</label>
                            <select
                                value={selectedTemplateId}
                                onChange={e => setSelectedTemplateId(e.target.value)}
                                className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                            >
                                <option value="">Choisir un template...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} {t.isActive ? '(Actif)' : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
                            <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed font-bold">
                                Vous allez générer un document PDF contenant les cartes de **{members.length} membres**. Chaque carte sera sur deux pages (Recto puis Verso).
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={onClose} className="flex-1 h-14 bg-gray-100 dark:bg-white/5 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Annuler</button>
                            <button
                                onClick={startBatch}
                                disabled={!selectedTemplateId}
                                className="flex-1 h-14 bg-indigo-600 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 transition-all"
                            >
                                Démarrer
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center space-y-8">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-white/5" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * progress) / 100} className="text-indigo-600 transition-all duration-300" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-black text-indigo-600">{progress}%</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black dark:text-white mb-2">{statusMessage}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] animate-pulse">Traitement en cours...</p>
                        </div>

                        {/* Hidden render area for capturing */}
                        <div style={{ position: 'fixed', left: '-5000px', top: '-5000px' }}>
                            {members[currentIdx] && (
                                <>
                                    <div ref={frontRef} className="relative bg-white" style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}>
                                        {selectedTemplate.frontBackgroundUrl && (
                                            <img
                                                src={selectedTemplate.frontBackgroundUrl.startsWith('http') ? selectedTemplate.frontBackgroundUrl : `${api.defaults.baseURL?.replace('/api', '') || ''}${selectedTemplate.frontBackgroundUrl}`}
                                                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }}
                                                crossOrigin="anonymous" alt=""
                                            />
                                        )}
                                        {selectedTemplate.layoutConfig?.fields?.filter(f => f.side === 'front').map(field => (
                                            <div key={field.id} style={{ position: 'absolute', left: `${field.x}px`, top: `${field.y}px`, width: field.width ? `${field.width}px` : 'auto', height: field.height ? `${field.height}px` : 'auto', zIndex: 10, opacity: field.opacity !== undefined ? field.opacity : 1 }}>
                                                {renderFieldValue(field, members[currentIdx])}
                                            </div>
                                        ))}
                                    </div>
                                    <div ref={backRef} className="relative bg-white" style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}>
                                        {selectedTemplate.backBackgroundUrl && (
                                            <img
                                                src={selectedTemplate.backBackgroundUrl.startsWith('http') ? selectedTemplate.backBackgroundUrl : `${api.defaults.baseURL?.replace('/api', '') || ''}${selectedTemplate.backBackgroundUrl}`}
                                                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }}
                                                crossOrigin="anonymous" alt=""
                                            />
                                        )}
                                        {selectedTemplate.layoutConfig?.fields?.filter(f => f.side === 'back').map(field => (
                                            <div key={field.id} style={{ position: 'absolute', left: `${field.x}px`, top: `${field.y}px`, width: field.width ? `${field.width}px` : 'auto', height: field.height ? `${field.height}px` : 'auto', zIndex: 10, opacity: field.opacity !== undefined ? field.opacity : 1 }}>
                                                {renderFieldValue(field, members[currentIdx])}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BatchMemberCardGeneratorModal;
