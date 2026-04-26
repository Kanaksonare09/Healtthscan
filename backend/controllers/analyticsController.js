const ReportBiomarker = require('../models/ReportBiomarker');
const Report = require('../models/Report');

exports.getAnalytics = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Security: patients can only see their own analytics
        if (req.user.role === 'patient' && req.user.id !== patientId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // 1. Fetch all reports for the patient
        const reports = await Report.find({ patientId })
            .sort({ createdAt: 1 })
            .select('_id reportName testType createdAt fileUrl');

        // 2. Fetch all biomarkers for the patient (all reports)
        const biomarkers = await ReportBiomarker.find({ patientId })
            .sort({ testDate: 1 })
            .lean();

        // 3. Build per-biomarker trend lines
        // { "hemoglobin": [ { date, value, unit, severity, reportId, reportName } ] }
        const trendMap = {};
        for (const bm of biomarkers) {
            const name = bm.biomarkerName;
            if (!trendMap[name]) trendMap[name] = [];
            const report = reports.find(r => r._id.toString() === bm.reportId?.toString());
            trendMap[name].push({
                date: bm.testDate || bm.createdAt,
                value: bm.value,
                unit: bm.unit,
                severity: bm.severity,
                interpretation: bm.interpretation,
                referenceMin: bm.referenceMin,
                referenceMax: bm.referenceMax,
                reportId: bm.reportId,
                reportName: report?.reportName || 'Unknown Report'
            });
        }

        // 4. Build latest snapshot (most recent value per biomarker)
        const latestSnapshot = Object.entries(trendMap).map(([name, entries]) => {
            const latest = entries[entries.length - 1];
            return {
                name,
                ...latest,
                trend: entries.length >= 2
                    ? entries[entries.length - 1].value > entries[entries.length - 2].value
                        ? 'Increasing'
                        : entries[entries.length - 1].value < entries[entries.length - 2].value
                            ? 'Decreasing' : 'Stable'
                    : 'Stable'
            };
        });

        // 5. Risk distribution
        const riskCounts = { Normal: 0, Mild: 0, Moderate: 0, Critical: 0 };
        biomarkers.forEach(b => {
            if (riskCounts[b.severity] !== undefined) riskCounts[b.severity]++;
        });

        // 6. Build report timeline (one entry per report with its biomarkers)
        const reportTimeline = reports.map(r => {
            const reportBiomarkers = biomarkers.filter(b => b.reportId?.toString() === r._id.toString());
            return {
                _id: r._id,
                reportName: r.reportName,
                testType: r.testType,
                createdAt: r.createdAt,
                biomarkerCount: reportBiomarkers.length,
                abnormalCount: reportBiomarkers.filter(b => b.isAbnormal).length,
            };
        });

        // 7. Grouped Category Trends (e.g., Kidney, Urine, Blood)
        const categoryTrends = {};
        reports.forEach(r => {
            const category = r.testType || 'General';
            const reportBiomarkers = biomarkers.filter(b => b.reportId?.toString() === r._id.toString());
            if (reportBiomarkers.length === 0) return;

            const scoreWeights = { Normal: 100, Mild: 60, Moderate: 30, Critical: 0 };
            
            // Calculate a raw average but also check for the worst-case biomarker
            const biomarkerScores = reportBiomarkers.map(b => scoreWeights[b.severity] || 100);
            const rawAverage = biomarkerScores.reduce((a, b) => a + b, 0) / biomarkerScores.length;
            const minScore = Math.min(...biomarkerScores);
            
            // Final score is a mix: heavily weighted towards the worst finding
            const finalScore = Math.round((rawAverage * 0.4) + (minScore * 0.6));

            if (!categoryTrends[category]) categoryTrends[category] = [];
            categoryTrends[category].push({
                date: r.createdAt,
                score: finalScore,
                reportName: r.reportName
            });
        });

        // 8. Generate Truly Dynamic Personalized Health Tips
        const healthTips = [];
        const abnormalMarkers = latestSnapshot.filter(bm => bm.severity !== 'Normal');
        
        if (abnormalMarkers.length === 0) {
            healthTips.push("Daily Diet: Maintain your excellent markers with a high-fiber Mediterranean diet (nuts, seeds, olive oil, and leafy greens).");
            healthTips.push("Routine: Your biomarkers are stable. Keep up with 150 minutes of weekly moderate activity to maintain this baseline.");
            healthTips.push("Hydration: Aim for 2.5L of water daily to support metabolic efficiency and cellular health.");
        } else {
            // Categorize abnormalities for specific advice
            const issues = {
                sugar: abnormalMarkers.some(m => /glucose|hba1c|sugar|glycaemic/i.test(m.name)),
                lipid: abnormalMarkers.some(m => /cholesterol|ldl|hdl|triglyceride/i.test(m.name)),
                kidney: abnormalMarkers.some(m => /creatinine|urea|bun|egfr/i.test(m.name)),
                liver: abnormalMarkers.some(m => /sgot|sgpt|alt|ast|bilirubin|ggt/i.test(m.name)),
                anemia: abnormalMarkers.some(m => /hemoglobin|rbc|iron|ferritin/i.test(m.name)),
            };

            if (issues.sugar) {
                healthTips.push("Blood Sugar Management: Avoid refined sugars and white flour. Opt for complex carbs like oats, quinoa, or brown rice. Pair carbs with protein to prevent spikes.");
            }
            if (issues.lipid) {
                healthTips.push("Heart Health: Your lipid profile suggests a need for Omega-3. Increase intake of walnuts, flaxseeds, or fatty fish. Limit saturated fats from red meat and dairy.");
            }
            if (issues.kidney) {
                healthTips.push("Kidney Support: Maintain a strict sodium limit (under 2000mg/day). Avoid excessive protein supplements and stay consistently hydrated with plain water.");
            }
            if (issues.liver) {
                healthTips.push("Liver Care: Eliminate alcohol and highly processed 'junk' foods. Increase bitter greens (arugula, kale) and cruciferous vegetables like broccoli to support detoxification.");
            }
            if (issues.anemia) {
                healthTips.push("Iron Optimization: Pair iron-rich foods (spinach, beans, lean meat) with Vitamin C (lemon, orange) to maximize absorption. Avoid tea or coffee immediately after meals.");
            }

            // Routine advice based on severity
            const hasCritical = abnormalMarkers.some(m => m.severity === 'Critical');
            if (hasCritical) {
                healthTips.push("Important: One or more biomarkers are in the critical zone. Transition to light walking only and consult your primary physician before starting any intense exercise.");
            } else {
                healthTips.push("Lifestyle Routine: Incorporate 20-30 minutes of brisk walking or yoga daily to help normalize your metabolic markers over the next 3 months.");
            }
        }

        res.status(200).json({
            totalReports: reports.length,
            totalBiomarkers: biomarkers.length,
            riskCounts,
            trendMap,
            categoryTrends,
            latestSnapshot,
            reportTimeline,
            healthTips
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
