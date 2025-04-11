import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BookingForm } from './components/BookingForm';
import { BookingHistory } from './components/BookingHistory';
import { BookingConfirmation } from './components/BookingConfirmation';
import { AdminDashboard } from './pages/AdminDashboard';
import { BookingProvider } from './contexts/BookingContext';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';

export default function App() {
  const { toast, hideToast } = useToast();

  return (
    <BookingProvider>
      <Router>
        <Routes>
          <Route path="/" element={<BookingForm services={[]} />} />
          <Route path="/history" element={<BookingHistory />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type as 'success' | 'error' | 'info'}
            visible={toast.visible}
            onHide={hideToast}
          />
        )}
      </Router>
    </BookingProvider>
  );
}