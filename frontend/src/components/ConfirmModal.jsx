import React from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4 text-center">
                <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full relative z-10 border border-gray-100 dark:border-white/10">
                    <div className="bg-white px-5 pt-6 pb-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start text-center sm:text-left">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
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
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onConfirm}
                        >
                            Confirmer
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
