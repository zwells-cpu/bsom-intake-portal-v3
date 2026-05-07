import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  FileUp,
  KeyRound,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'

const handledInfo = [
  {
    title: 'Client Intake and Assessment Details',
    copy: 'Referral information, intake status, assessment progress, and related workflow notes may be handled in the portal.',
    icon: ClipboardCheck,
  },
  {
    title: 'Contact and Caregiver Information',
    copy: 'Caregiver names, phone numbers, email addresses, and referral source details may be used for coordination and follow-up.',
    icon: UsersRound,
  },
  {
    title: 'Uploaded Documents',
    copy: 'Relevant intake forms, assessment documents, and supporting records may be uploaded to keep operational work organized.',
    icon: FileUp,
  },
  {
    title: 'User Account and Role Information',
    copy: 'Staff account details and role settings help determine which tools and information each user can access.',
    icon: KeyRound,
  },
  {
    title: 'Workflow Activity and Audit History',
    copy: 'Certain actions may be visible in activity history to support accountability, troubleshooting, and handoffs.',
    icon: Activity,
  },
]

const informationUses = [
  'Support intake coordination',
  'Track referral and assessment progress',
  'Improve team visibility',
  'Reduce scattered spreadsheets and duplicated work',
  'Support administrative follow-up and accountability',
]

const securityPractices = [
  'Authenticated access',
  'Role-based permissions',
  'Session protections',
  'Audit logging',
  'Protected document access',
]

const userResponsibilities = [
  'Use your own login credentials',
  'Do not share passwords or account access',
  'Only access information needed for your role',
  'Keep client information private',
  'Log out when using shared or public devices',
  'Report access issues or incorrect information to an administrator',
]

function PageHero({ eyebrow, title, subtitle, icon: Icon, status }) {
  return (
    <section className="security-hero policy-hero">
      <div className="security-hero-copy">
        <div className="security-eyebrow">
          <Icon size={15} strokeWidth={2.2} />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="security-hero-mark" aria-hidden="true">
        <div className="security-hero-shield">
          <Icon size={42} strokeWidth={1.8} />
        </div>
        <div className="security-hero-status">
          <Sparkles size={15} strokeWidth={2.1} />
          {status}
        </div>
      </div>
    </section>
  )
}

function Section({ title, copy, children }) {
  return (
    <section className="security-section">
      <div className="security-section-heading">
        <h2>{title}</h2>
        {copy ? <p>{copy}</p> : null}
      </div>
      {children}
    </section>
  )
}

function TextPanel({ icon: Icon, title, children }) {
  return (
    <article className="security-thinking-panel policy-text-panel">
      <div className="security-thinking-icon">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </article>
  )
}

function Checklist({ items }) {
  return (
    <div className="security-checklist">
      {items.map((item) => (
        <div className="security-check-item" key={item}>
          <CheckCircle2 size={17} strokeWidth={2.2} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

export function PrivacyDataHandlingPage() {
  return (
    <div className="security-page policy-page">
      <PageHero
        eyebrow="Privacy-Aware Operations"
        title="Privacy & Data Handling"
        subtitle="Clear, plain-language guidance for how information is handled inside the portal."
        icon={FileText}
        status="Healthcare privacy-aware"
      />

      <Section
        title="What Information May Be Handled"
        copy="The portal helps keep operational information organized around the work staff already perform."
      >
        <div className="security-protect-grid policy-info-grid">
          {handledInfo.map(({ title, copy, icon: Icon }) => (
            <article className="security-card security-protect-card" key={title}>
              <div className="security-card-icon">
                <Icon size={20} strokeWidth={2} />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        title="How Information Is Used"
        copy="Information is used to support clearer coordination, cleaner handoffs, and more reliable follow-up."
      >
        <Checklist items={informationUses} />
      </Section>

      <TextPanel icon={UsersRound} title="Access and Permissions">
        Portal access is limited to authorized users. Some areas may be restricted based on role so staff only access the tools and information appropriate for their responsibilities.
      </TextPanel>

      <TextPanel icon={FileUp} title="Document Handling">
        Uploaded documents are intended to support intake and operational workflows. Staff should only upload, view, or share documents when it is appropriate for their role and work responsibilities.
      </TextPanel>

      <TextPanel icon={Activity} title="Activity Visibility">
        Certain workflow actions may be logged to support accountability, troubleshooting, and operational transparency.
      </TextPanel>

      <Section
        title="Security Practices"
        copy="The Security page outlines the safeguards used across the portal. In brief, these practices support privacy-aware operations without adding unnecessary friction."
      >
        <Checklist items={securityPractices} />
      </Section>

      <div className="security-note policy-note">
        This portal is designed to support responsible healthcare operations. Team members should continue following internal privacy, device, communication, and compliance policies.
      </div>
    </div>
  )
}

export function TermsOfUsePage() {
  return (
    <div className="security-page policy-page">
      <PageHero
        eyebrow="Responsible Use"
        title="Terms of Use"
        subtitle="Simple expectations for using the portal responsibly and professionally."
        icon={ClipboardCheck}
        status="Clear team expectations"
      />

      <TextPanel icon={ShieldCheck} title="Authorized Use">
        This portal is intended for authorized team members supporting healthcare operations, intake coordination, assessment tracking, and related administrative workflows.
      </TextPanel>

      <Section
        title="User Responsibilities"
        copy="Every user helps keep the portal useful, accurate, and privacy-aware."
      >
        <Checklist items={userResponsibilities} />
      </Section>

      <TextPanel icon={Database} title="Appropriate Data Handling">
        Users should enter accurate information, avoid unnecessary duplication, and handle sensitive information with care.
      </TextPanel>

      <TextPanel icon={FileUp} title="Documents and Uploads">
        Only upload documents that are relevant to approved operational workflows. Do not upload unnecessary, unrelated, or inappropriate files.
      </TextPanel>

      <TextPanel icon={Activity} title="Activity Logging">
        Some actions may be logged for operational visibility, quality control, troubleshooting, and accountability.
      </TextPanel>

      <TextPanel icon={Sparkles} title="Availability and Updates">
        The portal may be updated over time as workflows improve. Features, layouts, and access rules may change as operational needs evolve.
      </TextPanel>

      <div className="security-note policy-note">
        The portal supports workflow organization, but it does not replace internal policies, professional judgment, payer requirements, or compliance obligations.
      </div>
    </div>
  )
}
