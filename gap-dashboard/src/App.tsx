// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoginPage from "./pages/LoginPage";
import ManagePage from "./pages/Manage";
import RequireAuth from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthContext";
import GroupDetailPage from './pages/GroupDetailPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/manage" element={
            <RequireAuth>
              <ManagePage />
            </RequireAuth>
          } />
          <Route path="/groups/:id" element={
            <RequireAuth>
              <GroupDetailPage />
            </RequireAuth>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
