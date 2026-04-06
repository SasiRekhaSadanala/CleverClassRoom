import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ClassroomList from './pages/ClassroomList';
import ClassroomView from './pages/ClassroomView';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      <Route path="/classrooms" element={
        <PrivateRoute>
          <ClassroomList />
        </PrivateRoute>
      } />
      
      <Route path="/classroom/:id/*" element={
        <PrivateRoute>
          <ClassroomView />
        </PrivateRoute>
      } />
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
