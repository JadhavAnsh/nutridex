import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import BaseLayout from './BaseLayout';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import History from './pages/History';
import Home from './pages/Home';
import Login from './pages/Login';
import ManualEntry from './pages/ManualEntry';
import Profile from './pages/Profile';
import Result from './pages/Result';
import Scan from './pages/Scan';
import Signup from './pages/Signup';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<BaseLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/scan" element={<PrivateRoute><Scan /></PrivateRoute>} />
            <Route path="/manual-entry" element={<PrivateRoute><ManualEntry /></PrivateRoute>} />
            <Route path="/result" element={<PrivateRoute><Result /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
