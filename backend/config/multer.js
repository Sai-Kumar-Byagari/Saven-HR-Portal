const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user ? req.user.id : 'temp';
    const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', 'documents', String(userId));
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const docType = req.body.doc_type || 'document';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const labelMap = {
      ssc: 'SSC_Memo', '12th': '12th_Memo', degree: 'Degree_Certificate',
      aadhar: 'Aadhaar_Card', pan: 'PAN_Card', resume: 'Resume',
      offer_letter: 'Offer_Letter', other: 'Document',
    };
    const label = labelMap[docType] || docType;
    cb(null, `${label}_${timestamp}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, PNG, DOCX are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// Profile photo storage
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user ? req.user.id : 'temp';
    const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', 'profiles', String(userId));
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `profile_${timestamp}${ext}`);
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for profiles
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed for profile photos.'), false);
    }
  },
});

// Policy / resume upload storage
const policyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', 'policies');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `policy_${timestamp}${ext}`);
  },
});

const uploadPolicy = multer({
  storage: policyStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', 'resumes');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `resume_${timestamp}${ext}`);
  },
});

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const recordingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', 'recordings');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `recording_${timestamp}${ext}`);
  },
});

const uploadRecording = multer({
  storage: recordingStorage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB for recordings
  fileFilter: (req, file, cb) => {
    const allowed = [
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-wav',
      'audio/webm', 'audio/ogg', 'audio/flac', 'audio/m4a', 'audio/x-m4a',
      // Video
      'video/mp4', 'video/webm', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
      // Documents (for notes/transcripts uploaded instead of recording)
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Allow by extension as fallback (some browsers send wrong mimetype)
      const ext = file.originalname.toLowerCase().split('.').pop();
      const allowedExts = ['mp3','mp4','wav','webm','ogg','flac','m4a','mpeg','mov','avi','mkv','pdf','docx','txt'];
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only audio, video, PDF, DOCX, or TXT files are allowed for recordings.'), false);
      }
    }
  },
});

module.exports = { upload, uploadProfile, uploadPolicy, uploadResume, uploadRecording };

// ── Payslip upload storage ────────────────────────────────────────────────────
const payslipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', 'payslips');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `payslip_${timestamp}${ext}`);
  },
});

const uploadPayslip = multer({
  storage: payslipStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf','image/jpeg','image/png','image/jpg'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF or image files allowed.'), false);
  },
});

module.exports = { upload, uploadProfile, uploadPolicy, uploadResume, uploadRecording, uploadPayslip };

// ── Punch photo storage (attendance selfie) ────────────────────────────────
const punchPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads', 'punch-photos');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const userId = req.user ? req.user.id : 'unknown';
    const timestamp = Date.now();
    cb(null, `punch_${userId}_${timestamp}.jpg`);
  },
});

const uploadPunchPhoto = multer({
  storage: punchPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/jpg','image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only image files allowed.'), false);
  },
});

module.exports = { upload, uploadProfile, uploadPolicy, uploadResume, uploadRecording, uploadPayslip, uploadPunchPhoto };
