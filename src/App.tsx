import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookingForm } from './components/BookingForm';
import { BookingHistory } from './components/BookingHistory';
import { BookingConfirmation } from './components/BookingConfirmation';
import { AdminDashboard } from './pages/AdminDashboard';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';

function App() {
  const { toast, hideToast } = useToast();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookingForm />} />
        <Route path="/history" element={<BookingHistory />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </BrowserRouter>
  );
}

export default App