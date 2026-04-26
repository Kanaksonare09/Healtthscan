'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const menuItems = {
        patient: [
            { name: 'Dashboard', path: '/dashboard/patient', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg> },
            { name: 'Reports', path: '/dashboard/patient/reports', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg> },

            { name: 'Analytics', path: '/dashboard/patient/analytics', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></svg> },
            { name: 'Profile', path: '/dashboard/patient/profile', icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
        ],
        doctor: [
            { name: 'Dashboard', path: '/dashboard/doctor', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg> },
            { name: 'Reports', path: '/dashboard/doctor/shared-reports', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg> },
            { name: 'Patients', path: '/dashboard/doctor/patients', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
        ]
    };

    const currentRoleItems = menuItems[user?.role as keyof typeof menuItems] || [];
    const isDoctor = user?.role === 'doctor';

    return (
        <aside className="w-[230px] bg-[#2C3E3E] text-white flex flex-col h-full relative z-20 shadow-2xl shadow-[#1A2626]/30 shrink-0">
            {/* Brand */}
            <div className="px-6 pt-6 pb-8">
                <Link href={`/dashboard/${user?.role}`}>
                    <h2 className="text-lg font-extrabold tracking-tight text-white leading-snug">
                        HealthScan
                    </h2>
                    <p className="text-[10px] text-[#8FB9A8] mt-0.5 tracking-widest">Premium Suite</p>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5">
                {currentRoleItems.map((item) => {
                    const isExact = pathname === item.path;
                    const isActive = isExact || (item.path !== '#' && item.path !== '/dashboard/doctor' && pathname.startsWith(item.path + '/'));
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-semibold relative ${isActive
                                    ? 'bg-[#4F6F6F] text-white font-bold'
                                    : 'text-[#8FB9A8]/70 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom CTA + Logout */}
            <div className="px-4 pb-6 space-y-2 mt-auto">
                <button
                    onClick={logout}
                    className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-[#8FB9A8]/60 hover:bg-white/5 hover:text-white transition-all text-sm font-semibold"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                    Logout
                </button>
            </div>
        </aside>
    );
}
