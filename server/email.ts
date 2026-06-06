import nodemailer from 'nodemailer';
import { db } from './db.js';

// Setup optional SMTP transport from environment variables
const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER || '';
const smtpPassword = process.env.SMTP_PASSWORD || '';
const smtpSender = process.env.SMTP_SENDER || '"Astraveda Support" <support@astraveda.com>';

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPassword) {
  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword
      }
    });
    console.log(`[SMTP Mailer Engine] Live SMTP configured with host ${smtpHost}`);
  } catch (err) {
    console.error('[SMTP Mailer Engine] Failed to initialize transporter:', err);
  }
} else {
  console.log('[SMTP Mailer Engine] No SMTP credentials provided. Operating in Developer Sandbox simulation mode.');
}

// Brand CSS styling defaults
const emailStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
  
  body {
    background-color: #0c0a09;
    color: #e4e4e7;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    margin: 0;
    padding: 0;
  }
`;

export const EmailService = {
  /**
   * Dispatches a stylized HTML email to the specified user
   */
  async sendMail(to: string, subject: string, htmlContent: string, templateType: string): Promise<boolean> {
    let delivered = false;
    
    // 1. Try sending via standard SMTP transporter if configured
    if (transporter) {
      try {
        await transporter.sendMail({
          from: smtpSender,
          to,
          subject,
          html: htmlContent
        });
        delivered = true;
        console.log(`[Email Dispatched] SMTP sent "${subject}" successfully to ${to}`);
      } catch (err) {
        console.error(`[Email Error] SMTP failed to dispatch "${subject}" to ${to}:`, err);
      }
    }

    // 2. Perform DB Audit Trail Logging
    try {
      await db.logSentEmail({
        recipient: to,
        subject,
        body: htmlContent,
        type: templateType,
        status: delivered ? 'delivered' : 'simulated'
      });
    } catch (dbErr) {
      console.error('[Email Error] Failed to log email to database query tables:', dbErr);
    }

    return true;
  },

  /**
   * Dispatches the Welcome Onboarding Welcoming Email
   */
  async sendWelcomeEmail(to: string, fullName: string) {
    const subject = 'Welcome to Astraveda - Exquisite Haute Couture';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-text-size-adjust: none; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #09090b; padding: 40px 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
            .header { padding: 40px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(180deg, #18181b 0%, #09090b 100%); }
            .logo { font-size: 24px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #10b981; text-decoration: none; display: inline-block; font-family: 'Playfair Display', serif, Georgia; }
            .content { padding: 40px; line-height: 1.6; color: #d4d4d8; font-size: 14px; }
            h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 20px; font-family: 'Playfair Display', serif, Georgia; letter-spacing: -0.01em; }
            p { margin-top: 0; margin-bottom: 16px; }
            .highlight-box { background-color: #09090b; border: 1px dashed #10b981; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0; }
            .coupon-title { font-size: 11px; text-transform: uppercase; tracking: 0.2em; color: #a1a1aa; font-weight: 700; margin-bottom: 6px; }
            .coupon-code { font-size: 24px; font-weight: 900; color: #10b981; letter-spacing: 0.1em; font-family: monospace; }
            .coupon-desc { font-size: 12px; color: #71717a; margin-top: 8px; }
            .btn { display: inline-block; background-color: #10b981; color: #09090b; padding: 14px 28px; border-radius: 10px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; margin-top: 20px; text-align: center; }
            .footer { padding: 30px 40px; background-color: #09090b; font-size: 11px; color: #52525b; text-align: center; border-top: 1px solid #27272a; }
            .footer-links { margin-bottom: 15px; }
            .footer-links a { color: #10b981; text-decoration: none; margin: 0 10px; }
            .brand-claim { font-style: italic; color: #a1a1aa; margin-top: 25px; display: block; border-left: 3.5px solid #10b981; padding-left: 15px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <a href="${process.env.APP_URL || '#'}" class="logo">ASTRAVEDA</a>
              </div>
              <div class="content">
                <h1>Step Into Exquisite Craftsmanship</h1>
                <p>Hello ${fullName || 'Aesthetic Connoisseur'},</p>
                <p>We are absolutely thrilled to welcome you to <strong>Astraveda</strong>. Our garment atelier operates at the nexus of exquisite editorial designs and elite, premium-grade handloom craftsmanship.</p>
                <p>Every piece in our signature catalogue is built using heavy organic fibers, engineered to drape seamlessly, and finished meticulously with tailored durability features.</p>
                
                <div class="highlight-box">
                  <div class="coupon-title">YOUR WELCOME INVITATION PRIZE</div>
                  <div class="coupon-code">ASTRAWELCOME10</div>
                  <div class="coupon-desc">Apply code at checkout for 10% off your initial order of luxury hoodies, tees, or joggers.</div>
                </div>

                <p>By registering on our node consoles, you now have first-access privileges to limited micro-drop launches and real-time shipment updates directly synced through our premier logistics providers like Qikink.</p>
                
                <span class="brand-claim">
                  "Haute couture is not just apparel. It is an uncompromised statement of texture, geometry, and design absolute alignment."
                </span>
                
                <div style="text-align: center;">
                  <a href="${process.env.APP_URL || '#'}" class="btn">Explore Signature Microdrops</a>
                </div>
              </div>
              <div class="footer">
                <div class="footer-links">
                  <a href="${process.env.APP_URL || '#'}?tab=shop">Shop Collection</a>
                  <a href="${process.env.APP_URL || '#'}?tab=policy">Unboxing Video policy</a>
                  <a href="${process.env.APP_URL || '#'}?tab=profile">My Account</a>
                </div>
                <p>© ${new Date().getFullYear()} Astraveda Fabrics Inc. Handcrafted Premium Atelier. All Rights Reserved.</p>
                <p style="font-size: 10px; color: #3f3f46; margin-top: 5px;">This email is dispatched securely to ${to}. You received this as an registered account holder in our aesthetic design system portal.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail(to, subject, html, 'welcome');
  },

  /**
   * Dispatches Order Confirmation Email with precise item breakdown list
   */
  async sendOrderConfirmation(to: string, order: any, items: any[], addressDetails: any) {
    const subject = `Order Confirmed - Astraveda Premium Run #${order.order_number}`;
    
    // Construct HTML items table list
    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 12px 0; color: #ffffff; font-weight: 600;">
          ${item.name || 'Signature Item'}
          ${item.variant_name ? `<br><small style="color: #71717a; font-weight: 300;">Variant: ${item.variant_name}</small>` : ''}
        </td>
        <td style="padding: 12px 0; text-align: center; color: #a1a1aa; font-family: monospace;">x${item.quantity || 1}</td>
        <td style="padding: 12px 0; text-align: right; color: #10b981; font-weight: 700; font-family: monospace;">₹${Number(item.price).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; }
            .wrapper { width: 100%; background-color: #09090b; padding: 40px 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .header { padding: 35px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(180deg, #18181b 0%, #09090b 100%); }
            .logo { font-size: 22px; font-weight: 800; letter-spacing: 0.15em; color: #10b981; text-decoration: none; font-family: serif; }
            .content { padding: 35px; font-size: 14px; line-height: 1.6; color: #d4d4d8; }
            h1 { font-family: serif; color: #ffffff; font-size: 22px; margin-top: 0; margin-bottom: 5px; }
            .order-meta { font-family: monospace; font-size: 11px; color: #71717a; margin-bottom: 25px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { text-align: left; border-bottom: 1px solid #3f3f46; padding-bottom: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #a1a1aa; }
            .totals { width: 100%; border-top: 2px solid #27272a; padding-top: 15px; margin-top: 10px; font-size: 13px; }
            .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .total-final { display: flex; justify-content: space-between; padding: 12px 0 4px 0; border-top: 1px dashed #3f3f46; font-size: 16px; font-weight: 800; color: #10b981; font-family: monospace; }
            .address-box { background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin-top: 20px; }
            .address-box h3 { margin-top: 0; margin-bottom: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #ffffff; }
            .address-box p { margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5; }
            .audit-warning { background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 20px; margin: 30px 0; color: #ef4444; }
            .audit-warning h4 { margin-top: 0; margin-bottom: 6px; font-size: 13px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; }
            .btn { display: inline-block; background-color: #10b981; color: #09090b; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; margin-top: 20px; text-align: center; }
            .footer { padding: 30px 35px; background-color: #09090b; font-size: 11px; color: #52525b; text-align: center; border-top: 1px solid #27272a; }
            .footer-links a { color: #10b981; text-decoration: none; margin: 0 10px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <a href="${process.env.APP_URL || '#'}" class="logo">ASTRAVEDA</a>
              </div>
              <div class="content">
                <h1>Order Successfully Logged</h1>
                <div class="order-meta">
                  INVOICE: #${order.order_number} | DATE: ${new Date(order.created_at).toLocaleDateString()}
                </div>
                
                <p>Hello,</p>
                <p>Thank you for shopping at Astraveda. We have received your order, and our weavers are aligning production schedules for dynamic assembly. Below is your detailed breakdown invoice summary:</p>

                <table class="items-table">
                  <thead>
                    <tr>
                      <th>GARMENT STATEMENT</th>
                      <th style="text-align: center;">QTY</th>
                      <th style="text-align: right;">PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <div class="totals">
                  <div style="width: 100%; display: table;">
                    <div style="display: table-row;">
                      <div style="display: table-cell; padding: 3px 0; text-align: left; color: #a1a1aa;">Subtotal:</div>
                      <div style="display: table-cell; padding: 3px 0; text-align: right; color: #f4f4f5; font-family: monospace;">₹${Number(order.subtotal).toFixed(2)}</div>
                    </div>
                    ${order.discount > 0 ? `
                    <div style="display: table-row;">
                      <div style="display: table-cell; padding: 3px 0; text-align: left; color: #a1a1aa;">Discount Applied (${order.coupon_code || 'Promo'}):</div>
                      <div style="display: table-cell; padding: 3px 0; text-align: right; color: #ef4444; font-family: monospace;">-₹${Number(order.discount).toFixed(2)}</div>
                    </div>
                    ` : ''}
                    <div style="display: table-row;">
                      <div style="display: table-cell; padding: 3px 0; text-align: left; color: #a1a1aa;">Shipping Handling:</div>
                      <div style="display: table-cell; padding: 3px 0; text-align: right; color: #f4f4f5; font-family: monospace;">₹${Number(order.shipping_fee).toFixed(2)}</div>
                    </div>
                    <div style="display: table-row; font-weight: bold; font-size: 15px;">
                      <div style="display: table-cell; padding: 10px 0 0 0; text-align: left; border-top: 1px dashed #3f3f46; color: #10b981;">GRAND TOTAL CALCULATION:</div>
                      <div style="display: table-cell; padding: 10px 0 0 0; text-align: right; border-top: 1px dashed #3f3f46; color: #10b981; font-family: monospace;">₹${Number(order.total).toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div class="address-box">
                  <h3>SHIPPING CONSIGNMENT ADDRESS</h3>
                  <p>
                    <strong>${addressDetails.name || 'Customer'}</strong><br>
                    ${addressDetails.street || ''}<br>
                    ${addressDetails.city || ''}, ${addressDetails.state || ''} - ${addressDetails.postal_code || ''}<br>
                    ${addressDetails.country || ''}<br>
                    Phone contact: ${addressDetails.phone || ''}
                  </p>
                </div>

                <div class="audit-warning">
                  <h4>⚠️ IMPORTANT UNBOXING AUDIT RULES</h4>
                  <p style="margin: 0; font-size: 11px; line-height: 1.5;">
                    To prevent any transit disputes, our fulfillment pipeline is certified with tamper-proof security seals. <strong>Customers are strictly required to record a single, uncut unboxing video</strong> starting from showing the closed outer package labels until final fabric check. Missing, damaged, or product errors cannot be verified without video proof.
                  </p>
                </div>

                <p>We have processed logistics integration with our premier tracking node <strong>Qikink</strong>. Once the package is cleared for dispatch, you can track real-time visual progress step-by-step from your customer panel dashboard portal.</p>

                <div style="text-align: center; margin-top: 25px;">
                  <a href="${process.env.APP_URL || '#'}?tab=orders" class="btn">View Live Tracking Timeline</a>
                </div>
              </div>
              <div class="footer">
                <div class="footer-links">
                  <a href="${process.env.APP_URL || '#'}?tab=orders">Sync Orders</a>
                  <a href="${process.env.APP_URL || '#'}?tab=support">Help Desk</a>
                  <a href="${process.env.APP_URL || '#'}?tab=policy">Fulfillment Policy</a>
                </div>
                <p style="margin-top: 15px;">© ${new Date().getFullYear()} Astraveda Fabrics Inc. Atelier & Looms. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail(to, subject, html, 'order_confirmation');
  },

  /**
   * Dispatches Password Reset Request Email
   */
  async sendPasswordResetEmail(to: string, resetToken: string, userFullName: string) {
    const subject = 'Astraveda Systems - Password Reset Request';
    const resetUrl = `${process.env.APP_URL || 'https://astraveda.com'}/api/auth/reset-password-redirect?email=${encodeURIComponent(to)}&token=${encodeURIComponent(resetToken)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; }
            .wrapper { width: 100%; background-color: #09090b; padding: 50px 0; }
            .container { max-width: 550px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .header { padding: 35px 40px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(180deg, #18181b 0%, #09090b 100%); }
            .logo { font-size: 20px; font-weight: 800; letter-spacing: 0.15em; color: #10b981; text-decoration: none; font-family: serif; }
            .content { padding: 40px; font-size: 14px; line-height: 1.6; color: #d4d4d8; }
            h1 { font-family: serif; color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 15px; }
            .reset-box { background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0; }
            .token-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #71717a; margin-bottom: 8px; }
            .token-code { font-size: 26px; font-weight: 900; color: #10b981; letter-spacing: 0.08em; font-family: monospace; }
            .btn { display: inline-block; background-color: #10b981; color: #09090b; padding: 13px 26px; border-radius: 8px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; margin-top: 15px; }
            .security-notice { font-size: 12px; color: #71717a; border-top: 1px solid #27272a; padding-top: 20px; margin-top: 30px; }
            .footer { padding: 25px 40px; background-color: #09090b; font-size: 11px; color: #52525b; text-align: center; border-top: 1px solid #27272a; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <a href="${process.env.APP_URL || '#'}" class="logo">ASTRAVEDA</a>
              </div>
              <div class="content">
                <h1>Security Restructuring Protocol</h1>
                <p>Hello ${userFullName || 'Account Owner'},</p>
                <p>We received a system call requesting a credential reset for your registered mail access account. If you did not initialize this diagnostic reset command, you can safely disregard this digital transmittal.</p>
                
                <p>To establish fresh logging passwords, use the single-session secure token below inside your aesthetic client portal password reset page, or click the direct alignment button below:</p>
                
                <div class="reset-box">
                  <div class="token-label">SECURE CREDENTIAL TOKEN</div>
                  <div class="token-code">${resetToken}</div>
                </div>

                <p style="font-size: 12px; text-align: center; color: #a1a1aa; margin-top: 10px;">
                  For manual entry, copy the 12-character token above, navigate to reset pass tab, and input along with your registered email.
                </p>

                <p class="security-notice">
                  🛡️ <strong>Safety Safeguard:</strong> This transactional reset code is only valid for the upcoming 60 minutes. Our database nodes never save cleartext passwords.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Astraveda Fabrics Inc. Security Division. All rights reserved.</p>
                <p style="font-size: 9px; color: #3f3f46;">Dispatch ID: TR-${Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendMail(to, subject, html, 'password_reset');
  }
};
