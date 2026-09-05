import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | TFDSpeedrun",
  description: "Terms of Service for TFDSpeedrun.",
};

export default function TermsPage() {
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

          <h1 className="mt-6 text-3xl font-bold">Terms of Service</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Version 1.0 · Last updated: September 2026
          </p>
        </header>

        <div className="space-y-10 text-sm leading-7 text-zinc-300">
          <section className="space-y-4">
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your use of
              TFDSpeedrun. By creating an account or using TFDSpeedrun, you
              agree to these Terms.
            </p>
          </section>

          <Section title="1. About TFDSpeedrun">
            <p>
              TFDSpeedrun is a free, independently developed speedrunning tool
              that allows users to time, record, manage, compare and analyze
              speedruns.
            </p>
            <p>
              TFDSpeedrun is created and maintained by Martin Knol in the
              Netherlands.
            </p>
            <p>
              TFDSpeedrun is currently provided as a personal, non-commercial
              project. There are no subscriptions, purchases or paid features.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least 16 years old to create an account or use
              TFDSpeedrun.
            </p>
            <p>
              By creating an account, you confirm that you are at least 16
              years old and are permitted to agree to these Terms.
            </p>
            <p>
              TFDSpeedrun may remove an account if it becomes reasonably
              apparent that the account belongs to a person under the age of 16.
            </p>
          </Section>

          <Section title="3. Your Account">
            <p>
              You are responsible for maintaining the security of your
              TFDSpeedrun account and for activity performed through your
              account.
            </p>
            <p>
              You must provide a valid email address in order to create and
              maintain an account.
            </p>
            <p>
              You may not intentionally use TFDSpeedrun to impersonate another
              person, gain unauthorized access to another user&apos;s account,
              interfere with the service, or circumvent security measures.
            </p>
            <p>
              If you believe your account has been compromised, you should
              change your credentials and contact TFDSpeedrun where appropriate.
            </p>
          </Section>

          <Section title="4. Free Service">
            <p>TFDSpeedrun is currently provided free of charge.</p>
            <p>
              Your personal data is not used as payment for the service, and
              TFDSpeedrun does not currently monetize users through behavioural
              advertising, marketing profiles or the sale of personal data.
            </p>
            <p>
              The fact that TFDSpeedrun is currently free does not guarantee
              that every future feature or version will always be offered free
              of charge. If paid functionality is introduced in the future,
              applicable terms and information will be provided before a user
              enters into a paid transaction.
            </p>
          </Section>

          <Section title="5. Acceptable Use">
            <p>
              You may use TFDSpeedrun for its intended purposes, including
              timing, recording and analyzing speedruns.
            </p>

            <p>You must not use TFDSpeedrun to:</p>

            <ul className="list-disc space-y-1 pl-6">
              <li>
                intentionally interfere with or disrupt the service or its
                infrastructure;
              </li>
              <li>
                gain or attempt to gain unauthorized access to accounts,
                systems or data;
              </li>
              <li>
                distribute malware or use TFDSpeedrun in connection with
                malicious software;
              </li>
              <li>
                use automated methods in a manner that places an unreasonable
                burden on the service;
              </li>
              <li>
                circumvent security, authentication or access-control
                mechanisms;
              </li>
              <li>
                use TFDSpeedrun to violate applicable law or the rights of
                others;
              </li>
              <li>
                falsely represent another product, download, website or service
                as an official TFDSpeedrun product.
              </li>
            </ul>

            <p>
              Reasonable personal experimentation with your own speedrun data
              is not prohibited merely because it was not anticipated by the
              developer.
            </p>
          </Section>

          <Section title="6. Your Data">
            <p>
              You retain your rights in information and content that you enter
              into TFDSpeedrun.
            </p>
            <p>
              You grant TFDSpeedrun the limited permission necessary to store,
              process and display that information for the purpose of providing
              the service to you.
            </p>
            <p>
              TFDSpeedrun does not claim ownership of your speedrun records or
              other user-provided data.
            </p>
            <p>
              You can download a machine-readable copy of your TFDSpeedrun
              account data through the Account page. Run data can additionally
              be exported in CSV format through Insights.
            </p>
            <p>
              You can delete your account through the Account page. Account
              deletion removes the account and associated TFDSpeedrun
              application data, subject to any temporary retention that may
              exist in infrastructure backups, logs or where retention is
              legally required.
            </p>
            <p>
              Additional information about personal-data processing is provided
              in the{" "}
              <Link
                href="/privacy"
                className="text-zinc-100 underline underline-offset-4 hover:text-white"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <Section title="7. TFDSpeedrun Intellectual Property">
            <p>
              The original TFDSpeedrun software, source code, documentation,
              text, original design elements and other original material
              created for TFDSpeedrun are owned by Martin Knol, except where
              otherwise stated or where third-party rights apply.
            </p>
            <p>
              These materials may be protected by copyright and other
              applicable intellectual-property laws.
            </p>
            <p>
              Unless permission or an applicable third-party or open-source
              licence provides otherwise, you may not copy, reproduce, modify,
              redistribute, sublicense or incorporate protected TFDSpeedrun
              material into another product or service without permission.
            </p>
            <p>
              Nothing in these Terms prevents anyone from independently
              creating or distributing their own speedrunning tools, including
              tools relating to The First Descendant. TFDSpeedrun does not claim
              ownership of the general concept of a speedrun timer, speedrun
              analysis, or tools for The First Descendant.
            </p>
          </Section>

          <Section title="8. TFDSpeedrun Name and Identity">
            <p>
              TFDSpeedrun is currently the identity used for this project.
            </p>
            <p>
              You may not use the TFDSpeedrun name, branding or project
              identity in a manner that falsely suggests that another
              application, website, download, service or communication is an
              official TFDSpeedrun product or has been endorsed, approved or
              distributed by TFDSpeedrun.
            </p>
            <p>
              In particular, you may not use the TFDSpeedrun identity to
              distribute malicious software, conduct phishing, impersonate the
              project, or otherwise intentionally mislead users about the
              origin of software or communications.
            </p>
            <p>
              This provision does not prevent legitimate discussion, reviews,
              references to TFDSpeedrun, or independently developed competing
              tools that do not misrepresent themselves as TFDSpeedrun.
            </p>
          </Section>

          <Section title="9. The First Descendant and NEXON">
            <p>TFDSpeedrun is an independent community tool.</p>
            <p>
              TFDSpeedrun is not affiliated with, endorsed by, sponsored by, or
              otherwise associated with NEXON Korea Corp. or NEXON Games Co.,
              Ltd.
            </p>
            <p>
              The First Descendant and related names, trademarks, artwork, game
              content and other intellectual property belong to their
              respective owners.
            </p>
            <p>
              © NEXON Korea Corp. &amp; NEXON Games Co, LTD. All Rights
              Reserved.
            </p>
            <p>
              Nothing in these Terms grants TFDSpeedrun or its users ownership
              of NEXON&apos;s intellectual property.
            </p>
          </Section>

          <Section title="10. Third-Party Software and Services">
            <p>
              TFDSpeedrun relies on third-party software and infrastructure,
              including services used for hosting, authentication and database
              functionality.
            </p>
            <p>
              Third-party software may be subject to its own licences and
              terms. Nothing in these Terms overrides rights granted under an
              applicable open-source or third-party licence.
            </p>
            <p>
              TFDSpeedrun is not responsible for changes, interruptions or
              failures caused solely by third-party services outside
              TFDSpeedrun&apos;s reasonable control.
            </p>
          </Section>

          <Section title="11. Availability and Changes">
            <p>TFDSpeedrun is an actively developed project.</p>
            <p>
              Features may be added, modified or removed, and the service may
              occasionally be unavailable because of maintenance, technical
              problems, security incidents or circumstances outside reasonable
              control.
            </p>
            <p>
              TFDSpeedrun does not guarantee uninterrupted or error-free
              availability.
            </p>
            <p>
              Where reasonably possible, changes that materially affect users
              or their data will be communicated appropriately.
            </p>
          </Section>

          <Section title="12. Speedrun Results">
            <p>TFDSpeedrun is a timing and analysis tool.</p>
            <p>
              The service does not guarantee that recorded times, splits,
              comparisons, personal bests or other results will be accepted by
              any game community, leaderboard, competition, event or
              third-party verification service.
            </p>
            <p>
              Users remain responsible for complying with the rules of any
              leaderboard, competition or community to which they submit
              results.
            </p>
          </Section>

          <Section title="13. Suspension and Termination">
            <p>
              You may stop using TFDSpeedrun at any time and may delete your
              account using the functionality provided on the Account page.
            </p>
            <p>
              TFDSpeedrun may suspend or terminate access when reasonably
              necessary, including in cases of serious or repeated violations
              of these Terms, attempts to compromise the service, malicious
              activity or legal requirements.
            </p>
            <p>
              Where appropriate and reasonably possible, TFDSpeedrun will
              consider the circumstances before terminating an account.
            </p>
            <p>
              Termination does not give TFDSpeedrun ownership of user data.
            </p>
          </Section>

          <Section title="14. Disclaimer and Limitation of Liability">
            <p>
              TFDSpeedrun is provided as a free, independently developed tool.
            </p>
            <p>
              Reasonable efforts are made to keep the service functional and
              secure, but software can contain errors and services can
              experience interruptions or data loss. You should not rely on
              TFDSpeedrun as the sole copy of information that is critically
              important to you.
            </p>
            <p>
              To the extent permitted by applicable law, TFDSpeedrun and its
              developer are not liable for indirect or consequential loss
              resulting from use of, or inability to use, the service where
              such liability may lawfully be excluded or limited.
            </p>
            <p>
              Nothing in these Terms excludes or limits liability where doing
              so is prohibited by applicable law, nor do these Terms remove
              mandatory rights that users may have under applicable consumer or
              other law.
            </p>
          </Section>

          <Section title="15. Privacy">
            <p>
              The processing of personal data is described separately in the{" "}
              <Link
                href="/privacy"
                className="text-zinc-100 underline underline-offset-4 hover:text-white"
              >
                TFDSpeedrun Privacy Policy
              </Link>
              .
            </p>
            <p>
              The Privacy Policy explains what information is processed, why it
              is processed, which service providers are involved, browser
              storage, retention, account deletion and your privacy rights.
            </p>
            <p>
              Acceptance of these Terms should not be interpreted as consent to
              data processing where another legal basis applies under
              applicable data-protection law.
            </p>
          </Section>

          <Section title="16. Changes to These Terms">
            <p>
              These Terms may be updated as TFDSpeedrun develops. The current
              version and its last-updated date will be made available through
              TFDSpeedrun.
            </p>
            <p>
              Where a change materially affects existing users&apos; rights or
              obligations, TFDSpeedrun will provide appropriate notice and,
              where necessary, request acceptance of updated Terms.
            </p>
            <p>
              Continued use will not be treated as acceptance where applicable
              law requires an explicit agreement to the change.
            </p>
          </Section>

          <Section title="17. Governing Law">
            <p>
              These Terms are governed by the laws of the Netherlands, without
              depriving users of mandatory protections that may apply to them
              under applicable law.
            </p>
            <p>
              Nothing in these Terms restricts any mandatory rights regarding
              jurisdiction or dispute resolution that cannot lawfully be
              excluded by agreement.
            </p>
          </Section>

          <Section title="18. Contact">
            <p>
              Questions about these Terms or TFDSpeedrun can be sent to:
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
          <Link href="/privacy" className="hover:text-zinc-300">
            Privacy Policy
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