/**
 * KAIROS contact form: message store + daily digest email.
 *
 * What it does
 *  1. doPost()          receives each message from the website's "Send a message" form
 *                       and saves it as a row in a Google Sheet (your permanent log).
 *  2. sendDailyDigest() runs once a day (9 PM India time) and emails ONE summary of all
 *                       messages from the last day, grouped by topic and sorted, to OWNER.
 *                       On days with no messages nothing is sent.
 *
 * Setup (about 2 minutes, see tools/daily-digest/README.md)
 *  - script.google.com > New project > paste this file
 *  - Run setup() once and allow access
 *  - Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone)
 *  - Put the web app URL in src/data/contact.js (DIGEST_ENDPOINT)
 */

const OWNER = 'saxena.priyanshu2008@gmail.com'
const TIMEZONE = 'Asia/Kolkata'
const DIGEST_HOUR = 21 // 9 PM
const SHEET_NAME = 'Messages'
const HEADERS = ['Received', 'Name', 'Email', 'Phone', 'City / country', 'Topic', 'Watch', 'Preferred reply', 'Message', 'Page', 'In digest']

// Topics in the order they appear in the digest (most time-sensitive first)
const TOPIC_ORDER = ['Book a private viewing', 'My configuration', 'A specific watch', 'Service or repair', 'Press or partnership', 'General question']

// ---------- one-time setup ----------
function setup() {
  const props = PropertiesService.getScriptProperties()
  let id = props.getProperty('SHEET_ID')
  let ss = id ? SpreadsheetApp.openById(id) : null
  if (!ss) {
    ss = SpreadsheetApp.create('KAIROS website messages')
    props.setProperty('SHEET_ID', ss.getId())
  }
  let sh = ss.getSheetByName(SHEET_NAME)
  if (!sh) {
    sh = ss.getSheets()[0]
    sh.setName(SHEET_NAME)
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS)
    sh.setFrozenRows(1)
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold')
  }
  // exactly one daily trigger
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'sendDailyDigest')
    .forEach((t) => ScriptApp.deleteTrigger(t))
  ScriptApp.newTrigger('sendDailyDigest').timeBased().everyDays(1).atHour(DIGEST_HOUR).inTimezone(TIMEZONE).create()
  Logger.log('Ready. Messages sheet: ' + ss.getUrl())
}

function sheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID')
  if (!id) throw new Error('Run setup() first')
  return SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME)
}

// ---------- receive a message from the website ----------
function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}')
    if (d.website) return json_({ ok: true }) // honeypot: bots fill the hidden field
    const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max)
    const row = {
      name: clean(d.name, 120),
      email: clean(d.email, 160),
      phone: clean(d.phone, 40),
      city: clean(d.city, 120),
      topic: clean(d.topic, 60) || 'General question',
      watch: clean(d.watch, 60) || 'Not specified',
      contactBy: clean(d.contactBy, 30) || 'Email',
      message: clean(d.message, 5000),
      page: clean(d.page, 300),
    }
    if (!row.name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(row.email) || row.message.length < 10) {
      return json_({ ok: false, error: 'Missing or invalid fields' })
    }
    // simple flood guard: at most 5 messages per email address per hour
    const cache = CacheService.getScriptCache()
    const key = 'n_' + row.email.toLowerCase()
    const n = Number(cache.get(key) || 0)
    if (n >= 5) return json_({ ok: false, error: 'Too many messages, please try again later' })
    cache.put(key, String(n + 1), 3600)

    const lock = LockService.getScriptLock()
    lock.waitLock(10000)
    try {
      sheet_().appendRow([new Date(), row.name, row.email, row.phone, row.city, row.topic, row.watch, row.contactBy, row.message, row.page, ''])
    } finally {
      lock.releaseLock()
    }
    return json_({ ok: true })
  } catch (err) {
    return json_({ ok: false, error: String(err) })
  }
}

