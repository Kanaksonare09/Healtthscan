# HealthScan — Intelligent Medical Insights Platform

A privacy-first, AI-powered platform designed for seamless patient-doctor collaboration. HealthScan transforms complex medical reports into clear, actionable health insights.

---

## ✨ Features

- **Universal AI Analysis**: Instant clinical insights from uploaded blood tests, radiology reports, and more.
- **Multilingual Voice Summaries**: Audio summaries of lab results available in English, Hindi, Punjabi, Tamil, and Marathi.
- **Patient Dashboard**: Track health trends, view visual analytics, and interact with your medical data via AI chat.
- **Doctor Dashboard**: Securely access patient reports, manage consultations, and monitor clinical abnormalities.
- **Advanced OCR Engine**: High-accuracy local extraction of data from PDFs and medical report images.
- **Simplified Registration**: Instant access for both Patients and Doctors with no administrative delay.

---

## 🚀 How to Run the Project

Follow these steps to launch the HealthScan ecosystem locally.

### 1. Start the Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```
*Running on: http://localhost:5010*

### 2. Start the OCR Service (Python/Flask)
```bash
cd ocr_service
# Ensure you have your virtual environment set up
source venv/bin/activate
python app.py
```
*Running on: http://localhost:5001*

### 3. Start the Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Running on: http://localhost:3000*

---

### Prerequisites
- **Node.js**: v18 or higher
- **Python**: 3.9 or higher
- **MongoDB**: Running locally or via Atlas
- **Ollama (Optional)**: For local AI inference
