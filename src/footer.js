export function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'custom-footer';
    footer.innerHTML = `
        <div class="social-icons-container">
            <a href="https://www.tiktok.com/@nalancreations?_t=8r3okcluwcL&_r=1" target="_blank" class="tiktok-link">
                <img src="/images/tiktok-logo.png" alt="TikTok Logo" class="social-icon tiktok-icon">
            </a>
            <a href="https://www.instagram.com/nalancreations" target="_blank">
                <img src="/images/insta-logo.png" alt="Instagram Logo" class="social-icon">
            </a>
        </div>
        <div class="footer-branding">&copy; 2024 NALANCREATIONS. ALL RIGHTS RESERVED.</div>
        <div class="legal-links">
            <a href="/imprint">Imprint</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms & Conditions</a>
            <a href="/cancellation">Right of Withdrawal</a>
        </div>
    `;
    document.body.appendChild(footer);
}
