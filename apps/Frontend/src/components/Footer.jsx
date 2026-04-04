import React from 'react';
import './Footer.css';

const footerLinks = ['Games', 'About', 'Prizes', 'Features', 'Support'];

const Footer = () => {
  return (
    <footer className="landing-footer font-[Neue Montreal]">
      <div className="landing-footer__content">
        <section className="landing-footer__section">
          <h3 className="landing-footer__section-title">SURVIVE THE SEMESTER</h3>
          <div className="landing-footer__chips">
            {footerLinks.map((link) => (
              <a key={link} href="#" className="landing-footer__chip">
                {link}
              </a>
            ))}
          </div>
        </section>

        <section className="landing-footer__section landing-footer__section--address">
          <h3 className="landing-footer__section-title">US</h3>
          <div className="landing-footer__address">
            <p>Team-31</p>
            <p>PDP</p>
            <p>IIITDM Kurnool</p>
          </div>
        </section>
      </div>

      <div className="landing-footer__brand-row">
        <div className="landing-footer__brand">
          <img src="/assests/char2.png" alt="Survive The Semester" className="landing-footer__brand-logo" />
          <span className="landing-footer__brand-name">Survive The Semester</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
