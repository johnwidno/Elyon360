import React, { createContext, useContext, useState, useMemo } from 'react';

const translations = {
    FR: {
        // Navbar
        nav_home: 'Accueil',
        nav_about: 'À propos',
        nav_services: 'Services',
        nav_contact: 'Contact',
        nav_signup: "Se connecter",
        nav_create: 'Inscrire mon église',

        // Hero
        hero_title_1: 'Une solution divine pour une',
        hero_title_2: 'gestion',
        hero_title_accent: 'moderne',
        hero_desc: "La vision complète pour l'église d'aujourd'hui et de demain. ElyonSys 360 offre tous les outils pour gérer vos membres, vos événements, vos finances et votre site web en un seul endroit.",
        hero_cta: 'Créer mon église gratuitement',
        hero_login: 'Se connecter',

        // About
        about_title: "À propos d'ElyonSys 360",
        about_desc: "ElyonSys 360 est une plateforme SaaS conçue pour faciliter la gestion administrative, spirituelle et communautaire des églises modernes. Grâce à une interface intuitive et sécurisée, chaque église dispose de son propre espace personnalisé pour gérer ses membres, ses activités, ses finances et sa croissance spirituelle.",

        // Features
        features_title: 'Fonctionnalités clés',
        features_subtitle: "Une suite complète d'outils pour servir votre communauté.",
        feat_1_title: 'Gestion des membres & profils',
        feat_1_desc: 'Suivez les parcours spirituels, les engagements et les familles avec des profils complets.',
        feat_2_title: 'Planification des cultes et activités',
        feat_2_desc: "Planifiez les cultes, gérez les inscriptions et coordonnez toutes les activités depuis un seul endroit.",
        feat_3_title: 'Tableau de bord administratif',
        feat_3_desc: "Visualisez toutes les données importantes et prenez des décisions éclairées pour votre église.",
        feat_4_title: 'Gestion des finances / dons',
        feat_4_desc: 'Suivez les dons, les dîmes et les dépenses en toute transparence et conformité.',
        feat_5_title: 'Statistiques en temps réel',
        feat_5_desc: 'Accédez à des analyses puissantes pour mesurer la croissance de votre communauté.',
        feat_6_title: 'Espace membre personnalisé',
        feat_6_desc: 'Offrez un espace numérique personnalisé pour suivre ses parcours et sa croissance spirituelle.',
        feat_7_title: 'Accès par sous-domaine',
        feat_7_desc: 'Votre église dispose de son propre sous-domaine sur elyonsys360.com.',
        feat_8_title: 'Personnalisation complète',
        feat_8_desc: "Adaptez l'interface et les fonctionnalités aux besoins spécifiques de votre communauté.",

        // Objective
        obj_title: 'Notre objectif',
        obj_desc_1: "Offrir aux églises un outil numérique puissant et centralisé pour mieux organiser leur vision, suivre leurs fidèles, et impacter leur communauté.",
        obj_desc_2: "Nous croyons que chaque église mérite d'avoir accès aux meilleures technologies pour coordonner et développer son ministère. ElyonSys 360 est un partenaire de confiance pour une gestion efficace et spirituellement alignée.",
        obj_item_1: 'Interface intuitive et facile à utiliser',
        obj_item_2: 'Sécurité et confidentialité garanties',
        obj_item_3: 'Support technique réactif',
        obj_item_4: 'Mises à jour régulières et nouvelles fonctionnalités',
        obj_item_5: 'Personnalisation selon vos besoins',

        // CTA
        cta_title: 'Prêt à transformer votre gestion ?',
        cta_desc: 'Rejoignez les églises qui font confiance à ElyonSys 360',
        cta_btn: 'Créer mon église maintenant',

        // Footer
        footer_desc: 'Plateforme de gestion pour les églises modernes.',
        footer_links: 'Liens Rapides',
        footer_features: 'Fonctionnalités',
        footer_contact: 'Contact',
        footer_rights: 'Tous droits réservés.',

        // Login Page
        back_home: "Retour à l'accueil",
        login: "Connexion",
        welcome_to: "Bienvenue sur",
        login_to_space: "Connectez-vous à votre espace",
        email_address: "ADRESSE EMAIL",
        email_placeholder: "votre@email.com",
        password: "MOT DE PASSE",
        password_placeholder: "••••••••",
        forgot_password: "Mot de passe oublié ?",
        login_btn: "Se connecter",
        no_account: "Pas encore de compte ?",
        register_here: "Enregistrez votre église ici",
        invalid_credentials: "Email ou mot de passe incorrect.",

        // Member Dashboard
        overview: "Vue d'ensemble",
        my_profile: "Mon profil",
        recent_activity: "Activité récente",
        my_requests: "Mes demandes",
        donation_history: "Historique des dons",
        sunday_school: "Classes dominicales",
        groups: "Groupes",
        ministries: "Ministères",
        my_member_card: "Ma carte membre",
        upcoming_events: "Événements à venir",
        hello: "Bonjour",
        welcome_member_space: "Bienvenue dans votre espace membre",
        view_all: "Voir tout",
        no_upcoming_events: "Aucun événement à venir",
        view_all_history: "Voir tout l'historique",
        no_recent_activity: "Aucune activité récente",
        donation: "Don",
        notification: "Notification",
        donation_of: "Don de",
        recorded: "enregistré",

        // Worship Module
        worship_management: "Gestion des Cultes",
        worship_subtitle: "Planifiez, préparez et collaborez sur les messages de culte.",
        new_worship: "Nouveau Culte",
        total_worships: "Total des cultes",
        upcoming_worships: "Cultes à venir",
        draft_worships: "En brouillon",
        search_service: "Chercher un culte par thème...",
        upcoming: "À venir",
        past: "Passés",
        statistics: "Statistiques",
        loading: "Chargement...",
        no_worship_found: "Aucun culte trouvé",
        no_worship_instructions: "Commencez par créer votre premier culte pour planifier le programme et le message.",
        create_first_worship: "Créer un culte",
        draft: "Brouillon",
        worship_type_distribution: "Répartition des types de cultes",
        meetings_activity: "Activité des réunions",
        monthly_overview: "Aperçu mensuel de planification de réunions et d'événements",
        plan_new_worship: "Planifier un culte",
        plan_worship_desc: "Définissez le thème et les détails de base pour commencer.",
        theme: "Thème du culte",
        date: "Date",
        time: "Heure",
        worship_type: "Type de culte",
        normal_worship: "Culte normal",
        special_worship: "Culte spécial",
        celebration: "Célébration",
        deliverance: "Délivrance",
        prayer_night: "Soirée de prière",
        confirm_creation: "Confirmer la création",
        
        welcome_block: "Accueil",
        song_block: "Chant / Louange",
        prayer_block: "Prière",
        reading_block: "Lecture Biblique",
        announcements_block: "Annonces",
        sermon_block: "Message / Prédication",
        other_block: "Autre / Personnalisé",
        worship_schedule: "Déroulement du culte",
        presentation_mode: "Mode Présentation",
        exporting: "Export...",
        convert_to_pdf: "Convertir en PDF",
        schedule_tab: "Déroulement",
        sermon_tab: "Message & Prédication",
        add_block: "Ajouter un bloc",
        block_list_title: "Déroulement",
        steps: "étapes",
        click_left_to_build: "Cliquez sur un bloc à gauche pour construire votre culte.",
        normal: "Normal",
        special: "Spécial",
        
        // Sermon Editor
        bold: "Gras",
        italic: "Italique",
        underline: "Souligné",
        highlight_to_comment: "Surligner pour commenter",
        select_text_to_comment: "Veuillez sélectionner du texte pour ajouter un commentaire.",
        add_comment: "Ajouter un commentaire",
        comment_selection: "Commenter la sélection",
        sermon_title_placeholder: "Titre global de la prédication...",
        saved_at: "Sauvegardé à",
        saving: "Enregistrement...",
        save: "Enregistrer",
        comments: "Commentaires",
        message_saved: "Message sauvegardé",
        error_saving: "Erreur lors de la sauvegarde",
        start_writing_message: "Commencez à rédiger votre message ici...",
        your_sermon_title: "Titre de votre prédication",
        sermon_theme_placeholder: "ex: Porter du fruit en abondance",
        
        // Block Accordions UI
        responsable: "Responsable",
        responsable_placeholder: "Ex: Pasteur Jean / Chorale...",
        content_notes: "Contenu / Notes",
        content_placeholder: "Ajoutez les détails ou le texte exact ici...",
        lyrics_readonly: "Paroles (Lecture Seule)",
        passage_readonly: "Passage",
        add_sub_responsibility: "Ajouter Responsable/Contenu",
        add_text_only: "Ajouter Texte Simple",
        remove_item: "Supprimer cet élément",
        suggested: "Suggéré :",
        members: "Membres",
        groups: "Groupes",
        search_member_group: "Recherche membre ou groupe...",
        no_suggestions: "Aucune suggestion"
    },
    EN: {
        nav_home: 'Home',
        nav_about: 'About',
        nav_services: 'Services',
        nav_contact: 'Contact',
        nav_signup: 'Sign in',
        nav_create: 'Register my church',

        hero_title_1: 'A divine solution for',
        hero_title_2: '',
        hero_title_accent: 'modern management',
        hero_desc: "The complete vision for today's and tomorrow's church. ElyonSys 360 provides all the tools to manage your members, events, finances and website in one place.",
        hero_cta: 'Create my church for free',
        hero_login: 'Sign in',

        about_title: 'About ElyonSys 360',
        about_desc: "ElyonSys 360 is a SaaS platform designed to facilitate the administrative, spiritual and community management of modern churches. With an intuitive and secure interface, each church has its own personalized space to manage its members, activities, finances and spiritual growth.",

        features_title: 'Key Features',
        features_subtitle: 'A complete suite of tools to serve your community.',
        feat_1_title: 'Member & Profile Management',
        feat_1_desc: 'Track spiritual journeys, commitments and families with complete profiles.',
        feat_2_title: 'Worship & Activity Planning',
        feat_2_desc: 'Plan services, manage registrations and coordinate all activities from one place.',
        feat_3_title: 'Administrative Dashboard',
        feat_3_desc: 'Visualize all important data and make informed decisions for your church.',
        feat_4_title: 'Financial / Donation Management',
        feat_4_desc: 'Track donations, tithes and expenses with full transparency and compliance.',
        feat_5_title: 'Real-time Statistics',
        feat_5_desc: 'Access powerful analytics to measure the growth of your community.',
        feat_6_title: 'Personalized Member Space',
        feat_6_desc: 'Offer a personalized digital space to track journeys and spiritual growth.',
        feat_7_title: 'Subdomain Access',
        feat_7_desc: 'Your church gets its own subdomain on elyonsys360.com.',
        feat_8_title: 'Full Customization',
        feat_8_desc: "Adapt the interface and features to the specific needs of your community.",

        obj_title: 'Our Objective',
        obj_desc_1: 'Provide churches with a powerful, centralized digital tool to better organize their vision, track their faithful, and impact their community.',
        obj_desc_2: "We believe every church deserves access to the best technologies to coordinate and grow its ministry. ElyonSys 360 is a trusted partner for effective and spiritually aligned management.",
        obj_item_1: 'Intuitive and easy-to-use interface',
        obj_item_2: 'Guaranteed security and privacy',
        obj_item_3: 'Responsive technical support',
        obj_item_4: 'Regular updates and new features',
        obj_item_5: 'Customization to your needs',

        cta_title: 'Ready to transform your management?',
        cta_desc: 'Join the churches that trust ElyonSys 360',
        cta_btn: 'Create my church now',

        footer_desc: 'Management platform for modern churches.',
        footer_links: 'Quick Links',
        footer_features: 'Features',
        footer_contact: 'Contact',
        footer_rights: 'All rights reserved.',

        // Login Page
        back_home: "Back to home",
        login: "Sign In",
        welcome_to: "Welcome to",
        login_to_space: "Log in to your workspace",
        email_address: "EMAIL ADDRESS",
        email_placeholder: "your@email.com",
        password: "PASSWORD",
        password_placeholder: "••••••••",
        forgot_password: "Forgot password?",
        login_btn: "Sign in",
        no_account: "Don't have an account yet?",
        register_here: "Register your church here",
        invalid_credentials: "Invalid email or password.",

        // Member Dashboard
        overview: "Overview",
        my_profile: "My profile",
        recent_activity: "Recent activity",
        my_requests: "My requests",
        donation_history: "Donation history",
        sunday_school: "Sunday school",
        groups: "Groups",
        ministries: "Ministries",
        my_member_card: "My member card",
        upcoming_events: "Upcoming events",
        hello: "Hello",
        welcome_member_space: "Welcome to your member space",
        view_all: "View all",
        no_upcoming_events: "No upcoming events",
        view_all_history: "View all history",
        no_recent_activity: "No recent activity",
        donation: "Donation",
        notification: "Notification",
        donation_of: "Donation of",
        recorded: "recorded",

        // Worship Module
        worship_management: "Worship Management",
        worship_subtitle: "Plan, prepare and collaborate on worship messages.",
        new_worship: "New Worship",
        total_worships: "Total Worship Services",
        upcoming_worships: "Upcoming Worships",
        draft_worships: "Drafts",
        search_service: "Search a service by theme...",
        upcoming: "Upcoming",
        past: "Past",
        statistics: "Statistics",
        loading: "Loading...",
        no_worship_found: "No worship found",
        no_worship_instructions: "Start by creating your first service to plan the schedule and the message.",
        create_first_worship: "Create a worship service",
        draft: "Draft",
        worship_type_distribution: "Worship Types Distribution",
        meetings_activity: "Meetings Activity",
        monthly_overview: "Monthly overview of meetings and event planning",
        plan_new_worship: "Plan a Worship Service",
        plan_worship_desc: "Set the theme and basic details to get started.",
        theme: "Worship Theme",
        date: "Date",
        time: "Time",
        worship_type: "Worship Type",
        normal_worship: "Normal Worship",
        special_worship: "Special Worship",
        celebration: "Celebration",
        deliverance: "Deliverance",
        prayer_night: "Prayer Night",
        confirm_creation: "Confirm Creation",
        
        welcome_block: "Welcome",
        song_block: "Song / Worship",
        prayer_block: "Prayer",
        reading_block: "Bible Reading",
        announcements_block: "Announcements",
        sermon_block: "Sermon",
        other_block: "Other / Custom",
        worship_schedule: "Worship Schedule",
        presentation_mode: "Presentation Mode",
        exporting: "Exporting...",
        convert_to_pdf: "Convert to PDF",
        schedule_tab: "Schedule",
        sermon_tab: "Sermon & Message",
        add_block: "Add a block",
        block_list_title: "Schedule",
        steps: "steps",
        click_left_to_build: "Click on a block on the left to build your worship service.",
        normal: "Normal",
        special: "Special",

        // Sermon Editor
        bold: "Bold",
        italic: "Italic",
        underline: "Underline",
        highlight_to_comment: "Highlight to comment",
        select_text_to_comment: "Please select text to add a comment.",
        add_comment: "Add a comment",
        comment_selection: "Comment on selection",
        sermon_title_placeholder: "Global title of the sermon...",
        saved_at: "Saved at",
        saving: "Saving...",
        save: "Save",
        comments: "Comments",
        message_saved: "Message saved",
        error_saving: "Error saving",
        start_writing_message: "Start writing your message here...",
        your_sermon_title: "Your Sermon Title",
        sermon_theme_placeholder: "ex: Bearing fruit in abundance",
        
        // Block Accordions UI
        responsable: "In Charge",
        responsable_placeholder: "Ex: Pastor John / Choir...",
        content_notes: "Content / Notes",
        content_placeholder: "Add details or exact text here...",
        lyrics_readonly: "Lyrics (Readonly)",
        passage_readonly: "Passage",
        add_sub_responsibility: "Add Responsibility/Content",
        add_text_only: "Add Simple Text",
        remove_item: "Remove this item",
        suggested: "Suggested:",
        members: "Members",
        groups: "Groups",
        search_member_group: "Search member or group...",
        no_suggestions: "No suggestions"
    }
};

// Helper function for default t
const formatFallback = (str) => {
    if (!str) return '';
    const formatted = str.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};
const defaultT = (key, defaultValue) => translations.FR[key] || defaultValue || formatFallback(key);

const LanguageContext = createContext({
    lang: 'FR',
    toggleLang: () => { },
    t: defaultT
});

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState('FR');

    const toggleLang = () => setLang(l => l === 'FR' ? 'EN' : 'FR');

    const value = useMemo(() => ({
        lang,
        language: lang.toLowerCase(), // Alias for backward compatibility
        toggleLang,
        toggleLanguage: toggleLang, // Alias for backward compatibility
        t: (key, defaultValue) => translations[lang]?.[key] || translations.FR[key] || defaultValue || formatFallback(key)
    }), [lang]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    return useContext(LanguageContext);
};

