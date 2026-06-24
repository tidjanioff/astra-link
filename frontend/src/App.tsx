import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import AgencyDetailPage from './pages/AgencyDetailPage'
import AgencyListPage from './pages/AgencyListPage'
import LaunchDetailPage from './pages/LaunchDetailPage'
import LaunchListPage from './pages/LaunchListPage'
import RocketDetailPage from './pages/RocketDetailPage'

function PlaceholderPage({ name }: { name: string }) {
  return <div>{name}</div>
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ height: '56px' }} />
      <Routes>
        <Route path="/" element={<LaunchListPage />} />
        <Route path="/launches/:id" element={<LaunchDetailPage />} />
        <Route path="/agencies" element={<AgencyListPage />} />
        <Route path="/agencies/:provider" element={<AgencyDetailPage />} />
        <Route path="/rockets/:family" element={<RocketDetailPage />} />
        <Route
          path="/my-launches"
          element={<PlaceholderPage name="MyLaunchesPage" />}
        />
        <Route path="/login" element={<PlaceholderPage name="LoginPage" />} />
        <Route
          path="/register"
          element={<PlaceholderPage name="RegisterPage" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
