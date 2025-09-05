require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`  EMAIL_HOST: ${process.env.EMAIL_HOST || 'Not set'}`);
  console.log(`  EMAIL_PORT: ${process.env.EMAIL_PORT || 'Not set'}`);
  console.log(`  EMAIL_USER: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`  EMAIL_PASS: ${process.env.EMAIL_PASS ? '[SET]' : 'Not set'}`);
  console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  console.log('');

  // Test connection
  console.log('🔗 Testing SMTP Connection...');
  try {
    const connectionResult = await emailService.testConnection();
    if (connectionResult.success) {
      console.log('✅ SMTP connection successful!');
    } else {
      console.log('❌ SMTP connection failed:', connectionResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ SMTP connection error:', error.message);
    return;
  }

  // Test sending a verification email
  console.log('\n📧 Testing Email Sending...');
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  console.log(`  Sending to: ${testEmail}`);
  
  try {
    const result = await emailService.sendVerificationEmail(
      testEmail,
      'test-token-123',
      'Test User'
    );

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`  Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Test email failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Test email error:', error.message);
  }

  // Test team invite email
  console.log('\n👥 Testing Team Invite Email...');
  try {
    const inviteResult = await emailService.sendTeamInviteEmail({
      toEmail: testEmail,
      inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=test-invite-token-123`,
      organizationName: 'Test Organization',
      inviterName: 'Test Inviter',
      role: 'viewer'
    });

    if (inviteResult.success) {
      console.log('✅ Team invite email sent successfully!');
      console.log(`  Message ID: ${inviteResult.messageId}`);
    } else {
      console.log('❌ Team invite email failed:', inviteResult.error);
    }
  } catch (error) {
    console.log('❌ Team invite email error:', error.message);
  }

  console.log('\n🎉 Email testing complete!');
  console.log('\n💡 Next steps:');
  console.log('  1. Check your email inbox (and spam folder)');
  console.log('  2. If emails are not received, check the configuration above');
  console.log('  3. For Gmail, make sure to use an App Password');
  console.log('  4. See EMAIL_SETUP_GUIDE.md for detailed troubleshooting');
}

// Run the test
testEmail().catch(console.error);
