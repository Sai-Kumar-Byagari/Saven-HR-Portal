/**
 * AI Service — Groq (free tier) with llama-3.3-70b-versatile
 * Temperature guide:
 *   0   → evaluations, extractions (zero creativity, max accuracy)
 *   0.4 → JD generation (needs some creativity for writing)
 */
const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are Saven Technologies HR AI Assistant. You are professional, precise, and India-market aware. All evaluations consider Indian IT industry standards. Saven Technologies is a technology company based in Hyderabad, India. You MUST respond ONLY with a valid JSON object — no markdown, no code blocks, no explanation outside JSON. Just raw JSON.`;

function getGroqClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'your_groq_key_here') {
    throw new Error('GROQ_API_KEY not set. Get a free key from https://console.groq.com');
  }
  return new Groq({ apiKey: key });
}

async function callAI(userPrompt, retries = 2, temperature = 0) {
  const client = getGroqClient();
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: 4096,
      });
      return completion.choices[0].message.content;
    } catch (err) {
      if (err.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt + 1) * 1000));
        continue;
      }
      throw err;
    }
  }
}

function parseJSON(text) {
  try {
    const clean = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(clean);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response as JSON');
  }
}

/* ── JD Generation (temperature 0.4 — needs writing creativity) ─────────────── */
async function generateJobDescription({ title, department, keyResponsibilities, requiredSkills, experienceYears, salaryLpa }) {
  const prompt = `Generate a complete professional Job Description for Saven Technologies, Hyderabad, India.

Position Details:
- Title: ${title}
- Department: ${department}
- Key Responsibilities: ${keyResponsibilities}
- Required Skills: ${requiredSkills}
- Experience Required: ${experienceYears} years
- Salary Offered: ${salaryLpa ? salaryLpa + ' LPA' : 'Competitive, based on experience'}

Return ONLY a JSON object with these exact keys:
{
  "role_overview": "2-3 sentence overview of the role",
  "key_responsibilities": ["responsibility 1", "responsibility 2", "...8-10 items total"],
  "required_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1", "skill2"],
  "qualifications": ["qualification1", "qualification2"],
  "compensation_range": "${salaryLpa ? salaryLpa + ' LPA' : 'Competitive based on experience'}",
  "why_join_saven": "2-3 sentences about this opportunity",
  "full_jd_text": "Complete formatted JD as a single string with all sections"
}`;

  try {
    const text = await callAI(prompt, 2, 0.4);
    const data = parseJSON(text);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ── Candidate Info Extraction (temperature 0 — pure extraction) ─────────────── */
async function extractCandidateInfo(resumeText) {
  const prompt = `Extract candidate contact information from this resume text.

Resume (first 3000 chars):
${resumeText.substring(0, 3000)}

STRICT RULES:
- Only return email if it is a 100% valid email address (has @ and domain like .com/.in). Else null.
- Only return phone if it is a real phone number with digits. Else null.
- Return the candidate's full name. If unclear, return null.
- NEVER return "not found", "N/A", "none", "unknown", or any placeholder text.

Return ONLY this JSON:
{
  "name": "Full Name or null",
  "email": "valid@email.com or null",
  "phone": "+91XXXXXXXXXX or null"
}`;
  try {
    const text = await callAI(prompt, 2, 0);
    const parsed = parseJSON(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      name:  parsed.name && parsed.name !== 'null' && parsed.name.length < 150 ? String(parsed.name).trim() : null,
      email: parsed.email && emailRegex.test(String(parsed.email).trim()) ? String(parsed.email).trim() : null,
      phone: parsed.phone && parsed.phone !== 'null' ? String(parsed.phone).trim().substring(0, 20) : null,
    };
  } catch {
    return { name: null, email: null, phone: null };
  }
}

/* ── Resume Shortlisting (temperature 0 — strict evaluation) ────────────────── */
async function shortlistCandidate({ candidateName, resumeText, jdContent, minScore }) {
  // Cap resume text to avoid token overflow — 6000 chars is plenty for evaluation
  const cappedResume = resumeText.substring(0, 6000);

  const prompt = `You are a strict HR evaluator. Evaluate ONLY based on what is EXPLICITLY written in the resume text. Do NOT assume or infer anything.

