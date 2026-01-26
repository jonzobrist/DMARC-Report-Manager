import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ReportDetail from './components/ReportDetail';

import FileManager from './components/FileManager';
import ReportsList from './components/ReportsList';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/reports" element={<ReportsList />} />
                    <Route path="/report/:id" element={<ReportDetail />} />
                    <Route path="/files" element={<FileManager />} />
                </Routes>
            </Layout>
        </Router>
    )
}

export default App
