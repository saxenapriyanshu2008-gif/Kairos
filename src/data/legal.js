/*
  Legal pages for KAIROS. KAIROS is a concept brand built for a web
  development competition, so these pages are written as clear, honest
  examples: they explain how a real store would handle each topic and say
  plainly what this concept site actually does (no payments, no accounts,
  no tracking).
*/

export const LEGAL_UPDATED = '2 October 2026'

export const legalPages = [
  {
    slug: 'privacy',
    title: 'Privacy Notice',
    short: 'Privacy',
    intro:
      'This notice explains what information KAIROS collects, why we collect it and the choices you have. KAIROS is a concept brand, so this site collects far less than a real store would. Where that is the case, we say so.',
    sections: [
      {
        h: 'What this concept site collects',
        p: [
          'The contact form sends what you type (name, email, phone, city, topic, the watch you chose and your message) to the KAIROS studio. Messages are kept in a private Google Sheet owned by the studio and summarised in one daily email; if that is unavailable, the message is emailed straight away using the form-to-email service FormSubmit. We use your details only to reply to you. The newsletter form checks your address but does not send or store it. Your bag and wishlist live only in this browser tab and are cleared when you close it.',
          'The watch configurator remembers your last design in your browser\'s local storage, so it is still there when you come back. That data stays on your device and you can clear it in your browser settings.',
          'Campaign photos load from Unsplash, so Unsplash receives a normal web request (including your IP address) when an image loads. Fonts are hosted with the site itself.',
          'The site does not use analytics, advertising pixels or tracking cookies.',
        ],
      },
      {
        h: 'What a real KAIROS store would collect',
        list: [
          'Contact details you give us, such as your name, email, phone number and delivery address.',
          'Order details, such as the watch you chose, its options and your payment status. Card numbers would be handled only by the payment provider, never stored by us.',
          'Messages you send to our client advisors or service team.',
          'Basic technical data, such as browser type and pages visited, only if you allow analytics cookies.',
        ],
      },
      {
        h: 'Why we would use it',
        list: [
          'To make, ship and service your watch.',
          'To answer your questions and arrange appointments.',
          'To send news about KAIROS, only if you sign up, with an unsubscribe link in every email.',
          'To meet legal duties, such as keeping invoices for tax records.',
        ],
      },
      {
        h: 'Sharing',
        p: ['We would share data only with partners who help us run the service, such as couriers, payment providers and email tools, and only what each one needs. We would never sell your personal data.'],
      },
      {
        h: 'How long we keep it',
        p: ['Order and invoice records for as long as the law requires. Marketing data until you unsubscribe. Service records for the life of the warranty plus two years.'],
      },
      {
        h: 'Your rights',
        p: ['You can ask to see, correct, download or delete your data, and you can withdraw consent at any time. Under India\'s Digital Personal Data Protection Act, 2023 and similar laws elsewhere, you can also complain to your local data protection authority.'],
      },
      {
        h: 'Contact',
        p: ['Questions about privacy can go to privacy@kairos.example. (This is a placeholder address for the concept site.)'],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    short: 'Terms',
    intro: 'These terms cover your use of this website. Please read them before you use the site.',
    sections: [
      {
        h: 'A concept brand',
        p: [
          'KAIROS is a fictional watch brand created for a web development competition. No watches are for sale, prices are examples, and nothing you add to your bag can be bought or paid for.',
          'Product details, including the specifications of KAIROS PULSE, describe a concept product and are not an offer to sell.',
        ],
      },
      {
        h: 'Using the site',
        list: [
          'You may browse, share links and take screenshots for personal or review use.',
          'Do not try to break, overload or misuse the site or its code.',
          'Do not present the KAIROS name, logo or renders as a real company or product.',
        ],
      },
      {
        h: 'Content and credits',
        p: ['The KAIROS name, K-clock logo, watch models, renders and copy are original work made for this project. Photographs, fonts and code libraries belong to their creators and are used under their licences, listed on the Assets & Credits page.'],
      },
      {
        h: 'Links to other sites',
        p: ['Some links open other websites, such as social media. We do not control those sites and are not responsible for their content or privacy practices.'],
      },
      {
        h: 'No warranty for the website',
        p: ['The site is provided as it is. We work to keep it accurate and available, but we cannot promise it will always be error free.'],
      },
      {
        h: 'Changes',
        p: ['We may update these terms. The date at the top of this page shows the latest version.'],
      },
    ],
  },
  {
    slug: 'shipping',
    title: 'Shipping & Returns',
    short: 'Shipping',
    intro: 'How a KAIROS order would travel to you, and how to send it back if it is not right. As a concept brand we do not ship real orders.',
    sections: [
      {
        h: 'Delivery',
        list: [
          'Free insured delivery on every order.',
          'Made-to-order watches from the configurator ship in 3 to 4 weeks. Collection pieces ship in 2 to 4 working days.',
          'Every parcel is sent by a secure courier and needs a signature on delivery.',
          'You get a tracking link by email as soon as your watch leaves the atelier.',
        ],
      },
      {
        h: 'Duties and taxes',
        p: ['Prices for India would include GST. For other countries, any import duties are shown at checkout before you pay, so there are no surprises at the door.'],
      },
      {
        h: '30-day returns',
        p: [
          'If your watch is not right, you can return it within 30 days of delivery for a full refund. It should be unworn, with its protective films, box, papers and strap tags.',
          'Engraved or custom-configured watches can be exchanged for a different configuration, but not refunded, because they are made for you.',
        ],
      },
      {
        h: 'How to return',
        list: [
          'Contact our client service team with your order number.',
          'We send you a prepaid, insured return label.',
          'Once we check the watch, your refund goes back to your original payment method within 7 working days.',
        ],
      },
    ],
  },
  {
    slug: 'warranty',
    title: 'Warranty & Service',
    short: 'Warranty',
    intro: 'Every KAIROS is built to last for generations. This page explains what the warranty covers and how servicing works.',
    sections: [
      {
        h: 'Five-year international warranty',
        p: ['Mechanical KAIROS watches are covered for five years from the date of purchase against defects in materials and workmanship. KAIROS PULSE is covered for two years, with one year for its battery.'],
      },
      {
        h: 'What is not covered',
        list: [
          'Normal wear, such as scratches on the case, crystal or strap.',
          'Damage from accidents, misuse or water entry after the crown was left open.',
          'Repairs or battery changes made by anyone other than KAIROS or an approved service centre.',
        ],
      },
      {
        h: 'Recommended service',
        p: ['We suggest a full service for mechanical watches every five to seven years. The movement is taken apart, cleaned, oiled, adjusted and tested for water resistance, and the case is refinished by hand.'],
      },
      {
        h: 'Water resistance',
        p: ['Check that the crown is pushed in or screwed down before swimming. We recommend a water resistance test once a year if you swim or dive with your watch.'],
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    short: 'Cookies',
    intro: 'Cookies are small files a website saves in your browser. This page explains how KAIROS uses them.',
    sections: [
      {
        h: 'Cookies on this concept site',
        p: ['This site sets no cookies. It uses one local storage entry to remember your last configurator design, which never leaves your device. Your bag and wishlist are kept in memory only while the tab is open.'],
      },
      {
        h: 'What a real store would use',
        list: [
          'Essential cookies, to keep your bag and sign-in working. These cannot be turned off.',
          'Analytics cookies, to understand which pages help people most. Only with your consent.',
          'Marketing cookies, to measure campaigns. Only with your consent, and never sold to others.',
        ],
      },
      {
        h: 'Your choices',
        p: ['You can block or delete cookies in your browser settings at any time. Blocking essential cookies may stop the bag from working.'],
      },
    ],
  },
]

export const getLegal = (slug) => legalPages.find((p) => p.slug === slug)
