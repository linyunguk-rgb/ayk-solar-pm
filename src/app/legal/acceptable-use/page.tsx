import type { Metadata } from 'next'
import { LegalShell, type TocItem } from '@/components/legal/legal-shell'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy — AYK PTE LTD',
  description:
    'Acceptable Use Policy for the AYK Solar Project Management System: permitted uses, prohibited uses, enterprise tenant responsibilities, enforcement and penalties.',
}

const LAST_UPDATED = '15 September 2025'

const toc: TocItem[] = [
  { id: 'permitted', label: '1. Permitted Uses' },
  { id: 'prohibited', label: '2. Prohibited Uses' },
  { id: 'enterprise', label: '3. Enterprise Tenant Responsibilities' },
  { id: 'enforcement', label: '4. Enforcement & Penalties' },
  { id: 'reporting', label: '5. Reporting Violations' },
  { id: 'contact', label: '6. Contact' },
]

export default function AcceptableUsePage() {
  return (
    <LegalShell
      title="Acceptable Use Policy"
      lastUpdated={LAST_UPDATED}
      description="Rules of the road for using the AYK Solar Project Management System responsibly, and what happens when those rules are broken."
      toc={toc}
    >
      <p>
        This Acceptable Use Policy (&quot;<strong>AUP</strong>&quot;) forms part of the AYK PTE. LTD.
        <a href="/legal/terms">Terms of Service</a> and is incorporated by reference. Capitalised terms have the
        meanings given in the Terms. By using the Platform, you agree to comply with this AUP.
      </p>

      <h2 id="permitted">1. Permitted Uses</h2>
      <p>You may use the Platform to:</p>
      <ul>
        <li>Manage your Tenant&apos;s solar construction projects, daily progress, manpower, materials, expenses, safety, and documents.</li>
        <li>Generate reports and dashboards for your internal business use and for sharing with your clients, where permitted by your contractual arrangements.</li>
        <li>Invite Users into your Tenant via Access Codes, in accordance with your enterprise licence.</li>
        <li>Export your Tenant Data in supported formats (CSV, JSON, printable reports) for backup or migration purposes.</li>
        <li>Use the Platform via a supported modern browser, the installable PWA, or any documented public API where we provide one.</li>
      </ul>

      <h2 id="prohibited">2. Prohibited Uses</h2>
      <p>You must not, and must not permit any User of your Tenant to:</p>
      <h3>2.1 Unauthorised access &amp; security violations</h3>
      <ul>
        <li>Attempt to gain access to another Tenant&apos;s data, account, or infrastructure.</li>
        <li>Probe, scan, or test the vulnerability of the Platform or any AYK system.</li>
        <li>Bypass authentication, rate limits, role-based access controls, or other security features.</li>
        <li>Use another User&apos;s credentials, or share your own credentials with anyone.</li>
      </ul>
      <h3>2.2 Abuse of the service</h3>
      <ul>
        <li>Place undue load on the Platform (e.g. scripted bulk exports that exceed reasonable use) without written authorisation from AYK.</li>
        <li>Scrape, crawl, or extract data from the Platform in bulk, except via documented APIs where expressly permitted.</li>
        <li>Use the Platform to send spam, phishing, or unsolicited commercial messages.</li>
        <li>Upload viruses, malware, ransomware, or any other malicious code.</li>
      </ul>
      <h3>2.3 Harmful or unlawful content</h3>
      <ul>
        <li>Upload content that is unlawful, defamatory, harassing, or infringes the intellectual property or privacy rights of any third party.</li>
        <li>Upload Personal Data that you are not authorised to process under the PDPA, GDPR, or other applicable law.</li>
        <li>Use the Platform to facilitate fraud, money laundering, or sanctions evasion.</li>
      </ul>
      <h3>2.4 Reverse engineering</h3>
      <ul>
        <li>Reverse engineer, decompile, or disassemble any part of the Platform, except to the extent expressly permitted by applicable law.</li>
        <li>Build a competing product using AYK&apos;s designs, code, schema, or trade secrets exposed through the Platform.</li>
      </ul>
      <h3>2.5 Misrepresentation</h3>
      <ul>
        <li>Register an account under a false identity, or impersonate another individual or organisation.</li>
        <li>Use the Platform to misrepresent your qualifications, certifications, or the status of your solar projects to regulators, clients, or the public.</li>
      </ul>

      <h2 id="enterprise">3. Enterprise Tenant Responsibilities</h2>
      <p>
        As an Enterprise customer, you are responsible for the conduct of every User in your Tenant. Specifically, you
        agree to:
      </p>
      <ul>
        <li><strong>Provision responsibly</strong> — issue Access Codes only to individuals who are authorised to act on behalf of your organisation.</li>
        <li><strong>Enforce least privilege</strong> — assign roles (Admin, Project Manager, Site Supervisor, Engineer, Safety Officer, Store Officer, Worker) that match each User&apos;s actual responsibilities.</li>
        <li><strong>Revoke promptly</strong> — revoke Access Codes and credentials of Users who leave your organisation, change roles, or no longer require access, within 24 hours of the change.</li>
        <li><strong>Notify AYK</strong> — of any suspected or confirmed security incident affecting your Tenant as soon as reasonably practicable, and cooperate with AYK in any investigation.</li>
        <li><strong>Maintain your own backups</strong> — AYK provides disaster-recovery backups, but you are encouraged to export critical Tenant Data periodically.</li>
        <li><strong>Stay within licence limits</strong> — ensure that the number of active Users in your Tenant does not exceed your licensed seat count.</li>
        <li><strong>Pay fees</strong> — pay all invoices by their due date. Late payment may result in suspension of your Tenant.</li>
      </ul>

      <h2 id="enforcement">4. Enforcement &amp; Penalties</h2>
      <p>
        AYK reserves the right to investigate suspected AUP violations and to take any of the following actions, in its
        sole discretion, with or without notice:
      </p>
      <ul>
        <li><strong>Warning</strong> — a written warning to the offending User and (where relevant) the Tenant administrator.</li>
        <li><strong>Content removal</strong> — removal of specific content that violates this AUP.</li>
        <li><strong>Suspension</strong> — temporary suspension of a User&apos;s access or a Tenant&apos;s access while a violation is investigated.</li>
        <li><strong>Termination</strong> — permanent termination of a User account or a Tenant, particularly for repeat or serious violations (e.g. unauthorised access, malware upload, fraud).</li>
        <li><strong>Forfeit of prepaid fees</strong> — where a Tenant is terminated for cause, prepaid Access Code fees may be forfeited.</li>
        <li><strong>Referral to authorities</strong> — where a violation may constitute a criminal offence, AYK will refer the matter to the relevant law-enforcement or regulatory authority.</li>
      </ul>
      <p>
        AYK has no obligation to monitor User activity but may do so to the extent permitted by law for security, fraud
        prevention, and compliance purposes.
      </p>

      <h2 id="reporting">5. Reporting Violations</h2>
      <p>
        If you become aware of an AUP violation — whether by a User in your Tenant, another Tenant, or an external party
        — please report it promptly to <a href="mailto:legal@ayk.com.sg">legal@ayk.com.sg</a> with as much detail as
        possible (User ID, project name, date, screenshots, etc.). AYK will investigate and take appropriate action.
        Reports may be made confidentially.
      </p>

      <h2 id="contact">6. Contact</h2>
      <p>
        Questions about this AUP can be sent to <a href="mailto:legal@ayk.com.sg">legal@ayk.com.sg</a>.
      </p>
    </LegalShell>
  )
}
