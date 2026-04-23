import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import api from '../../api/axios';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, Download, Loader2, Info, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MemberCard_PWA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);

  const DEFAULT_CARD_WIDTH = 324;
  const DEFAULT_CARD_HEIGHT = 204;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active card template
        const tplRes = await api.get('/card-templates');
        const active = tplRes.data.find(t => t.isActive) || tplRes.data[0];
        setTemplate(active);

        // Fetch user's member card info if exists
        const cardRes = await api.get(`/member-cards`);
        // Note: Backend might need to filter by current user if not done automatically
        const myCard = cardRes.data.find(c => c.userId === user.id);
        setCardData(myCard);
      } catch (error) {
        console.error("Error fetching card data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('__gradient')) return path;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`;
  };

  const getBgStyle = (bg) => {
    if (!bg) return { backgroundColor: '#ffffff' };
    if (bg.startsWith('__gradient:')) {
      return {
        backgroundImage: bg.split(':')[1],
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {
      backgroundImage: `url("${getImageUrl(bg)}")`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  };

  const renderFieldValue = (field) => {
    if (field.type === 'image') {
      const isLogo = field.label?.includes('logo') || field.id === 'churchLogo';
      const isPhoto = field.label?.includes('photo') || field.id === 'photo';

      const style = {
        borderRadius: field.borderRadius ? `${field.borderRadius}px` : '0px',
        width: '100%',
        height: '100%',
        objectFit: isLogo ? 'contain' : 'cover'
      };

      if (isLogo) {
        const url = getImageUrl(user?.church?.logoUrl);
        return url ? <img src={url} alt="logo" style={style} /> : <div className="bg-gray-100 w-full h-full" />;
      }
      if (isPhoto) {
        const url = getImageUrl(user?.photo);
        return url ? <img src={url} alt="photo" style={style} /> : <div className="bg-gray-100 w-full h-full" />;
      }
      if (field.imageUrl) return <img src={getImageUrl(field.imageUrl)} alt="img" style={style} />;
      return <div className="bg-gray-100 w-full h-full" />;
    }

    if (field.type === 'qrcode') {
      const qrValue = (field.qrValue || '{member.id}').replace('{member.id}', user.id).replace('{member.code}', user.memberCode || user.id);
      return <QRCodeSVG value={qrValue} width="100%" height="100%" fgColor={field.color || '#000'} />;
    }

    if (field.type === 'text') {
      let val = field.label || '';
      const safeReplace = (str, pattern, replacement) => str.replace(new RegExp(pattern, 'g'), replacement || '');
      
      val = safeReplace(val, '{member.fullName}', `${user.firstName} ${user.lastName}`);
      val = safeReplace(val, '{member.firstName}', user.firstName);
      val = safeReplace(val, '{member.lastName}', user.lastName);
      val = safeReplace(val, '{member.id}', cardData?.cardNumber || user.id);
      val = safeReplace(val, '{member.code}', user.memberCode || '-');
      val = safeReplace(val, '{church.name}', user?.church?.name || 'Église');
      val = safeReplace(val, '{church.acronym}', user?.church?.acronym || 'SIGLE');

      return (
        <div style={{
          color: field.color || '#000',
          fontSize: `${field.fontSize || 12}px`,
          fontFamily: field.fontFamily || 'Arial',
          fontWeight: field.bold ? 'bold' : 'normal',
          textAlign: field.textAlign || 'left',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: field.textAlign === 'center' ? 'center' : field.textAlign === 'right' ? 'flex-end' : 'flex-start'
        }}>
          {val}
        </div>
      );
    }
    
    if (field.type === 'shape') {
        return <div style={{ width: '100%', height: '100%', backgroundColor: field.color || '#000', opacity: field.opacity || 1, borderRadius: field.shapeType === 'circle' ? '50%' : '0' }} />;
    }

    return null;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={32} />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Chargement de votre carte...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <div className="p-6 space-y-8 max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><ChevronLeft size={20} /></button>
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Ma Carte Membre</h1>
          <div className="w-10"></div>
        </div>

        {!template ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center shadow-xl border border-slate-100 dark:border-slate-700">
            <Info className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              Aucun modèle de carte n'est disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-12 flex flex-col items-center">
            
            {/* Front Side */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-100 dark:border-none"
              style={{ width: `${DEFAULT_CARD_WIDTH}px`, height: `${DEFAULT_CARD_HEIGHT}px` }}
            >
              <div style={{ position: 'absolute', inset: 0, zIndex: 0, ...getBgStyle(template.frontBackgroundUrl) }} />
              {template.layoutConfig?.fields?.filter(f => f.side === 'front').map(field => (
                <div key={field.id} style={{
                  position: 'absolute',
                  left: `${field.x}px`, top: `${field.y}px`,
                  width: `${field.width}px`, height: `${field.height}px`,
                  zIndex: 10, opacity: field.opacity ?? 1
                }}>
                  {renderFieldValue(field)}
                </div>
              ))}
            </motion.div>

            {/* Back Side */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="relative shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-100 dark:border-none"
              style={{ width: `${DEFAULT_CARD_WIDTH}px`, height: `${DEFAULT_CARD_HEIGHT}px` }}
            >
              <div style={{ position: 'absolute', inset: 0, zIndex: 0, ...getBgStyle(template.backBackgroundUrl) }} />
              {template.layoutConfig?.fields?.filter(f => f.side === 'back').map(field => (
                <div key={field.id} style={{
                  position: 'absolute',
                  left: `${field.x}px`, top: `${field.y}px`,
                  width: `${field.width}px`, height: `${field.height}px`,
                  zIndex: 10, opacity: field.opacity ?? 1
                }}>
                  {renderFieldValue(field)}
                </div>
              ))}
            </motion.div>

            <div className="w-full space-y-4 pt-4">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                <p className="text-[12px] font-bold text-blue-600 dark:text-blue-400 leading-relaxed text-center">
                  Cette carte est votre identifiant officiel au sein de la communauté. Vous pouvez la présenter lors des événements et services.
                </p>
              </div>
              
              <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                <Download size={16} />
                Télécharger ma carte
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default MemberCard_PWA;
