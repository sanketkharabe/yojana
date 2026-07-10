import React from 'react';

const MyApplications = () => {
  return (
    <div className="container" style={{ padding: '3rem 0', flex: 1 }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>माझे अर्ज (My Applications)</h1>
      <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <p className="text-lg text-muted">तुम्ही अद्याप कोणत्याही योजनेसाठी अर्ज केलेला नाही.</p>
        <p className="text-sm text-muted mt-2">जेव्हा तुम्ही अर्ज कराल, तेव्हा त्यांची माहिती येथे दिसेल.</p>
      </div>
    </div>
  );
};

export default MyApplications;
