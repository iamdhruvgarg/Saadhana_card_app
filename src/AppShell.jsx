import { useAuth } from './components/AuthProvider';
import LoginPage from './components/LoginPage';
import App from './App';

export default function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <div className="login-om">🙏</div>
            <h1 className="login-title">Saadhana Card</h1>
            <p className="login-subtitle">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <App user={user} />;
}
