# ChatTrain Standalone Frontend

This is a standalone version of the ChatTrain frontend that runs independently without requiring a backend server. It uses mock data and services to provide a fully functional demo experience.

## Features

- **Complete UI/UX**: All original frontend features and components
- **Mock Authentication**: Login with demo credentials
- **Mock Data**: Pre-populated trainers, sessions, and analytics
- **File Upload Simulation**: Mock file upload functionality
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Support**: Light/dark/system theme switching

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open your browser to `http://localhost:3000`
   - Use demo credentials to login:
     - **Email**: `demo@example.com`
     - **Password**: `demo123`

## Demo Credentials

- **Email**: `demo@example.com`
- **Password**: `demo123`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Mock Data

The standalone frontend includes:

- **3 Sample Trainers**: Customer Service, Sales, and Compliance training
- **2 API Keys**: OpenAI and Anthropic examples
- **2 Training Sessions**: Active sessions with sample conversations
- **Analytics Data**: Charts and statistics for dashboard
- **User Profile**: Demo user with preferences

## Configuration

The application uses environment variables for configuration. Key settings:

- `VITE_USE_MOCKS=true` - Enables mock API (default for standalone)
- `VITE_BYPASS_EMAIL_VERIFICATION=true` - Skips email verification
- `VITE_APP_NAME` - Application name
- `VITE_DEBUG_MODE` - Enables debug logging

## Connecting to Real Backend

To connect to a real backend server:

1. Set `VITE_USE_MOCKS=false` in your environment
2. Set `VITE_API_BASE_URL=http://your-backend-url/api`
3. Restart the development server

## File Structure

```
standalone-frontend/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── services/
│   │   ├── api.ts          # Main API service (with mock support)
│   │   └── mockApi.ts      # Mock API implementation
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   └── assets/             # Static assets
├── public/                 # Public assets
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
└── README.md             # This file
```

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Framer Motion** - Animations
- **React Flow** - Flow diagram components

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Notes

- The mock API simulates real API responses with realistic delays
- All data is stored in browser localStorage for persistence
- File uploads create blob URLs for preview
- The application maintains state across page refreshes

## Production Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory and can be deployed to any static hosting service.

## Troubleshooting

**Login Issues**: Make sure to use the exact demo credentials: `demo@example.com` / `demo123`

**Build Errors**: Ensure all dependencies are installed with `npm install`

**Mock Data Not Loading**: Check browser console for errors and ensure localStorage is available

## License

This standalone frontend maintains the same license as the original ChatTrain project.