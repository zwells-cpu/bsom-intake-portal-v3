import {
  Activity,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  FileLock2,
  FileText,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UsersRound,
} from 'lucide-react'

const trustPills = [
  'Secure Access',
  'HIPAA-Aware Design',
  'Audit Logging Enabled',
  'Role Permissions Active',
]

const protectedAreas = [
  {
    title: 'Client Information',
    copy: 'Sensitive intake and assessment information is handled through authenticated access and structured workflows.',
    icon: FileText,
  },
  {
    title: 'Team Activity',
    copy: 'Key actions are logged to support accountability and operational transparency.',
    icon: Activity,
  },
  {
    title: 'Documents & Uploads',
    copy: 'Client documents are handled through controlled storage and protected access patterns.',
    icon: FileLock2,
  },
  {
    title: 'System Access',
    copy: 'Only authorized users can access the portal and role-based areas.',
    icon: LockKeyhole,
  },
]

const securityFeatures = [
  ['Role-Based Access', 'Staff see the workspaces and controls appropriate for their responsibilities.', UsersRound],
  ['Session Timeout Protection', 'Idle sessions are monitored to reduce unattended access risk.', TimerReset],
  ['Audit Logging', 'Important workflow events are captured for visibility and follow-up.', ClipboardCheck],
  ['Protected File Access', 'Document workflows use controlled access patterns for sensitive files.', FileLock2],
  ['Secure Authentication', 'Portal access starts with authenticated staff sign-in.', Fingerprint],
  ['Password Standards', 'Account access is supported by managed password and recovery flows.', KeyRound],
  ['Centralized Intake Tracking', 'Referral and assessment work stays organized in one operational system.', DatabaseZap],
  ['Reduced Spreadsheet Dependency', 'Cleaner workflows reduce scattered files, duplicate lists, and unclear handoffs.', BadgeCheck],
]

const safeguards = [
  'Access restricted by authenticated login',
  'User permissions organized by role',
  'Key workflow actions logged',
  'Documents handled through protected access',
  'Intake data centralized in one system',
  'Admin visibility into recent activity',
  'Session protections in place',
  'Designed to reduce scattered spreadsheet risk',
]

export function SecurityPage() {
  return (
    <div className="security-page">
      <section className="security-hero">
        <div className="security-hero-copy">
          <div className="security-eyebrow">
            <ShieldCheck size={15} strokeWidth={2.2} />
            Trust Center
          </div>
          <h1>Security &amp; Privacy</h1>
          <p>
            Built with healthcare operations in mind &mdash; with thoughtful safeguards designed to protect sensitive client information, team workflows, and operational visibility.
          </p>
          <div className="security-trust-pills" aria-label="Security status">
            {trustPills.map((pill) => (
              <span key={pill}>{pill}</span>
            ))}
          </div>
        </div>
        <div className="security-hero-mark" aria-hidden="true">
          <div className="security-hero-shield">
            <ShieldCheck size={42} strokeWidth={1.8} />
          </div>
          <div className="security-hero-status">
            <Sparkles size={15} strokeWidth={2.1} />
            Privacy-aware operations
          </div>
        </div>
      </section>

      <section className="security-section">
        <div className="security-section-heading">
          <h2>What We Protect</h2>
          <p>Clear safeguards for the information and workflows staff touch every day.</p>
        </div>
        <div className="security-protect-grid">
          {protectedAreas.map(({ title, copy, icon: Icon }) => (
            <article className="security-card security-protect-card" key={title}>
              <div className="security-card-icon">
                <Icon size={20} strokeWidth={2} />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="security-section">
        <div className="security-section-heading">
          <h2>Security Features</h2>
          <p>Plain-language controls that support privacy, accountability, and smoother operations.</p>
        </div>
        <div className="security-feature-grid">
          {securityFeatures.map(([title, copy, Icon]) => (
            <article className="security-feature-card" key={title}>
              <div className="security-feature-icon">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="security-thinking-panel">
        <div className="security-thinking-icon">
          <ShieldCheck size={24} strokeWidth={2} />
        </div>
        <div>
          <h2>How We Think About Security</h2>
          <p>
            Good security is not just about technology. It is also about reducing confusion, improving accountability, and helping teams handle sensitive information with more clarity. This portal was designed to support cleaner workflows, stronger handoffs, and more intentional intake operations.
          </p>
        </div>
      </section>

      <section className="security-section">
        <div className="security-section-heading">
          <h2>Operational Safeguards</h2>
          <p>A practical checklist for responsible healthcare operations.</p>
        </div>
        <div className="security-checklist">
          {safeguards.map((item) => (
            <div className="security-check-item" key={item}>
              <CheckCircle2 size={17} strokeWidth={2.2} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="security-note">
        This portal is continuously evolving. Teams should continue following internal privacy, device, and compliance policies as part of a complete healthcare operations strategy.
      </div>
    </div>
  )
}
