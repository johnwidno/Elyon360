import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = "Search...",
    displayKey = "name",
    valueKey = "id",
    className = "",
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search term
    const filteredOptions = options.filter(option => {
        const displayValue = option[displayKey] || '';
        return displayValue.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Get selected option display value
    const selectedOption = options.find(opt => opt[valueKey] === value);
    const displayValue = selectedOption ? selectedOption[displayKey] : '';

    const handleSelect = (option) => {
        onChange(option[valueKey]);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Search Input / Display */}
            <div
                className={`w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-transparent outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="flex items-center justify-between">
                        <span className={!displayValue ? 'text-gray-400' : ''}>
                            {displayValue || placeholder}
                        </span>
                        <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                            No results found
                        </div>
                    ) : (
                        filteredOptions.map(option => (
                            <div
                                key={option[valueKey]}
                                onClick={() => handleSelect(option)}
                                className={`px-4 py-3 text-sm cursor-pointer transition-colors ${option[valueKey] === value
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                {option[displayKey]}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