// a quick check that the deployment is live (open the web app URL in a browser)
function doGet() {
  return json_({ ok: true, service: 'KAIROS messages' })
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

// ---------- the daily digest ----------
function sendDailyDigest() {
  const sh = sheet_()
  const last = sh.getLastRow()
  if (last < 2) return
  const values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues()
  const pending = []
  values.forEach((r, i) => {
    if (!r[10]) pending.push({ rowIndex: i + 2, at: new Date(r[0]), name: r[1], email: r[2], phone: r[3], city: r[4], topic: r[5], watch: r[6], contactBy: r[7], message: r[8] })
  })
  if (!pending.length) return // nothing new today: no email

  // group by topic (fixed order), then sort inside each topic by watch, then by time
  const rank = (t) => {
    const i = TOPIC_ORDER.indexOf(t)
    return i < 0 ? TOPIC_ORDER.length : i
  }
  const groups = {}
  pending.forEach((m) => (groups[m.topic] = groups[m.topic] || []).push(m))
  const topics = Object.keys(groups).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
  topics.forEach((t) => groups[t].sort((a, b) => String(a.watch).localeCompare(String(b.watch)) || a.at - b.at))

  const day = Utilities.formatDate(new Date(), TIMEZONE, 'd MMM yyyy')
  const time = (d) => Utilities.formatDate(d, TIMEZONE, 'h:mm a')
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const subject = `KAIROS daily messages: ${pending.length} new on ${day}`

  // HTML email
  let html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#161514;max-width:680px">`
  html += `<h2 style="font-family:Georgia,serif;font-weight:normal;margin:0 0 4px">KAIROS daily messages</h2>`
  html += `<p style="color:#6d675d;margin:0 0 18px">${esc(day)} · ${pending.length} new message${pending.length > 1 ? 's' : ''}</p>`
  html += `<table style="border-collapse:collapse;margin-bottom:22px">`
  topics.forEach((t) => (html += `<tr><td style="padding:3px 18px 3px 0">${esc(t)}</td><td style="padding:3px 0;font-weight:bold">${groups[t].length}</td></tr>`))
  html += `</table>`
  topics.forEach((t) => {
    html += `<h3 style="border-bottom:1px solid #d8d2c6;padding-bottom:6px;margin:26px 0 10px;font-size:15px;letter-spacing:1px;text-transform:uppercase;color:#8a6d3b">${esc(t)} (${groups[t].length})</h3>`
    groups[t].forEach((m) => {
      const reply = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re: your KAIROS enquiry')}`
      html += `<div style="border:1px solid #e3ddd2;padding:12px 14px;margin:0 0 10px;background:#faf8f3">`
      html += `<p style="margin:0 0 6px"><b>${esc(m.name)}</b> · ${esc(time(m.at))} · <span style="color:#6d675d">${esc(m.watch)}</span></p>`
      html += `<p style="margin:0 0 8px;white-space:pre-wrap">${esc(m.message)}</p>`
      html += `<p style="margin:0;font-size:13px;color:#6d675d"><a href="${reply}">${esc(m.email)}</a> · ${esc(m.phone)} · ${esc(m.city)} · prefers ${esc(m.contactBy)}</p>`
      html += `</div>`
    })
  })
  const url = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')).getUrl()
  html += `<p style="color:#6d675d;font-size:12px;margin-top:24px">All messages are kept in <a href="${url}">KAIROS website messages</a>.</p></div>`

  // plain-text version
  let text = `${subject}\n\n`
  topics.forEach((t) => {
    text += `== ${t} (${groups[t].length}) ==\n`
    groups[t].forEach((m) => (text += `- ${m.name} (${m.email}, ${m.phone}, ${m.city}) at ${time(m.at)}, watch: ${m.watch}, prefers ${m.contactBy}\n  ${m.message}\n`))
    text += '\n'
  })

  MailApp.sendEmail({ to: OWNER, subject, body: text, htmlBody: html, name: 'KAIROS website' })

  // mark as sent so tomorrow's digest only has new messages
  const stamp = new Date()
  pending.forEach((m) => sh.getRange(m.rowIndex, 11).setValue(stamp))
}

// Run this by hand to receive a sample digest right now (uses real pending messages)
function testDigestNow() {
  sendDailyDigest()
}
