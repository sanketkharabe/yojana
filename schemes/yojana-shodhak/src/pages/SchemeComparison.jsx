import React, { useState, useEffect } from 'react';
import { Columns, ArrowLeftRight, CheckCircle2, AlertCircle, Loader2, BarChart2, ShieldAlert, Check } from 'lucide-react';

const SchemeComparison = () => {
  const [schemes, setSchemes] = useState([]);
  const [schemeA, setSchemeA] = useState('');
  const [schemeB, setSchemeB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch schemes list
  useEffect(() => {
    fetch('http://localhost:5000/api/schemes')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load schemes');
        return res.json();
      })
      .then(data => {
        // Filter out empty/unnamed schemes
        const filtered = data.filter(s => s.scheme_name_en || s.short_name);
        setSchemes(filtered);
      })
      .catch(err => {
        console.error(err);
        setError('योजनांची यादी लोड करू शकलो नाही. कृपया सर्व्हर चालू असल्याची खात्री करा. (Failed to load schemes list. Make sure backend is running.)');
      });
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!schemeA || !schemeB) {
      setError('कृपया तुलना करण्यासाठी दोन्ही योजना निवडा. (Please select both schemes to compare.)');
      return;
    }
    if (schemeA === schemeB) {
      setError('कृपया दोन वेगवेगळ्या योजना निवडा. (Please select two different schemes to compare.)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`http://localhost:5000/api/compare-schemes?schemeA=${schemeA}&schemeB=${schemeB}`);
      if (!response.ok) {
        throw new Error('Comparison failed');
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('तुलना करताना त्रुटी आली. कृपया सर्व्हर तपासा. (Failed to retrieve comparison statistics. Make sure backend is running.)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 0', flex: 1 }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#e0e7ff', color: 'var(--color-secondary)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
          <Columns size={16} /> तुलना मंच • Comparison Panel
        </div>
        <h1 className="text-4xl font-extrabold mb-3 text-primary">योजना-ते-योजना तुलना (Scheme Comparison)</h1>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
          कोणत्याही दोन योजनांमधील लाभार्थी संख्या, सामायिक लाभार्थी आणि साम्य गुणोत्तर यांची तुलना करा. (Compare beneficiaries, overlaps, and duplicates between any two schemes.)
        </p>
      </div>

      {/* Select Dropdowns Form */}
      <div className="card" style={{ maxWidth: '850px', margin: '0 auto 3rem auto', padding: '2rem', backgroundColor: 'white' }}>
        <form onSubmit={handleCompare} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            
            {/* Scheme A select */}
            <div className="flex flex-col gap-2">
              <label style={{ fontWeight: 600, color: 'var(--color-primary)' }}>योजना अ (Scheme A):</label>
              <select 
                value={schemeA}
                onChange={(e) => setSchemeA(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1.5px solid var(--color-border)', outline: 'none', fontSize: '0.95rem', backgroundColor: '#f8fafc', color: 'black' }}
              >
                <option value="">-- योजना निवडा (Select Scheme) --</option>
                {schemes.map(s => (
                  <option key={s.id} value={s.id}>{s.scheme_name_en || s.short_name}</option>
                ))}
              </select>
            </div>

            {/* Middle decorative icon */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0 0 0' }}>
              <div style={{ backgroundColor: '#ffedd5', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                <ArrowLeftRight size={22} />
              </div>
            </div>

            {/* Scheme B select */}
            <div className="flex flex-col gap-2">
              <label style={{ fontWeight: 600, color: 'var(--color-primary)' }}>योजना ब (Scheme B):</label>
              <select 
                value={schemeB}
                onChange={(e) => setSchemeB(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1.5px solid var(--color-border)', outline: 'none', fontSize: '0.95rem', backgroundColor: '#f8fafc', color: 'black' }}
              >
                <option value="">-- योजना निवडा (Select Scheme) --</option>
                {schemes.map(s => (
                  <option key={s.id} value={s.id}>{s.scheme_name_en || s.short_name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Action button */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.85rem 3rem', borderRadius: '8px', minWidth: '200px' }}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ display: 'inline-block' }} /> तुलना करत आहे...
                </>
              ) : 'तुलना करा (Compare)'}
            </button>
          </div>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="card" style={{ maxWidth: '850px', margin: '0 auto 3rem auto', borderColor: '#fee2e2', backgroundColor: '#fef2f2', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ShieldAlert size={24} color="var(--color-error)" />
          <span style={{ color: '#b91c1c', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Comparison Results Dashboard */}
      {result && (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Top Overlap metrics banner */}
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)', 
            color: 'white', 
            padding: '2.5rem', 
            borderRadius: '16px',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
              सामायिक लाभार्थी जुळणी (Common Overlap Match)
            </h3>
            <div className="text-5xl font-extrabold mb-3" style={{ color: 'var(--color-accent)' }}>
              {result.match_percentage_union}% Match
            </div>
            <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1rem', opacity: 0.9 }}>
              दोन्ही योजनांमध्ये एकूण <strong>{result.common_beneficiaries}</strong> सामायिक व्यक्ती आढळल्या आहेत, ज्यामध्ये <strong>{result.duplicate_beneficiaries_common}</strong> डुप्लिकेट रेकॉर्ड्सचा समावेश आहे.
              (Found {result.common_beneficiaries} common unique individuals matching across both schemes.)
            </p>

            {/* Overlap Progress Bar */}
            <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', height: '10px', borderRadius: '5px', marginTop: '2rem', overflow: 'hidden' }}>
              <div style={{ width: `${result.match_percentage_union}%`, backgroundColor: 'var(--color-accent)', height: '100%', transition: 'width 0.5s ease-out' }}></div>
            </div>
          </div>

          {/* Scheme Side-by-Side metrics card grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            {/* Scheme A stats card */}
            <div className="card" style={{ padding: '2rem', backgroundColor: 'white', borderTop: '5px solid var(--color-accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <span className="text-sm text-muted">योजना अ (Scheme A)</span>
                  <h4 className="text-xl font-bold text-primary mt-1">{result.schemeA.name_en}</h4>
                  <span className="text-sm text-muted">{result.schemeA.name_mr}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>एकूण लाभार्थी (Total Beneficiaries):</span>
                  <strong className="text-lg">{result.schemeA.total_beneficiaries}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>अनन्य व्यक्ती (Unique Beneficiaries):</span>
                  <strong className="text-lg text-primary">{result.schemeA.unique_beneficiaries}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>डुप्लिकेट रेकॉर्ड्स (Duplicates):</span>
                  <strong className="text-lg text-muted">{result.schemeA.duplicate_beneficiaries}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                  <span>ब मध्ये जुळलेले प्रमाण (Overlap in B):</span>
                  <strong style={{ color: 'var(--color-accent)' }}>{result.match_percentage_schemeA}%</strong>
                </div>
              </div>
            </div>

            {/* Scheme B stats card */}
            <div className="card" style={{ padding: '2rem', backgroundColor: 'white', borderTop: '5px solid var(--color-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <span className="text-sm text-muted">योजना ब (Scheme B)</span>
                  <h4 className="text-xl font-bold text-primary mt-1">{result.schemeB.name_en}</h4>
                  <span className="text-sm text-muted">{result.schemeB.name_mr}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>एकूण लाभार्थी (Total Beneficiaries):</span>
                  <strong className="text-lg">{result.schemeB.total_beneficiaries}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>अनन्य व्यक्ती (Unique Beneficiaries):</span>
                  <strong className="text-lg text-primary">{result.schemeB.unique_beneficiaries}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed var(--color-border)' }}>
                  <span>डुप्लिकेट रेकॉर्ड्स (Duplicates):</span>
                  <strong className="text-lg text-muted">{result.schemeB.duplicate_beneficiaries}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                  <span>सामायिक प्रमाण (Overlap in B):</span>
                  <strong style={{ color: 'var(--color-secondary)' }}>{result.match_percentage_union}%</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Venn Diagram Visual Representation */}
          <div className="card" style={{ padding: '2rem', marginTop: '2rem', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 className="font-semibold text-primary mb-6 flex items-center gap-2" style={{ fontSize: '1.1rem' }}>
              <BarChart2 size={18} color="var(--color-accent)" />
              जुळणी गुणोत्तर आकृती (Venn Overlap Representation):
            </h4>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '320px', height: '200px' }}>
              {/* Left Circle (Scheme A) */}
              <div style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(249, 115, 22, 0.25)', 
                border: '2px solid var(--color-accent)', 
                position: 'absolute', 
                left: '20px', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                textAlign: 'center',
                zIndex: 1
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Scheme A</span>
                <strong style={{ fontSize: '1.25rem' }}>{result.schemeA.total_beneficiaries}</strong>
              </div>

              {/* Intersect Overlap Label */}
              <div style={{ 
                position: 'absolute',
                zIndex: 10,
                backgroundColor: '#0f172a',
                color: 'white',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                boxShadow: 'var(--shadow-md)'
              }}>
                Common: {result.common_beneficiaries}
              </div>

              {/* Right Circle (Scheme B) */}
              <div style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(30, 58, 138, 0.25)', 
                border: '2px solid var(--color-secondary)', 
                position: 'absolute', 
                right: '20px', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                textAlign: 'center',
                zIndex: 2
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Scheme B</span>
                <strong style={{ fontSize: '1.25rem' }}>{result.schemeB.total_beneficiaries}</strong>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* CSS spin keyframes */}
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SchemeComparison;
