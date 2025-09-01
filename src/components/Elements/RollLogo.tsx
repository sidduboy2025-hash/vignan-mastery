import React from 'react';

interface RollLogoProps {
    rollno: string;
}

const RollLogo: React.FC<RollLogoProps> = ({ rollno }) => {
    const initials = rollno?.slice(0, 2).toUpperCase() || '';

    return (
        <svg
            viewBox="0 0 100 100"
            className="w-8 h-8 border border-purple-700 rounded-full bg-purple-600"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="48" className="fill-purple-600" />
            <text
                x="50%"
                y="54%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-5xl font-bold font-sans"
            >
                {initials}
            </text>
        </svg>
    );
};

export default RollLogo;
