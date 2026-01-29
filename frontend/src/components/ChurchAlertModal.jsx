import React from 'react';

export default function AlertModal({ isOpen, onClose, title, message, type = 'success' }) {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const isWarning = type === 'warning';
    const isError = type === 'error';

    // Determine colors based on type
    const bgColor = isSuccess ? 'bg-green-100' : isWarning ? 'bg-yellow-100' : 'bg-red-100';
    const textColor = isSuccess ? 'text-green-600' : isWarning ? 'text-yellow-600' : 'text-red-600';
    const buttonColor = isSuccess ? 'bg-green-600 hover:bg-green-700' : isWarning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700';

    return (
        <div className="fixed inset-0 z-[150] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4 text-center">
                <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:max-w-sm w-full relative z-10 border border-gray-100 dark:border-white/10">
                    <div className="bg-white px-5 pt-6 pb-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start text-center sm:text-left">
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${bgColor} sm:mx-0 sm:h-10 sm:w-10`}>
                                {isSuccess ? (
                                    <svg className={`h-6 w-6 ${textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : isWarning ? (
                                    <svg className={`h-6 w-6 ${textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                ) : (
                                    <svg className={`h-6 w-6 ${textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <div className="mt-4 sm:mt-0 sm:ml-4">
                                <h3 className="text-lg leading-6 font-bold text-gray-900">{title}</h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 font-medium">{message}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${buttonColor}`}
                            onClick={onClose}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
