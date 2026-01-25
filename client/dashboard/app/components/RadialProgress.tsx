import React from 'react';

interface RadialProgressProps {
    score: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}

export function RadialProgress({ score, size = 60, strokeWidth = 8, color = "text-emerald-500" }: RadialProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-secondary"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={color}
                />
            </svg>
            <span className="absolute text-xl font-bold text-foreground">{score}%</span>
        </div>
    );
}
