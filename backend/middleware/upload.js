const { upload, uploadProfile, uploadPolicy, uploadResume, uploadRecording, uploadPayslip, uploadPunchPhoto } = require('../config/multer');

// Single document upload
const uploadDocument = upload.single('file');

// Multiple resume upload (max 10)
const uploadResumes = uploadResume.array('resumes', 10);

// Profile photo
const uploadProfilePhoto = uploadProfile.single('photo');

// Policy document
const uploadPolicyDoc = uploadPolicy.single('file');

// Interview recording
const uploadInterviewRecording = uploadRecording.single('recording');

// Payslip file
const uploadPayslipFile = uploadPayslip.single('payslip');

// Punch photo (attendance selfie)
const uploadPunchPhotoFile = uploadPunchPhoto.single('photo');

function handleMulterError(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error.',
          errors: [],
        });
      }
      next();
    });
  };
}

module.exports = {
  uploadDocument: handleMulterError(uploadDocument),
  uploadResumes: handleMulterError(uploadResumes),
  uploadProfilePhoto: handleMulterError(uploadProfilePhoto),
  uploadPolicyDoc: handleMulterError(uploadPolicyDoc),
  uploadInterviewRecording: handleMulterError(uploadInterviewRecording),
  uploadPayslipFile: handleMulterError(uploadPayslipFile),
  uploadPunchPhotoFile: handleMulterError(uploadPunchPhotoFile),
};
