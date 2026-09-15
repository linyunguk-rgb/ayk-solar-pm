import type { Metadata } from 'next'
import { LegalShell, type TocItem } from '@/components/legal/legal-shell'

export const metadata: Metadata = {
  title: 'GDPR / Data Processing Addendum — AYK PTE LTD',
  description:
    'GDPR and Data Processing Addendum for the AYK Solar Project Management System: controller vs processor roles, data subject rights, processing purposes, sub-processors, breach notification, international transfers, and DPA terms for enterprise customers.',
}

const LAST_UPDATED = '15 September 2025'

const toc: TocItem[] = [
  { id: 'scope', label: '1. Scope & Applicability' },
  { id: 'roles', label: '2. Controller vs Processor' },
  { id: 'purposes', label: '3. Processing Purposes' },
  { id: 'subject-rights', label: '4. Data Subject Rights' },
  { id: 'subprocessors', label: '5. Sub-Processors' },
  { id: 'breach', label: '6. Breach Notification' },
  { id: 'transfers', label: '7. International Transfers' },
  { id: 'security', label: '8. Security Measures' },
  { id: 'deletion', label: '9. Deletion & Return' },
  { id: 'audit', label: '10. Audit Rights' },
  { id: 'dpa-terms', label: '11. DPA Terms for Enterprise Customers' },
  { id: 'contact', label: '12. Contact' },
]

