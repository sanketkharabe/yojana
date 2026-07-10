import React, { useState } from 'react';
import { Search, Check, X, ShieldAlert, Award, FileText, User, Phone, MapPin, Loader2, Sparkles } from 'lucide-react';

const BeneficiarySearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch(`http://localhost:5000/api/search-beneficiary?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Server returned an error');
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search request failed:', err);
      setError('शोध घेताना त्रुटी आली. कृपया सर्व्हर चालू असल्याची खात्री करा. (Failed to fetch search results. Make sure backend is running.)');
    } finally {
      setLoading(false);
    }
  };

  const getMatchedFieldsText = (fields) => {
    return fields.map(f => {
      if (f === 'beneficiary_name') return 'नाव (Name)';
      if (f === 'father_or_husband_name') return 'वडिलांचे/पतीचे नाव (Father/Husband Name)';
      if (f === 'aadhaar') return 'आधार (Aadhaar)';
      if (f === 'mobile') return 'मोबाईल (Mobile)';
      return f;
    }).join(', ');
  };

  return (
    <div className="container" style={{ padding: '3rem 0', flex: 1 }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ffedd5', color: 'var(--color-accent)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>
          <Sparkles size={16} /> लाभार्थी शोध केंद्र • Beneficiary Search Hub
        </div>
        <h1 className="text-4xl font-extrabold mb-3 text-primary">योजना लाभार्थी शोध (Cross-Scheme Search)</h1>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
          नाव, आधार किंवा मोबाईल नंबरद्वारे सर्व सरकारी योजनांमधील लाभार्थी माहिती एकाच ठिकाणी शोधा. (Search across all imported schemes by Name, Aadhaar or Mobile.)
        </p>
      </div>

      {/* Search Input Box */}
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto 3rem auto', padding: '2rem', backgroundColor: 'white' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <div style={{ display: 'flex', border: '1.5px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#f8fafc', transition: 'border-color 0.2s', padding: '0.25rem' }}>
            <Search color="var(--color-text-muted)" size={22} style={{ margin: 'auto 0 auto 1rem' }} />
            <input 
              type="text" 
              placeholder="नाव, आधार क्रमांक, किंवा मोबाईल नंबर प्रविष्ट करा... (e.g. Umesh, 8412, 9420249174)" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '1rem', fontSize: '1.125rem', color: 'black', background: 'transparent' }}
            />
          </div>
          <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <span className="text-sm text-muted">💡 टीप: आधारचे शेवटचे ४ आकडे किंवा पूर्ण मोबाईल नंबर टाकून शोधल्यास अचूक निकाल मिळतील.</span>
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem 2.5rem', borderRadius: '8px', minWidth: '150px' }}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ display: 'inline-block' }} /> शोधत आहे...
                </>
              ) : 'शोधा (Search)'}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto 3rem auto', borderColor: '#fee2e2', backgroundColor: '#fef2f2', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ShieldAlert size={24} color="var(--color-error)" />
          <span style={{ color: '#b91c1c', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Search Results */}
      {searched && !loading && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
            📊 शोध निकाल (Search Results): {results.length} सापडले
          </h2>

          {results.length > 0 ? (
            <div className="flex flex-col gap-8">
              {results.map((beneficiary, index) => (
                <div key={index} className="card" style={{ padding: '2rem', backgroundColor: 'white', position: 'relative' }}>
                  
                  {/* Matching Score Badge */}
                  <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ 
                      backgroundColor: beneficiary.matching_score >= 90 ? '#d1fae5' : '#ffedd5',
                      color: beneficiary.matching_score >= 90 ? '#065f46' : '#9a3412',
                      padding: '0.35rem 1rem', 
                      borderRadius: '20px', 
                      fontSize: '0.875rem', 
                      fontWeight: 700 
                    }}>
                      🎯 {beneficiary.matching_score}% जुळणी (Match)
                    </span>
                    <span className="text-sm text-muted">द्वारे: {getMatchedFieldsText(beneficiary.matched_fields)}</span>
                  </div>

                  {/* Beneficiary Header Details */}
                  <div style={{ marginBottom: '2rem', maxWidth: '70%' }}>
                    <h3 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-secondary)' }}>
                      <User size={24} color="var(--color-accent)" />
                      {beneficiary.beneficiary_name}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText size={16} className="text-muted" />
                        <strong>आधार (Aadhaar):</strong> {beneficiary.aadhaar}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-muted" />
                        <strong>मोबाईल (Mobile):</strong> {beneficiary.mobile}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-muted" />
                        <strong>स्थान (Location):</strong> {beneficiary.village}, {beneficiary.taluka}, {beneficiary.district}
                      </div>
                    </div>
                  </div>

                  {/* Schemes Status Matrix */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <h4 className="font-semibold text-primary mb-4 flex items-center gap-2" style={{ fontSize: '1.1rem' }}>
                      <Award size={18} color="var(--color-accent)" />
                      सर्व योजनांमधील सहभाग स्थिती (Scheme Status Matrix):
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      {beneficiary.schemes.map((scheme, sIdx) => {
                        const isFound = scheme.status === 'Found';
                        return (
                          <div key={sIdx} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '0.85rem 1.25rem', 
                            backgroundColor: isFound ? '#f0fdf4' : '#f8fafc', 
                            border: `1px solid ${isFound ? '#bbf7d0' : 'var(--color-border)'}`,
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                          }}>
                            <div className="flex flex-col">
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isFound ? '#166534' : 'var(--color-text-main)' }}>
                                {scheme.scheme_name_en}
                              </span>
                              <span className="text-sm text-muted">
                                {scheme.scheme_name_mr}
                              </span>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.25rem', 
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: isFound ? '#15803d' : '#ef4444',
                              backgroundColor: isFound ? '#d1fae5' : '#fee2e2',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px'
                            }}>
                              {isFound ? (
                                <>
                                  <Check size={16} /> Found
                                </>
                              ) : (
                                <>
                                  <X size={16} /> Not Found
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              <p className="text-lg text-muted">कोणताही जुळणारा लाभार्थी सापडला नाही.</p>
              <p className="text-sm text-muted mt-2">कृपया नाव बरोबर लिहिले आहे का, किंवा योग्य आधार क्रमांक/मोबाईल नंबर टाकला आहे का ते तपासा.</p>
            </div>
          )}
        </div>
      )}

      {/* CSS Spin Keyframes */}
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

export default BeneficiarySearch;
