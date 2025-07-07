import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import Add from "./pages/Add";
import Select from "./pages/Select";
import Report from "./pages/Report";
import Pemasukan from "./pages/Pemasukan";
import ProtectedRoute from "./components/ProtectedRoute"; 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/add" element={
          <ProtectedRoute>
            <Add />
          </ProtectedRoute>
        } />
        <Route path="/select" element={
          <ProtectedRoute>
            <Select />
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        } />
        <Route path="/pemasukan" element={
          <ProtectedRoute>
            <Pemasukan />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
