const db = require('./models');
const { Op } = require('sequelize');

async function personalizeEDD() {
    try {
        console.log("Searching for EDD church...");
        const church = await db.Church.findOne({
            where: {
                [Op.or]: [
                    { acronym: 'EDD' },
                    { subdomain: 'edd' }
                ]
            }
        });

        if (!church) {
            console.error("Church EDD not found. Please create it first.");
            process.exit(1);
        }

        console.log(`Found: ${church.name}. Updating with premium content...`);

        await church.update({
            description: "Depuis notre fondation, l'Eglise de Dieu de Demals s'engage à être une lumière dans notre communauté. Nous sommes une famille unie par la foi, dédiée à l'enseignement biblique pur et à l'adoration sincère. Notre vision est de bâtir une génération de disciples passionnés par Dieu et engagés dans le service social et spirituel.",
            mission: "Porter l'Évangile à chaque cœur et transformer notre communauté par l'amour de Jésus-Christ.",
            missionImageUrl: "https://images.unsplash.com/photo-1529070532789-70dc1ca9070a?auto=format&fit=crop&q=80&w=1500",
            vision: "Devenir un phare spirituel qui impacte les familles de la zone de Demals et au-delà.",
            visionImageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=1500",
            values: "Intégrité, Compassion, Excellence et Service. Nous croyons que chaque vie est précieuse et mérite l'amour inconditionnel de Christ.",
            valuesImageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=1500",
            city: "Demals",
            address: "Rue de l'Espoir, Demals, Haïti",
            contactEmail: "info@edd-demals.org",
            contactPhone: "+509 3737-1234",
            heroImageUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=2000",
            socialLinks: {
                facebook: "https://facebook.com/edd.demals",
                youtube: "https://youtube.com/c/EDDLive",
                whatsapp: "https://wa.me/50937371234",
                instagram: "https://instagram.com/edd_demals"
            },
            pastoralTeam: [
                {
                    name: "Pasteur Jean Baptiste",
                    role: "Pasteur Titulaire",
                    bio: "Dédié au service de Dieu depuis plus de 20 ans, le Pasteur Jean a une passion pour l'enseignement de la parole et le mentorat des jeunes leaders.",
                    photo: ""
                },
                {
                    name: "Sœur Marie Baptiste",
                    role: "Responsable des Femmes",
                    bio: "Accompagne les familles et dirige le ministère des femmes avec une vision de restauration et de force spirituelle.",
                    photo: ""
                }
            ],
            schedules: [
                { day: "Dimanche", time: "08:30 - 11:30", type: "Culte d'Adoration" },
                { day: "Mardi", time: "18:00 - 19:30", type: "École de la Parole" },
                { day: "Vendredi", time: "18:30 - 20:00", type: "Jeûne et Prière" }
            ],
            recentActivities: [
                {
                    title: "Distribution Alimentaire",
                    description: "Nous avons servi plus de 200 familles dans le quartier de Demals ce week-end en partageant des kits alimentaires essentiels.",
                    date: "15 Dec 2025",
                    type: "Social"
                },
                {
                    title: "Séminaire de Jeunesse",
                    description: "Un moment puissant de réflexion et d'orientation pour plus de 50 jeunes de la zone sur le thème de l'intégrité.",
                    date: "05 Jan 2026",
                    type: "Jeunesse"
                },
                {
                    title: "Lancement du Site Web",
                    description: "EDD est désormais en ligne ! Suivez-nous et restez connectés pour rater aucun de nos services.",
                    date: "06 Jan 2026",
                    type: "Nouvelle"
                }
            ]
        });

        console.log("SUCCESS! EDD personalized successfully.");
        process.exit(0);
    } catch (error) {
        console.error("ERROR during personalization:", error);
        process.exit(1);
    }
}

personalizeEDD();
