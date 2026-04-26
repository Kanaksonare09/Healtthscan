import api from './api';

export const adminService = {
    getPendingUsers: async () => {
        const res = await api.get('/admin/pending-users');
        return res.data;
    },
    approveUser: async (userId: string) => {
        const res = await api.post('/admin/approve-user', { userId });
        return res.data;
    },
    rejectUser: async (userId: string) => {
        const res = await api.post('/admin/reject-user', { userId });
        return res.data;
    },
    deleteUser: async (userId: string) => {
        const res = await api.post('/admin/delete-user', { userId });
        return res.data;
    },
    deleteReport: async (reportId: string) => {
        const res = await api.post('/admin/delete-report', { reportId });
        return res.data;
    }
};
