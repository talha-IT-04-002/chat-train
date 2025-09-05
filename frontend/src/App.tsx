import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginSignup from './pages/LoginSignup'
import Signup from './pages/Signup'
import EmailVerification from './pages/EmailVerification'
import ManageKey from './pages/ManageKey'
import ManageTeam from './pages/ManageTeam'
import BuildNewTrainer from './pages/BuildNewTrainer'
import TrainerAIConversation from './pages/TrainerAIConversation'
import TrainerBuilder from './pages/TrainerBuilder'
import TrainerManagement from './pages/TrainerManagement'
import TrainerTest from './pages/TrainerTest'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import AcceptInvite from './pages/AcceptInvite'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginSignup />} />
            <Route path="/login" element={<LoginSignup />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/email-verification" element={<EmailVerification />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/trainer/:trainerId" element={<TrainerAIConversation />} />
            <Route path="/dashboard" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true}>
                <Dashboard />
             </ProtectedRoute>
            } />
            <Route path="/manage-key" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true} requireOrganization={true}>
                <ManageKey />
             </ProtectedRoute>
            } />
            <Route path="/manage-team" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true} requireOrganization={true}>
                <ManageTeam />
             </ProtectedRoute>
            } />
            <Route path="/build-new-trainer" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true} requireOrganization={true}>
                <BuildNewTrainer />
             </ProtectedRoute>
            } />
            <Route path="/trainer-ai-conversation" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true} requireOrganization={true}>
                <TrainerAIConversation />
             </ProtectedRoute>
            } />
            <Route path="/trainer-builder" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true} requireOrganization={true}>
                <TrainerBuilder />
             </ProtectedRoute>
            } />
            <Route path="/trainer-management" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true} requireOrganization={true}>
                <TrainerManagement />
             </ProtectedRoute>
            } />
            <Route path="/trainer-test" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true} requireOrganization={true}>
                <TrainerTest />
             </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requireAuth={true} requireEmailVerification={true}>
                <Settings />
             </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
