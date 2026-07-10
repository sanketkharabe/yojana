import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle2, FileText, Info, Building, GitFork, AlertTriangle, Check, X, HelpCircle, Activity } from 'lucide-react';
import { getSchemeById } from '../data/schemeData';
import { logicTrees, checkEligibilityLocal } from '../data/logicTrees';

const renderVal = (val) => {
  if (val === undefined || val === null) return '';
  if (typeof val !== 'string') {
    if (typeof val === 'boolean') return val ? 'होय (Yes)' : 'नाही (No)';
    return JSON.stringify(val);
  }

  const trimmed = val.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);
      
      if (Array.isArray(parsed)) {
        return (
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', margin: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {parsed.map((item, idx) => (
              <li key={idx} className="text-sm">{typeof item === 'object' ? JSON.stringify(item) : item}</li>
            ))}
          </ul>
        );
      }
      
      if (typeof parsed === 'object' && parsed !== null) {
        // Age limit
        if (parsed.minimum !== undefined && parsed.maximum !== undefined) {
          return `${parsed.minimum} ते ${parsed.maximum} ${parsed.unit || 'वर्षे'}`;
        }
        // Simple note
        if (parsed.note !== undefined && Object.keys(parsed).length === 1) {
          return parsed.note;
        }
        
        // Key-value grid
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {Object.entries(parsed).map(([k, v], idx) => {
              if (k === 'note') return <div key={idx} style={{ fontStyle: 'italic', fontSize: '0.875rem' }}>{v}</div>;
              const cleanKey = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <div key={idx} className="text-sm" style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{cleanKey}:</span>
                  <span>{typeof v === 'object' ? JSON.stringify(v) : (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v)}</span>
                </div>
              );
            })}
          </div>
        );
      }
    } catch (e) {
      // Fall back to clean string
    }
  }

  // Return clean string
  return val.replace(/^"|"$/g, '');
};

const resolveSchemeKey = (identifier) => {
  if (!identifier) return null;
  const str = String(identifier).toLowerCase();

  if (str.includes("ladki") || str.includes("bahin") || str.includes("bhai")) return "ladki bhainn";
  if (str.includes("awas") || str.includes("pmay") || str.includes("घरकुल")) return "awas";
  if (str.includes("kisan") || str.includes("pm-kisan") || str.includes("pmky")) return "pm kisan samman";
  if (str.includes("ujwala") || str.includes("pmuy")) return "ujwala scheme";
  if (str.includes("ayushman") || str.includes("pm-jay") || str.includes("pmjay")) return "Ayushman Bharat";
  if (str.includes("widow") || str.includes("विधवा")) return "Indira Gandhi National Widow Pension Scheme";
  if (str.includes("disability") || str.includes("अपंगत्व")) return "indira gandhi disability ";
  if (str.includes("scholarship") || str.includes("शिष्यवृत्ती")) return "national_scholarship_scheme_details";
  if (str.includes("jyoti") || str.includes("pmjjby")) return "pm jivan jyoti";
  if (str.includes("suraksha") || str.includes("pmsby")) return "pm suraksha ";
  if (str.includes("stand up") || str.includes("standup")) return "stand_up_india_details";
  if (str.includes("startup") || str.includes("start up")) return "startup_india_details";
  if (str.includes("svanidhi") || str.includes("svannidi")) return "svannidi";
  return identifier;
};

