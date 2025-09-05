# Chat Train Frontend

A React-based frontend for the Chat Train AI training platform.

## Features

- **Authentication System**: JWT-based login/logout with protected routes
- **Organization Management**: Multi-tenant support with organization switching
- **Trainer Management**: Create, edit, and manage AI trainers
- **API Key Management**: Configure LLM provider API keys
- **Session Tracking**: Monitor training sessions and analytics
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Icons**: Lucide React
- **UI Components**: Custom component library

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend server running (see backend README)

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

## Backend Connection

The frontend is configured to connect to the backend API running on `http://localhost:5000`. 

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Chat Train
VITE_APP_VERSION=1.0.0
```

### API Configuration

The frontend uses a proxy configuration in `vite.config.ts` to forward API requests to the backend during development:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, Theme)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API service layer
└── assets/             # Static assets
```

## Authentication Flow

1. **Login**: Users authenticate with email/password
2. **Token Storage**: JWT tokens are stored in localStorage
3. **Protected Routes**: Routes are protected based on authentication status
4. **Auto-redirect**: Authenticated users are redirected to dashboard
5. **Token Refresh**: Automatic token validation on app load

## API Integration

The frontend uses a centralized API service (`src/services/api.ts`) that provides:

- **Authentication endpoints**: login, register, logout
- **Organization management**: get organizations, switch organization
- **Trainer management**: CRUD operations for trainers
- **API key management**: manage LLM provider keys
- **Session tracking**: monitor training sessions
- **Analytics**: view performance metrics

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## Deployment

The frontend can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables for production API URL

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure backend server is running on port 5000
   - Check CORS configuration in backend
   - Verify API URL in environment variables

2. **Authentication Issues**
   - Clear localStorage and try logging in again
   - Check JWT token expiration
   - Verify backend authentication endpoints

3. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check TypeScript compilation errors
   - Verify all imports are correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
