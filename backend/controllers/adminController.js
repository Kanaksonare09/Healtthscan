const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createNotification } = require('./notificationController');

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, role: 'SuperAdmin' });
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed: Invalid credentials or insufficient permissions.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Authentication failed: Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, lvId: user.lvId },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await User.find({ 
            status: 'PENDING', 
            role: { $in: ['doctor', 'pathology'] } 
        }).select('-password').sort({ createdAt: -1 }).lean();

        // Populate profile details for each user
        const DoctorProfile = require('../models/DoctorProfile');
        const PathologyProfile = require('../models/PathologyProfile');

        const usersWithProfiles = await Promise.all(pendingUsers.map(async (user) => {
            if (user.role === 'doctor') {
                const profile = await DoctorProfile.findOne({ userId: user._id }).lean();
                return {
                    ...user,
                    registrationNumber: profile?.registrationNumber,
                    specialty: profile?.specialty,
                    hospitalName: profile?.hospitalName,
                    licenseCertificateUrl: profile?.licenseCertificateUrl
                };
            } else if (user.role === 'pathology') {
                const profile = await PathologyProfile.findOne({ userId: user._id }).lean();
                return {
                    ...user,
                    registrationNumber: profile?.licenseNumber,
                    labName: profile?.labName,
                    address: profile?.address
                };
            }
            return user;
        }));

        res.status(200).json({
            success: true,
            count: usersWithProfiles.length,
            users: usersWithProfiles
        });
    } catch (error) {
        console.error('Get Pending Users Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.approveUser = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.status !== 'PENDING') {
            return res.status(400).json({ message: `User is already ${user.status}` });
        }

        if (!['doctor', 'pathology'].includes(user.role)) {
            return res.status(400).json({ message: 'This user role does not require approval or is invalid for this action.' });
        }

        user.status = 'APPROVED';
        user.isVerified = true; // Auto-verify on approval
        await user.save();

        // TRIGGER NOTIFICATION: Doctor notified of approval
        await createNotification({
            recipient: user._id,
            actor: req.user.id,
            type: 'account_approved',
            message: 'Welcome! Your medical professional account has been approved and is now active.',
            link: '/dashboard/doctor'
        });

        // Optional: Log who performed the action (req.user.id)
        console.log(`[ADMIN ACTION] User ${userId} APPROVED by Admin ${req.user.id} at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'User approved successfully',
            user: { id: user._id, status: user.status }
        });
    } catch (error) {
        console.error('Approve User Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.rejectUser = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.status !== 'PENDING') {
            return res.status(400).json({ message: `User is already ${user.status}` });
        }

        user.status = 'REJECTED';
        await user.save();

        console.log(`[ADMIN ACTION] User ${userId} REJECTED by Admin ${req.user.id} at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'User rejected successfully',
            user: { id: user._id, status: user.status }
        });
    } catch (error) {
        console.error('Reject User Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'SuperAdmin') {
            return res.status(400).json({ message: 'Cannot delete a SuperAdmin' });
        }

        // Clean up associated data
        const DoctorProfile = require('../models/DoctorProfile');
        const PathologyProfile = require('../models/PathologyProfile');
        const Report = require('../models/Report');
        const ReportBiomarker = require('../models/ReportBiomarker');

        if (user.role === 'doctor') await DoctorProfile.deleteOne({ userId });
        if (user.role === 'pathology') await PathologyProfile.deleteOne({ userId });
        if (user.role === 'patient') {
            await Report.deleteMany({ patientId: userId });
            await ReportBiomarker.deleteMany({ patientId: userId });
        }

        await User.findByIdAndDelete(userId);

        console.log(`[ADMIN ACTION] User ${userId} DELETED by Admin ${req.user.id} at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'User and all associated data deleted successfully'
        });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const { reportId } = req.body;
        const Report = require('../models/Report');
        const ReportBiomarker = require('../models/ReportBiomarker');

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Delete biomarkers first
        await ReportBiomarker.deleteMany({ reportId });
        // Delete the report record
        await Report.findByIdAndDelete(reportId);

        console.log(`[ADMIN ACTION] Report ${reportId} DELETED by Admin ${req.user.id} at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'Report and associated biomarkers deleted successfully'
        });
    } catch (error) {
        console.error('Delete Report Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'SuperAdmin' } })
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllReports = async (req, res) => {
    try {
        const Report = require('../models/Report');
        // Populate patient name for better UI
        const reports = await Report.find()
            .populate('patientId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const formattedReports = reports.map(r => ({
            ...r,
            patientName: r.patientId?.name || 'Unknown Patient'
        }));

        res.status(200).json({
            success: true,
            reports: formattedReports
        });
    } catch (error) {
        console.error('Get All Reports Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.suspendUser = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'SuperAdmin') {
            return res.status(400).json({ message: 'Cannot suspend a SuperAdmin' });
        }

        user.status = 'SUSPENDED';
        await user.save();

        console.log(`[ADMIN ACTION] User ${userId} SUSPENDED by Admin ${req.user.id} at ${new Date().toISOString()}`);

        res.status(200).json({
            success: true,
            message: 'User suspended successfully',
            user: { id: user._id, status: user.status }
        });
    } catch (error) {
        console.error('Suspend User Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
