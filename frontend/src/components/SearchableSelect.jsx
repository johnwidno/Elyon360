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
                className={`w-full bg-gray-50 dark:bg-black border-2 border-transparent dark:border-white/5 rounded-2xl px-8 py-5 text-[15px] font-bold text-gray-700 dark:text-white outline-none focus:border-indigo-500/30 transition-all cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isOpen ? 'border-indigo-500/30' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <div className="flex items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={placeholder}
                            className="bg-transparent outline-none w-full placeholder-gray-400"
                            autoFocus
                        />
                    </div>
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
                <div className="absolute z-50 w-full mt-3 bg-white dark:bg-[#0D0D0D] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl max-h-80 overflow-y-auto noscrollbar transition-all animate-in fade-in slide-in-from-top-2">
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                            No results found
                        </div>
                    ) : (
                        filteredOptions.map(option => (
                            <div
                                key={option[valueKey]}
                                onClick={() => handleSelect(option)}
                                className={`px-8 py-4 text-[14px] font-bold cursor-pointer transition-all ${option[valueKey] === value
                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                                style={option.style || {}}
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
