import type { Metadata } from 'next'
import { LegalShell, type TocItem } from '@/components/legal/legal-shell'

export const metadata: Metadata = {
  title: 'Privacy Policy — AYK PTE LTD',
  description:
    'Privacy Policy for the AYK Solar Project Management System: information collected, how it is used, tenant isolation, data sharing, retention, security, cookies, user rights, GDPR and PDPA compliance, children, international transfers, and contact.',
}

const LAST_UPDATED = '15 September 2025'

const toc: TocItem[] = [
  { id: 'collected', label: '1. Information We Collect' },
  { id: 'use', label: '2. How We Use Data' },
  { id: 'isolation', label: '3. Data Isolation' },
  { id: 'sharing', label: '4. Data Sharing' },
  { id: 'retention', label: '5. Retention & Deletion' },
  { id: 'security', label: '6. Security Measures' },
  { id: 'cookies', label: '7. Cookies & Local Storage' },
  { id: 'rights', label: '8. Your Rights' },
  { id: 'gdpr', label: '9. GDPR Compliance (EU)' },
  { id: 'pdpa', label: '10. PDPA Compliance (SG)' },
  { id: 'children', label: '11. Children' },
  { id: 'transfers', label: '12. International Transfers' },
  { id: 'changes', label: '13. Changes to this Policy' },
  { id: 'contact', label: '14. Contact' },
]

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      description="How AYK PTE LTD collects, uses, shares, secures, and retains personal data on the AYK Solar Project Management System."
      toc={toc}
    >
      <p>
        At AYK PTE. LTD. (&quot;<strong>AYK</strong>&quot;, &quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;),
        we take privacy seriously. This Privacy Policy explains what Personal Data we collect through the AYK Solar
        Project Management System (the &quot;<strong>Platform</strong>&quot;), how we use and protect it, and the rights
        you have over it.
      </p>
      <p>
        This policy applies to all Users of the Platform — administrators, project managers, site supervisors,
        engineers, safety officers, store officers, and workers — and is aligned with the Singapore Personal Data
        Protection Act 2012 (&quot;<strong>PDPA</strong>&quot;) and the EU General Data Protection Regulation
        (&quot;<strong>GDPR</strong>&quot;).
      </p>

      <h2 id="collected">1. Information We Collect</h2>
      <h3>1.1 Account data</h3>
      <p>When you register or are invited to a Tenant, we collect:</p>
      <ul>
        <li>Full name</li>
        <li>Email address</li>
        <li>Phone number (optional)</li>
        <li>Role within the Tenant (e.g. Admin, Project Manager, Site Supervisor)</li>
        <li>Profile picture / avatar (optional)</li>
      </ul>
      <h3>1.2 Project &amp; site data</h3>
      <p>As you use the Platform, you (and other Users in your Tenant) may submit:</p>
      <ul>
        <li>Project names, locations, client names, budgets, and schedules</li>
        <li>Daily progress entries: panels installed, man-hours, workers on site, site status, remarks</li>
        <li>Task assignments and progress updates</li>
        <li>Worker records: names, employee IDs, roles, teams, skills, attendance</li>
        <li>Materials, transactions, expenses, receipts, and documents</li>
        <li>Safety checklists, incidents, and corrective actions</li>
      </ul>
      <h3>1.3 Media &amp; location data</h3>
      <p>
        When you upload site photos or capture GPS coordinates via the daily progress form, we store the photo files and
        the latitude/longitude pairs you submit. GPS capture is opt-in — the form does not collect your location until
        you press the &quot;Get Location&quot; button.
      </p>
      <h3>1.4 Usage &amp; technical data</h3>
      <p>We automatically collect:</p>
      <ul>
        <li>IP address and browser type (for security, audit, and abuse prevention)</li>
        <li>Approximate device type and screen size (for responsive rendering)</li>
        <li>Pages visited and actions taken within the Platform (for product analytics and audit logs)</li>
        <li>Crash and error reports (for debugging)</li>
      </ul>
      <h3>1.5 Enterprise &amp; billing data</h3>
      <p>For Enterprise customers, we collect billing contact, invoicing address, and payment metadata. We do not store
      full card numbers; card data, if collected, is handled by a PCI-DSS compliant payment processor.</p>

      <h2 id="use">2. How We Use Your Data</h2>
      <p>We use Personal Data for the following purposes:</p>
      <ul>
        <li><strong>Service delivery</strong> — authenticating you, displaying your Tenant&apos;s projects, progress, manpower, materials, expenses, safety, and documents.</li>
        <li><strong>Reporting</strong> — generating dashboards, charts, and the exportable daily / weekly / monthly / project-summary / planned-vs-actual reports.</li>
        <li><strong>Notifications</strong> — in-app and (optionally) email alerts for task assignments, low-stock materials, safety incidents, and overdue items.</li>
        <li><strong>Tenant administration</strong> — allowing Enterprise administrators to manage Users, Access Codes, and roles within their Tenant.</li>
        <li><strong>Security &amp; abuse prevention</strong> — detecting unauthorised access, fraud, rate-limit violations, and security incidents.</li>
        <li><strong>Improvement</strong> — aggregating usage patterns to improve features, performance, and reliability. Aggregated data is anonymised and cannot identify individuals or Tenants.</li>
        <li><strong>Legal compliance</strong> — meeting obligations under Singapore law, GDPR, and other applicable regulations.</li>
      </ul>
      <p>
        We do <strong>not</strong> use Personal Data to build individual profiles for third-party advertising, and we do
        not sell Personal Data.
      </p>

      <h2 id="isolation">3. Data Isolation</h2>
      <p>
        The Platform is multi-tenant. Every User belongs to exactly one Tenant, and every record — projects, progress,
        materials, expenses, safety, documents, notifications — is tagged with a Tenant identifier that is enforced at
        the application and database layers.
      </p>
      <p>
        As a result:
      </p>
      <ul>
        <li>One Tenant cannot query, list, view, or export another Tenant&apos;s data through the Platform UI or API.</li>
        <li>Cross-Tenant joins are technically prevented.</li>
        <li>AYK personnel do not have routine access to Tenant Data. Access by AYK engineers is restricted to break-glass scenarios (e.g. confirmed support tickets), logged, and time-bound.</li>
      </ul>

      <h2 id="sharing">4. Data Sharing</h2>
      <p>
        We never sell your Personal Data. We share it only in the following limited circumstances:
      </p>
      <ul>
        <li><strong>Within your Tenant</strong> — your account information (name, role, email) is visible to other Users in the same Tenant, and to your Tenant&apos;s administrators. Tenant Data is shared among Users of that Tenant according to role-based permissions.</li>
        <li><strong>Sub-processors</strong> — we use a small number of sub-processors for hosting, email delivery, and error monitoring, each bound by written agreements that meet PDPA and GDPR requirements. A list is available on request and in our GDPR/DPA.</li>
        <li><strong>Legal compliance</strong> — where required by law, regulation, court order, or competent governmental authority.</li>
        <li><strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of all or part of AYK&apos;s business, subject to confidentiality obligations consistent with this policy.</li>
      </ul>

      <h2 id="retention">5. Data Retention &amp; Deletion</h2>
      <h3>5.1 Active retention</h3>
      <p>
        We retain Tenant Data for as long as your Tenant is active. A Tenant is considered inactive if no User has signed
        in for 12 consecutive months.
      </p>
      <h3>5.2 Post-termination</h3>
      <p>
        After termination of a Tenant, we provide a 90-day window during which you may export your Tenant Data. After
        that window, we delete Tenant Data from production systems, with limited backups retained for up to 30 additional
        days for disaster-recovery purposes.
      </p>
      <h3>5.3 Audit logs</h3>
      <p>
        Security and audit logs (which may contain IP addresses and User IDs) are retained for up to 12 months for
        security and compliance purposes.
      </p>
      <h3>5.4 Legal holds</h3>
      <p>
        Where required by law or pending litigation, we will retain specific records beyond the periods above until the
        hold is lifted.
      </p>

      <h2 id="security">6. Security Measures</h2>
      <ul>
        <li><strong>Passwords</strong> are stored using one-way salted hashing (bcrypt or stronger). Plaintext passwords are never stored or logged.</li>
        <li><strong>Sessions</strong> are managed via signed, HttpOnly, Secure cookies. Tokens cannot be read by client-side JavaScript.</li>
        <li><strong>Transport encryption</strong> — all traffic between your browser and the Platform uses HTTPS/TLS.</li>
        <li><strong>Tenant isolation</strong> — enforced at the data layer; see Section 3.</li>
        <li><strong>Access controls</strong> — role-based access control per Tenant; AYK engineering access is least-privilege, logged, and reviewed periodically.</li>
        <li><strong>Backups</strong> — encrypted at rest; accessible only to a small number of authorised engineers.</li>
        <li><strong>Vulnerability management</strong> — dependencies are monitored for known CVEs; security patches are applied promptly.</li>
      </ul>
      <p>
        Despite our efforts, no system is perfectly secure. If a breach occurs that materially affects your Personal
        Data, we will notify affected Users and (where required) the relevant supervisory authorities without undue
        delay, in line with PDPA and GDPR breach-notification requirements.
      </p>

      <h2 id="cookies">7. Cookies &amp; Local Storage</h2>
      <p>
        We use minimal cookies and local storage: a signed session cookie for authentication, and local-storage entries
        for UI preferences (theme, sidebar state). We do not use third-party advertising cookies. Full details are in our
        <a href="/legal/cookies">Cookie Policy</a>.
      </p>

      <h2 id="rights">8. Your Rights</h2>
      <p>Subject to applicable law, you have the right to:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of the Personal Data we hold about you.</li>
        <li><strong>Correction</strong> — request that inaccurate or incomplete data be corrected.</li>
        <li><strong>Deletion</strong> — request deletion of your Personal Data, subject to legal retention obligations.</li>
        <li><strong>Export</strong> — receive an export of your Tenant Data in a structured, machine-readable format (CSV / JSON).</li>
        <li><strong>Restriction &amp; objection</strong> — request that we limit processing or stop processing your data for specific purposes.</li>
        <li><strong>Withdraw consent</strong> — where we rely on consent, you may withdraw it at any time.</li>
        <li><strong>Lodge a complaint</strong> — with the Singapore Personal Data Protection Commission (PDPC) or, for EU residents, your local supervisory authority.</li>
      </ul>
      <p>
        To exercise any of these rights, email <a href="mailto:privacy@ayk.com.sg">privacy@ayk.com.sg</a> with the subject
        line &quot;Data Subject Request&quot;. We respond within 30 days.
      </p>

      <h2 id="gdpr">9. GDPR Compliance (EU Users)</h2>
      <p>
        For Users in the European Economic Area, the UK, and Switzerland, we comply with the GDPR. The legal bases on
        which we process your Personal Data are:
      </p>
      <ul>
        <li><strong>Performance of a contract</strong> (Art. 6(1)(b)) — to provide the Service you requested.</li>
        <li><strong>Legal obligation</strong> (Art. 6(1)(c)) — to meet tax, accounting, and regulatory requirements.</li>
        <li><strong>Legitimate interests</strong> (Art. 6(1)(f)) — for security, fraud prevention, and product improvement, balanced against your rights.</li>
        <li><strong>Consent</strong> (Art. 6(1)(a)) — for optional features such as GPS capture and email notifications, where you have explicitly opted in.</li>
      </ul>
      <p>
        AYK acts as a <strong>processor</strong> for Tenant Data on behalf of Enterprise customers who act as
        <strong>controllers</strong>. The full terms are in our <a href="/legal/gdpr">GDPR / Data Processing Addendum</a>.
      </p>

      <h2 id="pdpa">10. PDPA Compliance (Singapore)</h2>
      <p>
        We comply with the PDPA, including the Notification, Consent, Purpose Limitation, Access and Correction,
        Accuracy, Protection, Retention Limitation, and Transfer Limitation Obligations. The Purposes for which we
        collect, use, and disclose Personal Data are listed in Section 2 of this Policy.
      </p>
      <p>
        Where consent is required under the PDPA, you may withdraw it at any time by writing to
        <a href="mailto:privacy@ayk.com.sg">privacy@ayk.com.sg</a>. Withdrawal may affect our ability to continue
        providing some features.
      </p>

      <h2 id="children">11. Children&apos;s Privacy</h2>
      <p>
        The Platform is intended for business use and is not directed at children under 18. We do not knowingly collect
        Personal Data from anyone under 18. If you believe we have collected such data, please contact
        <a href="mailto:privacy@ayk.com.sg">privacy@ayk.com.sg</a> and we will delete it.
      </p>

      <h2 id="transfers">12. International Data Transfers</h2>
      <p>
        AYK is headquartered in Singapore and primarily stores Tenant Data in Singapore. Some sub-processors may process
        data in other jurisdictions (e.g. the EU, US, or Australia). Where Personal Data is transferred outside
        Singapore, we ensure an equivalent level of protection through:
      </p>
      <ul>
        <li>Standard Contractual Clauses approved by the European Commission, where applicable.</li>
        <li>Binding corporate rules or other transfer mechanisms recognised by the PDPC.</li>
        <li>Sub-processor agreements that require compliance with PDPA and GDPR standards.</li>
      </ul>

      <h2 id="changes">13. Changes to this Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be notified by email to active Users
        and via an in-app notice at least 14 days before they take effect. The &quot;Last updated&quot; date at the top
        indicates when the policy was last revised.
      </p>

      <h2 id="contact">14. Contact</h2>
      <p>
        If you have any questions about this Privacy Policy or wish to exercise any of your rights, please contact our
        Data Protection Officer:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:privacy@ayk.com.sg">privacy@ayk.com.sg</a></li>
        <li><strong>General legal:</strong> <a href="mailto:legal@ayk.com.sg">legal@ayk.com.sg</a></li>
        <li><strong>Entity:</strong> AYK PTE. LTD., Singapore</li>
      </ul>
    </LegalShell>
  )
}
