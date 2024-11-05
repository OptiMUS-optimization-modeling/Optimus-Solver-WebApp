import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl w-3/4">
        <h1 className="text-2xl font-bold mb-4 text-center">Privacy Policy</h1>
        <p className="text-gray-700 font-bold leading-relaxed mb-4 text-center">
          Last Updated: Nov 5, 2024
        </p>

        <p className="text-gray-700 leading-relaxed mb-4">
          Optimus Solver WebApp ("Optimus," "the App," "we," "our," or "us")
          values your privacy and is committed to protecting your personal data.
          This Privacy Policy explains how we collect, use, and handle your data
          when you use Optimus. By using the App, you agree to the collection
          and use of information in accordance with this policy.
        </p>

        <h2 className="font-bold mb-2">1. Information We Collect</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          When you use Optimus, we may collect the following types of
          information:
        </p>
        <ul className="list-disc list-inside mb-4 text-gray-700 leading-relaxed">
          <li>
            <strong>Usage Data</strong>: Information about your interactions
            with the App, including input data, problem models, interactions
            with various features, and error logs.
          </li>
          <li>
            <strong>Technical Data</strong>: Data related to the device,
            operating system, and browser type you use, as well as IP address
            (anonymized where possible).
          </li>
        </ul>

        <h2 className="font-bold mb-2">2. How We Use Your Data</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          We use your data for the following purposes:
        </p>
        <ul className="list-disc list-inside mb-4 text-gray-700 leading-relaxed">
          <li>
            <strong>Debugging</strong>: To identify, investigate, and resolve
            any issues, errors, or bugs in the App.
          </li>
          <li>
            <strong>Software Improvements</strong>: To analyze patterns of use
            and improve the App’s performance, features, and usability.
          </li>
          <li>
            <strong>Research and User Studies</strong>: As this App is part of a
            research initiative, we use aggregated and anonymized data to
            conduct studies on user interaction, optimization techniques, and
            model efficacy.
          </li>
          <li>
            <strong>Publications</strong>: We may publish findings based on
            anonymized, aggregated statistics from user data for academic or
            research purposes. No personally identifiable information will be
            shared in any publications.
          </li>
        </ul>

        <h2 className="font-bold mb-2">3. Data Sharing and Disclosure</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          We do not sell, lease, or otherwise share your personal data with
          third parties, except in the following situations:
        </p>
        <ul className="list-disc list-inside mb-4 text-gray-700 leading-relaxed">
          <li>
            <strong>Academic and Research Collaborations</strong>: We may share
            anonymized, aggregated data with research collaborators to further
            research objectives. Any shared data will not include personally
            identifiable information.
          </li>
          <li>
            <strong>Legal Requirements</strong>: We may disclose your data if
            required to do so by law or in response to valid requests by public
            authorities (e.g., a court or government agency).
          </li>
        </ul>

        <h2 className="font-bold mb-2">4. Data Retention</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          We retain usage data for as long as necessary to fulfill the purposes
          outlined in this policy, such as debugging, improvements, and research
          analysis. Aggregated and anonymized data used for research purposes
          may be retained indefinitely. If you wish for your data to be deleted
          sooner, please reach out to us with a formal request (see Contact Us
          below).
        </p>

        <h2 className="font-bold mb-2">5. Data Security</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          We take data security seriously and employ reasonable measures to
          protect your information from unauthorized access, disclosure,
          alteration, or destruction. However, no method of data transmission or
          storage is completely secure. While we strive to use commercially
          acceptable means to protect your data, we cannot guarantee its
          absolute security.
        </p>

        <h2 className="font-bold mb-2">6. Your Data Rights</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Depending on your location, you may have certain rights regarding your
          personal data, including:
        </p>
        <ul className="list-disc list-inside mb-4 text-gray-700 leading-relaxed">
          <li>The right to access, correct, or delete your data.</li>
          <li>
            The right to restrict or object to certain types of data processing.
          </li>
          <li>
            The right to withdraw consent where data processing is based on
            consent (this will not affect the lawfulness of any processing
            conducted prior to withdrawal).
          </li>
        </ul>
        <p className="text-gray-700 leading-relaxed mb-4">
          To exercise any of these rights, please contact us (see Contact Us
          below).
        </p>

        <h2 className="font-bold mb-2">7. Children’s Privacy</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Optimus is intended for use by individuals aged 18 and over. We do not
          knowingly collect personal data from children under 18. If you are a
          parent or guardian and believe your child has provided us with
          personal data, please contact us to have the data removed.
        </p>

        <h2 className="font-bold mb-2">8. Changes to This Privacy Policy</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or for other operational, legal, or regulatory
          reasons. The updated policy will be posted on this page with a new
          "Last Updated" date. Continued use of the App following the posting of
          changes constitutes your acceptance of the revised policy.
        </p>

        <h2 className="font-bold mb-2">9. Contact Us</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          If you have any questions about this Privacy Policy, your rights, or
          how we handle your data, please contact us at{" "}
          <a href="https://web.stanford.edu/~udell/" className="link">
            https://web.stanford.edu/~udell/
          </a>
        </p>

        <p className="text-gray-700 leading-relaxed mb-4 font-bold">
          By using the Optimus Solver WebApp, you acknowledge that you have
          read, understood, and agree to this Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
