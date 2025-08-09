import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-policy-page">
      <div className="privacy-policy-container">
        <div className="privacy-policy-header">
          <h1>Privacy Policy</h1>
          <Link to="/" className="back-to-app">← Back to Fashion Taster</Link>
        </div>
        
        <div className="privacy-policy-content">
          <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
          
          <h3>1. Information We Collect</h3>
          <p>Fashion Taster collects information you provide directly to us, including:</p>
          <ul>
            <li>Fashion preference data and style analysis results</li>
            <li>Images you upload for style analysis</li>
            <li>Usage data and app interactions</li>
          </ul>

          <h3>2. How We Use Your Information</h3>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide personalized fashion recommendations</li>
            <li>Analyze your style preferences using AI</li>
            <li>Improve our services and user experience</li>
            <li>Generate fashion insights and style reports</li>
          </ul>

          <h3>3. Information Sharing</h3>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except:</p>
          <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
          </ul>

          <h3>4. Data Security</h3>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

          <h3>5. Third-Party Services</h3>
          <p>Our app may integrate with third-party services (such as Pinterest) to enhance functionality. These services have their own privacy policies.</p>

          <h3>6. Your Rights</h3>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of certain data collection</li>
          </ul>

          <h3>7. Data Retention</h3>
          <p>We retain your information for as long as necessary to provide our services and comply with legal obligations.</p>

          <h3>8. Children's Privacy</h3>
          <p>Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>

          <h3>9. Changes to This Policy</h3>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

          <h3>10. Contact Us</h3>
          <p>If you have questions about this privacy policy, please contact us at:</p>
          <p>Email: privacy@knowyourtaste.online</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
