# Daily message digest

Messages from the website's **Send a message** form are saved in a Google Sheet, and
**one email a day (9 PM India time)** is sent to `saxena.priyanshu2008@gmail.com` with all of
that day's messages, grouped by topic (private viewings first) and sorted by watch and time.
No messages that day means no email.

It runs free on your own Google account with Google Apps Script. There is no server to host.

## Set it up (about 2 minutes)

1. Sign in to Google as **saxena.priyanshu2008@gmail.com** and open <https://script.google.com>.
2. Click **New project**. Delete what is in the editor, paste all of `Code.gs` from this folder,
   and click **Save**. Name the project `KAIROS messages`.
3. In the function menu at the top choose **setup**, then click **Run**.
   Google asks for permission: choose your account, click **Advanced**, then
   **Go to KAIROS messages**, then **Allow**. (It needs to create the sheet, run on a timer and send email.)
4. Click **Deploy > New deployment**. Click the gear and pick **Web app**. Set
   **Execute as: Me** and **Who has access: Anyone**. Click **Deploy** and copy the **Web app URL**
   (it ends in `/exec`).
5. Paste that URL into `src/data/contact.js` as `DIGEST_ENDPOINT`, then rebuild and publish
   (or just send the URL to Claude and it will do this).

Done. A sheet called **KAIROS website messages** now appears in your Google Drive and collects
every message. To see a sample digest right away, send a test message from the site, then run
**testDigestNow** in the script editor.

## Notes

- The website sends to this script first. If the script cannot be reached, it falls back to
  emailing that single message through FormSubmit, so nothing is lost.
- Change the time with `DIGEST_HOUR` in `Code.gs` and run **setup** again.
- If you edit `Code.gs` later, use **Deploy > Manage deployments > Edit > New version** so the
  same URL keeps working.
