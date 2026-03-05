import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../auth/AuthProvider';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import AlertModal from '../../ChurchAlertModal';
import html2canvas from 'html2canvas';

const DEFAULT_CARD_WIDTH = 324;
const DEFAULT_CARD_HEIGHT = 204;

const MemberCardGeneratorModal = ({ member = {}, onClose, onSuccess, viewOnly = false, cardData = null, template: passedTemplate = null, isOpen = true }) => {
    const isVertical = passedTemplate?.layoutConfig?.isVertical || false;
    const CARD_WIDTH = isVertical ? DEFAULT_CARD_HEIGHT : DEFAULT_CARD_WIDTH;
    const CARD_HEIGHT = isVertical ? DEFAULT_CARD_WIDTH : DEFAULT_CARD_HEIGHT;

    const { t } = useLanguage();
    const { user } = useAuth();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [churchInfo, setChurchInfo] = useState(null);
    const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' or 'image'
    const [exportResolution, setExportResolution] = useState('hd'); // 'hd' -> 300dpi (1013x638) or 'standard' -> (646x408)
    const [alertMessage, setAlertMessage] = useState({ show: false, title: '', message: '', type: 'success' });
    const frontCardRef = useRef();
    const backCardRef = useRef();

    useEffect(() => {
        const fetchTemplate = async () => {
            if (passedTemplate) {
                setTemplate(passedTemplate);
                setLoading(false);
                return;
            }
            try {
                if (cardData && cardData.templateId) {
                    const tid = cardData.templateId.toString();
                    if (tid.startsWith('tpl_')) {
                        // It's a system template, it's not in the DB.
                        // We could search in SYSTEM_TEMPLATES but it's not imported here.
                        // For now just skip the API call if it's tpl_
                        console.warn("System template ID found, skipping API call:", tid);
                        setLoading(false);
                        return;
                    }
                    const res = await api.get(`/card-templates/${cardData.templateId}`);
                    setTemplate(res.data);
                } else {
                    const res = await api.get('/card-templates');
                    const active = res.data.find(t => t.isActive);
                    if (active) setTemplate(active);
                }

                // Fetch church info for variables
                try {
                    const churchRes = await api.get('/churches/settings');
                    setChurchInfo(churchRes.data.church);
                } catch (err) {
                    console.log("Could not fetch church info", err);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching template", error);
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [cardData, passedTemplate]);

    const getBgUrl = (path) => {
        if (!path) return '';
        if (typeof path !== 'string') return '';
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('__gradient')) return path;

        let serverBase = (api.defaults.baseURL || '').replace('/api', '');
        if (serverBase.endsWith('/')) serverBase = serverBase.slice(0, -1);

        const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, ''); // Remove all leading slashes
        return `${serverBase}/${cleanPath}`;
    };

    const getBgStyle = (bg) => {
        if (!bg) return { backgroundColor: '#ffffff' };
        if (bg.startsWith('__gradient:')) {
            return {
                backgroundImage: bg.split(':')[1],
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'transparent'
            };
        }
        return {
            backgroundImage: `url("${getBgUrl(bg)}")`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#ffffff'
        };
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            if (!template) throw new Error("Aucun modèle actif trouvé.");
            if (!frontCardRef.current || !backCardRef.current) throw new Error("Rendu de la carte non trouvé.");

            const scaleMultiplier = exportResolution === 'hd' ? 3.126 : 2; // Scale 3.126 from 324px gives ~1013px width (High Res)

            const frontCanvas = await html2canvas(frontCardRef.current, { scale: scaleMultiplier, useCORS: true });
            const backCanvas = await html2canvas(backCardRef.current, { scale: scaleMultiplier, useCORS: true });

            const frontDataUrl = frontCanvas.toDataURL('image/png');
            const backDataUrl = backCanvas.toDataURL('image/png');

            const fileNameBase = `MemberCard_${member?.firstName || 'Export'}_${member?.lastName || ''}`;

            if (exportFormat === 'pdf') {
                const pdf = new jsPDF({
                    orientation: isVertical ? 'p' : 'l',
                    unit: 'px',
                    format: [CARD_WIDTH * scaleMultiplier, CARD_HEIGHT * scaleMultiplier]
                });

                pdf.addImage(frontDataUrl, 'PNG', 0, 0, CARD_WIDTH * scaleMultiplier, CARD_HEIGHT * scaleMultiplier);
                pdf.addPage();
                pdf.addImage(backDataUrl, 'PNG', 0, 0, CARD_WIDTH * scaleMultiplier, CARD_HEIGHT * scaleMultiplier);

                if (viewOnly) {
                    pdf.save(`${fileNameBase}.pdf`);
                } else {
                    const cardNumber = `MC-${Date.now().toString().slice(-6)}-${member.id}`;
                    pdf.save(`${fileNameBase}.pdf`);

                    await api.post('/member-cards', {
                        userId: member.id,
                        cardNumber,
                        issueDate: new Date().toISOString().split('T')[0],
                        status: 'Active',
                        description: `Carte générée via Template (${exportResolution.toUpperCase()})`,
                        templateId: template.id
                    });
                }
            } else {
                // Export as images
                const downloadImage = (dataUrl, name) => {
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = name;
                    link.click();
                };

                if (viewOnly) {
                    downloadImage(frontDataUrl, `${fileNameBase}_Recto.png`);
                    setTimeout(() => downloadImage(backDataUrl, `${fileNameBase}_Verso.png`), 500);
                } else {
                    const cardNumber = `MC-${Date.now().toString().slice(-6)}-${member.id}`;
                    downloadImage(frontDataUrl, `${fileNameBase}_Recto.png`);
                    setTimeout(() => downloadImage(backDataUrl, `${fileNameBase}_Verso.png`), 500);

                    await api.post('/member-cards', {
                        userId: member.id,
                        cardNumber,
                        issueDate: new Date().toISOString().split('T')[0],
                        status: 'Active',
                        description: `Image générée via Template (${exportResolution.toUpperCase()})`,
                        templateId: template.id
                    });
                }
            }

            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
            setAlertMessage({ show: true, type: 'error', title: t('error', 'Erreur'), message: error.message || 'Échec de la génération.' });
        } finally {
            setGenerating(false);
        }
    };

    const renderFieldValue = (field) => {
        if (field.type === 'image') {
            const isLogo = field.label === '{church.logo}' || field.id === 'churchLogo' || field.label?.toLowerCase().includes('logo');
            const isPhoto = field.label === '{member.photo}' || field.id === 'photo' || field.label?.toLowerCase().includes('photo') || field.label?.toLowerCase().includes('portrait');

            const getImageUrl = (url) => {
                if (!url) return null;
                if (url.startsWith('http') || url.startsWith('data:')) return url;
                return getBgUrl(url); // Use the cleaner helper
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
                const photoUrl = getImageUrl(member?.photo);
                return photoUrl ? <img src={photoUrl} alt="avatar" style={imageStyle} crossOrigin="anonymous" /> : <div className="w-full h-full bg-gray-200 text-[10px] flex items-center justify-center">Photo</div>;
            }
            // Custom uploaded image
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
                qrValue = qrValue.replace('{member.id}', (member?.id || '').toString());
                qrValue = qrValue.replace('{member.code}', (member?.permanentCode || member?.id || '').toString());
            }
            return <QRCodeSVG value={qrValue} width="100%" height="100%" fgColor={field.color || '#000000'} />;
        }
        if (field.type === 'text') {
            let val = field.label || '';

            // Legacy fallbacks
            if (val === 'Nom complet' || val.includes('Nom')) val = `${member.firstName} ${member.lastName}`;
            if (val === 'ID Membre' || val.includes('ID')) val = `ID: ${member.id}`;

            // New variable system
            const safeReplace = (str, pattern, replacement) => str.replace(new RegExp(pattern, 'g'), replacement || '');

            val = safeReplace(val, '{member.fullName}', `${member?.firstName || ''} ${member?.lastName || ''}`);
            val = safeReplace(val, '{member.firstName}', member?.firstName || '');
            val = safeReplace(val, '{member.lastName}', member?.lastName || '');
            val = safeReplace(val, '{member.id}', (cardData && cardData.cardNumber) ? cardData.cardNumber : (member?.id || ''));
            val = safeReplace(val, '{member.code}', member?.memberCode || member?.code || '-');
            val = safeReplace(val, '{member.phone}', member?.phone || '-');
            val = safeReplace(val, '{member.email}', member?.email || '-');
            val = safeReplace(val, '{member.gender}', member?.gender || '-');
            val = safeReplace(val, '{member.bloodGroup}', member?.bloodGroup || '-');
            val = safeReplace(val, '{member.nif}', member?.nifCin || member?.nif || member?.cin || '-');
            val = safeReplace(val, '{member.address}', member?.address || '-');

            const birthDateStr = member?.birthDate ? new Date(member.birthDate).toLocaleDateString() : '-';
            val = safeReplace(val, '{member.birthDate}', birthDateStr);

            val = safeReplace(val, '{church.name}', user?.churchName || churchInfo?.name || 'Église');
            val = safeReplace(val, '{church.pastor}', user?.pastorName || churchInfo?.pastorName || 'Pasteur');
            val = safeReplace(val, '{church.acronym}', user?.churchAcronym || churchInfo?.acronym || 'Église');
            val = safeReplace(val, '{church.phone}', churchInfo?.contactPhone || 'Téléphone');
            val = safeReplace(val, '{church.email}', user?.churchEmail || churchInfo?.churchEmail || churchInfo?.contactEmail || 'Email');
            val = safeReplace(val, '{church.address}', churchInfo?.address ? `${churchInfo.address}, ${churchInfo.city || ''}` : 'Adresse');

            const textStyle = {
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
            };

            return (
                <div style={textStyle}>
                    {val}
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm"><div className="animate-spin text-white">⏳</div></div>;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] w-full max-w-4xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-white">Aperçu de la Carte Membre</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-xl font-black">✕</button>
                </div>

                {!template ? (
                    <div className="p-12 text-center text-gray-500 bg-gray-50 dark:bg-black rounded-2xl">
                        Aucun modèle actif. Veuillez créer et activer un modèle de carte.
                    </div>
                ) : (
                    <div className="space-y-8 flex flex-col items-center">
                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">Recto</p>
                            <div
                                ref={frontCardRef}
                                className="relative bg-white shadow-xl overflow-hidden rounded-none border border-gray-100"
                                style={{
                                    width: `${CARD_WIDTH}px`,
                                    height: `${CARD_HEIGHT}px`,
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        zIndex: 0,
                                        ...getBgStyle(template.frontBackgroundUrl)
                                    }}
                                />
                                {template.layoutConfig?.fields?.filter(f => f.side === 'front').map(field => (
                                    <div key={field.id} style={{
                                        position: 'absolute',
                                        left: `${field.x}px`,
                                        top: `${field.y}px`,
                                        width: field.width ? `${field.width}px` : 'auto',
                                        height: field.height ? `${field.height}px` : 'auto',
                                        zIndex: 10,
                                        opacity: field.opacity !== undefined ? field.opacity : 1
                                    }}>
                                        {renderFieldValue(field)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">Verso</p>
                            <div
                                ref={backCardRef}
                                className="relative bg-white shadow-xl overflow-hidden rounded-none border border-gray-100"
                                style={{
                                    width: `${CARD_WIDTH}px`,
                                    height: `${CARD_HEIGHT}px`
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        zIndex: 0,
                                        ...getBgStyle(template.backBackgroundUrl)
                                    }}
                                />
                                {template.layoutConfig?.fields?.filter(f => f.side === 'back').map(field => (
                                    <div key={field.id} style={{
                                        position: 'absolute',
                                        left: `${field.x}px`,
                                        top: `${field.y}px`,
                                        width: field.width ? `${field.width}px` : 'auto',
                                        height: field.height ? `${field.height}px` : 'auto',
                                        zIndex: 10,
                                        opacity: field.opacity !== undefined ? field.opacity : 1
                                    }}>
                                        {renderFieldValue(field)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 w-full justify-center pt-6 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-black p-2 rounded-xl border border-gray-200 dark:border-white/10">
                                <span className="text-xs font-bold text-gray-500 pl-2">Format:</span>
                                <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="bg-transparent text-sm font-bold border-none outline-none cursor-pointer">
                                    <option value="pdf">Document PDF</option>
                                    <option value="image">Images (PNG)</option>
                                </select>
                                <div className="w-px h-6 bg-gray-200 dark:bg-white/10"></div>
                                <span className="text-xs font-bold text-gray-500">Qualité:</span>
                                <select value={exportResolution} onChange={e => setExportResolution(e.target.value)} className="bg-transparent text-sm font-bold border-none outline-none cursor-pointer">
                                    <option value="hd">Haute Définition (300 DPI - 1013x638)</option>
                                    <option value="standard">Standard (648x408)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full justify-center pt-4">
                            <button onClick={onClose} className="px-8 py-4 bg-gray-100 dark:bg-white/5 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200">Annuler</button>
                            <button onClick={handleGenerate} disabled={generating} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                {generating ? 'Génération...' : (viewOnly ? `Télécharger (${exportFormat.toUpperCase()})` : `Générer et Enregistrer (${exportFormat.toUpperCase()})`)}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <AlertModal isOpen={alertMessage.show} title={alertMessage.title} message={alertMessage.message} type={alertMessage.type} onClose={() => setAlertMessage({ ...alertMessage, show: false })} />
        </div>
    );
};

export default MemberCardGeneratorModal;