CRITICAL RULES:
1. Only list a skill as "matched" if it appears word-for-word or as a direct equivalent in the resume
2. Score based ONLY on actual matches found
3. Be honest — a weak match must get a low score
4. Do not pad scores to seem generous

SCORING GUIDE (apply strictly):
- 85-100: Most required skills present, experience matches, relevant domain
- 65-84: Several required skills present, minor gaps
- 40-64: Some skills missing, partial match
- 20-39: Most required skills absent
- 0-19:  Almost no match

JOB DESCRIPTION (what we need):
${jdContent.substring(0, 3000)}

RESUME TEXT (evaluate ONLY this — do not invent anything):
${cappedResume}

Return ONLY this JSON:
{
  "score": <integer 0-100>,
  "skills_found_in_resume": ["exact skills from resume matching JD"],
  "skills_missing_from_resume": ["required JD skills NOT in resume"],
  "experience_analysis": "exact years/roles from resume vs JD requirement",
  "education_analysis": "exact education from resume vs JD requirement",
  "strengths": "only resume facts that are strengths for this role",
  "gaps": "only JD requirements missing from resume",
  "recommendation": "shortlist or reject",
  "justification": "one factual sentence citing specific resume content"
}`;

  try {
    const text = await callAI(prompt, 2, 0);
    const data = parseJSON(text);
    data.score = Math.min(100, Math.max(0, parseInt(data.score) || 0));
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ── Telephonic Interview — Round 1 (temperature 0) ─────────────────────────── */
async function evaluateTelephoneInterview({ jdContent, notes, candidateName }) {
  if (!notes || notes.trim().length < 10) {
    return { success: false, error: 'Insufficient notes. Please provide interview observations before evaluating.' };
  }

  const isTranscript = notes.includes('[INTERVIEW RECORDING TRANSCRIPT');
  const contentLabel = isTranscript ? 'INTERVIEW TRANSCRIPT' : 'INTERVIEW NOTES';
  const sourceInstruction = isTranscript
    ? 'This is an AUTO-TRANSCRIBED recording of the actual interview. Evaluate based on what was literally said.'
    : 'These are the interviewer\'s written notes. Evaluate ONLY what is written here.';

  const prompt = `You are an HR interview evaluator at Saven Technologies, India. Evaluate the telephonic interview STRICTLY from the content below. Zero hallucination.

MANDATORY RULES:
1. Score ONLY based on what is present in the content. Never add missing information.
2. If communication quality is unclear → communication_score = 50 (neutral).
3. Negative signals must lower the score — do not soften.
4. ${sourceInstruction}

Candidate: ${candidateName}

Job Description:
${jdContent.substring(0, 2000)}

${contentLabel}:
${notes.substring(0, 4000)}

Return ONLY this JSON:
{
  "overall_score": <0-100>,
  "communication_score": <0-100>,
  "relevance_score": <0-100>,
  "enthusiasm_score": <0-100>,
  "strengths": "strengths evident only from the content",
  "concerns": "concerns evident only from the content",
  "recommendation": "proceed or hold or reject",
  "detailed_feedback": "2-3 paragraph honest evaluation with specific citations",
  "next_steps": "suggested next steps",
  "evaluation_source": "${isTranscript ? 'auto_transcript' : 'interviewer_notes'}"
}`;

  try {
    const text = await callAI(prompt, 2, 0);
    const data = parseJSON(text);
    data.overall_score = Math.min(100, Math.max(0, parseInt(data.overall_score) || 0));
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ── Technical Interview — Round 2 (temperature 0) ──────────────────────────── */
async function evaluateTechnicalInterview({ jdContent, notes, candidateName }) {
  if (!notes || notes.trim().length < 10) {
    return { success: false, error: 'Insufficient notes. Please provide technical assessment before evaluating.' };
  }

  const isTranscript = notes.includes('[INTERVIEW RECORDING TRANSCRIPT');
  const contentLabel = isTranscript ? 'INTERVIEW TRANSCRIPT' : 'TECHNICAL INTERVIEW NOTES';
  const sourceInstruction = isTranscript
    ? 'This is an AUTO-TRANSCRIBED recording. Evaluate what was actually discussed and demonstrated.'
    : 'These are the interviewer\'s written notes. Evaluate ONLY what is written.';

  const prompt = `You are a technical interview evaluator at Saven Technologies, India. Evaluate STRICTLY from the content. Zero hallucination.

