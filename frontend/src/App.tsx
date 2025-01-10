// frontend/src/App.tsx
import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate 
} from 'react-router-dom';
import LoginForm from './components/Auth/LoginForm';
import PropertyList from './components/Properties/PropertyList';
import DashboardPanel from './components/Dashboard/DashboardPanel';
import PropertyForm from './components/Properties/PropertyForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginForm />
  },
  {
    path: "/properties",
    element: <ProtectedRoute><PropertyList /></ProtectedRoute>
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><DashboardPanel /></ProtectedRoute>
  },
  {
    path: "/property/new",
    element: <ProtectedRoute><PropertyForm /></ProtectedRoute>
  },
  {
    path: "/property/edit/:id",
    element: <ProtectedRoute><PropertyForm /></ProtectedRoute>
  },
  {
    path: "/",
    element: <Navigate to="/properties" />
  }
], {
  future: {
    v7_normalizeFormMethod: true
  }
});

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;