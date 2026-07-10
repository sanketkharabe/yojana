import React, { useState } from 'react';
import { MapPin, Info, ChevronDown, ArrowRight, ArrowLeft, CheckCircle2, Shield, Calendar, X, Check, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { checkEligibilityLocal } from '../data/logicTrees';

const FarmerEligibility = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    district: '',
    hasLand: false,
    income: '',
    isTaxpayer: false,
    isGovtEmployee: false,
    hasRccBuilding: false,
    hasSaurPump: false,
    hasFourWheeler: false
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
      gender: 'Male', // Default context for general farmer
      age: 40,
      income: Number(formData.income || 0),
      isTaxpayer: formData.isTaxpayer,
      isGovtEmployee: formData.isGovtEmployee,
      hasLand: formData.hasLand,
      hasPuccaHouse: formData.hasRccBuilding,
      hasRccBuilding: formData.hasRccBuilding,
      hasSaurPump: formData.hasSaurPump,
      hasFourWheeler: formData.hasFourWheeler
    };

    const schemesToEval = [
      { id: "pm kisan samman", name: "Pradhan Mantri Kisan Samman Nidhi (पीएम किसान)" },
      { id: "Agro Service Provider Scheme", name: "Agro Service Provider Scheme (अ‍ॅग्रो सर्व्हिस प्रोव्हायडर)" },
      { id: "awas", name: "Pradhan Mantri Awas Yojana (PMAY Awas)" },
      { id: "Ayushman Bharat", name: "Ayushman Bharat (आयुष्मान भारत)" }
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
    setStep(5); // Go to results screen
  };

  const handleReset = () => {
    setFormData({
      district: '',
      hasLand: false,
      income: '',
      isTaxpayer: false,
      isGovtEmployee: false,
      hasRccBuilding: false,
      hasSaurPump: false,
      hasFourWheeler: false
    });
    setResults(null);
    setStep(1);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', flex: 1, padding: '2rem 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">शेतकरी पात्रता तपासणी (Farmer Eligibility)</h1>
          <p className="text-muted text-sm font-medium">तुमची माहिती भरा आणि तुमच्यासाठी उपलब्ध असलेल्या शासकीय योजनांची यादी मिळवा.</p>
        </div>

        {step < 5 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            
            {/* Main Form Area */}
            <div>
              <div className="card" style={{ padding: '2rem' }}>
                
                {/* Horizontal progress indicators */}
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="font-semibold text-primary">टप्पा {step} पैकी ४</span>
                  <span className="font-semibold text-muted">{step * 25}% पूर्ण</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '2rem', overflow: 'hidden' }}>
                  <div style={{ width: `${step * 25}%`, height: '100%', backgroundColor: 'var(--color-accent)' }}></div>
                </div>

                {/* Step 1: Location & Land */}
                {step === 1 && (
                  <div className="flex flex-col gap-6">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <MapPin size={24} color="var(--color-primary)" />
                      <h2 className="text-xl font-bold">तुमचा जिल्हा आणि शेतजमीन स्थिती</h2>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>जिल्हा निवडा (District)</label>
                      <select 
                        value={formData.district} 
                        onChange={(e) => handleInputChange('district', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', outline: 'none', backgroundColor: 'white' }}
                      >
                        <option value="">निवडा (Select)</option>
                        <option value="Hingoli">हिंगोली (Hingoli)</option>
                        <option value="Nanded">नांदेड (Nanded)</option>
                        <option value="Parbhani">परभणी (Parbhani)</option>
                        <option value="Aurangabad">छत्रपती संभाजीनगर (Chhatrapati Sambhajinagar)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>तुमच्या नावावर लागवडीयोग्य शेतजमीन आहे का? (Cultivable Land)</label>
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasLand === true} onChange={() => handleSelectRadio('hasLand', true)} /> होय (Yes)
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasLand === false} onChange={() => handleSelectRadio('hasLand', false)} /> नाही (No)
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Income & Financials */}
                {step === 2 && (
                  <div className="flex flex-col gap-6">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <Calendar size={24} color="var(--color-primary)" />
                      <h2 className="text-xl font-bold">वार्षिक उत्पन्न आणि आर्थिक तपशील</h2>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>कुटुंबाचे एकूण वार्षिक उत्पन्न (₹)</label>
                      <input 
                        type="number" 
                        placeholder="उदा. १५००००"
                        value={formData.income}
                        onChange={(e) => handleInputChange('income', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Taxpayer and Job */}
                {step === 3 && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold">नोकरी आणि करदाता स्थिती</h2>
                    
                    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>कुटुंबात कोणी आयकर भरणारे (Taxpayer) सदस्य आहे का?</label>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.isTaxpayer === true} onChange={() => handleSelectRadio('isTaxpayer', true)} /> होय
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.isTaxpayer === false} onChange={() => handleSelectRadio('isTaxpayer', false)} /> नाही
                        </label>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>कुटुंबात कोणी सरकारी नोकरीत (Government Job) आहे का?</label>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.isGovtEmployee === true} onChange={() => handleSelectRadio('isGovtEmployee', true)} /> होय
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.isGovtEmployee === false} onChange={() => handleSelectRadio('isGovtEmployee', false)} /> नाही
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Asset Constraints (Solar/RCC/4-wheeler) */}
                {step === 4 && (
                  <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold">मालमत्ता आणि तांत्रिक साधने</h2>

                    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>तुमच्याकडे पक्के आरसीसी (RCC/Concrete) घर आहे का?</label>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasRccBuilding === true} onChange={() => handleSelectRadio('hasRccBuilding', true)} /> होय
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasRccBuilding === false} onChange={() => handleSelectRadio('hasRccBuilding', false)} /> नाही
                        </label>
                      </div>
                    </div>

                    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>तुम्ही सौर पंप (Saur Pump) किंवा सौर पॅनेल बसवले आहेत का?</label>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasSaurPump === true} onChange={() => handleSelectRadio('hasSaurPump', true)} /> होय
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasSaurPump === false} onChange={() => handleSelectRadio('hasSaurPump', false)} /> नाही
                        </label>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>तुमच्याकडे चारचाकी वाहन (Four-Wheeler) आहे का? (ट्रॅक्टर वगळून)</label>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasFourWheeler === true} onChange={() => handleSelectRadio('hasFourWheeler', true)} /> होय
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasFourWheeler === false} onChange={() => handleSelectRadio('hasFourWheeler', false)} /> नाही
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer buttons */}
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

                  {step < 4 ? (
                    <button onClick={handleNext} disabled={step === 1 && !formData.district || step === 2 && !formData.income} className="btn-primary flex items-center gap-2">
                      पुढील टप्पा <ArrowRight size={18} />
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
              
              {/* Info Card */}
              <div className="card" style={{ backgroundColor: '#f1f5f9', borderLeft: '4px solid var(--color-accent)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={18} color="var(--color-accent)" />
                  <h3 className="font-semibold text-primary">महत्त्वाची सूचना</h3>
                </div>
                <p className="text-sm text-muted">पीएम किसान आणि शेतकरी योजनांसाठी ७/१२ उतारा आणि शेतजमीन मालकी असणे अत्यंत गरजेचे आहे.</p>
              </div>

              {/* Data Safety */}
              <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={20} />
                  <h4 className="font-bold">सुरक्षितता हमी</h4>
                </div>
                <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  तुमचा गोळा केलेला डेटा स्थानिक पातळीवर तपासला जातो आणि सुरक्षा मानकांनुसार सुरक्षित आहे.
                </p>
              </div>

            </div>
          </div>
        ) : (
          /* RESULTS SCREEN */
          <div className="flex flex-col gap-6">
            <div className="card text-center" style={{ padding: '2rem', backgroundColor: '#e2e8f0' }}>
              <h2 className="text-2xl font-bold text-primary mb-2">पात्रता निकाल (Farmer Eligibility Results)</h2>
              <p className="text-sm text-muted">तुमच्या प्रोफाईलनुसार शेतकरी योजनांचे विश्लेषण खालीलप्रमाणे आहे.</p>
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

export default FarmerEligibility;
