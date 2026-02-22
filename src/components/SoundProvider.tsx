'use client';

import { useEffect, useRef } from 'react';

export function SoundProvider() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize the audio object with the sound file
        // Note: The file name contains a space, which may be URL-encoded as %20
        audioRef.current = new Audio('/sound/click%20sound.mp3');
        audioRef.current.preload = 'auto';

        let hoveredElement: HTMLElement | null = null;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Look for the closest element that acts as an interactive button/link/card
            const button = target.closest('button, a[href], .neo-button, .neo-card') as HTMLElement;

            if (button && button !== hoveredElement) {
                hoveredElement = button;

                if (audioRef.current) {
                    // Clone the node to allow rapid successive plays without cutting off 
                    // (or just reset currentTime if you prefer a single overlapping instance)
                    const playPromise = audioRef.current.cloneNode(true) as HTMLAudioElement;
                    playPromise.volume = 0.5; // Slightly lower volume so it's not too loud
                    playPromise.play().catch(err => {
                        // Ignore playback errors from browser auto-play policies (usually happens if 
                        // the user hasn't clicked anywhere on the document yet)
                    });
                }
            } else if (!button) {
                hoveredElement = null;
            }
        };

        document.addEventListener('mouseover', handleMouseOver);

        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
        };
    }, []);

    return null;
}
