import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TFDSpeedrun",
  description: "Privacy Policy for TFDSpeedrun.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <article className="mx-auto max-w-4xl">
        <header className="mb-10 border-b border-zinc-800 pb-8">
          <Link
            href="/login"
            className="text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            ← Back to TFDSpeedrun
          </Link>

          <h1 className="mt-6 text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Version 1.0 · Last updated: September 2026
          </p>
        </header>

        <div className="space-y-10 text-sm leading-7 text-zinc-300">
          <section>
            <p>
              This Privacy Policy explains how personal data is processed when
              you use TFDSpeedrun.
            </p>
            <p className="mt-4">
              TFDSpeedrun is a free, independently developed speedrunning tool
              created and maintained by Martin Knol in the Netherlands.
            </p>
            <p className="mt-4">
              For privacy-related questions or requests, contact{" "}
              <a
                href="mailto:asthrun1893@gmail.com"
                className="text-zinc-100 underline underline-offset-4 hover:text-white"
              >
                asthrun1893@gmail.com
              </a>
              .
            </p>
          </section>

          <Section title="1. Who is responsible for your data?">
            <p>
              Martin Knol is the controller responsible for the processing of
              personal data through TFDSpeedrun.
            </p>
            <p>
              TFDSpeedrun is currently operated as a personal, non-commercial
              project and is not a registered company.
            </p>
          </Section>

          <Section title="2. Who can use TFDSpeedrun?">
            <p>
              TFDSpeedrun is intended for users who are at least 16 years old.
              You must be at least 16 years old to create an account.
            </p>
            <p>
              TFDSpeedrun does not intentionally seek to collect personal data
              from people under the age of 16. If you believe TFDSpeedrun is
              processing personal data belonging to someone under 16, please
              contact us.
            </p>
          </Section>

          <Section title="3. What data does TFDSpeedrun process?">
            <p>TFDSpeedrun may process:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Your email address and TFDSpeedrun user ID.</li>
              <li>Your chosen username or display name.</li>
              <li>Your account and application settings.</li>
              <li>Game profiles, categories and sections you create.</li>
              <li>Custom target splits.</li>
              <li>Recorded runs and splits.</li>
              <li>Information necessary to maintain your authenticated session.</li>
              <li>
                Technical information processed for hosting, security and
                operation of the service.
              </li>
            </ul>
            <p>
              TFDSpeedrun does not require your home address, telephone number,
              date of birth or payment information to create an account.
            </p>
            <p>
              Passwords are handled through the authentication service provided
              by Supabase. TFDSpeedrun does not include your password in the
              TFDSpeedrun application database or account-data export.
            </p>
          </Section>

          <Section title="4. Why is your data processed?">
            <p>
              TFDSpeedrun processes account and application data where
              necessary to provide the service you request. This includes
              account authentication, session management, storing settings and
              speedrun data, calculating comparisons, providing exports and
              account management, and maintaining the security and technical
              integrity of the service.
            </p>
            <p>
              For processing objectively necessary to provide TFDSpeedrun, the
              primary legal basis is Article 6(1)(b) GDPR: processing necessary
              for the performance of an agreement with you.
            </p>
            <p>
              Where processing is necessary to comply with a legal obligation,
              Article 6(1)(c) GDPR may apply. Where necessary to protect
              TFDSpeedrun, its infrastructure or its users against abuse or
              security threats, Article 6(1)(f) GDPR may apply where the
              requirements for legitimate interests are satisfied.
            </p>
            <p>
              TFDSpeedrun does not currently process personal data for
              behavioural advertising, marketing profiling or cross-site
              tracking.
            </p>
          </Section>

          <Section title="5. Where is your data stored and processed?">
            <h3 className="font-semibold text-zinc-100">Supabase</h3>
            <p>
              TFDSpeedrun uses Supabase for its application database and
              authentication services. The primary TFDSpeedrun Supabase project
              is configured in Central EU (Frankfurt), Germany.
            </p>
            <p>
              Supabase may use subprocessors and processing may involve other
              locations where necessary to provide its services or meet legal
              requirements.
            </p>

            <h3 className="pt-2 font-semibold text-zinc-100">Vercel</h3>
            <p>
              TFDSpeedrun uses Vercel to host and operate the web application.
              As part of providing the hosting service, Vercel may process
              technical and request-related information.
            </p>
            <p>
              Processing may take place outside the European Economic Area,
              including in the United States. TFDSpeedrun therefore does not
              claim that all technical processing takes place exclusively
              within Germany or the European Economic Area.
            </p>
          </Section>

          <Section title="6. How long is your data kept?">
            <p>
              Your TFDSpeedrun account information, settings and speedrun data
              are generally retained for as long as your account exists and the
              information is needed to provide the service.
            </p>
            <p>
              When you delete your account, the account and associated
              TFDSpeedrun application data are deleted.
            </p>
            <p>
              Some information may temporarily remain in infrastructure
              backups, security records or technical logs according to the
              applicable retention practices of infrastructure providers, or
              where retention is required by law.
            </p>
            <p>
              TFDSpeedrun does not apply a general seven-year retention period
              to user account and speedrun data.
            </p>
          </Section>

          <Section title="7. Cookies and local browser storage">
            <p>
              TFDSpeedrun uses limited browser storage necessary for the
              operation of the service.
            </p>
            <p>
              A Supabase authentication/session cookie is used to maintain your
              authenticated session.
            </p>
            <p>
              TFDSpeedrun also uses browser localStorage to store active
              timer/run state so that an active run can be recovered when
              appropriate. These entries use keys beginning with{" "}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-200">
                tfd-live-run:
              </code>
              .
            </p>
            <p>
              TFDSpeedrun does not currently use advertising cookies, marketing
              cookies, advertising pixels, behavioural advertising, cross-site
              tracking or third-party marketing analytics.
            </p>
            <p>
              Because the current browser storage is used for functional
              purposes rather than advertising or marketing, TFDSpeedrun does
              not present an advertising-cookie consent banner. If optional
              technology requiring consent is introduced in the future, it will
              be assessed before deployment and will not be activated before
              consent where consent is legally required.
            </p>
          </Section>

          <Section title="8. Does TFDSpeedrun sell personal data?">
            <p>No.</p>
            <p>
              TFDSpeedrun does not sell your personal data. Your personal data
              is not used as payment for access to TFDSpeedrun.
            </p>
            <p>
              TFDSpeedrun currently has no advertising system and does not
              provide personal data to advertisers for targeted advertising.
            </p>
          </Section>

          <Section title="9. Service providers">
            <p>
              TFDSpeedrun relies primarily on Supabase for authentication and
              database infrastructure and Vercel for hosting and execution of
              the web application.
            </p>
            <p>
              These providers may use subprocessors in accordance with their
              applicable terms and data-processing arrangements.
            </p>
            <p>
              Personal data may also be disclosed where required by applicable
              law.
            </p>
          </Section>

          <Section title="10. Downloading your data">
            <p>
              From the Account page, you can download a machine-readable JSON
              export containing TFDSpeedrun account and application data
              associated with your account, including profile information,
              settings, game profiles, categories, sections, custom targets,
              runs and splits.
            </p>
            <p>
              Authentication secrets and passwords are not included in this
              export. Run information can additionally be exported in CSV
              format through Insights.
            </p>
          </Section>

          <Section title="11. Correcting your data">
            <p>
              TFDSpeedrun provides account-management functionality that allows
              you to change certain information yourself, including your
              username, email address and password.
            </p>
            <p>
              If you need assistance with personal data that cannot be
              corrected through the application, contact{" "}
              <a
                href="mailto:asthrun1893@gmail.com"
                className="text-zinc-100 underline underline-offset-4 hover:text-white"
              >
                asthrun1893@gmail.com
              </a>
              .
            </p>
          </Section>

          <Section title="12. Deleting your data and account">
            <p>
              You can delete your account from the Account page. Account
              deletion removes your TFDSpeedrun account and associated
              application data.
            </p>
            <p>
              For security, TFDSpeedrun may require you to reauthenticate before
              completing account deletion.
            </p>
            <p>
              If you cannot use the account-deletion functionality, you can
              submit a deletion request by email.
            </p>
          </Section>

          <Section title="13. Your GDPR rights">
            <p>
              Depending on the circumstances, the GDPR may give you rights
              concerning your personal data, including access, correction,
              deletion, restriction of processing, objection and data
              portability.
            </p>
            <p>
              For privacy requests, contact{" "}
              <a
                href="mailto:asthrun1893@gmail.com"
                className="text-zinc-100 underline underline-offset-4 hover:text-white"
              >
                asthrun1893@gmail.com
              </a>
              .
            </p>
            <p>
              If you are in the Netherlands, you can also lodge a complaint
              with the Autoriteit Persoonsgegevens.
            </p>
          </Section>

          <Section title="14. TFDSpeedrun Companion">
            <p>
              TFDSpeedrun may be used with the optional TFDSpeedrun Companion,
              a locally installed application that can provide configured
              global-hotkey input to the TFDSpeedrun web application.
            </p>
            <p>
              The Companion is designed to respond only to global hotkeys
              configured for TFDSpeedrun functionality. It is not designed to
              record arbitrary keyboard input, maintain a history of keystrokes
              or transmit general keyboard activity over the internet.
            </p>
            <p>
              Communication between the Companion and the TFDSpeedrun web
              application takes place through a local connection on your
              device. The Companion does not require your TFDSpeedrun password
              and does not independently authenticate to your Supabase account.
            </p>
          </Section>

          <Section title="15. Security">
            <p>
              TFDSpeedrun uses technical measures intended to protect accounts
              and application data against unauthorized access, modification
              and misuse. These include authenticated access, server-side
              authorization and database access controls.
            </p>
            <p>
              No online service or software system can guarantee absolute
              security. If a personal-data breach occurs, TFDSpeedrun will
              assess the incident and take any notification or other action
              required under applicable data-protection law.
            </p>
          </Section>

          <Section title="16. Children">
            <p>
              TFDSpeedrun is not intended for people under 16 years of age.
              TFDSpeedrun does not require users to provide their date of birth.
              Users are instead required to confirm during registration that
              they are at least 16 years old.
            </p>
            <p>
              If TFDSpeedrun becomes aware that an account belongs to a person
              under 16, the account may be removed.
            </p>
          </Section>

          <Section title="17. Changes to this Privacy Policy">
            <p>
              TFDSpeedrun may update this Privacy Policy when the service or its
              data-processing practices change.
            </p>
            <p>
              The current version and last-updated date will be made available
              through TFDSpeedrun. Material changes to the way personal data is
              processed will be communicated where appropriate, and consent
              will be requested where applicable law requires consent for the
              new processing.
            </p>
          </Section>

          <Section title="18. Contact">
            <p>
              For questions about this Privacy Policy or the processing of your
              personal data:
            </p>
            <p>
              <strong className="text-zinc-100">Martin Knol</strong>
              <br />
              Netherlands
              <br />
              <a
                href="mailto:asthrun1893@gmail.com"
                className="text-zinc-100 underline underline-offset-4 hover:text-white"
              >
                asthrun1893@gmail.com
              </a>
            </p>
          </Section>
        </div>

        <footer className="mt-12 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
          <Link href="/terms" className="hover:text-zinc-300">
            Terms of Service
          </Link>
        </footer>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}