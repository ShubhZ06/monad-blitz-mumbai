'use client';

import { useState, useEffect } from 'react';
import { useProfile } from './ProfileProvider';

export function ProfilePopup() {
    const { showProfilePopup, setShowProfilePopup, saveProfile, profile } = useProfile();
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when popup opens
    useEffect(() => {
        if (showProfilePopup) {
            setUsername(profile?.username || '');
            setError('');
        }
    }, [showProfilePopup, profile]);

    if (!showProfilePopup) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmedUsername = username.trim();

        // Validation
        if (!trimmedUsername) {
            setError('Please enter a username');
            return;
        }

        if (trimmedUsername.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }

        if (trimmedUsername.length > 20) {
            setError('Username must be 20 characters or less');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
            setError('Username can only contain letters, numbers, and underscores');
            return;
        }

        setIsSubmitting(true);
        const result = await saveProfile(trimmedUsername);
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.error || 'Failed to save profile');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-[#fffbe6] border-4 border-black shadow-[8px_8px_0_0_#000000] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#FF3366] border-b-4 border-black p-4">
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider text-center drop-shadow-[2px_2px_0_#000000]">
                        🎮 Create Your Profile
                    </h2>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-black font-bold text-lg">
                            Welcome, Trainer! Choose your name to begin your adventure.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="username" className="block text-sm font-black text-black uppercase tracking-wider">
                            Trainer Name
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your name..."
                            maxLength={20}
                            className="w-full px-4 py-3 text-lg font-bold text-black bg-white border-4 border-black shadow-[4px_4px_0_0_#000000] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3366] focus:shadow-[2px_2px_0_0_#000000] transition-all placeholder:text-gray-400"
                            autoFocus
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-600 font-medium">
                            3-20 characters. Letters, numbers, and underscores only.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3">
                            <p className="text-red-600 font-bold text-sm text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full neo-button bg-[#34c759] text-white text-xl uppercase tracking-widest px-8 py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span>Start Adventure</span>
                                <span className="text-2xl">⚡</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Decorative elements */}
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#ffcc00] border-4 border-black rounded-full shadow-[2px_2px_0_0_#000000] flex items-center justify-center text-2xl">
                    ✨
                </div>
            </div>
        </div>
    );
}
