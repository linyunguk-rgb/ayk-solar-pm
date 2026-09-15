import type { Metadata } from 'next'
import { LegalShell, type TocItem } from '@/components/legal/legal-shell'

export const metadata: Metadata = {
  title: 'Cookie Policy — AYK PTE LTD',
  description:
    'Cookie Policy for the AYK Solar Project Management System: essential, analytics, and preference cookies; local storage; managing and disabling cookies; third-party services.',
}

const LAST_UPDATED = '15 September 2025'

const toc: TocItem[] = [
  { id: 'what-are', label: '1. What Cookies Are' },
  { id: 'essential', label: '2. Essential Cookies' },
  { id: 'analytics', label: '3. Analytics Cookies' },
  { id: 'local-storage', label: '4. Local Storage' },
  { id: 'manage', label: '5. Managing & Disabling Cookies' },
  { id: 'third-party', label: '6. Third-Party Services' },
  { id: 'changes', label: '7. Changes' },
  { id: 'contact', label: '8. Contact' },
]

export default function CookiesPage() {
  return (
    <LegalShell
      title="Cookie Policy"
      lastUpdated={LAST_UPDATED}
      description="How the AYK Solar Project Management System uses cookies, local storage, and similar technologies."
      toc={toc}
    >
      <p>
        This Cookie Policy explains how AYK PTE. LTD. (&quot;<strong>AYK</strong>&quot;) uses cookies, local storage, and
        similar browser technologies (&quot;<strong>cookies</strong>&quot;) on the AYK Solar Project Management System
        (the &quot;<strong>Platform</strong>&quot;). It supplements our <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <h2 id="what-are">1. What Cookies Are</h2>
      <p>
        A cookie is a small text file that a website stores in your browser. Cookies allow a site to remember your
        actions and preferences over time, so you don&apos;t have to re-enter them on every visit. Cookies are widely
        used across the web to make sites work efficiently and to provide reporting information.
      </p>
      <p>
        Cookies do <strong>not</strong> contain malware and do not give AYK access to your device or any data outside the
        Platform. They are bound to a single origin (e.g. your AYK deployment domain).
      </p>

      <h2 id="essential">2. Essential Cookies</h2>
      <p>
        These cookies are required for the Platform to function. Without them, you would not be able to sign in, maintain
        a session, or access protected pages. Essential cookies are set automatically and cannot be disabled in our
        system.
      </p>
      <ul>
        <li><strong>ayk_session</strong> — a signed, HttpOnly, Secure cookie that identifies your authenticated session. It is set when you log in and cleared when you log out or the session expires.</li>
        <li><strong>csrf_token</strong> — used to prevent cross-site request forgery on state-changing requests (where applicable).</li>
      </ul>
      <p>
        Session cookies have a limited lifetime (typically 7 days of inactivity or 30 days absolute, whichever is
        shorter). They never contain your password.
      </p>

      <h2 id="analytics">3. Analytics Cookies</h2>
      <p>
        We use first-party, privacy-preserving analytics to understand aggregate usage patterns (e.g. which features are
        most used). These analytics are anonymised before storage and do <strong>not</strong> use third-party advertising
        networks.
      </p>
      <p>
        If we ever introduce opt-in analytics cookies that track individuals across sessions, we will prompt you for
        consent before setting them, in line with GDPR and PDPA requirements.
      </p>

      <h2 id="local-storage">4. Local Storage</h2>
      <p>
        In addition to cookies, the Platform uses the browser&apos;s <strong>localStorage</strong> API to store
        non-sensitive UI preferences on your device. These include:
      </p>
      <ul>
        <li>Theme preference (light / dark)</li>
        <li>Sidebar collapsed/expanded state</li>
        <li>Recently selected project (for convenience)</li>
        <li>Service-worker registration flag (for PWA offline support)</li>
      </ul>
      <p>
        Local storage entries are not sent to the server on every request (unlike cookies). They persist until you clear
        them or sign out of the Platform (some are cleared on logout). They do not contain authentication secrets.
      </p>

      <h2 id="manage">5. Managing &amp; Disabling Cookies</h2>
      <p>
        You have full control over cookies. You can:
      </p>
      <ul>
        <li>Configure your browser to <strong>block all cookies</strong> or only third-party cookies.</li>
        <li>Set your browser to <strong>clear cookies on exit</strong>.</li>
        <li>Use your browser&apos;s <strong>private / incognito</strong> mode, which discards cookies when you close the window.</li>
        <li>Manually <strong>delete cookies</strong> via your browser&apos;s site-data settings.</li>
      </ul>
      <p>
        Note: blocking the <code>ayk_session</code> cookie will prevent you from signing in. Other cookies and local
        storage entries can be blocked safely; the Platform will simply fall back to default preferences.
      </p>
      <p>
        Browser-specific instructions:
      </p>
      <ul>
        <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data.</li>
        <li><strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data.</li>
        <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data.</li>
        <li><strong>Edge:</strong> Settings → Cookies and site permissions.</li>
      </ul>

      <h2 id="third-party">6. Third-Party Services</h2>
      <p>
        The Platform does not embed third-party advertising or tracking pixels. We use a small number of carefully
        vetted sub-processors for hosting, transactional email, and error monitoring. Where these services set their own
        cookies, they are limited to first-party scoped identifiers used solely to deliver the service to us.
      </p>
      <p>
        A current list of sub-processors is available on request and in our <a href="/legal/gdpr">GDPR / Data Processing
        Addendum</a>.
      </p>

      <h2 id="changes">7. Changes to this Policy</h2>
      <p>
        If we introduce new cookies or change how we use them, we will update this policy and notify active Users by
        email or in-app notice where required by law. The &quot;Last updated&quot; date at the top reflects the latest
        revision.
      </p>

      <h2 id="contact">8. Contact</h2>
      <p>
        Questions about cookies can be sent to <a href="mailto:privacy@ayk.com.sg">privacy@ayk.com.sg</a> or
        <a href="mailto:legal@ayk.com.sg">legal@ayk.com.sg</a>.
      </p>
    </LegalShell>
  )
}
