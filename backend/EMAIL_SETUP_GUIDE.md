# Email Setup Guide for Chat Train

This guide will help you configure email functionality for team invitations, password resets, and email verification.

## Quick Setup

### 1. Environment Variables

Add these to your `.env` file in the backend directory:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### 2. Gmail Setup (Recommended)

#### Option A: Gmail with App Password (Recommended for Production)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Chat Train"
   - Copy the generated 16-character password
3. **Update your .env file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   ```

#### Option B: Gmail with Less Secure Apps (Development Only)

⚠️ **Warning**: This is less secure and may not work with newer Gmail accounts.

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-regular-gmail-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 3. Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

#### Custom SMTP Server
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## Testing Email Configuration

### 1. Test Connection

Run the email test script:

```bash
cd backend
node test-email.js
```

### 2. Test from API

Make a POST request to test email sending:

```bash
curl -X POST http://localhost:5000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

### 3. Check Logs

Look for these messages in your backend console:
- ✅ `Email service connection verified`
- ✅ `Team invite email sent: <messageId>`
- ❌ `Error sending team invite email: <error>`

## Troubleshooting

### Common Issues

#### 1. "Invalid login" or "Authentication failed"
- **Gmail**: Use App Password instead of regular password
- **Other providers**: Check if you need to enable "Less secure apps" or use App Password

#### 2. "Connection timeout"
- Check your internet connection
- Verify EMAIL_HOST and EMAIL_PORT are correct
- Try different ports (587, 465, 25)

#### 3. "Email sent but not received"
- Check spam/junk folder
- Verify recipient email address
- Check if your email provider has sending limits

#### 4. "FRONTEND_URL not set"
- Set FRONTEND_URL in your .env file
- This is used for invite links and password reset URLs

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
DEBUG_EMAIL=true
```

## Security Best Practices

1. **Use App Passwords** instead of regular passwords
2. **Enable 2-Factor Authentication** on your email account
3. **Use environment variables** - never hardcode credentials
4. **Regular password rotation** for production environments
5. **Monitor email sending limits** to avoid being blocked

## Production Considerations

1. **Use a dedicated email service** like SendGrid, Mailgun, or AWS SES
2. **Set up email authentication** (SPF, DKIM, DMARC)
3. **Monitor delivery rates** and bounce handling
4. **Implement rate limiting** for email sending
5. **Use environment-specific configurations**

## Example Production Setup (SendGrid)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

## Support

If you're still having issues:

1. Check the backend console for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple email client first
4. Check your email provider's SMTP documentation
