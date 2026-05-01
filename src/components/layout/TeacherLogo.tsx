const TeacherLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Graduation cap top */}
    <polygon points="50,8 15,26 50,42 85,26" fill="url(#capGrad)" />
    {/* Cap brim shadow */}
    <path d="M15 26 L15 44 L22 48 L22 30 Z" fill="url(#capShadow)" />
    {/* Cap string/tassel */}
    <line x1="85" y1="26" x2="85" y2="46" stroke="url(#tasselGrad)" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="85" cy="50" r="4" fill="url(#tasselGrad)" />

    {/* Face */}
    <circle cx="50" cy="65" r="22" fill="url(#skinGrad)" />

    {/* Eyes with shine */}
    <circle cx="41" cy="61" r="5" fill="white" />
    <circle cx="59" cy="61" r="5" fill="white" />
    <circle cx="42" cy="62" r="3" fill="#1a1a2e" />
    <circle cx="60" cy="62" r="3" fill="#1a1a2e" />
    <circle cx="43.5" cy="60.5" r="1" fill="white" opacity="0.9" />
    <circle cx="61.5" cy="60.5" r="1" fill="white" opacity="0.9" />

    {/* Glasses frames */}
    <circle cx="41" cy="61" r="6.5" fill="none" stroke="#7c3aed" strokeWidth="2" />
    <circle cx="59" cy="61" r="6.5" fill="none" stroke="#7c3aed" strokeWidth="2" />
    <path d="M47.5 61 L52.5 61" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/>
    <path d="M34.5 61 L34 58" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M65.5 61 L66 58" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>

    {/* Smile */}
    <path d="M 41 71 Q 50 78 59 71" stroke="#c2410c" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

    {/* Cheeks */}
    <circle cx="36" cy="70" r="4" fill="#f87171" opacity="0.35" />
    <circle cx="64" cy="70" r="4" fill="#f87171" opacity="0.35" />

    {/* Book bottom */}
    <rect x="34" y="85" width="32" height="11" rx="2.5" fill="url(#bookGrad)" />
    <line x1="50" y1="85" x2="50" y2="96" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
    <line x1="38" y1="89" x2="48" y2="89" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
    <line x1="52" y1="89" x2="62" y2="89" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>

    <defs>
      <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed"/>
        <stop offset="100%" stopColor="#db2777"/>
      </linearGradient>
      <linearGradient id="capShadow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="tasselGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24"/>
        <stop offset="100%" stopColor="#f59e0b"/>
      </linearGradient>
      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a"/>
        <stop offset="100%" stopColor="#fcd34d"/>
      </linearGradient>
      <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2563eb"/>
        <stop offset="100%" stopColor="#7c3aed"/>
      </linearGradient>
    </defs>
  </svg>
);

export default TeacherLogo;
