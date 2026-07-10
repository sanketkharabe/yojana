import React, { useState } from 'react';
import { User, Users, HeartCrack, UserMinus, Info, CheckCircle, ArrowLeft, Building, HelpCircle, AlertTriangle, Check, X, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { checkEligibilityLocal } from '../data/logicTrees';

const WomenEligibility = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    maritalStatus: 'unmarried', // unmarried, married, widow, divorced, abandoned
    age: '',
    income: '',
    isTaxpayer: false,
    isGovtEmployee: false,
    hasFourWheeler: false,
    hasRccBuilding: false,
    hasSaurPump: false,
    hasLpgConnection: false
  });
  
  const [results, setResults] = useState(null);

  const handleSelectRadio = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberInput = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleCheckEligibility = () => {
    // Construct inputs
    const inputs = {
      gender: 'Female',
      age: Number(formData.age || 0),
      income: Number(formData.income || 0),
      isTaxpayer: formData.isTaxpayer,
      isGovtEmployee: formData.isGovtEmployee,
      hasFourWheeler: formData.hasFourWheeler,
      hasPuccaHouse: formData.hasRccBuilding, // RCC building implies owning a pucca house
      hasRccBuilding: formData.hasRccBuilding,
      hasSaurPump: formData.hasSaurPump,
      hasLpgConnection: formData.hasLpgConnection,
      isWidow: formData.maritalStatus === 'widow'
    };

    // Schemes to evaluate
    const schemesToEval = [
      { id: "ladki bhainn", name: "Mukhyamantri Majhi Ladki Bahin Yojana (लाडकी बहीण)" },
      { id: "ujwala scheme", name: "Pradhan Mantri Ujjwala Yojana (उज्ज्वला)" },
      { id: "Indira Gandhi National Widow Pension Scheme", name: "Indira Gandhi National Widow Pension Scheme (विधवा पेन्शन)" },
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
    setStep(6); // Go to results screen
  };

  const handleReset = () => {
    setFormData({
      maritalStatus: 'unmarried',
      age: '',
      income: '',
      isTaxpayer: false,
      isGovtEmployee: false,
      hasFourWheeler: false,
      hasRccBuilding: false,
      hasSaurPump: false,
      hasLpgConnection: false
    });
    setResults(null);
    setStep(1);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', flex: 1, padding: '2rem 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">महिला पात्रता तपासणी (Women Eligibility)</h1>
          <p className="text-muted text-sm">तुमच्यासाठी उपलब्ध असलेल्या सरकारी योजना शोधण्यासाठी सोप्या प्रश्नांची उत्तरे द्या.</p>
        </div>

        {step < 6 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem' }}>
            
            {/* Left Progress Panel */}
            <div>
              <div className="card" style={{ padding: '1.5rem 1rem' }}>
                <h3 className="font-bold text-primary mb-4" style={{ fontSize: '0.875rem' }}>प्रगती (Progress)</h3>
                <div className="flex flex-col gap-4 relative">
                  <div style={{ position: 'absolute', left: '11px', top: '15px', bottom: '15px', width: '2px', backgroundColor: 'var(--color-border)', zIndex: 0 }}></div>
                  
                  {[
                    "वैवाहिक स्थिती",
                    "तुमचे वय",
                    "वार्षिक उत्पन्न",
                    "नोकरी व करदाता",
                    "मालमत्ता आणि इतर"
                  ].map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = step === stepNum;
                    const isCompleted = step > stepNum;
                    
                    return (
                      <div key={idx} className="flex items-center gap-3 relative z-10" style={{ backgroundColor: 'white', padding: '2px 0' }}>
                        {isCompleted ? (
                          <CheckCircle size={20} color="var(--color-success)" fill="white" />
                        ) : (
                          <div style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            backgroundColor: 'white',
                            fontSize: '0.75rem',
                            fontWeight: isActive ? 700 : 400,
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'
                          }}>
                            {stepNum}
                          </div>
                        )}
                        <span style={{ 
                          fontSize: '0.8125rem', 
                          fontWeight: isActive || isCompleted ? 600 : 400, 
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' 
                        }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Form Question Area */}
            <div className="flex flex-col gap-6">
              
              {/* Step 1: Marital Status */}
              {step === 1 && (
                <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>१</div>
                    <h2 className="text-xl font-bold">तुमची वैवाहिक स्थिती काय आहे?</h2>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[
                      { id: 'unmarried', label: 'अविवाहित (Unmarried)', icon: <User size={24} /> },
                      { id: 'married', label: 'विवाहित (Married)', icon: <Users size={24} /> },
                      { id: 'widow', label: 'विधवा (Widow)', icon: <HeartCrack size={24} /> },
                      { id: 'divorced', label: 'घटस्फोटित (Divorced)', icon: <UserMinus size={24} /> }
                    ].map(opt => (
                      <button 
                        key={opt.id}
                        onClick={() => handleSelectRadio('maritalStatus', opt.id)}
                        style={{ 
                          border: formData.maritalStatus === opt.id ? '2px solid var(--color-accent)' : '1px solid var(--color-border)', 
                          borderRadius: '8px', 
                          padding: '1.25rem', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          gap: '0.75rem',
                          backgroundColor: formData.maritalStatus === opt.id ? '#fff7ed' : 'white'
                        }}
                      >
                        {opt.icon}
                        <span className="font-semibold text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Age */}
              {step === 2 && (
                <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>२</div>
                    <h2 className="text-xl font-bold">तुमचे वय किती आहे? (Age)</h2>
                  </div>
                  
                  <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        placeholder="उदा. २५" 
                        value={formData.age}
                        onChange={(e) => handleNumberInput('age', e.target.value)}
                        style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1.25rem', outline: 'none', textAlign: 'center', fontWeight: 600 }} 
                      />
                      <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>वर्षे</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>तुमच्या आधार कार्डवरील वयानुसार वय लिहा.</p>
                  </div>
                </div>
              )}

              {/* Step 3: Income */}
              {step === 3 && (
                <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>३</div>
                    <h2 className="text-xl font-bold">तुमच्या कुटुंबाचे एकूण वार्षिक उत्पन्न किती आहे?</h2>
                  </div>
                  
                  <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        placeholder="उदा. १५००००" 
                        value={formData.income}
                        onChange={(e) => handleNumberInput('income', e.target.value)}
                        style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1.25rem', outline: 'none', textAlign: 'center', fontWeight: 600 }} 
                      />
                      <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>₹ / वर्ष</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>उत्पन्नाचा दाखला किंवा रेशन कार्डवरील माहितीनुसार निवडा.</p>
                  </div>
                </div>
              )}

              {/* Step 4: Taxpayer & Govt Job */}
              {step === 4 && (
                <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>४</div>
                    <h2 className="text-xl font-bold">रोजगार आणि करदाता स्थिती</h2>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
                      <h4 className="font-semibold mb-2">कुटुंबात कोणी आयकरदाता (Income Taxpayer) आहे का?</h4>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.isTaxpayer === true} onChange={() => handleSelectRadio('isTaxpayer', true)} /> होय (Yes)
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.isTaxpayer === false} onChange={() => handleSelectRadio('isTaxpayer', false)} /> नाही (No)
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">कुटुंबात कोणी कायमस्वरूपी शासकीय नोकरीत (Govt Employee) आहे का?</h4>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.isGovtEmployee === true} onChange={() => handleSelectRadio('isGovtEmployee', true)} /> होय (Yes)
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.isGovtEmployee === false} onChange={() => handleSelectRadio('isGovtEmployee', false)} /> नाही (No)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Assets and Indirect Triggers */}
              {step === 5 && (
                <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>५</div>
                    <h2 className="text-xl font-bold">मालमत्ता आणि इतर माहिती</h2>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
                      <h4 className="font-semibold mb-2">कुटुंबाच्या मालकीचे चारचाकी वाहन (Four Wheeler) आहे का? (ट्रॅक्टर वगळून)</h4>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasFourWheeler === true} onChange={() => handleSelectRadio('hasFourWheeler', true)} /> होय
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasFourWheeler === false} onChange={() => handleSelectRadio('hasFourWheeler', false)} /> नाही
                        </label>
                      </div>
                    </div>

                    <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
                      <h4 className="font-semibold mb-2">तुमच्या घराला पक्के आरसीसी (Concrete/RCC) छत किंवा पक्की इमारत आहे का?</h4>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasRccBuilding === true} onChange={() => handleSelectRadio('hasRccBuilding', true)} /> होय
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasRccBuilding === false} onChange={() => handleSelectRadio('hasRccBuilding', false)} /> नाही
                        </label>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        पक्के घर/छत असल्यास ते प्रधानमंत्री आवास योजनेच्या पात्रतेला प्रभावित करू शकते.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">तुम्ही सौर ऊर्जा (Solar Energy / Surya Ghar) किंवा सौर पंप योजनेचा लाभ घेतला आहे का?</h4>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasSaurPump === true} onChange={() => handleSelectRadio('hasSaurPump', true)} /> होय
                        </label>
                        <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                          <input type="radio" checked={formData.hasSaurPump === false} onChange={() => handleSelectRadio('hasSaurPump', false)} /> नाही
                        </label>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        सौर पॅनेल बसवण्यासाठी पक्की इमारत असावी लागते.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="flex justify-between items-center mt-4">
                {step > 1 ? (
                  <button onClick={handleBack} className="btn-outline flex items-center gap-2">
                    <ArrowLeft size={18} /> मागे
                  </button>
                ) : (
                  <Link to="/" className="btn-outline flex items-center gap-2">
                    <ArrowLeft size={18} /> मुख्यपृष्ठ
                  </Link>
                )}
                
                {step < 5 ? (
                  <button onClick={handleNext} disabled={step === 2 && !formData.age || step === 3 && !formData.income} className="btn-primary">
                    पुढील टप्पा
                  </button>
                ) : (
                  <button onClick={handleCheckEligibility} className="btn-primary flex items-center gap-2" style={{ backgroundColor: 'var(--color-green)' }}>
                    पात्रता तपासा <Building size={18} />
                  </button>
                )}
              </div>

            </div>

          </div>
        ) : (
          /* RESULTS SCREEN */
          <div className="flex flex-col gap-6">
            <div className="card text-center" style={{ padding: '2rem', backgroundColor: '#e2e8f0' }}>
              <h2 className="text-2xl font-bold text-primary mb-2">पात्रता निकाल (Eligibility Results)</h2>
              <p className="text-sm text-muted">तुमच्या प्रोफाईलनुसार विविध योजनांचे विश्लेषण खालीलप्रमाणे आहे.</p>
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
                      <h3 className="font-bold text-lg text-primary">{res.schemeName}</h3>
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
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>तपशीलवार पडताळणी (Verification Path):</h4>
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

export default WomenEligibility;
