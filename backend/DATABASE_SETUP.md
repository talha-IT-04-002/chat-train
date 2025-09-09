# Database Setup Guide

This guide will help you set up the database for ChatTrain: Propelling Training Forward.

## Quick Start Options

### Option 1: MongoDB Atlas (Recommended - Cloud Database)
**Best for**: Development, testing, and production
**Cost**: Free tier available
**Setup Time**: 5-10 minutes

1. Follow the guide in `setup-mongodb-atlas.md`
2. Update your `.env` file with the Atlas connection string
3. Run `npm run db:test` to verify connection
4. Run `npm run db:seed` to populate sample data

### Option 2: Local MongoDB Installation
**Best for**: Development only, offline work
**Cost**: Free
**Setup Time**: 10-15 minutes

1. Follow the guide in `setup-local-mongodb.md`
2. Your `.env` file is already configured for local MongoDB
3. Run `npm run db:test` to verify connection
4. Run `npm run db:seed` to populate sample data

## Database Scripts

### Available Commands

```bash
# Test database connection
npm run db:test

# Seed database with sample data
npm run db:seed

# Backup database
npm run db:backup

# Start development server
npm run dev
```

### What Each Script Does

- **`db:test`**: Tests database connection and basic operations
- **`db:seed`**: Populates database with sample users, organizations, trainers, and API keys
- **`db:backup`**: Creates a backup of your database
- **`dev`**: Starts the development server with database connection

## Database Schema Overview

### Collections (Tables)

1. **users** - User accounts and profiles
2. **organizations** - Company/team data
3. **teammembers** - User-organization relationships
4. **trainers** - AI trainer configurations
5. **trainerflows** - Flow builder data
6. **sessions** - User interaction sessions
7. **analytics** - Performance metrics
8. **apikeys** - API key management
9. **notifications** - System notifications
10. **reports** - Generated reports

### Sample Data Created

When you run `npm run db:seed`, the following data is created:

- **Organization**: Demo Company
- **Admin User**: admin@demo.com (password: admin123)
- **Regular User**: user@demo.com (password: user123)
- **API Keys**: Sample OpenAI and Anthropic keys
- **Trainers**: Compliance and Sales training bots

## Environment Variables

Make sure your `.env` file contains:

```env
# Database Configuration
   MONGODB_URI=mongodb://localhost:27017/chattrain
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-train?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - MongoDB is not running
   - Wrong port or host
   - Firewall blocking connection

2. **Authentication Failed**
   - Wrong username/password
   - User doesn't have proper permissions

3. **Network Timeout**
   - Internet connection issues (for Atlas)
   - Firewall blocking connection

### Testing Your Setup

1. **Test Connection**:
   ```bash
   npm run db:test
   ```

2. **Seed Database**:
   ```bash
   npm run db:seed
   ```

3. **Start Server**:
   ```bash
   npm run dev
   ```

4. **Test API**:
   ```bash
   curl http://localhost:5000/health
   ```

## Data Storage Locations

### Local MongoDB
- **Windows**: `C:\Program Files\MongoDB\Server\7.0\data\`
- **Linux**: `/var/lib/mongodb/`
- **macOS**: `/usr/local/var/mongodb/`

### MongoDB Atlas
- Data is stored on MongoDB's cloud servers
- Automatically backed up and replicated
- Accessible from anywhere with internet

## Security Considerations

1. **Never commit your `.env` file** to version control
2. **Use strong passwords** for database users
3. **Restrict network access** in production
4. **Regular backups** are important
5. **Monitor database usage** and performance

## Next Steps

After setting up the database:

1. **Test the API endpoints** using the sample data
2. **Connect your frontend** to the backend API
3. **Customize the sample data** for your needs
4. **Set up monitoring** and logging
5. **Configure backups** for production

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your MongoDB installation/Atlas setup
3. Check the server logs for error messages
4. Ensure all environment variables are set correctly
