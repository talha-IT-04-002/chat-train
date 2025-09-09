# ChatTrain: Propelling Training Forward

The L&D Engine - A comprehensive full-stack application for creating, managing, and deploying AI-powered chat trainers that propel training forward. Built with React, Node.js, and MongoDB.

## 🚀 Features

- **AI Trainer Management**: Create and configure AI trainers with custom flows
- **Multi-tenant Architecture**: Organization-based user management
- **Authentication System**: JWT-based authentication with role-based access
- **API Key Management**: Support for multiple LLM providers (OpenAI, Anthropic, Google)
- **Session Tracking**: Comprehensive analytics and session management
- **Real-time Features**: Live chat interactions and updates
- **Responsive Design**: Modern UI that works on all devices

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express-validator** for input validation

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chattrain
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   Create `.env` files in both frontend and backend directories:

   **Backend (.env)**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chat-train
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=30d
   FRONTEND_URL=http://localhost:3000
   ```

   **Frontend (.env)**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=Chat Train
   VITE_APP_VERSION=1.0.0
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in backend .env
   ```

5. **Start both frontend and backend**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

## 📁 Project Structure

```
chat-train/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Theme)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   └── assets/          # Static assets
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js backend API
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # API route handlers
│   ├── scripts/             # Database scripts
│   ├── server.js            # Main server file
│   └── package.json
├── package.json             # Root package.json
└── README.md
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run build` - Build frontend for production
- `npm run start` - Start backend in production mode
- `npm run test` - Run backend tests
- `npm run lint` - Run frontend linting

### Backend API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email address

#### Organizations
- `GET /api/organizations` - Get user's organizations
- `GET /api/organizations/:id` - Get organization details

#### Trainers
- `GET /api/trainers` - Get all trainers for organization
- `POST /api/trainers` - Create new trainer
- `PUT /api/trainers/:id` - Update trainer
- `DELETE /api/trainers/:id` - Delete trainer

#### API Keys
- `GET /api/api-keys` - Get API keys for organization
- `POST /api/api-keys` - Create new API key
- `PUT /api/api-keys/:id` - Update API key
- `DELETE /api/api-keys/:id` - Delete API key

## 🔐 Authentication Flow

1. **Registration**: Users create accounts with email/password
2. **Login**: JWT token-based authentication
3. **Token Storage**: Tokens stored in localStorage
4. **Protected Routes**: Frontend routes protected by authentication status
5. **Auto-redirect**: Authenticated users redirected to dashboard

## 🗄 Database Schema

### Core Models
- **User**: User accounts and authentication
- **Organization**: Multi-tenant organizations
- **TeamMember**: Organization membership and roles
- **Trainer**: AI trainer configurations
- **TrainerFlow**: Visual flow definitions
- **Session**: User training sessions
- **Analytics**: Performance metrics
- **ApiKey**: LLM provider API keys

## 🚀 Deployment

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `frontend/dist` folder to your hosting service
3. Configure environment variables for production

### Backend Deployment
1. Set up MongoDB (local or cloud)
2. Configure environment variables
3. Deploy to your hosting service (Heroku, Vercel, etc.)

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure MongoDB is running
   - Check MONGODB_URI in backend .env
   - Verify backend server is running on port 5000

2. **Frontend Can't Connect to Backend**
   - Check CORS configuration in backend
   - Verify API URL in frontend .env
   - Ensure both servers are running

3. **Authentication Issues**
   - Clear localStorage and try logging in again
   - Check JWT_SECRET in backend .env
   - Verify token expiration settings

4. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check TypeScript compilation errors
   - Verify all imports are correct

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/backend/README.md` and `/frontend/README.md`
- Review the API documentation in `/backend/README.md`
