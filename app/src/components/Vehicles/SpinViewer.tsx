import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, MoveHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SpinViewerProps {
    images: string[];
    className?: string;
    autoRotate?: boolean;
}

export default function SpinViewer({ images, className, autoRotate = false }: SpinViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [rotation, setRotation] = useState(0); // Continuous rotation value
    const [velocity, setVelocity] = useState(0);
    const requestRef = useRef<number>(0);
    const lastX = useRef<number>(0);
    const lastTime = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update index based on continuous rotation
    useEffect(() => {
        const index = Math.floor((rotation % (images.length * 10)) / 10 + images.length) % images.length;
        setCurrentIndex(index);
    }, [rotation, images.length]);

    const animate = useCallback((time: number) => {
        if (!isDragging) {
            // Apply inertia or auto-rotation
            let newVelocity = velocity * 0.95; // Friction
            
            if (autoRotate && Math.abs(newVelocity) < 0.2) {
                newVelocity = 0.3; // Minimum auto-rotate speed
            }

            if (Math.abs(newVelocity) < 0.01) newVelocity = 0;
            
            setRotation(prev => prev + newVelocity);
            setVelocity(newVelocity);
        }
        requestRef.current = requestAnimationFrame(animate);
    }, [isDragging, velocity, autoRotate]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [animate]);

    const handleStart = (clientX: number) => {
        setIsDragging(true);
        lastX.current = clientX;
        lastTime.current = performance.now();
        setVelocity(0);
    };

    const handleMove = (clientX: number) => {
        if (!isDragging) return;

        const diff = clientX - lastX.current;
        const now = performance.now();
        const deltaTime = now - lastTime.current;

        if (deltaTime > 0) {
            const newVelocity = diff * 0.5;
            setRotation(prev => prev + newVelocity);
            setVelocity(newVelocity);
        }

        lastX.current = clientX;
        lastTime.current = now;
    };

    const handleEnd = () => {
        setIsDragging(false);
    };

    if (!images || images.length === 0) return null;

    return (
        <div 
            ref={containerRef}
            className={cn(
                "relative select-none cursor-grab active:cursor-grabbing overflow-hidden rounded-[2rem] bg-gray-100 aspect-[16/9] group",
                className
            )}
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
        >
            {/* Main Image */}
            <div className="w-full h-full relative">
                {images.map((img, i) => (
                    <img 
                        key={i}
                        src={img} 
                        alt={`Vehicle spin ${i}`}
                        className={cn(
                            "absolute inset-0 w-full h-full object-cover pointer-events-none",
                            i === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                        )}
                    />
                ))}
            </div>

            {/* Overlay UI */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-20" />
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 z-30">
                <RotateCw className="w-4 h-4 text-white animate-spin-slow" />
                <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">360° Interactive</span>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
                <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
                />
            </div>
        </div>
    );
}
