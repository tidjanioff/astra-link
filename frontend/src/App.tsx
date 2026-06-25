import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import { AuthProvider } from './context/AuthContext'
import AgencyDetailPage from './pages/AgencyDetailPage'
import AgencyListPage from './pages/AgencyListPage'
import LaunchDetailPage from './pages/LaunchDetailPage'
import LaunchListPage from './pages/LaunchListPage'
import LoginPage from './pages/LoginPage'
import MyLaunchesPage from './pages/MyLaunchesPage'
import RegisterPage from './pages/RegisterPage'
import RocketDetailPage from './pages/RocketDetailPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <div style={{ height: '56px' }} />
        <Routes>
          <Route path="/" element={<LaunchListPage />} />
          <Route path="/launches/:id" element={<LaunchDetailPage />} />
          <Route path="/agencies" element={<AgencyListPage />} />
          <Route path="/agencies/:provider" element={<AgencyDetailPage />} />
          <Route path="/rockets/:family" element={<RocketDetailPage />} />
          <Route path="/my-launches" element={<MyLaunchesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
