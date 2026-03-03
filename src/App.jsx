import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Trains from './pages/Trains'
import TrainDetails from './pages/TrainDetails'
import BookTicket from './pages/BookTicket'
import MyBookings from './pages/MyBookings'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTrains from './pages/admin/AdminTrains'
import AdminStations from './pages/admin/AdminStations'
import AdminSchedules from './pages/admin/AdminSchedules'

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Home />} />
                            <Route path="trains" element={<Trains />} />
                            <Route path="trains/:id" element={<TrainDetails />} />
                            <Route path="book/:id" element={
                                <ProtectedRoute>
                                    <BookTicket />
                                </ProtectedRoute>
                            } />
                            <Route path="my-bookings" element={
                                <ProtectedRoute>
                                    <MyBookings />
                                </ProtectedRoute>
                            } />
                            <Route path="signin" element={<SignIn />} />
                            <Route path="signup" element={<SignUp />} />

                            {/* Admin Routes */}
                            <Route path="admin" element={
                                <AdminRoute>
                                    <AdminDashboard />
                                </AdminRoute>
                            } />
                            <Route path="admin/trains" element={
                                <AdminRoute>
                                    <AdminTrains />
                                </AdminRoute>
                            } />
                            <Route path="admin/stations" element={
                                <AdminRoute>
                                    <AdminStations />
                                </AdminRoute>
                            } />
                            <Route path="admin/schedules" element={
                                <AdminRoute>
                                    <AdminSchedules />
                                </AdminRoute>
                            } />
                        </Route>
                    </Routes>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
