// ============================================================
//  HealthScan — Refined Patient-Doctor MongoDB Schema
//  MongoDB 6.0+
//  Copy-paste into MongoDB Shell or Compass
//  Run each block in order
// ============================================================


// ============================================================
//  1. USERS
//  Single collection for core roles (patient, doctor)
// ============================================================

db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "role", "name", "lvId"],
      properties: {
        _id:           { bsonType: "objectId" },
        lvId:          { bsonType: "string" },      // Core system ID (e.g., LV-1234)
        email:         { bsonType: "string" },
        phone:         { bsonType: "string" },
        password:      { bsonType: "string" },
        role:          { enum: ["patient", "doctor"] },
        name:          { bsonType: "string" },
        avatarUrl:     { bsonType: "string" },
        status:        { enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] },
        isActive:      { bsonType: "bool" },
        isVerified:    { bsonType: "bool" },
        lastLoginAt:   { bsonType: "date" },
        createdAt:     { bsonType: "date" },
        updatedAt:     { bsonType: "date" }
      }
    }
  }
});

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ lvId: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ phone: 1 }, { sparse: true });


// ============================================================
//  2. PATIENT PROFILES
//  1:1 with users where role = "patient"
// ============================================================

db.createCollection("patientProfiles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId"],
      properties: {
        _id:                   { bsonType: "objectId" },
        userId:                { bsonType: "objectId" },   // ref: users._id (UNIQUE)
        dateOfBirth:           { bsonType: "date" },
        gender:                { enum: ["Male", "Female", "Other"] },
        bloodGroup:            { bsonType: "string" },     // "A+", "O-" etc.
        emergencyContactName:  { bsonType: "string" },
        emergencyContactPhone: { bsonType: "string" },
        preferredLanguage:     { bsonType: "string" },     // "en", "hi", "mr", "ta"
        createdAt:             { bsonType: "date" },
        updatedAt:             { bsonType: "date" }
      }
    }
  }
});

db.patientProfiles.createIndex({ userId: 1 }, { unique: true });


// ============================================================
//  3. DOCTOR PROFILES
//  1:1 with users where role = "doctor"
// ============================================================

db.createCollection("doctorProfiles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "registrationNumber"],
      properties: {
        _id:                { bsonType: "objectId" },
        userId:             { bsonType: "objectId" },   // ref: users._id (UNIQUE)
        specialty:          { bsonType: "string" },     // "Cardiology", "General" etc.
        registrationNumber: { bsonType: "string" },     // MCI / state council (UNIQUE)
        hospitalName:       { bsonType: "string" },
        licenseCertificateUrl: { bsonType: "string" },
        isVerified:         { bsonType: "bool" },       
        createdAt:          { bsonType: "date" },
        updatedAt:          { bsonType: "date" }
      }
    }
  }
});

db.doctorProfiles.createIndex({ userId: 1 }, { unique: true });
db.doctorProfiles.createIndex({ registrationNumber: 1 }, { unique: true });


// ============================================================
//  4. REPORTS
//  Core report document — one per test/upload
// ============================================================

db.createCollection("reports", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["patientId", "uploadedBy", "uploadedByRole", "reportName", "testType", "fileUrl", "reportDate"],
      properties: {
        _id:            { bsonType: "objectId" },
        patientId:      { bsonType: "objectId" },  // ref: users._id
        lvId:           { bsonType: "string" },    // Denormalized LabVault ID for quick search
        uploadedBy:     { bsonType: "objectId" },  // ref: users._id (patient or doctor)
        uploadedByRole: { enum: ["patient", "doctor"] },
        reportName:     { bsonType: "string" },    // "Complete Blood Count"
        testType:       { bsonType: "string" },    
        category:       { enum: ["blood", "urine", "imaging", "biopsy", "other"] },
        fileUrl:        { bsonType: "string" },    
        thumbnailUrl:   { bsonType: "string" },
        reportDate:     { bsonType: "date" },      
        status:         { enum: ["processing", "ready", "failed"] },
        isDeleted:      { bsonType: "bool" },      
        createdAt:      { bsonType: "date" },
        updatedAt:      { bsonType: "date" }
      }
    }
  }
});

db.reports.createIndex({ patientId: 1, reportDate: -1 });
db.reports.createIndex({ lvId: 1 });
db.reports.createIndex({ status: 1 });


// ============================================================
//  5. REPORT BIOMARKERS
//  Structured extracted values — powers trend charts
// ============================================================

db.createCollection("reportBiomarkers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reportId", "patientId", "biomarkerName", "value", "unit", "testDate"],
      properties: {
        _id:           { bsonType: "objectId" },
        reportId:      { bsonType: "objectId" },  // ref: reports._id
        patientId:     { bsonType: "objectId" },  // ref: users._id
        biomarkerName: { bsonType: "string" },    
        value:         { bsonType: "double" },
        unit:          { bsonType: "string" },    
        referenceMin:  { bsonType: "double" },
        referenceMax:  { bsonType: "double" },
        isAbnormal:    { bsonType: "bool" },
        testDate:      { bsonType: "date" },      
        createdAt:     { bsonType: "date" }
      }
    }
  }
});

db.reportBiomarkers.createIndex({ reportId: 1, biomarkerName: 1 }, { unique: true });
db.reportBiomarkers.createIndex({ patientId: 1, biomarkerName: 1, testDate: 1 });


// ============================================================
//  6. REPORT AI ANALYSIS
//  AI summaries, insights, OCR, and multilingual audio
// ============================================================

db.createCollection("reportAiAnalysis", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reportId"],
      properties: {
        _id:           { bsonType: "objectId" },
        reportId:      { bsonType: "objectId" },  // ref: reports._id (UNIQUE)
        ocrText:       { bsonType: "string" },    
        summaryEn:     { bsonType: "string" },    
        insightsEn:    { bsonType: "string" },    
        doctorBriefEn: { bsonType: "string" },    
        translations:  { bsonType: "object" },
        audioUrls:     { bsonType: "object" },
        generatedAt:   { bsonType: "date" }
      }
    }
  }
});

db.reportAiAnalysis.createIndex({ reportId: 1 }, { unique: true });


// ============================================================
//  7. REPORT ACCESS
//  Patient grants doctor access to a specific report
// ============================================================

db.createCollection("reportAccess", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reportId", "patientId", "doctorId", "status"],
      properties: {
        _id:          { bsonType: "objectId" },
        reportId:     { bsonType: "objectId" },  
        patientId:    { bsonType: "objectId" },  
        doctorId:     { bsonType: "objectId" },  
        status:       { enum: ["pending", "approved", "revoked", "expired"] },
        accessLevel:  { enum: ["summary_only", "full_report"] },
        grantedAt:    { bsonType: "date" },
        expiresAt:    { bsonType: "date" },      
        revokedAt:    { bsonType: "date" },
        createdAt:    { bsonType: "date" }
      }
    }
  }
});

db.reportAccess.createIndex({ reportId: 1, doctorId: 1 }, { unique: true });


// ============================================================
//  8. NOTIFICATIONS
// ============================================================

db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "type", "title", "body"],
      properties: {
        _id:           { bsonType: "objectId" },
        userId:        { bsonType: "objectId" },  
        type:          {
          enum: [
            "report_ready",
            "access_requested",
            "access_granted",
            "access_revoked"
          ]
        },
        title:         { bsonType: "string" },
        body:          { bsonType: "string" },
        isRead:        { bsonType: "bool" },
        createdAt:     { bsonType: "date" }
      }
    }
  }
});

db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
