import React from 'react';

export interface PolicySection {
  id: 'privasi' | 'refund' | 'terma';
  number: number;
  title: string;
  subtitle: string;
  url: string;
  content: React.ReactNode;
}

export const LEGAL_POLICIES: Record<'privasi' | 'refund' | 'terma', PolicySection> = {
  privasi: {
    id: 'privasi',
    number: 1,
    title: 'Privacy Policy',
    subtitle: 'Perlindungan privasi dan pengurusan data peribadi pengguna bicarakrypto.com',
    url: '/polisi-privasi',
    content: (
      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Your Privacy</h4>
          <p>
            We respect and prioritize your privacy. The personal information you provide is collected solely to deliver services, improve our offerings, and enhance your experience. Only authorized personnel can access this data, and we ensure its confidentiality. We will not share your information with third parties unless required for providing services (e.g., delivering newsletters, performing security checks, or conducting research) or with your explicit consent. In certain cases, disclosure may be required to comply with legal obligations or safeguard our rights and your security.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Your Consent</h4>
          <p>
            We do not sell your personal information, including your name, email, or other sensitive details, to third parties. Any data sharing with partners (e.g., analytics or hosting providers) is strictly for service delivery and is governed by strict confidentiality agreements.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Communication and Updates</h4>
          <p>
            If you subscribe to our services, you may receive updates on crypto news, market insights, and exclusive offers via email. You can opt out of such communications anytime by clicking the &ldquo;unsubscribe&rdquo; link in our emails or managing your preferences in your account settings.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Cookies and Tracking Technologies</h4>
          <p>
            We use cookies and similar technologies to enhance your experience, analyze website traffic, and improve our services. These cookies may store preferences, authentication data, or tracking metrics. You can adjust your browser settings to manage or disable cookies, but this may limit certain functionalities of our site.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Site Analytics</h4>
          <p>
            We collect aggregated and anonymized data about website visits to understand user behavior, improve our services, and deliver relevant content. This data may include metrics such as page views, session duration, and geographic trends. No personally identifiable information is shared in this process.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Disclosures of Information</h4>
          <p>We may disclose your personal information:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-white/75">
            <li>To trusted third-party service providers supporting our operations (e.g., hosting, analytics, email delivery).</li>
            <li>If legally required or to protect our rights, comply with legal processes, or prevent fraud.</li>
            <li>In the event of a business transfer, such as a merger or acquisition, where user data is part of the transferred assets.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Data Security</h4>
          <p>
            We implement robust measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no online system can be entirely secure. We advise you to safeguard your login credentials and use strong, unique passwords.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Third-Party Links</h4>
          <p>
            Our portal may link to external sites. Please note that we are not responsible for the privacy practices of these third-party websites. We encourage you to review their privacy policies before submitting personal information.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Accessing and Managing Your Information</h4>
          <p>
            You can review, update, or delete your personal information by logging into your account or contacting our support team. For security reasons, we may require proof of identity before processing your request.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Contacting Us</h4>
          <p>
            We value your feedback and are committed to addressing any concerns you may have. For questions or support, please reach out to us via{' '}
            <a href="mailto:info@bicarakrypto.com" className="text-[#5CF2C0] underline hover:opacity-90">
              info@bicarakrypto.com
            </a>.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Changes to This Policy</h4>
          <p>
            We may update this Privacy Policy from time to time. Changes will be reflected on this page, and we encourage you to review it periodically to stay informed.
          </p>
        </section>
      </div>
    ),
  },
  refund: {
    id: 'refund',
    number: 2,
    title: 'Refund Policy',
    subtitle: 'Dasar pembatalan dan syarat pemulangan bayaran perkhidmatan Bicara Krypto',
    url: '/polisi-refund',
    content: (
      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Cancellation Period</h4>
          <p>
            Customers may cancel their subscription or service booking within 24 hours of purchase without any penalty.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Cancellation Fees</h4>
          <p>
            If a cancellation request is made after 24 hours, a cancellation fee of 20% of the total subscription or service cost will apply.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Refund Eligibility</h4>
          <p>
            Refunds are only applicable for cancellations made within the allowable cancellation period (within 24 hours of purchase). Refunds will be processed within 5-7 business days and credited back to the original payment method.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Non-Refundable Services</h4>
          <p>
            Digital services, such as one-time research reports, premium analytics tools, or completed consultations, are non-refundable once accessed or delivered. Subscription fees for services already rendered during the billing period are also non-refundable.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Process for Cancellation</h4>
          <p>
            To cancel a service or subscription, customers must contact our support team via{' '}
            <a href="mailto:info@bicarakrypto.com" className="text-[#5CF2C0] underline hover:opacity-90">
              info@bicarakrypto.com
            </a>. Please include the order or subscription details for faster processing.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Changes to Subscriptions</h4>
          <p>
            Changes to subscription plans or service tiers can be requested at least 48 hours before the next billing cycle. Depending on the requested changes, additional charges or adjustments may apply.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Important Notes</h4>
          <ul className="list-disc pl-5 space-y-2 text-white/75">
            <li>
              <strong className="text-white">Trial Subscriptions:</strong> If a free trial is offered and not canceled before the trial ends, the first billing cycle will not be eligible for a refund.
            </li>
            <li>
              <strong className="text-white">Promotional Offers:</strong> Purchases made under special promotional rates are non-refundable.
            </li>
            <li>
              <strong className="text-white">Exceptional Circumstances:</strong> Refunds beyond the stated policy will only be considered under exceptional circumstances and are subject to approval.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Contact for Support</h4>
          <p>
            For cancellation, refund requests, or changes, please reach out to us at{' '}
            <a href="mailto:info@bicarakrypto.com" className="text-[#5CF2C0] underline hover:opacity-90">
              info@bicarakrypto.com
            </a>, and our team will assist you promptly.
          </p>
        </section>
      </div>
    ),
  },
  terma: {
    id: 'terma',
    number: 3,
    title: 'Terms & Condition',
    subtitle: 'Syarat dan terma penggunaan laman web www.bicarakrypto.com',
    url: '/terma-syarat',
    content: (
      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        <section className="space-y-2">
          <p className="text-white font-medium">
            Welcome to <span className="text-[#5CF2C0]">bicara krypto</span>, your trusted source for crypto news and market research. By accessing or using our website, you agree to be bound by the terms and conditions outlined below. These terms apply to all visitors and users of <span className="text-white/90">www.bicarakrypto.com</span>.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">General</h4>
          <p>
            We reserve the right to modify, update, or remove any part of these terms and conditions at any time without prior notice. Continued use of the website signifies your acceptance of the updated terms. Any violation of these terms may result in restricted access or legal action.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Site Content and Intellectual Property</h4>
          <p>
            All materials on this site, including articles, reports, logos, graphics, and other digital assets, are protected by copyright and other intellectual property laws. These materials are owned or licensed by bicara krypto and are intended solely for personal and non-commercial use. Reproduction, modification, or redistribution without permission is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Comments and Feedback</h4>
          <p>
            Users may submit comments, feedback, or suggestions regarding our content. By submitting, you agree that such contributions do not violate the rights of any third party (e.g., intellectual property or privacy). Submissions containing unlawful, abusive, or obscene material will not be tolerated, and the user will bear full responsibility for any violations.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Content Accuracy</h4>
          <p>
            While we strive to provide accurate and up-to-date information, bicara krypto does not guarantee the completeness or reliability of the content. Market data and analysis are subject to change, and users should exercise their own judgment before making decisions based on the information provided.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Subscriptions and Payments</h4>
          <ul className="list-disc pl-5 space-y-1.5 text-white/75">
            <li>Our portal offers paid subscriptions for premium features such as in-depth reports and exclusive analytics.</li>
            <li>Payments are processed through secure payment gateways and may include options such as Visa, MasterCard, or other online methods.</li>
            <li>Subscription fees are non-refundable once access to paid content has been provided.</li>
            <li>Payment cards are subject to validation and authorization. If authorization is declined, we are not responsible for delays or denial of service.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Newsletter and Communications</h4>
          <p>
            By signing up for our services, you agree to receive periodic newsletters and updates related to crypto news, insights, and promotions. You can unsubscribe at any time using the link provided in our emails.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Indemnification</h4>
          <p>
            You agree to indemnify and hold bicara krypto harmless from any claims, damages, or expenses arising from your use of our website, including but not limited to violations of these terms or misuse of the content provided.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Third-Party Links</h4>
          <p>
            Our site may contain links to third-party websites. We do not endorse or take responsibility for the content, services, or products on those sites. Access to third-party links is at your own risk.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Inaccuracies and Errors</h4>
          <p>
            Occasionally, there may be typographical errors or inaccuracies in our content. We reserve the right to correct any such errors without prior notice. If you notice any discrepancies, please contact us for resolution.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Termination</h4>
          <p>
            These terms remain effective until terminated by either party. You may discontinue using the website at any time. bicara krypto reserves the right to terminate access to any user who fails to comply with these terms without prior notice.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-base font-semibold text-white">Contact Us</h4>
          <p>
            For questions or concerns about these terms, please reach out to us at{' '}
            <a href="mailto:info@bicarakrypto.com" className="text-[#5CF2C0] underline hover:opacity-90">
              info@bicarakrypto.com
            </a>.
          </p>
        </section>
      </div>
    ),
  },
};