export default function GdprPage() {
  return (
    <LegalShell
      title="GDPR / Data Processing Addendum"
      lastUpdated={LAST_UPDATED}
      description="How AYK processes personal data as a processor on behalf of enterprise controllers, and the data-protection terms that apply to enterprise customers."
      toc={toc}
    >
      <p>
        This GDPR / Data Processing Addendum (&quot;<strong>DPA</strong>&quot;) forms part of the AYK PTE. LTD.
        <a href="/legal/terms">Terms of Service</a> and our <a href="/legal/privacy">Privacy Policy</a>, and is
        incorporated by reference. It applies to the processing of Personal Data within the AYK Solar Project Management
        System (the &quot;<strong>Platform</strong>&quot;) where the GDPR or UK GDPR applies.
      </p>

      <h2 id="scope">1. Scope &amp; Applicability</h2>
      <p>
        This DPA applies where AYK processes Personal Data on behalf of an Enterprise customer (the
        &quot;<strong>Controller</strong>&quot;) in connection with the Controller&apos;s use of the Platform. It
        reflects the requirements of Article 28 of the GDPR and the UK Data Protection Act 2018.
      </p>
      <p>
        Terms used but not defined here have the meanings given in the GDPR. This DPA prevails over any conflicting term
        in the Terms of Service with respect to the processing of Personal Data.
      </p>

      <h2 id="roles">2. Controller vs Processor</h2>
      <h3>2.1 Roles</h3>
      <ul>
        <li>The <strong>Controller</strong> is the Enterprise customer that determines the purposes and means of processing Personal Data within its Tenant.</li>
        <li>The <strong>Processor</strong> is AYK PTE. LTD., which processes Personal Data on behalf of the Controller in order to provide the Platform.</li>
      </ul>
      <h3>2.2 Processing instructions</h3>
      <p>
        AYK will process Personal Data only on the Controller&apos;s documented instructions, including with regard to
        transfers of Personal Data to a third country, unless required to do so by law. The Terms of Service, the
        Controller&apos;s order form, and this DPA constitute the Controller&apos;s initial instructions. The Controller
        may issue additional instructions through the Platform&apos;s configuration options or by written notice to
        <a href="mailto:privacy@ayk.com.sg">privacy@ayk.com.sg</a>.
      </p>
      <h3>2.3 AYK as independent controller</h3>
      <p>
        To the extent AYK processes Personal Data for its own legitimate purposes (e.g. billing, security, product
        analytics), AYK acts as an independent Controller, and the relevant processing is described in the
        <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <h2 id="purposes">3. Processing Purposes</h2>
      <p>AYK processes Personal Data as a Processor solely for the following purposes:</p>
      <ul>
        <li>Providing, maintaining, and securing the Platform for the Controller&apos;s Tenant.</li>
        <li>Storing and displaying projects, daily progress entries, manpower records, materials, expenses, safety records, and documents entered by the Controller&apos;s Users.</li>
        <li>Generating dashboards, charts, reports, and exports on behalf of the Controller.</li>
        <li>Providing in-app and (optionally) email notifications to the Controller&apos;s Users.</li>
        <li>Providing support, debugging, and disaster-recovery services.</li>
        <li>Complying with the Controller&apos;s documented instructions and applicable law.</li>
      </ul>
      <p>
        AYK will not process Personal Data for any other purpose without the Controller&apos;s prior written authorisation,
        and will not process Personal Data for AYK&apos;s own commercial benefit (other than as permitted under the
        Privacy Policy as an independent Controller for aggregate, anonymised metrics).
      </p>

      <h2 id="subject-rights">4. Data Subject Rights</h2>
      <p>
        AYK will assist the Controller in responding to data-subject requests (access, rectification, erasure,
        restriction, portability, objection, and rights related to automated decision-making) by:
      </p>
      <ul>
        <li>Providing tools within the Platform that allow the Controller to access, export, correct, and delete Tenant Data directly.</li>
        <li>Providing reasonable technical and organisational support, taking into account the nature of the processing.</li>
        <li>Forwarding any data-subject request received directly by AYK to the Controller without responding to the data subject, unless authorised to do so.</li>
      </ul>

      <h2 id="subprocessors">5. Sub-Processors</h2>
      <p>
        The Controller grants AYK general authorisation to engage sub-processors, provided that AYK:
      </p>
      <ul>
        <li>Maintains a current list of sub-processors, available to the Controller on request.</li>
        <li>Notifies the Controller of intended changes to that list at least 30 days in advance, giving the Controller the right to object on reasonable data-protection grounds.</li>
        <li>Imposes data-protection terms on each sub-processor that are no less protective than those in this DPA.</li>
        <li>Remains liable to the Controller for the performance of each sub-processor&apos;s obligations.</li>
      </ul>
      <p>
        Categories of sub-processors currently used include: cloud hosting providers, transactional email delivery, error
        monitoring, and (where applicable) payment processing. A current list is available on request from
        <a href="mailto:privacy@ayk.com.sg">privacy@ayk.com.sg</a>.
      </p>

      <h2 id="breach">6. Personal Data Breach Notification</h2>
      <p>
        AYK will notify the Controller without undue delay, and in any case within 72 hours of becoming aware of a
        Personal Data breach affecting the Controller&apos;s Tenant Data. The notification will:
      </p>
      <ul>
        <li>Describe the nature of the breach, including (where possible) the categories and approximate number of data subjects and records concerned.</li>
        <li>Provide the contact details of AYK&apos;s Data Protection Officer or designated contact.</li>
        <li>Describe the likely consequences of the breach.</li>
        <li>Describe the measures taken or proposed to address the breach and mitigate its possible adverse effects.</li>
      </ul>
      <p>
        AYK will cooperate with the Controller in handling the breach, including providing further information as it
        becomes available and assisting the Controller in notifying the relevant supervisory authority and affected data
        subjects where required.
      </p>

      <h2 id="transfers">7. International Data Transfers</h2>
      <p>
        To the extent AYK transfers Personal Data outside the European Economic Area, the UK, or Singapore (as
        applicable), it will ensure that such transfer is carried out under one of the following safeguards:
      </p>
      <ul>
        <li>Standard Contractual Clauses approved by the European Commission.</li>
        <li>The UK International Data Transfer Agreement or UK Addendum to the EU SCCs.</li>
        <li>Other transfer mechanisms recognised by the relevant supervisory authority or the Singapore PDPC.</li>
      </ul>
      <p>
        AYK will provide the Controller with a copy of the relevant transfer mechanism on request, subject to
        confidentiality obligations.
      </p>

      <h2 id="security">8. Security Measures</h2>
      <p>
        AYK implements and maintains appropriate technical and organisational measures designed to protect Personal Data
        against unauthorised access, loss, destruction, alteration, or disclosure. These measures include:
      </p>
      <ul>
        <li>Encryption of Personal Data in transit (TLS) and at rest (database-level encryption).</li>
        <li>One-way salted password hashing (bcrypt or stronger).</li>
        <li>Signed, HttpOnly, Secure session cookies.</li>
        <li>Tenant-level logical data isolation enforced at the application and database layers.</li>
        <li>Role-based access control within each Tenant.</li>
        <li>Least-privilege access for AYK engineering staff, with break-glass procedures and audit logging.</li>
        <li>Regular security reviews and dependency vulnerability scanning.</li>
        <li>Encrypted, access-controlled backups with periodic restore testing.</li>
      </ul>

      <h2 id="deletion">9. Deletion &amp; Return of Data</h2>
      <p>
        Upon termination of the Controller&apos;s Tenant, AYK will:
      </p>
      <ul>
        <li>Provide a 90-day window during which the Controller may export all Tenant Data in a structured, machine-readable format.</li>
        <li>Delete all Tenant Data from production systems at the end of the export window.</li>
        <li>Delete or anonymise Tenant Data from backups within 30 days following the deletion from production, except where retention is required by law.</li>
      </ul>

      <h2 id="audit">10. Audit Rights</h2>
      <p>
        The Controller may, at its own cost and no more than once per calendar year, request an audit of AYK&apos;s
        compliance with this DPA. AYK will cooperate with such audits by:
      </p>
      <ul>
        <li>Providing reasonable access to relevant documentation and personnel.</li>
        <li>Accepting third-party audit reports (e.g. SOC 2 Type II, ISO 27001) in lieu of an on-site audit where they adequately address the matters in question.</li>
      </ul>
      <p>
        Where an audit reveals a material non-compliance attributable to AYK, AYK will bear the reasonable cost of the
        audit. Otherwise, the Controller bears the cost.
      </p>

      <h2 id="dpa-terms">11. DPA Terms for Enterprise Customers</h2>
      <p>
        Enterprise customers may sign an order form, statement of work, or DPA addendum that supplements this DPA with
        additional terms, including:
      </p>
      <ul>
        <li>Specific uptime and support service levels.</li>
        <li>Designated data residency (e.g. Singapore-only or EU-only storage).</li>
        <li>Custom data-retention schedules.</li>
        <li>Custom sub-processor restrictions.</li>
        <li>Specific breach-notification timelines.</li>
        <li>Insurance coverage amounts and indemnities.</li>
      </ul>
      <p>
        Where there is any conflict between this DPA and a signed Enterprise order form, the signed Enterprise order form
        prevails. To request an Enterprise DPA, contact <a href="mailto:legal@ayk.com.sg">legal@ayk.com.sg</a>.
      </p>

      <h2 id="contact">12. Contact</h2>
      <p>
        AYK&apos;s Data Protection Officer can be reached at:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:privacy@ayk.com.sg">privacy@ayk.com.sg</a></li>
        <li><strong>Legal:</strong> <a href="mailto:legal@ayk.com.sg">legal@ayk.com.sg</a></li>
        <li><strong>Entity:</strong> AYK PTE. LTD., Singapore</li>
      </ul>
    </LegalShell>
  )
}
