import React, { useState } from 'react';

const Footer = () => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (!feedback.trim()) {
      alert('कृपया आधी अभिप्राय लिहा!');
      return;
    }
    alert('तुमचा अभिप्राय यशस्वीरीत्या सादर केला गेला आहे! धन्यवाद.');
    setFeedback('');
  };

  return (
    <footer style={{ backgroundColor: 'var(--color-primary)', color: 'white', marginTop: 'auto', borderTop: '4px solid var(--color-accent)' }}>
      {/* Feedback Section */}
      <div style={{ backgroundColor: 'var(--color-primary-hover)', padding: '3rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container flex flex-col items-center">
          <h3 className="font-bold mb-2 text-xl" style={{ color: 'white' }}>तुमचा अभिप्राय (Feedback)</h3>
          <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1.5rem', textAlign: 'center' }}>
            तुम्हाला अपेक्षित असलेली योजना सापडली नाही का? आम्हाला कळवा. आम्ही ती जोडण्याचा नक्की प्रयत्न करू.
          </p>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <textarea 
              placeholder="तुमचा अभिप्राय येथे लिहा..." 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', resize: 'none', marginBottom: '1rem', fontSize: '0.875rem', outline: 'none' }}
            ></textarea>
            <button onClick={handleSubmit} className="btn-primary w-full" style={{ padding: '0.75rem', fontSize: '0.875rem', letterSpacing: '0.5px' }}>सादर करा (Submit)</button>
          </div>
        </div>
      </div>
      
      <div className="container flex items-center justify-between text-sm" style={{ padding: '2rem 0', color: '#94a3b8' }}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" style={{ height: '32px', filter: 'brightness(0) invert(1) opacity(0.8)' }} />
            <span className="font-bold text-xl" style={{ color: 'white' }}>योजना शोधक</span>
          </div>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>डिजिटल इंडिया उपक्रमाचा एक भाग</span>
        </div>
        <div className="flex gap-6 font-medium">
          <a href="#" style={{ color: '#cbd5e1' }}>Privacy Policy</a>
          <a href="#" style={{ color: '#cbd5e1' }}>Terms of Service</a>
          <a href="#" style={{ color: '#cbd5e1' }}>Help Center</a>
          <a href="#" style={{ color: '#cbd5e1' }}>Accessibility</a>
        </div>
        <div style={{ opacity: 0.8 }}>
          © 2024 Government of India. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
