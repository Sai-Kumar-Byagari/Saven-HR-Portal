export type DocumentType =
  | 'ssc'
  | '12th'
  | 'degree'
  | 'aadhar'
  | 'pan'
  | 'resume'
  | 'offer_letter'
  | 'other';

export interface EmployeeDocument {
  id: number;
  user_id: number;
  doc_type: DocumentType;
  file_path: string;
  original_name: string;
  display_name: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentRequest {
  doc_type: DocumentType;
  file: File;
  display_name: string;
}
