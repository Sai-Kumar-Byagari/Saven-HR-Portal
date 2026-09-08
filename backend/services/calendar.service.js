/**
 * Calendar Service — generates ICS files and sends calendar invites via email.
 * ICS format is supported by Outlook, Teams, Google Calendar, Apple Calendar.
 * When sent as email attachment, Outlook shows Accept/Decline buttons.
 */
const { sendMail } = require('../config/mailer');
const { v4: uuidv4 } = require('uuid');

/**
 * Format a JS Date to ICS datetime string: 20240624T143000Z
 */
function toICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace('.000', '');
}

/**
 * Generate ICS file content for an interview.
 */
function generateICS({ uid, title, description, startDate, durationMins, location, organizerEmail, organizerName, attendees }) {
  const endDate = new Date(startDate.getTime() + durationMins * 60000);
  const now = toICSDate(new Date());
  const start = toICSDate(startDate);
  const end   = toICSDate(endDate);

  const attendeeLines = (attendees || []).map(a =>
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${a.name}:mailto:${a.email}`
  ).join('\r\n');

  // Escape special chars in description/summary
  const esc = (s) => (s || '').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Saven Technologies HR Portal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}@saven.in`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(location || 'Online')}`,
    `ORGANIZER;CN=${esc(organizerName)}:mailto:${organizerEmail}`,
    attendeeLines,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

/**
 * Send calendar invite email with .ics attachment.
 * Outlook will show Accept/Decline buttons automatically.
 */
async function sendInterviewCalendarInvite({
  round,
  candidate,
  position,
  hrUser,
  managerUser,
}) {
  try {
    const roundLabels = { phone: 'Telephonic', technical: 'Technical', hr: 'Final HR' };
    const roundLabel  = roundLabels[round.round_type] || round.round_type;
    const title       = `Interview: ${candidate.name} — ${roundLabel} Round (${position.title})`;
    const startDate   = new Date(round.scheduled_at);
    const durationMins = round.duration_mins || 60;

    const meetingLinkLine = round.meeting_link
      ? `\nMeeting Link: ${round.meeting_link}`
      : '';

    const description = [
      `Candidate: ${candidate.name}`,
      `Position: ${position.title} — ${position.department}`,
      `Round: ${roundLabel} (Round ${round.round_number})`,
      `Date & Time: ${startDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
      `Duration: ${durationMins} minutes`,
      meetingLinkLine,
      '',
      'This interview has been scheduled via Saven HR Portal.',
    ].filter(s => s !== undefined).join('\n');

    // Attendees: HR + Manager (if exists)
    const attendees = [
      { name: `${hrUser.first_name} ${hrUser.last_name}`, email: hrUser.work_email },
    ];
    if (managerUser) {
      attendees.push({ name: `${managerUser.first_name} ${managerUser.last_name}`, email: managerUser.work_email });
    }

    const uid = uuidv4();
    const icsContent = generateICS({
      uid,
      title,
      description,
      startDate,
      durationMins,
      location: round.meeting_link || 'Online',
      organizerEmail: hrUser.work_email,
      organizerName: `${hrUser.first_name} ${hrUser.last_name}`,
      attendees,
    });

    // HTML email body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563EB; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">🎯 Interview Scheduled</h2>
          <p style="color: #bfdbfe; margin: 5px 0 0;">Saven Technologies HR Portal</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; width: 140px;">Candidate</td><td style="padding: 8px 0; font-weight: bold; color: #111827;">${candidate.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Position</td><td style="padding: 8px 0; color: #374151;">${position.title} — ${position.department}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Round</td><td style="padding: 8px 0; color: #374151;">${roundLabel} (Round ${round.round_number})</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Date & Time</td><td style="padding: 8px 0; color: #374151; font-weight: bold;">${startDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })} IST</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Duration</td><td style="padding: 8px 0; color: #374151;">${durationMins} minutes</td></tr>
            ${round.meeting_link ? `<tr><td style="padding: 8px 0; color: #6b7280;">Meeting Link</td><td style="padding: 8px 0;"><a href="${round.meeting_link}" style="color: #2563EB; font-weight: bold;">Click to Join Meeting</a></td></tr>` : ''}
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #eff6ff; border-left: 4px solid #2563EB; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">📅 A calendar invite (.ics) is attached. Open it to add this interview to your Outlook/Teams calendar.</p>
          </div>
        </div>
      </div>
    `;

    // Send to all attendees
    const recipients = attendees.map(a => a.email).join(', ');
    await sendMail({
      to: recipients,
      subject: `📅 Interview Scheduled: ${candidate.name} — ${roundLabel} Round`,
      html: htmlBody,
      text: description,
      attachments: [{
        filename: `interview_${candidate.name.replace(/\s+/g, '_')}_round${round.round_number}.ics`,
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      }],
    });

    console.log(`[Calendar] Interview invite sent to: ${recipients}`);
    return { success: true, recipients };
  } catch (err) {
    // Don't crash the main flow if email fails — just log it
    console.error('[Calendar] Failed to send invite:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendInterviewCalendarInvite };
