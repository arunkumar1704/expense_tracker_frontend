import { Navigate } from 'react-router-dom';

function HelpingRouter({ children }) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default HelpingRouter;
