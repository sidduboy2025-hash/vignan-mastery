import { useEffect, useRef, useState } from "react";

interface CountdownTimerProps {
    slug: string;
    duration?: number;
    onComplete?: () => void;
    isRunning: boolean;
}

const CountdownTimer = ({ slug, duration = 3 * 60 * 60, onComplete, isRunning }: CountdownTimerProps) => {
    const timerKey = `timer-${slug}`;
    const [timeLeft, setTimeLeft] = useState<number>(() => {
        const saved = localStorage.getItem(timerKey);
        return saved ? Math.max(0, parseInt(saved, 10)) : duration;
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleOnClick = () => {
        onComplete?.();
        localStorage.removeItem(timerKey);
    }

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    const newTime = Math.max(0, prev - 1);
                    localStorage.setItem(timerKey, newTime.toString());
                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    useEffect(() => {
        if (timeLeft <= 0 && isRunning) {
            onComplete?.();
            localStorage.removeItem(timerKey);
        }
    }, [timeLeft, isRunning, onComplete]);

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    return (
        <div className="text-lg font-bold text-red-600 border px-3 py-px border-red-500 font-mono cursor-pointer" onClick={handleOnClick}>
            {formatTime(timeLeft)}
        </div>
    );
};

export default CountdownTimer;
