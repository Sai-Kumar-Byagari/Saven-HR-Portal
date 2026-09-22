import type { DocumentType } from '@/types/document.types';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ssc: 'SSC Memo',
  '12th': '12th Memo',
  degree: 'Degree Certificate',
  aadhar: 'Aadhaar Card',
  pan: 'PAN Card',
  resume: 'Resume',
  offer_letter: 'Offer Letter',
  other: 'Other Document',
};

export const DOCUMENT_TYPES: DocumentType[] = [
  'ssc',
  '12th',
  'degree',
  'aadhar',
  'pan',
  'resume',
  'offer_letter',
  'other',
];
