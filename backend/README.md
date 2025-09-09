# ChatTrain Backend API

A comprehensive MERN stack backend for ChatTrain: Propelling Training Forward - The L&D Engine.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Organization Management**: Multi-tenant architecture with team management
- **AI Trainer Management**: Create, configure, and deploy AI trainers
- **Flow Builder**: Visual flow editor for creating training scenarios
- **Session Tracking**: Comprehensive analytics and session management
- **API Key Management**: Support for multiple LLM providers (OpenAI, Anthropic, Google)
- **Analytics & Reporting**: Detailed insights and performance metrics
- **Real-time Features**: WebSocket support for live interactions

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Email**: Nodemailer (for verification and notifications)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chattrain/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/chat-train
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=30d
   
   # Email (optional for development)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `PUT /api/auth/preferences` - Update user preferences

### Organizations
- `GET /api/organizations` - Get user's organizations
- `GET /api/organizations/:id` - Get organization details
  
#### Team Management (Stable Core)
- `GET /api/organizations/:id/team` - List team members
- `POST /api/organizations/:id/team/invite` - Invite by email (owner/admin/manager)
- `POST /api/organizations/:id/team/accept` - Accept invite (public via token)
- `PATCH /api/organizations/:id/team/:memberId/role` - Update role (owner/admin/manager)

### Trainers
- `GET /api/trainers` - Get all trainers for organization
- `POST /api/trainers` - Create new trainer
- `GET /api/trainers/:id` - Get trainer details
- `PUT /api/trainers/:id` - Update trainer
- `DELETE /api/trainers/:id` - Delete trainer
- `POST /api/trainers/:id/deploy` - Deploy trainer
- `POST /api/trainers/:id/undeploy` - Undeploy trainer
- `GET /api/trainers/:id/flows` - Get trainer flows
- `GET /api/trainers/:id/analytics` - Get trainer analytics

### Sessions
- `GET /api/sessions` - Get user sessions
- `GET /api/sessions/:id` - Get session details

### Analytics
- `GET /api/analytics` - Get analytics data

### API Keys
- `GET /api/api-keys` - Get API keys for organization

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user details

### Team Management
- `GET /api/organizations/:id/team` - List team members
- `POST /api/organizations/:id/team/invite` - Invite a member (owner/admin/manager)
- `POST /api/organizations/:id/team/accept` - Accept invitation (public)
- `PATCH /api/organizations/:id/team/:memberId/role` - Update role (owner/admin/manager)

For full details, see `backend/TEAM_MANAGEMENT.md`.

## Database Schema

### Core Models

1. **User** - User accounts and authentication
2. **Organization** - Multi-tenant organizations
3. **TeamMember** - Organization membership and roles
4. **Trainer** - AI trainer configurations
5. **TrainerFlow** - Visual flow definitions
6. **Session** - User training sessions
7. **Analytics** - Performance metrics and insights
8. **ApiKey** - LLM provider API keys

### Key Features

- **Multi-tenant Architecture**: Organizations with isolated data
- **Role-based Access Control**: Owner, Admin, Manager, Trainer, Viewer roles
- **Comprehensive Analytics**: Session tracking, user engagement, performance metrics
- **Flow Validation**: Built-in validation for trainer flows
- **API Key Management**: Secure storage and usage tracking
- **Real-time Updates**: WebSocket support for live features

## Development

### Project Structure
```
backend/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API route handlers
├── utils/           # Utility functions
├── server.js        # Main server file
└── package.json     # Dependencies and scripts
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/chat-train` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `30d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS for frontend integration
- **Helmet Security**: Security headers and protection
- **SQL Injection Protection**: Mongoose ODM prevents injection attacks

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "count": 1, // For list responses
  "errors": [] // For validation errors
}
```

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Validation errors, invalid input
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
