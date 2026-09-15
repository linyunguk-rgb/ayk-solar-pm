import type { Metadata } from 'next'
import { LegalShell, type TocItem } from '@/components/legal/legal-shell'

export const metadata: Metadata = {
  title: 'Disclaimer — AYK PTE LTD',
  description:
    'Disclaimer for the AYK Solar Project Management System: no warranty, accuracy of data, limitation of liability, third-party links, and professional advice disclaimer.',
}

const LAST_UPDATED = '15 September 2025'

const toc: TocItem[] = [
  { id: 'no-warranty', label: '1. No Warranty' },
  { id: 'accuracy', label: '2. Accuracy of Data' },
  { id: 'liability', label: '3. Limitation of Liability' },
  { id: 'third-party', label: '4. Third-Party Links' },
  { id: 'advice', label: '5. Professional Advice Disclaimer' },
  { id: 'availability', label: '6. Service Availability' },
  { id: 'contact', label: '7. Contact' },
]

export default function DisclaimerPage() {
  return (
    <LegalShell
      title="Disclaimer"
      lastUpdated={LAST_UPDATED}
      description="Important disclaimers about the AYK Solar Project Management System and the data it contains."
      toc={toc}
    >
      <p>
        The information and services provided by AYK PTE. LTD. (&quot;<strong>AYK</strong>&quot;) on the AYK Solar
        Project Management System (the &quot;<strong>Platform</strong>&quot;) are provided on an &quot;as is&quot; and
        &quot;as available&quot; basis. This Disclaimer supplements our <a href="/legal/terms">Terms of Service</a> and
        forms part of them.
      </p>

      <h2 id="no-warranty">1. No Warranty</h2>
      <p>
        To the maximum extent permitted by applicable law, AYK disclaims all warranties, express or implied, in relation
        to the Platform, including any implied warranties of merchantability, fitness for a particular purpose, title,
        and non-infringement. AYK does not warrant that:
      </p>
      <ul>
        <li>The Platform will be uninterrupted, error-free, or completely secure.</li>
        <li>Any defects or bugs will be corrected within a specific timeframe.</li>
        <li>The Platform will meet your specific business or regulatory requirements.</li>
        <li>Results obtained from using the Platform (including dashboards, charts, and reports) will be accurate or reliable in all circumstances.</li>
      </ul>
      <p>
        You use the Platform at your own risk. Any reliance on the Platform is strictly at your own discretion.
      </p>

      <h2 id="accuracy">2. Accuracy of Data</h2>
      <p>
        The Platform is a tool for capturing, organising, and reporting on data that you and your Users enter. AYK does
        not control, verify, or endorse the accuracy, completeness, or lawfulness of Tenant Data. Responsibility for the
        accuracy of Tenant Data rests entirely with the Tenant that created or uploaded it.
      </p>
      <p>
        In particular:
      </p>
      <ul>
        <li>Daily progress entries (panels installed, man-hours, workers on site) are reported by your Users and may contain errors or omissions.</li>
        <li>GPS coordinates captured by Users reflect the device location at the moment of capture and may be approximate.</li>
        <li>Photos uploaded by Users depict the site as captured by them; AYK does not verify the contents, timestamps, or authenticity of uploaded photos.</li>
        <li>Financial figures (budgets, actual costs, expenses) are entered by your Users; AYK is not a substitute for professional accounting.</li>
        <li>Compliance percentages (e.g. PPE compliance) are derived from checklists completed by your Users and reflect only what was recorded in the Platform.</li>
      </ul>
      <p>
        You should always validate critical figures against primary source records before relying on them for billing,
        regulatory reporting, or contractual decisions.
      </p>

      <h2 id="liability">3. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by applicable law, neither AYK nor its directors, officers, employees, or
        affiliates will be liable for any indirect, incidental, special, consequential, or punitive damages, or for any
        loss of profits, revenue, data, or business interruption, arising out of or in connection with your use of, or
        inability to use, the Platform — whether in contract, tort (including negligence), or any other theory of
        liability, even if AYK has been advised of the possibility of such damages.
      </p>
      <p>
        AYK&apos;s aggregate liability arising out of or relating to the Platform will not exceed the amount you paid to
        AYK in the 12 months preceding the event giving rise to the liability. This limitation does not apply to
        liability that cannot be excluded or limited under applicable law.
      </p>

      <h2 id="third-party">4. Third-Party Links &amp; Content</h2>
      <p>
        The Platform may contain links to third-party websites, services, or resources that are not owned or controlled
        by AYK. AYK has no control over and assumes no responsibility for the content, privacy policies, or practices of
        any third-party sites or services. You acknowledge and agree that AYK will not be liable for any damage or loss
        caused or alleged to be caused by or in connection with your use of any such third-party site or service.
      </p>
      <p>
        Where the Platform integrates with third-party tools (e.g. payment processors, email delivery), the terms of
        those third parties apply to your use of their services.
      </p>

      <h2 id="advice">5. Professional Advice Disclaimer</h2>
      <p>
        The Platform is a project management tool. Nothing on the Platform constitutes:
      </p>
      <ul>
        <li><strong>Engineering, electrical, or solar design advice.</strong> Solar installation design must be carried out by qualified and licensed engineers in compliance with local codes and standards.</li>
        <li><strong>Safety advice.</strong> PPE checklists and incident records captured in the Platform are administrative tools only and do not replace a competent person&apos;s safety assessment or your obligations under local workplace safety and health law.</li>
        <li><strong>Legal advice.</strong> These documents are not a substitute for independent legal advice from a qualified lawyer.</li>
        <li><strong>Financial, tax, or accounting advice.</strong> Financial reports generated by the Platform are for internal management purposes and may not conform to any specific accounting standard.</li>
      </ul>
      <p>
        You should consult appropriately qualified professionals before making decisions that depend on these matters.
      </p>

      <h2 id="availability">6. Service Availability</h2>
      <p>
        While AYK targets high availability, the Platform may be temporarily unavailable due to scheduled maintenance,
        software updates, infrastructure failures, or events outside AYK&apos;s reasonable control (including force
        majeure). AYK will use reasonable efforts to notify Enterprise customers of scheduled maintenance in advance.
        Specific uptime commitments, if any, are set out in your enterprise order form or service-level agreement.
      </p>

      <h2 id="contact">7. Contact</h2>
      <p>
        Questions about this Disclaimer can be sent to <a href="mailto:legal@ayk.com.sg">legal@ayk.com.sg</a>.
      </p>
    </LegalShell>
  )
}
