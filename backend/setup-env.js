const fs = require('fs');
const path = require('path');

const envContent = `# Environment Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb+srv://talhaijaz:talhaijaz@cluster0.jlhm6ym.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=chat-train-super-secret-jwt-key-2024-development
JWT_EXPIRE=30d

# Email Configuration (optional for development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# API Configuration
API_RATE_LIMIT=100
API_RATE_LIMIT_WINDOW=900000

# Security
CORS_ORIGIN=http://localhost:3000
`;

const envPath = path.join(__dirname, '.env');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists. Skipping creation.');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📝 Please review and update the configuration as needed.');
  }
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📋 Please create a .env file manually with the following content:');
  console.log('\n' + envContent);
}
