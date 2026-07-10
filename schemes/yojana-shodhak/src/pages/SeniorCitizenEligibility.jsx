import React, { useState } from 'react';
import { Shield, Train, PlusCircle, CreditCard, Calendar, ArrowRight, ArrowLeft, ChevronRight, CheckCircle2, X, Check, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { checkEligibilityLocal } from '../data/logicTrees';

const SeniorCitizenEligibility = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    income: '',
    hasRccBuilding: false
  });
  
  const [results, setResults] = useState(null);

  const handleSelectRadio = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleCheckEligibility = () => {
    const inputs = {
      gender: 'Male', // general check
      age: Number(formData.age || 0),
      income: Number(formData.income || 0),
      hasRccBuilding: formData.hasRccBuilding
    };

    const schemesToEval = [
      { id: "Ayushman Bharat", name: "Ayushman Bharat - PM-JAY (Vay Vandana Card)" },
      { id: "pm suraksha ", name: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)" },
      { id: "pm jivan jyoti", name: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)" }
    ];

    const evaluationResults = schemesToEval.map(scheme => {
      const res = checkEligibilityLocal(scheme.id, inputs);
      return {
        schemeId: scheme.id,
        schemeName: scheme.name,
        ...res
      };
    });

    setResults(evaluationResults);
    setStep(4); // Go to results screen
  };

  const handleReset = () => {
    setFormData({
      age: '',
      income: '',
      hasRccBuilding: false
    });
    setResults(null);
    setStep(1);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', flex: 1, padding: '2rem 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link to="/" style={{ color: 'var(--color-text-muted)' }}>मुख्य पृष्ठ</Link>
          <ChevronRight size={14} color="var(--color-text-muted)" />
          <span style={{ color: 'var(--color-text-muted)' }}>पात्रता</span>
          <ChevronRight size={14} color="var(--color-text-muted)" />
          <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>ज्येष्ठ नागरिक</span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">ज्येष्ठ नागरिक पात्रता तपासणी (Senior Citizen Eligibility)</h1>
          <p className="text-muted text-sm">सरकारी योजनांसाठी आपली पात्रता तपासण्यासाठी खालील सोप्या प्रश्नांची उत्तरे द्या.</p>
        </div>

        {step < 4 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            
            {/* Main Form Area */}
            <div>
              <div className="card" style={{ padding: '2rem' }}>
                
                {/* Progress Bar */}
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="font-semibold text-primary">टप्पा {step} पैकी ३</span>
                  <span className="font-semibold text-muted">{Math.round((step / 3) * 100)}% पूर्ण</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '2rem', overflow: 'hidden' }}>
                  <div style={{ width: `${(step / 3) * 100}%`, height: '100%', backgroundColor: 'var(--color-accent)' }}></div>
                </div>

                {/* Step 1: Age */}
                {step === 1 && (
                  <div className="flex flex-col gap-6">
                    <div style={{ backgroundColor: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--color-accent)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <Calendar size={24} color="var(--color-accent)" style={{ marginTop: '0.25rem' }} />
                      <div>
                        <h2 className="text-xl font-bold mb-1">आपले वय किती आहे? (Age)</h2>
                        <p className="text-sm text-muted">वाय वंदना कार्ड ७० वर्षे किंवा त्याहून अधिक वयाच्या नागरिकांना थेट मोफत उपचार देते.</p>
                      </div>
                    </div>
                    
                    <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                      <input 
                        type="number" 
                        placeholder="उदा. ७२" 
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1.25rem', outline: 'none', textAlign: 'center', fontWeight: 600 }}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Income */}
                {step === 2 && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold">कुटुंबाचे एकूण वार्षिक उत्पन्न</h2>
                    
                    <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                      <input 
                        type="number" 
                        placeholder="उदा. १५००००" 
                        value={formData.income}
                        onChange={(e) => handleInputChange('income', e.target.value)}
                        style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1.25rem', outline: 'none', textAlign: 'center', fontWeight: 600 }}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Assets */}
                {step === 3 && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold">मालमत्ता तपशील</h2>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>तुमच्या घराला पक्के आरसीसी (Concrete/RCC) छत किंवा पक्की इमारत आहे का?</label>
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasRccBuilding === true} onChange={() => handleSelectRadio('hasRccBuilding', true)} /> होय
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasRccBuilding === false} onChange={() => handleSelectRadio('hasRccBuilding', false)} /> नाही
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                  {step > 1 ? (
                    <button onClick={handleBack} className="btn-outline flex items-center gap-2">
                      <ArrowLeft size={18} /> मागे
                    </button>
                  ) : (
                    <Link to="/" className="btn-outline flex items-center gap-2">
                      <ArrowLeft size={18} /> मुख्यपृष्ठ
                    </Link>
                  )}

                  {step < 3 ? (
                    <button onClick={handleNext} disabled={step === 1 && !formData.age || step === 2 && !formData.income} className="btn-primary flex items-center gap-2">
                      पुढील पाऊल <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button onClick={handleCheckEligibility} className="btn-primary flex items-center gap-2" style={{ backgroundColor: 'var(--color-green)' }}>
                      पात्रता तपासा <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Right Sidebar */}
            <div className="flex flex-col gap-6">
              
              {/* Safe Data Card */}
              <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '1.5rem' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield size={24} />
                  <h3 className="font-bold text-lg">तुमचा डेटा सुरक्षित आहे</h3>
                </div>
                <p className="text-sm" style={{ opacity: 0.9, lineHeight: 1.6 }}>
                  आम्ही घेतलेली माहिती फक्त तुमच्या पात्रतेची गणना करण्यासाठी वापरली जाते. ही माहिती कुठेही साठवली जात नाही.
                </p>
              </div>

              {/* Benefits Card */}
              <div className="card" style={{ backgroundColor: '#f1f5f9' }}>
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ color: 'var(--color-primary)' }}>✤</span>
                  <h3 className="font-semibold text-primary">ज्येष्ठ नागरिक योजनांचे फायदे</h3>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'white', padding: '0.75rem', borderRadius: '8px' }}>
                    <PlusCircle size={20} color="var(--color-accent)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>मोफत वैद्यकीय उपचार (५ लाख रु.)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'white', padding: '0.75rem', borderRadius: '8px' }}>
                    <CreditCard size={20} color="var(--color-accent)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>असंघटित विमा सहाय्य</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* RESULTS SCREEN */
          <div className="flex flex-col gap-6">
            <div className="card text-center" style={{ padding: '2rem', backgroundColor: '#e2e8f0' }}>
              <h2 className="text-2xl font-bold text-primary mb-2">पात्रता निकाल (Senior Citizen Eligibility Results)</h2>
              <p className="text-sm text-muted">तुमच्या प्रोफाईलनुसार योजनांचे विश्लेषण खालीलप्रमाणे आहे.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {results.map((res) => (
                <div 
                  key={res.schemeId} 
                  className="card flex flex-col justify-between" 
                  style={{ 
                    borderTop: `4px solid ${res.eligible ? 'var(--color-success)' : 'var(--color-error)'}`
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-md text-primary">{res.schemeName}</h3>
                      <span style={{ 
                        backgroundColor: res.eligible ? 'var(--color-success-bg)' : '#fee2e2', 
                        color: res.eligible ? '#047857' : '#b91c1c',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {res.eligible ? 'पात्र (Eligible)' : 'अपात्र (Ineligible)'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 mb-6">
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>पडताळणी मार्ग (Verification Path):</h4>
                      <div className="flex flex-col gap-1">
                        {res.auditLog.map((log, lIdx) => (
                          <div 
                            key={lIdx} 
                            style={{ 
                              fontSize: '0.75rem', 
                              color: log.success ? '#047857' : (log.type === 'indirect' ? '#b45309' : '#b91c1c'),
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.25rem'
                            }}
                          >
                            <span>{log.success ? '✓' : '✗'}</span>
                            <div>
                              <strong>{log.type === 'indirect' ? '[अप्रत्यक्ष]: ' : ''}{log.message_mr}</strong>
                              <span style={{ display: 'block', fontSize: '0.6875rem', opacity: 0.8 }}>{log.message_en}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }} className="flex justify-between items-center">
                    <Link to={`/scheme/${res.schemeId}`} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                      योजनेचे निकष पहा →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-6">
              <button onClick={handleReset} className="btn-primary">
                पुन्हा तपासा (Reset)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeniorCitizenEligibility;
