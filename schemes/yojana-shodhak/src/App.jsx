import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import WomenEligibility from './pages/WomenEligibility';
import FarmerEligibility from './pages/FarmerEligibility';
import SeniorCitizenEligibility from './pages/SeniorCitizenEligibility';
import SchemeDetails from './pages/SchemeDetails';
import MyApplications from './pages/MyApplications';
import Contact from './pages/Contact';
import BeneficiarySearch from './pages/BeneficiarySearch';
import SchemeComparison from './pages/SchemeComparison';
import SimilarityReport from './pages/SimilarityReport';

function App() {
  return (
    <Router>
      <div className="flex flex-col" style={{ minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/women-eligibility" element={<WomenEligibility />} />
            <Route path="/farmer-eligibility" element={<FarmerEligibility />} />
            <Route path="/senior-citizen-eligibility" element={<SeniorCitizenEligibility />} />
            <Route path="/scheme/:id" element={<SchemeDetails />} />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/search-beneficiary" element={<BeneficiarySearch />} />
            <Route path="/compare-schemes" element={<SchemeComparison />} />
            <Route path="/similarity-report" element={<SimilarityReport />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