MANDATORY RULES:
1. Only mark a technology as "known" if it explicitly appears in the content.
2. Struggles/failures in the content must lower the score significantly.
3. code_quality_score = 0 if no coding was performed in the interview.
4. Be brutally honest — this directly affects hiring decisions.
5. ${sourceInstruction}

Candidate: ${candidateName}

Job Description (required skills):
${jdContent.substring(0, 2000)}

${contentLabel}:
${notes.substring(0, 4000)}

Return ONLY this JSON:
{
  "overall_score": <0-100>,
  "technical_depth_score": <0-100>,
  "problem_solving_score": <0-100>,
  "code_quality_score": <0-100, 0 if not assessed>,
  "domain_knowledge_score": <0-100>,
  "strengths": "technical strengths explicitly shown in content",
  "gaps": "technical gaps explicitly shown — JD skills not demonstrated",
  "recommendation": "proceed or hold or reject",
  "detailed_feedback": "honest technical assessment with specific citations",
  "topics_covered": ["topics explicitly covered"],
  "topics_weak": ["topics explicitly weak or failed"],
  "evaluation_source": "${isTranscript ? 'auto_transcript' : 'interviewer_notes'}"
}`;

  try {
    const text = await callAI(prompt, 2, 0);
    const data = parseJSON(text);
    data.overall_score = Math.min(100, Math.max(0, parseInt(data.overall_score) || 0));
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ── Final HR Interview — Round 3 (temperature 0) ────────────────────────────── */
async function evaluateFinalHRInterview({ jdContent, notes, candidateName }) {
  if (!notes || notes.trim().length < 10) {
    return { success: false, error: 'Insufficient notes. Please provide HR interview observations before evaluating.' };
  }

  const isTranscript = notes.includes('[INTERVIEW RECORDING TRANSCRIPT');
  const contentLabel = isTranscript ? 'INTERVIEW TRANSCRIPT' : 'HR INTERVIEW NOTES';
  const sourceInstruction = isTranscript
    ? 'This is an AUTO-TRANSCRIBED recording of the final HR interview. Evaluate the actual conversation.'
    : 'These are the interviewer\'s written notes. Evaluate ONLY what is written.';

  const prompt = `You are a senior HR evaluator at Saven Technologies, India. Final round evaluation. Strictly from content only. Zero hallucination.

MANDATORY RULES:
1. salary_alignment_score = 0 if salary was not discussed.
2. culture_fit_score = based ONLY on signals in the content.
3. long_term_intent_score = 50 if candidate's future plans were not mentioned.
4. final_recommendation must be logically consistent with all scores.
5. Never invent positives to soften a rejection.
6. ${sourceInstruction}

Candidate: ${candidateName}

Job Description:
${jdContent.substring(0, 2000)}

${contentLabel}:
${notes.substring(0, 4000)}

Return ONLY this JSON:
{
  "overall_score": <0-100>,
  "culture_fit_score": <0-100>,
  "communication_polish_score": <0-100>,
  "long_term_intent_score": <0-100, 50 if not discussed>,
  "salary_alignment_score": <0-100, 0 if not discussed>,
  "final_recommendation": "Hire or Hold or Reject",
  "justification": "factual justification citing specific content",
  "key_positives": ["only positives explicitly in content"],
  "concerns": ["only concerns explicitly in content"],
  "onboarding_notes": "notes if hired, else N/A",
  "evaluation_source": "${isTranscript ? 'auto_transcript' : 'interviewer_notes'}"
}`;

  try {
    const text = await callAI(prompt, 2, 0);
    const data = parseJSON(text);
    data.overall_score = Math.min(100, Math.max(0, parseInt(data.overall_score) || 0));
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  extractCandidateInfo,
  generateJobDescription,
  shortlistCandidate,
  evaluateTelephoneInterview,
  evaluateTechnicalInterview,
  evaluateFinalHRInterview,
};
