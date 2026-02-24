import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function StatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
    return (
        <div className="glass-card p-6 rounded-3xl group">
            <div className="flex items-center gap-4">
                <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", color)}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">{label}</p>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
                </div>
            </div>
        </div>
    );
}

export function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm",
                active
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
        >
            {icon}
            {label}
        </button>
    );
}
