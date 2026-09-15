import type { Metadata } from 'next'
import { LegalShell, type TocItem } from '@/components/legal/legal-shell'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: `Terms of Service — ${APP_NAME}`,
  description: `Terms of Service governing use of the ${APP_NAME} Solar Project Management System.`,
  robots: { index: true, follow: true },
}

const LAST_UPDATED = '15 September 2025'

const toc: TocItem[] = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'description', label: '2. Description of Service' },
  { id: 'accounts', label: '3. User Accounts' },
  { id: 'use', label: '4. Acceptable Use' },
  { id: 'data', label: '5. Data and Content' },
  { id: 'ip', label: '6. Intellectual Property' },
  { id: 'availability', label: '7. Service Availability' },
  { id: 'liability', label: '8. Limitation of Liability' },
  { id: 'changes', label: '9. Changes to These Terms' },
  { id: 'law', label: '10. Governing Law' },
  { id: 'contact', label: '11. Contact' },
]

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      description={`The terms and conditions that govern your use of the ${APP_NAME} Solar Project Management System.`}
      lastUpdated={LAST_UPDATED}
      toc={toc}
    >
      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <p>
        By accessing or using the {APP_NAME} Solar Project Management System
        (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of
        Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms,
        please do not access or use the Service.
      </p>

      <h2 id="description">2. Description of Service</h2>
      <p>
        The Service is an internal project management platform operated by{' '}
        {APP_NAME} for tracking solar construction projects, manpower,
        materials, safety, expenses, and related documentation. The Service is
        intended for use by authorised employees, contractors, and partners of{' '}
        {APP_NAME}.
      </p>

      <h2 id="accounts">3. User Accounts</h2>
      <ul>
        <li>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activities that occur under your account.
        </li>
        <li>
          You must immediately notify {APP_NAME} of any unauthorised use of your
          account or any other security breach.
        </li>
        <li>
          Demo accounts provided for evaluation purposes must not be used to
          access or modify real project data.
        </li>
        <li>
          {APP_NAME} reserves the right to suspend or terminate accounts that
          violate these Terms.
        </li>
      </ul>

      <h2 id="use">4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose;</li>
        <li>
          Attempt to gain unauthorised access to any part of the Service, other
          accounts, or computer systems or networks connected to the Service;
        </li>
        <li>Upload or transmit viruses, malware, or any other malicious code;</li>
        <li>
          Interfere with the proper functioning of the Service or place an
          unreasonable load on its infrastructure;
        </li>
        <li>
          Use the Service to store or transmit confidential information
          belonging to third parties without authorisation;
        </li>
        <li>
          Reverse engineer, decompile, or disassemble any portion of the
          Service.
        </li>
      </ul>

      <h2 id="data">5. Data and Content</h2>
      <p>
        You retain ownership of all project data, documents, and information you
        submit to the Service (&ldquo;User Content&rdquo;). {APP_NAME} processes
        such User Content on your behalf solely to provide and operate the
        Service. Refer to our{' '}
        <a href="/legal/privacy">Privacy Policy</a> for details on how we handle
        your information.
      </p>
      <p>
        You warrant that you have all necessary rights to submit User Content to
        the Service and that such User Content does not violate the rights of
        any third party.
      </p>

      <h2 id="ip">6. Intellectual Property</h2>
      <p>
        The Service, including its design, software, documentation, branding,
        and visual interface, is the intellectual property of {APP_NAME} and is
        protected by applicable copyright, trademark, and other laws. You may
        not copy, modify, distribute, or create derivative works from the
        Service without prior written consent.
      </p>
      <p>
        &ldquo;AYK&rdquo;, the AYK logo, and the Solar Energy tagline are
        trademarks of {APP_NAME}. All other trademarks are the property of their
        respective owners.
      </p>

      <h2 id="availability">7. Service Availability</h2>
      <p>
        While {APP_NAME} strives to maintain high availability, the Service is
        provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
        We do not guarantee uninterrupted access and may modify, suspend, or
        discontinue the Service at any time without notice. Scheduled
        maintenance windows will be communicated in advance where possible.
      </p>

      <h2 id="liability">8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, {APP_NAME} shall not be liable
        for any indirect, incidental, special, consequential, or punitive
        damages, or any loss of data, profits, or business opportunities,
        arising out of or in connection with your use of the Service.
      </p>
      <p>
        The total aggregate liability of {APP_NAME} for any claim arising out
        of these Terms shall not exceed the amount paid by you to{' '}
        {APP_NAME} for the Service in the twelve (12) months preceding the
        claim.
      </p>

      <h2 id="changes">9. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be
        communicated to users through the Service or by email. Continued use of
        the Service after changes take effect constitutes acceptance of the
        revised Terms.
      </p>

      <h2 id="law">10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the Republic of Singapore. Any
        disputes arising out of or in connection with these Terms shall be
        resolved in the courts of Singapore, without regard to conflict of law
        provisions.
      </p>

      <h2 id="contact">11. Contact</h2>
      <p>
        For questions about these Terms, please contact {APP_NAME} at{' '}
        <a href="mailto:legal@ayk.com.sg">legal@ayk.com.sg</a>.
      </p>
    </LegalShell>
  )
}
