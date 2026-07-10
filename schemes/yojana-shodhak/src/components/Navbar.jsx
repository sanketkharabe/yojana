import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Globe, User } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="glass-dark" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '1rem 0' }}>
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" style={{ color: 'white', textDecoration: 'none' }}>
          <Landmark size={32} color="var(--color-accent)" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ letterSpacing: '0.5px' }}>योजना</span>
            <span style={{ opacity: 0.5, fontSize: '1.25rem' }}>|</span>
            <span className="text-xl font-medium" style={{ opacity: 0.9 }}>Yojana</span>
          </div>
        </Link>

        <div className="flex items-center gap-8 text-sm font-medium">
          <Link to="/" style={{ color: 'white', textDecoration: 'none', borderBottom: '2px solid var(--color-accent)', paddingBottom: '4px' }}>Home</Link>
          <Link to="/search-beneficiary" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Search Beneficiary</Link>
          <Link to="/compare-schemes" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Scheme Comparison</Link>
          <Link to="/similarity-report" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Similarity Report</Link>
          <Link to="/my-applications" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>My Applications</Link>
          <Link to="/contact" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.2s' }}>Contact</Link>
        </div>

        <div className="flex items-center gap-4">
          <button style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Globe size={18} />
          </button>
          <button style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.1)', fontWeight: 500, fontSize: '0.875rem' }}>
            <User size={16} />
            <span>Login</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