const SchemeDetails = () => {
  const { id } = useParams();
  const [schemeData, setSchemeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'logictree'
  
  // Real-time Inputs for the Logic Tree Check
  const [inputs, setInputs] = useState({
    gender: 'Female',
    age: '25',
    income: '150000',
    isTaxpayer: false,
    isGovtEmployee: false,
    hasFourWheeler: false,
    hasPuccaHouse: false,
    hasRccBuilding: false,
    hasSaurPump: false,
    hasLpgConnection: false,
    disabilityPercent: '0',
    isWidow: false,
    isStudent: false,
    academicPercent: '80',
    isStreetVendor: false,
    hasLand: false,
    isScOrSt: false,
    isRegisteredEntity: false,
    yearsSinceIncorporation: '0',
    annualTurnover: '0'
  });

  const [showExtraQuestions, setShowExtraQuestions] = useState(false);

  const [allSchemes, setAllSchemes] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/schemes')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch schemes list');
        return response.json();
      })
      .then(data => {
        setAllSchemes(data);
      })
      .catch(err => {
        console.error('Failed to fetch schemes for other-schemes links', err);
      });
  }, []);

  const dbShortName = schemeData?.rawData?.short_name;
  const dbNameEn = schemeData?.rawData?.scheme_name_en;
  const dbNameMr = schemeData?.rawData?.scheme_name_mr;
  const resolvedKey = resolveSchemeKey(dbShortName || dbNameEn || dbNameMr || id);
  const treeConfig = logicTrees[resolvedKey];

  // Group questions into primary (for current scheme) and extra (for other schemes)
  const primaryQuestions = treeConfig ? treeConfig.questions : [];
  const primaryQuestionIds = new Set(primaryQuestions.map(q => q.id));

  const extraQuestions = [];
  const addedExtraIds = new Set();
  Object.keys(logicTrees).forEach(schemeKey => {
    const questions = logicTrees[schemeKey].questions || [];
    questions.forEach(q => {
      if (!primaryQuestionIds.has(q.id) && !addedExtraIds.has(q.id)) {
        extraQuestions.push(q);
        addedExtraIds.add(q.id);
      }
    });
  });

  useEffect(() => {
    fetch(`http://localhost:5000/api/schemes/${id}`)
      .then(response => {
        if (!response.ok) throw new Error('Network response not ok');
        return response.json();
      })
      .then(dbData => {
        // Map backend API data to what the UI expects
        const mappedData = {
          id: dbData.id,
          title: dbData.scheme_name || dbData.scheme_name_mr || dbData.scheme_name_en,
          tag: dbData.category || dbData.scheme_type || 'सरकारी योजना',
          tagColor: '#e0e7ff',
          tagTextColor: '#4338ca',
          desc: dbData.description || dbData.short_name || 'योजनेची सविस्तर माहिती.',
          officialWebsite: dbData.official_website,
          isFromDb: true,
          rawData: dbData
        };
        setSchemeData(mappedData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Backend failed, using mock data', err);
        const data = getSchemeById(id);
        setSchemeData(data);
        setLoading(false);
      });
      
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return <div className="container py-8 text-center text-xl">लोड करत आहे... (Loading...)</div>;
  }

  if (!schemeData) {
    return <div className="container py-8 text-center text-xl">योजना सापडली नाही (Scheme not found)...</div>;
  }

  const raw = schemeData.rawData || {};

  // Extract common fields safely supporting both DB and Mock format
  let benefits = {};
  if (schemeData.isFromDb) {
    if (raw.benefits && raw.benefits.length > 0) {
      raw.benefits.forEach(b => benefits[b.benefit_name || `Benefit ${b.id}`] = b.description || 'लागू');
    }
  } else {
    benefits = raw.benefits || raw.key_benefits_and_incentives || {};
  }

  let eligibility = {};
  if (schemeData.isFromDb) {
    if (raw.eligibility && raw.eligibility.length > 0) {
      raw.eligibility.forEach(e => {
        eligibility[e.criteria_name || `Criteria ${e.id}`] = e.details;
      });
    }
  } else {
    eligibility = raw.eligibility_criteria || {};
  }

  let documents = [];
  if (schemeData.isFromDb) {
    documents = (raw.documents || []).map(d => d.document_name);
  } else {
    documents = raw.documents_required || raw.registration_and_documents || [];
  }

  let applicationSteps = [];
  if (schemeData.isFromDb) {
    applicationSteps = raw.application_steps || [];
  } else {
    if (raw.application_process) {
      applicationSteps = Object.entries(raw.application_process).map(([key, val]) => ({
        step_no: parseInt(key.replace("step_", "")),
        description: val
      }));
    }
  }

  const officialWeb = schemeData.officialWebsite || raw.scheme?.official_website || raw.scheme_details?.official_website || raw.contact_details?.official_website;

  // Handle Input Change
  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Evaluate Live Eligibility using Logic Tree Engine
  const evalResult = checkEligibilityLocal(resolvedKey, inputs);

  // Compute Cross-Scheme Impacts dynamically to show "Indirect Elimination" mappings
  const crossSchemeImpacts = [];
  if (inputs.hasRccBuilding || inputs.hasSaurPump) {
    crossSchemeImpacts.push({
      scheme_en: "Pradhan Mantri Awas Yojana (PMAY)",
      scheme_mr: "प्रधानमंत्री आवास योजना (घरकुल)",
      impact_en: "Disqualified (Indirectly) - Owning an RCC concrete roof/building indicates possession of a pucca house.",
      impact_mr: "अपात्र (अप्रत्यक्ष) - स्वतःचे आरसीसी पक्के घर असल्याचे स्पष्ट होत असल्याने नवीन घरकुल योजनेचा लाभ मिळणार नाही.",
      status: "disqualified"
    });
    crossSchemeImpacts.push({
      scheme_en: "Mukhyamantri Majhi Ladki Bahin Yojana",
      scheme_mr: "मुख्यमंत्री माझी लाडकी बहीण योजना",
      impact_en: "High Risk of Disqualification - RCC buildings imply annual family income exceeds the EWS limits (typically > ₹2 Lakhs).",
      impact_mr: "अपात्रतेचा धोका - पक्के आरसीसी घर असणे कुटुंबाचे वार्षिक उत्पन्न २.५ लाखांपेक्षा जास्त असल्याचे दर्शवते, जे या योजनेच्या अटींच्या विरुद्ध आहे.",
      status: "warning"
    });
  }
  if (inputs.isTaxpayer) {
    crossSchemeImpacts.push({
      scheme_en: "All Welfare Schemes (Ladki Bahin, PM-Kisan, PMAY)",
      scheme_mr: "सर्व कल्याणकारी योजना (लाडकी बहीण, पीएम-किसान, आवास)",
      impact_en: "Direct Elimination - Income tax payers are strictly excluded from all subsidy/welfare benefits.",
      impact_mr: "थेट बाद - आयकर भरणारे कुटुंब कोणत्याही कल्याणकारी मानधन किंवा घरकुल सवलतीसाठी पात्र ठरत नाही.",
      status: "disqualified"
    });
  }
  if (inputs.isGovtEmployee) {
    crossSchemeImpacts.push({
      scheme_en: "Ladki Bahin & PM-Kisan Yojana",
      scheme_mr: "लाडकी बहीण आणि पीएम-किसान योजना",
      impact_en: "Direct Elimination - Government employees or their families are excluded.",
      impact_mr: "थेट बाद - सरकारी नोकरीत असलेले सदस्य किंवा त्यांचे कुटुंब या योजनांसाठी अपात्र आहेत.",
      status: "disqualified"
    });
  }
  if (inputs.hasFourWheeler) {
    crossSchemeImpacts.push({
      scheme_en: "Ladki Bahin & PM Ujjwala Yojana",
      scheme_mr: "लाडकी बहीण आणि उज्ज्वला योजना",
      impact_en: "Direct Elimination - Families owning four-wheelers (excluding tractors) are excluded.",
      impact_mr: "थेट बाद - कुटुंबाकडे चारचाकी वाहन (ट्रॅक्टर सोडून) असल्यास अल्प-उत्पन्न निकषांनुसार अपात्र ठरतात.",
      status: "disqualified"
    });
  }

  const getDbIdForKey = (key) => {
    if (!allSchemes || allSchemes.length === 0) return null;
    const matched = allSchemes.find(s => {
      const resolved = resolveSchemeKey(s.short_name || s.scheme_name_en || s.scheme_name_mr);
      return resolved === key;
    });
    return matched ? matched.id : null;
  };

  const otherSchemesEval = Object.keys(logicTrees)
    .filter(key => key !== resolvedKey)
    .map(key => {
      const evalRes = checkEligibilityLocal(key, inputs);
      const dbId = getDbIdForKey(key);
      return {
        key,
        name_en: logicTrees[key].name_en,
        name_mr: logicTrees[key].name_mr,
        eligible: evalRes.eligible,
        reasons: evalRes.reasons,
        auditLog: evalRes.auditLog,
        dbId
      };
    });

  const eligibleOtherSchemes = otherSchemesEval.filter(s => s.eligible);
  const ineligibleOtherSchemes = otherSchemesEval.filter(s => !s.eligible);

  return (
    <div style={{ backgroundColor: '#f8fafc', flex: 1, padding: '2rem 0' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/" className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            <ArrowLeft size={16} /> मागे जा (Back)
          </Link>
        </div>

        {/* Header Banner */}
        <div className="card mb-6" style={{ borderTop: '4px solid var(--color-primary)' }}>
          <div className="flex justify-between items-start mb-4">
            <span style={{ backgroundColor: schemeData.tagColor, color: schemeData.tagTextColor, padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600 }}>
              {schemeData.tag}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">{schemeData.title}</h1>
          <p className="text-md text-muted mb-6">{schemeData.desc}</p>
          
          <div className="flex gap-4 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            {officialWeb ? (
              <a href={officialWeb} target="_blank" rel="noreferrer" className="btn-outline flex items-center gap-2" style={{ textDecoration: 'none' }}>
                अधिकृत वेबसाईट <ExternalLink size={18} />
              </a>
            ) : null}
            <button 
              onClick={() => setActiveTab(activeTab === 'details' ? 'logictree' : 'details')} 
              className="btn-primary flex items-center gap-2"
            >
              {activeTab === 'details' ? (
                <>पात्रता तपासा (Check Eligibility) <GitFork size={18} /></>
              ) : (
                <>योजनेची माहिती पहा <Info size={18} /></>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--color-border)', marginBottom: '2rem' }}>
          <button 
            onClick={() => setActiveTab('details')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              fontSize: '1rem', 
              fontWeight: 600, 
              color: activeTab === 'details' ? 'var(--color-accent)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'details' ? '3px solid var(--color-accent)' : 'none',
              marginBottom: '-2px'
            }}
          >
            📋 योजनेची माहिती (Details)
          </button>
          <button 
            onClick={() => setActiveTab('logictree')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              fontSize: '1rem', 
              fontWeight: 600, 
              color: activeTab === 'logictree' ? 'var(--color-accent)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'logictree' ? '3px solid var(--color-accent)' : 'none',
              marginBottom: '-2px'
            }}
          >
            🌿 पात्रता तपासा (Check Eligibility)
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'details' ? (
          <div className="flex flex-col gap-6">
            
            {/* Eligibility Section */}
            <div className="card">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-primary">
                <CheckCircle2 size={24} color="var(--color-success)" /> पात्रता निकष (Eligibility)
              </h2>
              <div className="flex flex-col gap-3">
                {Object.keys(eligibility).length > 0 ? (
                  Object.entries(eligibility).map(([key, val], idx) => (
                    <div key={idx} className="flex gap-2 items-start" style={{ padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 600, minWidth: '150px', textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}:
                      </div>
                      <div>
                        {renderVal(val)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">पात्रता माहिती उपलब्ध नाही.</p>
                )}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="card">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-primary">
                <Info size={24} color="var(--color-accent)" /> फायदे (Benefits)
              </h2>
              <div className="flex flex-col gap-3">
                {Object.keys(benefits).length > 0 ? (
                  Object.entries(benefits).map(([key, val], idx) => (
                    <div key={idx} style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                      <div className="font-semibold text-primary mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
                      <div className="text-sm">
                        {renderVal(val)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">फायद्यांची माहिती उपलब्ध नाही.</p>
                )}
              </div>
            </div>

            {/* Documents Section */}
            <div className="card">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-primary">
                <FileText size={24} color="gray" /> लागणारी कागदपत्रे (Required Documents)
              </h2>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Array.isArray(documents) ? (
                  documents.map((doc, idx) => (
                    <li key={idx} className="text-sm">
                      {typeof doc === 'string' ? doc : (doc.document || JSON.stringify(doc))}
                    </li>
                  ))
                ) : documents.mandatory ? (
                  documents.mandatory.map((doc, idx) => <li key={idx} className="text-sm">{doc}</li>)
                ) : (
                  <p className="text-muted">कागदपत्रांची माहिती उपलब्ध नाही.</p>
                )}
              </ul>
            </div>

            {/* Application Steps Section */}
            {applicationSteps.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-primary">
                  <Building size={24} color="var(--color-primary)" /> अर्ज करण्याची प्रक्रिया (Application Process)
                </h2>
                <div className="flex flex-col gap-4">
                  {applicationSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-start" style={{ padding: '0.75rem', borderLeft: '3px solid var(--color-primary)', backgroundColor: '#f8fafc' }}>
                      <div style={{ 
                        backgroundColor: 'var(--color-primary)', 
                        color: 'white', 
                        borderRadius: '50%', 
                        width: '24px', 
                        height: '24px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {step.step_no || idx + 1}
                      </div>
                      <div className="text-sm font-medium" style={{ paddingTop: '2px' }}>
                        {step.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disqualifications Section */}
            {(raw.disqualifications && raw.disqualifications.length > 0) && (
              <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4" style={{ color: '#ef4444' }}>
                  <CheckCircle2 size={24} color="#ef4444" /> अपात्रता निकष (Disqualifications)
                </h2>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {raw.disqualifications.map((reason, idx) => (
                    <li key={idx} className="text-sm">{reason}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        ) : (
          /* LOGIC TREE VISUALIZER TAB */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
            
            {/* Left: Input Dashboard */}
            <div className="flex flex-col gap-6">
              <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <Activity size={18} color="var(--color-accent)" /> तुमची माहिती भरा (Your Profile)
                </h3>
                
                <div className="flex flex-col gap-4">
                  {/* Primary Questions */}
                  {primaryQuestions.map((q) => (
                    <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {q.label_mr} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>({q.label_en})</span>
                      </label>
                      
                      {q.type === 'boolean' ? (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                          <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                            <input 
                              type="radio" 
                              name={q.id} 
                              checked={inputs[q.id] === true} 
                              onChange={() => handleInputChange(q.id, true)} 
                            /> होय (Yes)
                          </label>
                          <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                            <input 
                              type="radio" 
                              name={q.id} 
                              checked={inputs[q.id] === false} 
                              onChange={() => handleInputChange(q.id, false)} 
                            /> नाही (No)
                          </label>
                        </div>
                      ) : q.type === 'select' ? (
                        <select 
                          value={inputs[q.id]} 
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.875rem', outline: 'none' }}
                        >
                          {q.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label_mr} ({opt.label_en})</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="number" 
                          value={inputs[q.id]} 
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.875rem', outline: 'none' }} 
                        />
                      )}
                    </div>
                  ))}

                  {/* Toggle Button for Extra Questions */}
                  {extraQuestions.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <button 
                        onClick={() => setShowExtraQuestions(!showExtraQuestions)}
                        style={{ 
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        <span>🌿 इतर योजनांसाठी अतिरिक्त माहिती ({extraQuestions.length} प्रश्न)</span>
                        <span>{showExtraQuestions ? '▼' : '▶'}</span>
                      </button>

                      {showExtraQuestions && (
                        <div className="flex flex-col gap-4" style={{ marginTop: '1rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-accent)' }}>
                          {extraQuestions.map((q) => (
                            <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                {q.label_mr} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>({q.label_en})</span>
                              </label>
                              
                              {q.type === 'boolean' ? (
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                  <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                                    <input 
                                      type="radio" 
                                      name={q.id} 
                                      checked={inputs[q.id] === true} 
                                      onChange={() => handleInputChange(q.id, true)} 
                                    /> होय (Yes)
                                  </label>
                                  <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                                    <input 
                                      type="radio" 
                                      name={q.id} 
                                      checked={inputs[q.id] === false} 
                                      onChange={() => handleInputChange(q.id, false)} 
                                    /> नाही (No)
                                  </label>
                                </div>
                              ) : q.type === 'select' ? (
                                <select 
                                  value={inputs[q.id]} 
                                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.875rem', outline: 'none' }}
                                >
                                  {q.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label_mr} ({opt.label_en})</option>
                                  ))}
                                </select>
                              ) : (
                                <input 
                                  type="number" 
                                  value={inputs[q.id]} 
                                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.875rem', outline: 'none' }} 
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Cross-Scheme Indirect Elimination Warning Panel */}
              {crossSchemeImpacts.length > 0 && (
                <div className="card" style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
                  <h4 style={{ color: '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                    <AlertTriangle size={18} /> इतर योजनांवर अप्रत्यक्ष प्रभाव (Indirect Impacts)
                  </h4>
                  <div className="flex flex-col gap-3">
                    {crossSchemeImpacts.map((impact, idx) => (
                      <div key={idx} style={{ borderLeft: '3px solid', borderColor: impact.status === 'disqualified' ? '#ef4444' : '#f59e0b', paddingLeft: '0.5rem' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>{impact.scheme_mr}</div>
                        <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '0.125rem' }}>{impact.impact_mr}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Logic Tree Render */}
            <div className="flex flex-col gap-6">
              
              {/* Overall Eligibility Status Banner */}
              <div 
                className="card text-center" 
                style={{ 
                  backgroundColor: evalResult.eligible ? 'var(--color-success-bg)' : '#fef2f2',
                  borderColor: evalResult.eligible ? 'var(--color-success)' : 'var(--color-error)',
                  padding: '2rem'
                }}
              >
                {evalResult.eligible ? (
                  <>
                    <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
                    <h3 className="text-2xl font-bold" style={{ color: '#065f46' }}>तुम्ही पात्र आहात! (Eligible)</h3>
                    <p style={{ color: '#047857', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: 0 }}>
                      तुम्ही दिलेल्या माहितीनुसार सर्व पात्रता निकष पूर्ण करत आहात.
                    </p>
                  </>
                ) : (
                  <>
                    <X size={48} color="var(--color-error)" style={{ margin: '0 auto 1rem auto' }} />
                    <h3 className="text-2xl font-bold" style={{ color: '#991b1b' }}>तुम्ही अपात्र आहात (Not Eligible)</h3>
                    <p style={{ color: '#b91c1c', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: 0 }}>
                      खालील कारणांमुळे तुम्ही बाद ठरले आहात:
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#991b1b' }}>
                      {evalResult.auditLog.filter(log => !log.success).map((log, idx) => (
                        <li key={idx}><strong>{log.message_mr}</strong></li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Visual Logic Nodes Flow */}
              <div className="card">
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <GitFork size={18} /> पात्रता पडताळणी मार्ग (Eligibility Verification Path)
                </h3>
                
                <div className="flex flex-col gap-4 relative" style={{ paddingLeft: '1.5rem' }}>
                  {/* Vertical connector line */}
                  <div style={{ position: 'absolute', left: '7px', top: '15px', bottom: '15px', width: '2px', backgroundColor: 'var(--color-border)', zIndex: 0 }}></div>
                  
                  {evalResult.auditLog.map((log, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 relative z-10" 
                      style={{ backgroundColor: 'white', padding: '0.5rem 0' }}
                    >
                      {/* Node Bullet status indicator */}
                      <div 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          backgroundColor: log.success ? 'var(--color-success)' : (log.type === 'indirect' ? 'var(--color-warning)' : 'var(--color-error)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '4px',
                          marginLeft: '-24px',
                          border: '2px solid white'
                        }}
                      >
                        {log.success ? <Check size={10} color="white" /> : <X size={10} color="white" />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span 
                            style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              textTransform: 'uppercase',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              backgroundColor: log.type === 'indirect' ? 'var(--color-warning-bg)' : (log.success ? 'var(--color-success-bg)' : '#fee2e2'),
                              color: log.type === 'indirect' ? '#b45309' : (log.success ? '#047857' : '#b91c1c')
                            }}
                          >
                            {log.type === 'indirect' ? 'इतर माहितीवरून निष्कर्ष (Inferred)' : (log.type === 'override' ? 'विशेष सवलत (Special Exemption)' : 'थेट निकष (Direct Criteria)')}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', marginTop: '0.25rem', fontWeight: 500 }}>
                          {log.message_mr}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.05rem' }}>
                          {log.message_en}
                        </p>
                      </div>
                    </div>
                  ))}

                  {evalResult.auditLog.length === 0 && (
                    <div className="text-center text-muted py-4">
                      पात्रता पडताळणी मार्ग पाहण्यासाठी डावीकडील प्रश्नांची उत्तरे द्या.
                    </div>
                  )}
                </div>
              </div>

              {/* Other Schemes Eligibility Panel */}
              <div className="card" style={{ borderTop: '4px solid var(--color-primary)' }}>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <Activity size={18} color="var(--color-accent)" /> इतर योजनांची पात्रता स्थिती (Other Schemes Eligibility)
                </h3>
                <p className="text-xs text-muted mb-4">
                  तुमच्या दिलेल्या प्रोफाइलनुसार, तुम्ही इतर योजनांसाठी पात्र आहात की नाही त्याचे विश्लेषण खालीलप्रमाणे आहे.
                </p>

                <div className="flex flex-col gap-4">
                  {/* Eligible Other Schemes */}
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <Check size={16} /> तुम्ही पात्र असलेल्या इतर योजना ({eligibleOtherSchemes.length})
                    </h4>
                    {eligibleOtherSchemes.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {eligibleOtherSchemes.map(s => (
                          <div key={s.key} className="flex justify-between items-center" style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-success-bg)', borderRadius: '6px' }}>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#065f46' }}>{s.name_mr}</span>
                              <span style={{ fontSize: '0.75rem', color: '#047857', display: 'block' }}>{s.name_en}</span>
                            </div>
                            {s.dbId ? (
                              <Link to={`/scheme/${s.dbId}`} className="text-xs font-semibold" style={{ color: '#047857', textDecoration: 'underline' }}>
                                योजना पहा →
                              </Link>
                            ) : (
                              <span className="text-xs text-muted">लोड होत आहे...</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted italic pl-4">तुम्ही सद्यस्थितीत इतर कोणत्याही योजनेसाठी पात्र नाही.</p>
                    )}
                  </div>

                  {/* Ineligible Other Schemes */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <X size={16} /> तुम्ही अपात्र असलेल्या इतर योजना ({ineligibleOtherSchemes.length})
                    </h4>
                    {ineligibleOtherSchemes.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {ineligibleOtherSchemes.map(s => {
                          const failLogs = s.auditLog.filter(log => !log.success);
                          return (
                            <div key={s.key} style={{ padding: '0.75rem', border: '1px solid #fee2e2', backgroundColor: '#fef2f2', borderRadius: '6px' }}>
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#991b1b' }}>{s.name_mr}</span>
                                  <span style={{ fontSize: '0.75rem', color: '#b91c1c', display: 'block' }}>{s.name_en}</span>
                                </div>
                                {s.dbId && (
                                  <Link to={`/scheme/${s.dbId}`} className="text-xs font-semibold" style={{ color: '#b91c1c', textDecoration: 'underline' }}>
                                    माहिती पहा →
                                  </Link>
                                )}
                              </div>
                              <ul style={{ listStyleType: 'disc', paddingLeft: '1rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                                {failLogs.map((log, lIdx) => (
                                  <li key={lIdx} style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                                    <strong>{log.message_mr}</strong> ({log.message_en})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted italic pl-4">तुम्ही कोणत्याही योजनेसाठी अपात्र नाही.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default SchemeDetails;
