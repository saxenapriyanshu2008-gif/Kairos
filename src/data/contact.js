/*
  Contact settings in one place.
  Messages from the contact form are emailed to EMAIL through FormSubmit
  (https://formsubmit.co), a free form-to-email service that needs no server.
  The very first message triggers a one-time "activate this form" email to
  EMAIL; click the link in it once and every later message is delivered.
*/
export const CONTACT = {
  email: 'saxena.priyanshu2008@gmail.com',
  // shown on the site and used for the "Call us" button (tel: link)
  phone: '+91 00000 00000',
  hours: 'Mon to Sat, 11:00 to 19:00 IST',
  city: 'New Delhi, India',
}

export const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT.email}`

export const TOPICS = ['General question', 'A specific watch', 'My configuration', 'Book a private viewing', 'Service or repair', 'Press or partnership']
