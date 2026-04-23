import { useState, useEffect } from 'react';

export const usePWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect standalone mode
        const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsStandalone(!!standalone);

        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        const handleBeforeInstallPrompt = (e) => {
            console.log('PWA: beforeinstallprompt event fired');
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setIsInstallable(false);
            setIsStandalone(true);
            setDeferredPrompt(null);
            console.log('PWA: Installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const installApp = async () => {
        if (isStandalone) {
            alert("L'application est déjà installée sur cet appareil.");
            return;
        }

        if (isIOS) {
            alert("📥 Pour installer sur iPhone/iPad :\n1. Cliquez sur le bouton 'Partager' (carré avec flèche) en bas de Safari.\n2. Sélectionnez 'Sur l'écran d'accueil'.");
            return;
        }

        if (!deferredPrompt) {
            // Fallback for browsers that don't support beforeinstallprompt or if it hasn't fired yet
            alert("Pour installer l'application :\n\n- Sur Chrome/Edge (PC) : Cliquez sur l'icône d'ordinateur 📥 en haut à droite de la barre d'adresse.\n- Sur Android : Cliquez sur les '...' du navigateur puis 'Installer l'application'.");
            return;
        }

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA: User choice: ${outcome}`);
            
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsInstallable(false);
            }
        } catch (err) {
            console.error("PWA: Error during prompt", err);
        }
    };

    return { isInstallable, isStandalone, isIOS, installApp };
};
