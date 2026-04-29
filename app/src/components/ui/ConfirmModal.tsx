import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: (inputValue?: string) => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    showInput?: boolean;
    inputPlaceholder?: string;
    initialInputValue?: string;
    variant?: 'danger' | 'primary' | 'warning';
}

export function ConfirmModal({
    isOpen,
    title = 'Confirm Action',
    message,
    onConfirm,
    onCancel,
    confirmText = 'Yes, Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    showInput = false,
    inputPlaceholder = 'Type here...',
    initialInputValue = '',
    variant = 'danger'
}: ConfirmModalProps) {
    const [inputValue, setInputValue] = React.useState(initialInputValue);

    React.useEffect(() => {
        if (isOpen) setInputValue(initialInputValue);
    }, [isOpen, initialInputValue]);

    if (!isOpen) return null;

    const isDanger = variant === 'danger';
    const isPrimary = variant === 'primary';
    const isWarning = variant === 'warning';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            isDanger ? "bg-rose-50 text-rose-500" : 
                            isPrimary ? "bg-indigo-50 text-indigo-500" :
                            "bg-amber-50 text-amber-500"
                        )}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <button 
                            onClick={onCancel}
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium mb-4">
                        {message}
                    </p>

                    {showInput && (
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={inputPlaceholder}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-400 transition-all min-h-[100px] resize-none"
                            autoFocus
                        />
                    )}
                </div>

                <div className="p-4 bg-slate-50/50 flex gap-3 border-t border-slate-100">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-white text-slate-700 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => onConfirm(inputValue)}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 py-3 px-4 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50 flex justify-center items-center shadow-lg",
                            isDanger ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" :
                            isPrimary ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20" :
                            "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                        )}
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper for classNames if not imported
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
