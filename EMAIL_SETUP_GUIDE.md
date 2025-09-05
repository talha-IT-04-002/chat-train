# Email Verification Setup Guide

## Issues Found and Solutions

### 1. Missing Environment Configuration

**Problem**: The backend doesn't have a `.env` file configured, so email service can't send verification emails.

**Solution**: Create a `.env` file in the `backend` directory:

```bash
# Navigate to backend directory
cd backend

# Copy the example file
cp env.example .env
```

Then edit the `.env` file with your email configuration:

```env
# Environment Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/chat-train

# JWT Configuration
JWT_SECRET=chat-train-super-secret-jwt-key-2024-development
JWT_EXPIRE=30d

# Email Configuration (Update these with your email credentials)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# API Configuration
API_RATE_LIMIT=100
API_RATE_LIMIT_WINDOW=900000

# Security
CORS_ORIGIN=http://localhost:3000
```

### 2. Gmail App Password Setup

**For Gmail users**, you need to create an App Password:

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Create an App Password for "Mail"
4. Use this App Password in the `EMAIL_PASS` field

### 3. Route Configuration Fixed

**Problem**: Frontend route mismatch - backend sends `/verify-email` but frontend only had `/email-verification`.

**Solution**: ✅ **FIXED** - Added the correct route in `App.tsx`:
```tsx
<Route path="/verify-email" element={<EmailVerification />} />
```

### 4. Testing Email Service

After setting up the `.env` file, test the email service:

```bash
# Start the backend server
cd backend
npm run dev

# In another terminal, test the email service
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Org"
  }'
```

### 5. Alternative Email Providers

If you don't want to use Gmail, here are other options:

#### **SendGrid (Recommended for production)**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

#### **Mailgun**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASS=your-mailgun-password
```

#### **Outlook/Hotmail**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### 6. Development Mode (Skip Email Verification)

For development, you can temporarily disable email verification by modifying the registration route:

```javascript
// In backend/routes/auth.js, around line 95
// Comment out the email sending part:
/*
try {
  await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
} catch (error) {
  console.error('Failed to send verification email:', error);
}
*/

// And set user as verified by default:
user.emailVerified = true;
user.status = 'active';
```

### 7. Debugging Steps

1. **Check server logs** for email errors
2. **Verify environment variables** are loaded correctly
3. **Test email service connection**:
   ```javascript
   // Add this to your server.js temporarily
   const emailService = require('./services/emailService');
   emailService.testConnection().then(result => {
     console.log('Email service test:', result);
   });
   ```

### 8. Frontend Verification Flow

The verification flow works as follows:

1. User registers → Backend sends verification email
2. User clicks email link → Goes to `/verify-email?token=...`
3. Frontend calls `/api/auth/verify-email` with the token
4. Backend verifies token and activates account
5. User can now log in

### 9. Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Invalid credentials" on login | User needs to verify email first |
| Email not received | Check spam folder, verify email credentials |
| Token expired | Use resend verification feature |
| CORS errors | Ensure `CORS_ORIGIN` matches frontend URL |

### 10. Production Considerations

For production deployment:

1. Use a reliable email service (SendGrid, Mailgun, AWS SES)
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Monitor email delivery rates
4. Implement email templates with your branding
5. Add rate limiting for email sending

## Quick Fix Summary

1. **Create `.env` file** in backend directory
2. **Configure email credentials** (Gmail App Password recommended)
3. **Restart backend server**
4. **Test registration** with a new email address
5. **Check email** for verification link
6. **Click link** to verify account
7. **Login** with verified account

The email verification system is now properly configured and should work correctly!