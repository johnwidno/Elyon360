/* src/layouts/PublicLayout.jsx */
import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';

const PublicLayout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header / Navbar */}
            {/* Header / Navbar */}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                ElyonSys 360
                            </Link>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md font-medium">
                                Accueil
                            </Link>
                            <Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md font-medium">
                                À propos
                            </Link>
                            <Link to="/services" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md font-medium">
                                Services
                            </Link>
                            <Link to="/events" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md font-medium">
                                Événements
                            </Link>
                            <Link to="/contact" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md font-medium">
                                Contact
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <DarkModeToggle />
                            <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
                                Connexion
                            </Link>
                            <Link to="/register-church" className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium text-sm transition-colors">
                                Créer mon église
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow bg-gray-50 dark:bg-gray-900 transition-colors duration-200 text-gray-900 dark:text-gray-100">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 dark:bg-gray-950 text-gray-300 py-10 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">ElyonSys 360</h3>
                        <p className="text-sm">
                            Plateforme de gestion moderne pour les églises connectées.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Liens Rapides</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/login" className="hover:text-white transition-colors">Espace Membre</Link></li>
                            <li><Link to="/admin" className="hover:text-white transition-colors">Administration</Link></li>
                            <li><Link to="/register-church" className="hover:text-white transition-colors">Inscrire une église</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Contact</h3>
                        <p className="text-sm">support@elyonsys360.com</p>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-700 pt-8 text-center text-sm">
                    &copy; {new Date().getFullYear()} ElyonSys 360. Tous droits réservés.
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
