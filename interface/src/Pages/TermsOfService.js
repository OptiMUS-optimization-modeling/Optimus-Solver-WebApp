import React from "react";

const TermsOfService = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl w-3/4">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Terms of Service
        </h1>
        <p className="text-gray-700 font-bold leading-relaxed mb-4 text-center">
          Last Updated: Nov 5, 2024
        </p>
        <p className="text-gray-700 leading-relaxed mb-4">
          Welcome to the Optimus Solver WebApp ("Optimus," "the App," "we,"
          "our," or "us"), developed by PhD students at Stanford University as
          part of a research initiative. Optimus allows users to model and solve
          optimization problems using the power of Large Language Models (LLMs)
          and other advanced technologies. By accessing or using this App, you
          ("User" or "you") agree to the following Terms of Service. If you do
          not agree with these terms, please refrain from using Optimus.
        </p>

        <h2 className="font-bold mb-2">1. Acceptance of Terms</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          By accessing or using Optimus, you agree to be bound by these Terms of
          Service, including any updates we may make from time to time.
          Continued use of the App following any updates implies your acceptance
          of the revised Terms.
        </p>

        <h2 className="font-bold mb-2">2. License and Permitted Use</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Optimus is provided for educational and research purposes only. Users
          are granted a limited, non-exclusive, non-transferable, and revocable
          license to use the App solely for academic or personal research
          purposes. Commercial use of Optimus is strictly prohibited unless
          explicitly authorized by us.
        </p>

        <h2 className="font-bold mb-2">3. Data Privacy and Security</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Optimus processes your data to model and solve optimization problems.
          We do not store user data beyond the duration of each session, and we
          do not use or sell user data for any commercial purposes. However, as
          this App is still a research tool, we cannot guarantee complete data
          confidentiality. Please avoid uploading sensitive or personally
          identifiable information.
        </p>

        <h2 className="font-bold mb-2">4. User Responsibilities</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          As a User of Optimus, you agree to:
          <ul className="list-disc list-inside">
            <li>Use the App solely for lawful purposes.</li>
            <li>
              Ensure that any data you submit does not violate any applicable
              laws or third-party rights.
            </li>
            <li>
              Respect the intellectual property rights of Optimus, including not
              attempting to reverse-engineer, copy, or commercially exploit any
              aspect of the App.
            </li>
            <li>
              Avoid any activities that may harm or disrupt the App's
              functionality or its server infrastructure.
            </li>
          </ul>
        </p>

        <h2 className="font-bold mb-2">5. Limitations of Use</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Optimus is designed for educational and research purposes and may
          contain bugs, errors, or limitations in functionality. Users are
          advised not to rely solely on Optimus for critical or commercial
          optimization solutions.
        </p>

        <h2 className="font-bold mb-2">6. No Warranty</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Optimus is provided "as-is" without warranties of any kind. To the
          maximum extent permitted by applicable law, we disclaim all
          warranties, express or implied, including but not limited to, any
          implied warranties of merchantability, fitness for a particular
          purpose, and non-infringement.
        </p>

        <h2 className="font-bold mb-2">7. Limitation of Liability</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          To the fullest extent permitted by law, Optimus, its developers,
          contributors, and Stanford University shall not be liable for any
          indirect, incidental, special, consequential, or exemplary damages,
          including but not limited to, damages for loss of profits, data,
          goodwill, or other intangible losses, resulting from (a) your use or
          inability to use the App; (b) any unauthorized access to or alteration
          of your transmissions or data; or (c) any other matter relating to the
          App.
        </p>

        <h2 className="font-bold mb-2">8. Intellectual Property</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          All intellectual property rights in and to Optimus, including any
          underlying technology, content, and data, are owned by the developers,
          contributors, and affiliated institutions. These Terms do not grant
          you any rights to use the name "Optimus" or any logos, branding, or
          marks without prior written consent.
        </p>

        <h2 className="font-bold mb-2">9. Termination</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          We reserve the right to suspend or terminate your access to the App at
          any time, with or without notice, for any reason, including but not
          limited to a breach of these Terms.
        </p>

        <h2 className="font-bold mb-2">10. Indemnification</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          You agree to indemnify, defend, and hold harmless the developers,
          contributors, and affiliated institutions, including Stanford
          University, from and against any and all claims, liabilities, damages,
          losses, or expenses, including reasonable attorneys' fees, arising out
          of or in any way connected with your access to or use of the App or
          any breach by you of these Terms.
        </p>

        <h2 className="font-bold mb-2">11. Governing Law</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          These Terms of Service are governed by and construed in accordance
          with the laws of the State of California, United States, without
          regard to its conflict of law principles. Any disputes arising out of
          or related to these Terms or the use of Optimus shall be subject to
          the exclusive jurisdiction of the courts in Santa Clara County,
          California.
        </p>

        <h2 className="font-bold mb-2">12. Contact Us</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          For questions regarding these Terms of Service or Optimus, please
          contact us at{" "}
          <a href="https://web.stanford.edu/~udell/" className="link">
            https://web.stanford.edu/~udell/
          </a>
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
