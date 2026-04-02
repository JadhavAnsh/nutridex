import { ClerkProvider } from '@clerk/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import BaseLayout from './BaseLayout';
import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import Chat from './pages/Chat';
import History from './pages/History';
import AIDietPlanner from './pages/AIDietPlanner';
import DietLogger from './pages/DietLogger';
import Home from './pages/Home';
import Login from './pages/Login';
import ManualEntry from './pages/ManualEntry';
import Profile from './pages/Profile';
import Result from './pages/Result';
import Scan from './pages/Scan';
import Signup from './pages/Signup';
import reportWebVitals from './reportWebVitals';

const clerkPublishableKey =
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;

const router = createBrowserRouter([
  {
    path: '/',
    element: <BaseLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/signup',
        element: <Signup />,
      },
      {
        path: '/scan',
        element: <Scan />,
      },
      {
        path: '/manual-entry',
        element: <ManualEntry />,
      },
      {
        path: '/ai-diet-planner',
        element: <AIDietPlanner />,
      },
      {
        path: '/diet-logger',
        element: <DietLogger />,
      },
      {
        path: '/chat',
        element: <PrivateRoute><Chat /></PrivateRoute>,
      },
      {
        path: '/result',
        element: <PrivateRoute><Result /></PrivateRoute>,
      },
      {
        path: '/profile',
        element: <PrivateRoute><Profile /></PrivateRoute>,
      },
      {
        path: '/history',
        element: <PrivateRoute><History /></PrivateRoute>,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/">
      <AuthProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </ClerkProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
