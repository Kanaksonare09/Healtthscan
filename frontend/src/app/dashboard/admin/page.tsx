'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';

interface PendingUser {
    _id: string;
    name: string;
    email: string;
    role: 'doctor' | 'pathology';
    status: string;
    createdAt: string;
    registrationNumber?: string;
    licenseNumber?: string;
    labName?: string;
    specialty?: string;
    hospitalName?: string;
    licenseCertificateUrl?: string;
}

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<'queue' | 'users' | 'reports'>('queue');
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allReports, setAllReports] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (activeTab === 'queue') fetchPendingUsers();
        if (activeTab === 'users') fetchAllUsers();
        if (activeTab === 'reports') fetchAllReports();
    }, [activeTab]);

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPendingUsers();
            if (data.success) setPendingUsers(data.users);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to load verification queue.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            setLoading(true);
            // We'll need a new endpoint for this, but for now we'll use a placeholder or generic api call
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010'}/api/admin/all-users`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) setAllUsers(data.users);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to load users.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAllReports = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010'}/api/admin/all-reports`, {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (data.success) setAllReports(data.reports);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to load reports.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('CRITICAL: Delete this user and all their data permanently?')) return;
        try {
            setActionLoading(userId);
            const res = await adminService.deleteUser(userId);
            if (res.success) {
                setStatus({ type: 'success', message: 'User deleted successfully.' });
                setAllUsers(prev => prev.filter(u => u._id !== userId));
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Deletion failed.' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!confirm('Delete this report permanently?')) return;
        try {
            setActionLoading(reportId);
            const res = await adminService.deleteReport(reportId);
            if (res.success) {
                setStatus({ type: 'success', message: 'Report deleted.' });
                setAllReports(prev => prev.filter(r => r._id !== reportId));
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Deletion failed.' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            setActionLoading(userId);
            const res = await adminService.approveUser(userId);
            if (res.success) {
                setStatus({ type: 'success', message: 'Account approved.' });
                setPendingUsers(prev => prev.filter(user => user._id !== userId));
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Approval failed.' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId: string) => {
        if (!confirm('Reject this application?')) return;
        try {
            setActionLoading(userId);
            const res = await adminService.rejectUser(userId);
            if (res.success) {
                setStatus({ type: 'success', message: 'Account rejected.' });
                setPendingUsers(prev => prev.filter(user => user._id !== userId));
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Rejection failed.' });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading && pendingUsers.length === 0 && allUsers.length === 0 && allReports.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-[#8FB9A8] border-t-[#4F6F6F] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[#2C3E3E]">Administrator Control</h1>
                    <p className="text-[#6B7280] mt-1 font-medium text-lg">Manage medical professionals, labs, and clinical data.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-[#F6F7F5] p-1.5 rounded-2xl w-fit border border-[#E2E8F0]">
                {[
                    { id: 'queue', label: 'Verification Queue', icon: '⚡' },
                    { id: 'users', label: 'User Directory', icon: '👥' },
                    { id: 'reports', label: 'Report Database', icon: '📋' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === tab.id 
                            ? 'bg-white text-[#4F6F6F] shadow-sm' 
                            : 'text-[#6B7280] hover:bg-white/50'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {status && (
                <div className={`p-4 rounded-2xl border-l-4 shadow-sm ${
                    status.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-500 text-rose-700'
                }`}>
                    <p className="font-black flex items-center text-sm">
                        {status.message}
                    </p>
                </div>
            )}

            {/* Verification Queue */}
            {activeTab === 'queue' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {pendingUsers.length > 0 ? (
                        pendingUsers.map((user) => (
                            <div key={user._id} className="bg-white rounded-[2rem] border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                                <div className="p-8 flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            user.role === 'doctor' ? 'bg-[#F6F7F5] text-[#4F6F6F]' : 'bg-[#8FB9A8]/10 text-[#8FB9A8]'
                                        }`}>
                                            {user.role} Account
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-[#2C3E3E]">{user.name}</h3>
                                    <p className="text-[#6B7280] font-medium mb-6">{user.email}</p>
                                    
                                    <div className="bg-[#F6F7F5] p-5 rounded-2xl border border-[#E2E8F0] text-xs space-y-2">
                                        <p><strong>Reg #:</strong> {user.registrationNumber || user.licenseNumber}</p>
                                        <p><strong>Info:</strong> {user.specialty || user.labName}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-[#F6F7F5]/50 border-t border-[#E2E8F0] flex gap-4">
                                    <button onClick={() => handleApprove(user._id)} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all">Approve</button>
                                    <button onClick={() => handleReject(user._id)} className="px-6 bg-white text-rose-500 border border-rose-100 font-black py-4 rounded-2xl hover:bg-rose-50 transition-all">Reject</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-[#E2E8F0]">
                            <p className="text-[#6B7280] font-bold text-lg">No pending verifications.</p>
                        </div>
                    )}
                </div>
            )}

            {/* User Directory */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#F6F7F5] flex items-center justify-between">
                        <input 
                            type="text" 
                            placeholder="Search users by name, email or ID..." 
                            className="bg-[#F6F7F5] border-none rounded-xl px-5 py-3 text-sm w-full max-w-md focus:ring-2 focus:ring-[#8FB9A8]"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F6F7F5]">
                                <tr>
                                    {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-[#6B7280] uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F6F7F5]">
                                {allUsers.filter(u => 
                                    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                                ).map(u => (
                                    <tr key={u._id} className="hover:bg-[#F6F7F5]/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-[#2C3E3E] text-sm">{u.name}</td>
                                        <td className="px-6 py-4 text-[#6B7280] text-sm font-medium">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                u.role === 'doctor' ? 'bg-blue-50 text-blue-600' : 
                                                u.role === 'pathology' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>{u.role}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                u.status === 'APPROVED' ? 'text-emerald-600' : 'text-amber-600'
                                            }`}>{u.status}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.role !== 'SuperAdmin' && (
                                                <button 
                                                    onClick={() => handleDeleteUser(u._id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* All Reports */}
            {activeTab === 'reports' && (
                <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#F6F7F5]">
                        <input 
                            type="text" 
                            placeholder="Search reports by patient or test type..." 
                            className="bg-[#F6F7F5] border-none rounded-xl px-5 py-3 text-sm w-full max-w-md focus:ring-2 focus:ring-[#8FB9A8]"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F6F7F5]">
                                <tr>
                                    {['Report Name', 'Patient', 'Type', 'Date', 'Actions'].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-[#6B7280] uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F6F7F5]">
                                {allReports.filter(r => 
                                    r.reportName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    r.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
                                ).map(r => (
                                    <tr key={r._id} className="hover:bg-[#F6F7F5]/50 transition-colors">
                                        <td className="px-6 py-4 font-black text-[#2C3E3E] text-sm">{r.reportName}</td>
                                        <td className="px-6 py-4 text-[#6B7280] text-sm font-bold">{r.patientName || 'Unknown Patient'}</td>
                                        <td className="px-6 py-4 text-[#6B7280] text-xs font-black uppercase tracking-widest">{r.testType}</td>
                                        <td className="px-6 py-4 text-[#6B7280] text-xs font-medium">{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleDeleteReport(r._id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
