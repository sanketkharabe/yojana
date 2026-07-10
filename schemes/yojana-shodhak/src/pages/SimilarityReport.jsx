import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, CheckCircle2, ChevronRight, Search, Loader2, ShieldAlert, Award } from 'lucide-react';

const SimilarityReport = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/similarity-report')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load report');
        return res.json();
      })
      .then(data => {
        setReport(data);
      })
      .catch(err => {
        console.error(err);
        setError('साम्य लाभार्थी अहवाल लोड करू शकलो नाही. कृपया तुलना इंजिन चालविल्याची आणि सर्व्हर चालू असल्याची खात्री करा. (Failed to load similarity report. Make sure comparison engine has run and server is online.)');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getMatchedFieldName = (field) => {
    if (field === 'name') return 'नाव (Name)';
    if (field === 'village') return 'गाव (Village)';
    if (field === 'mobile') return 'मोबाईल (Mobile)';
    if (field === 'aadhaar') return 'आधार (Aadhaar)';
    return field;
  };

  const getShortSchemeName = (scheme) => {
    if (!scheme) return 'N/A';
    if (scheme.includes('Ladki Bahin')) return 'Ladki Bahin';
    if (scheme.includes('Kisan Samman') || scheme.includes('KISAN')) return 'PM Kisan';
    if (scheme.includes('Ujjwala') || scheme.includes('PMUY')) return 'PM Ujjwala';
    return scheme;
  };

  const filteredReport = report.filter(item => {
    const q = filterQuery.toLowerCase();
    return (
      item.beneficiaryA.name.toLowerCase().includes(q) ||
      item.beneficiaryB.name.toLowerCase().includes(q) ||
      item.beneficiaryA.village.toLowerCase().includes(q) ||
      item.beneficiaryB.village.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container" style={{ padding: '3rem 0', flex: 1 }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff7ed', color: 'var(--color-accent)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
          <Sparkles size={16} /> साम्य अहवाल • Similarity Hub
        </div>
        <h1 className="text-4xl font-extrabold mb-3 text-primary">साम्य लाभार्थी अहवाल (Name Similarity Report)</h1>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
          विविध योजना आणि गावांमध्ये सारखे नाव किंवा गुणधर्म आढळलेल्या व्यक्तींची यादी. (Automatically generated report showing similar beneficiaries across schemes and locations.)
        </p>
      </div>

      {/* Stats Summary and Search Bar */}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#f8fafc' }}>
            <span className="text-sm text-muted">एकूण साम्य गट (Total Matches)</span>
            <div className="text-3xl font-bold mt-1 text-primary">{report.length}</div>
          </div>

          <div className="card" style={{ padding: '1rem 1.5rem', backgroundColor: 'white', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Search size={20} color="var(--color-text-muted)" />
            <input 
              type="text" 
              placeholder="नावाने किंवा गावाने अहवाल फिल्टर करा... (Filter by name or village...)"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', color: 'black' }}
            />
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem 0' }}>
          <Loader2 size={36} className="animate-spin text-primary" style={{ display: 'inline-block' }} />
          <span style={{ marginLeft: '1rem', fontSize: '1.125rem', fontWeight: 500 }}>अहवाल तयार करत आहे... (Generating report...)</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="card" style={{ borderColor: '#fee2e2', backgroundColor: '#fef2f2', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ShieldAlert size={24} color="var(--color-error)" />
          <span style={{ color: '#b91c1c', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Similarity Report Cards */}
      {!loading && !error && (
        <div>
          {filteredReport.length > 0 ? (
            <div className="flex flex-col gap-6">
              {filteredReport.map((item, index) => (
                <div key={index} className="card" style={{ padding: '2rem', backgroundColor: 'white', borderLeft: '5px solid var(--color-accent)' }}>
                  
                  {/* Card Header showing match percentage */}
                  <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={20} color="var(--color-accent)" />
                      <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                        साम्य शोध #{index + 1} (Match #{index + 1})
                      </span>
                    </div>
                    
                    <span style={{ 
                      backgroundColor: item.matching_score >= 95 ? '#d1fae5' : '#ffedd5',
                      color: item.matching_score >= 95 ? '#065f46' : '#9a3412',
                      padding: '0.35rem 1.25rem', 
                      borderRadius: '20px', 
                      fontSize: '0.9rem', 
                      fontWeight: 700 
                    }}>
                      🎯 {item.matching_score}% साम्य (Match)
                    </span>
                  </div>

                  {/* Side-by-Side Comparison Container */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    
                    {/* Beneficiary A */}
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <span className="text-xs text-muted" style={{ fontWeight: 600 }}>योजना अ (Scheme A) - {getShortSchemeName(item.beneficiaryA.scheme)}</span>
                      <h4 className="text-lg font-bold text-primary mt-2">{item.beneficiaryA.name}</h4>
                      <div className="text-sm text-muted mt-2">
                        📍 {item.beneficiaryA.village}, {item.beneficiaryA.taluka}, {item.beneficiaryA.district}
                      </div>
                    </div>

                    {/* Middle Transition arrow */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ChevronRight size={24} color="var(--color-accent)" />
                    </div>

                    {/* Beneficiary B */}
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <span className="text-xs text-muted" style={{ fontWeight: 600 }}>योजना ब (Scheme B) - {getShortSchemeName(item.beneficiaryB.scheme)}</span>
                      <h4 className="text-lg font-bold text-primary mt-2">{item.beneficiaryB.name}</h4>
                      <div className="text-sm text-muted mt-2">
                        📍 {item.beneficiaryB.village}, {item.beneficiaryB.taluka}, {item.beneficiaryB.district}
                      </div>
                    </div>

                  </div>

                  {/* Matched Fields List */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <span className="text-sm font-semibold text-primary" style={{ marginRight: '1rem' }}>
                      समान आढळलेले तपशील (Matched Fields):
                    </span>
                    <div style={{ display: 'inline-flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {item.matched_fields.map((field, fIdx) => (
                        <span key={fIdx} style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.85rem', 
                          fontWeight: 600,
                          color: 'var(--color-green)',
                          backgroundColor: '#f0fdf4',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          border: '1px solid #bbf7d0'
                        }}>
                          <CheckCircle2 size={14} /> {getMatchedFieldName(field)}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              <p className="text-lg text-muted">कोणताही साम्य लाभार्थी आढळला नाही.</p>
            </div>
          )}
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

export default SimilarityReport;
