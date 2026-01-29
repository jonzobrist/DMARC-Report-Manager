import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ReportDetail from './components/ReportDetail';

import FileManager from './components/FileManager';
import ReportsList from './components/ReportsList';
import DomainList from './components/DomainList';
import Settings from './components/Settings';
import Login from './components/Login';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';




function AppContent() {
    const { user, loading } = useAuth();
    if (loading) return null;

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/reports" element={<ReportsList />} />
                        <Route path="/domains" element={<DomainList />} />
                        <Route path="/report/:id" element={<ReportDetail />} />
                        <Route path="/files" element={<FileManager />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </Layout>
            } />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}


export default App
