import React from 'react';

const Contact = () => {
  return (
    <div className="container" style={{ padding: '3rem 0', flex: 1 }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>संपर्क साधा (Contact Us)</h1>
      <div className="card" style={{ padding: '2rem', backgroundColor: '#f8fafc', maxWidth: '600px', margin: '0 auto' }}>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>तुमचे नाव (Name)</label>
            <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }} placeholder="उदा. राहुल पाटील" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ईमेल (Email)</label>
            <input type="email" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }} placeholder="उदा. rahul@example.com" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>संदेश (Message)</label>
            <textarea style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '120px' }} placeholder="तुमचा संदेश येथे लिहा..."></textarea>
          </div>
          <button type="button" className="btn-primary" style={{ padding: '0.75rem', marginTop: '1rem' }}>पाठवा (Send)</button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
