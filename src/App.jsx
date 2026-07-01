import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import MyLayout from './layout/MyLayout';
import Expenses from './pages/home';
import Login from './pages/login/Login';
import Register from './pages/Register';
import HelpingRouter from './helping/helpingRouter';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MyLayout />}>
          {/* Protected: Dashboard */}
          <Route
            index
            element={
              <HelpingRouter>
                <Expenses />
              </HelpingRouter>
            }
          />
          <Route
            path="expenses"
            element={
              <HelpingRouter>
                <Expenses />
              </HelpingRouter>
            }
          />
          {/* Public: Login & Register */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </BrowserRouter>
  );
}

export default App;
