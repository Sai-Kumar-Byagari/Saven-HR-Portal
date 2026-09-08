/**
 * Interview content extractor.
 * - Audio/Video: Transcribed via Groq Whisper API (whisper-large-v3) — FREE tier
 * - PDF / DOCX: Text extracted via textExtractor
 * - Plain text: Read directly
 *
 * Groq Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm (max 25MB per request)
 * For larger files the audio is chunked or we fall back to notes.
 */
const fs   = require('fs');
const path = require('path');

const GROQ_WHISPER_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Transcribe an audio/video file using Groq's Whisper API.
 * Returns the transcript string, or null on failure.
 */
async function transcribeWithGroq(absolutePath) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_key_here') {
    throw new Error('GROQ_API_KEY not set.');
  }

  const Groq = require('groq-sdk');
  const { toFile } = require('groq-sdk');
  const client = new Groq({ apiKey });

  const fileStream = fs.createReadStream(absolutePath);
  const fileName   = path.basename(absolutePath);

  // Wrap with toFile so Groq knows the filename + infers audio format
  const audioFile = await toFile(fileStream, fileName);

  // Groq transcription — uses whisper-large-v3
  const transcription = await client.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-large-v3',
    response_format: 'text',
    language: 'en',       // handles English & mixed content well
    temperature: 0,
  });

  // Groq returns a plain string when response_format is 'text'
  const text = typeof transcription === 'string'
    ? transcription
    : transcription?.text || null;

  return text && text.trim().length > 5 ? text.trim() : null;
}

/**
 * Main extractor — returns { type, content, source, transcribed? }
 */
async function extractInterviewContent(filePath, mimetype, interviewerNotes) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath.replace(/^\//, ''));

  const fileExists = fs.existsSync(absolutePath);
  const fileName   = path.basename(filePath || '');

  // ── Plain text ─────────────────────────────────────────────────────────
  if (mimetype === 'text/plain') {
    if (fileExists) {
      try {
        const text = fs.readFileSync(absolutePath, 'utf8').trim();
        if (text.length > 10) {
          return { type: 'text', content: text, source: 'text_file', transcribed: false };
        }
      } catch { /* fall through */ }
    }
    return { type: 'notes', content: interviewerNotes || '', source: 'interviewer_notes', transcribed: false };
  }

  // ── PDF ────────────────────────────────────────────────────────────────
  if (mimetype === 'application/pdf') {
    if (fileExists) {
      try {
        const { extractTextFromFile } = require('./textExtractor');
        const text = await extractTextFromFile(filePath, mimetype);
        if (text && text.length > 50) {
          return { type: 'document', content: text, source: 'pdf_document', transcribed: false };
        }
      } catch { /* fall through */ }
    }
  }

  // ── DOCX ───────────────────────────────────────────────────────────────
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    if (fileExists) {
      try {
        const { extractTextFromFile } = require('./textExtractor');
        const text = await extractTextFromFile(filePath, mimetype);
        if (text && text.length > 50) {
          return { type: 'document', content: text, source: 'docx_document', transcribed: false };
        }
      } catch { /* fall through */ }
    }
  }

  // ── Audio / Video — Groq Whisper transcription ─────────────────────────
  const isAudio = mimetype && mimetype.startsWith('audio/');
  const isVideo = mimetype && mimetype.startsWith('video/');

  // Also detect by extension if mimetype is wrong/generic
  const ext = fileName.toLowerCase().split('.').pop();
  const audioExts = ['mp3', 'mp4', 'wav', 'webm', 'ogg', 'flac', 'm4a', 'mpeg', 'mpga'];
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'mpeg'];
  const isAudioOrVideo = isAudio || isVideo || audioExts.includes(ext) || videoExts.includes(ext);

  if (isAudioOrVideo) {
    if (!fileExists) {
      return {
        type: 'recording',
        content: interviewerNotes || '',
        source: 'notes_only',
        transcribed: false,
        error: 'Recording file not found on server.',
      };
    }

    const fileSize = fs.statSync(absolutePath).size;

    if (fileSize > GROQ_WHISPER_MAX_BYTES) {
      // File too large for Groq — fall back to interviewer notes
      console.warn(`[InterviewExtractor] File too large for Groq Whisper (${(fileSize/1024/1024).toFixed(1)}MB > 25MB). Using interviewer notes.`);
      return {
        type: 'recording',
        content: interviewerNotes || '',
        source: 'recording_too_large',
        transcribed: false,
        fileName,
        note: `Recording file (${fileName}, ${(fileSize/1024/1024).toFixed(1)}MB) is too large for automatic transcription (limit: 25MB). Evaluated from interviewer notes.`,
      };
    }

    try {
      console.log(`[InterviewExtractor] Transcribing ${fileName} via Groq Whisper...`);
      const transcript = await transcribeWithGroq(absolutePath);

      if (transcript && transcript.length > 20) {
        console.log(`[InterviewExtractor] Transcription success — ${transcript.length} chars`);
        return {
          type: 'transcript',
          content: transcript,
          source: 'groq_whisper_transcript',
          transcribed: true,
          fileName,
        };
      } else {
        // Empty or very short transcript — use notes
        return {
          type: 'recording',
          content: interviewerNotes || '',
          source: 'empty_transcript',
          transcribed: false,
          fileName,
          note: 'Recording was uploaded but transcription returned no content. Evaluated from interviewer notes.',
        };
      }
    } catch (err) {
      console.error('[InterviewExtractor] Groq Whisper error:', err.message);
      return {
        type: 'recording',
        content: interviewerNotes || '',
        source: 'transcription_failed',
        transcribed: false,
        fileName,
        note: `Recording transcription failed: ${err.message}. Evaluated from interviewer notes.`,
      };
    }
  }

  // ── Fallback — use interviewer notes ──────────────────────────────────
  return { type: 'notes', content: interviewerNotes || '', source: 'interviewer_notes', transcribed: false };
}

module.exports = { extractInterviewContent };
