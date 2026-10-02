// Small inline icon set (stroke icons, 24px grid). Keeps the bundle free of an icon library.
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const SearchIcon = () => (<svg {...base}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>)
export const HeartIcon = ({ filled }) => (<svg {...base} fill={filled ? 'currentColor' : 'none'}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" /></svg>)
export const BagIcon = () => (<svg {...base}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>)
export const CloseIcon = () => (<svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>)
export const ArrowIcon = () => (<svg {...base}><path d="M5 12h14M13 6l6 6-6 6" /></svg>)
export const ArrowDown = () => (<svg {...base}><path d="M12 5v14M6 13l6 6 6-6" /></svg>)
