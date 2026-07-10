import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, CheckCircle, ArrowRight, Heart, HeartPulse, GraduationCap, Briefcase, MapPin, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSchemesData } from '../data/schemeData';

const Home = () => {
  const [schemes, setSchemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Try to fetch from PostgreSQL Backend
    fetch('http://localhost:5000/api/schemes')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          // Map database columns to the format React expects
          const dbSchemes = data.map(dbScheme => ({
            id: dbScheme.id,
            tag: dbScheme.category || dbScheme.scheme_type || 'सरकारी योजना',
            tagColor: '#e0e7ff', // default colors
            tagTextColor: '#4338ca',
            title: dbScheme.scheme_name || dbScheme.scheme_name_mr || dbScheme.scheme_name_en,
            desc: dbScheme.description || dbScheme.short_name || 'या योजनेसाठी पात्रता आणि अधिक माहिती जाणून घेण्यासाठी क्लिक करा.',
            amount: 'अधिक माहिती' // Default text for amounts
          }));
          setSchemes(dbSchemes);
        } else {
          // Fallback if DB is empty
          setSchemes(getSchemesData());
        }
      })
      .catch(err => {
        console.error('Backend not reachable, falling back to mock data:', err);
        setSchemes(getSchemesData());
      });
  }, []);

  const filteredSchemes = schemes.filter(scheme => {
    const term = searchTerm.toLowerCase();
    return (
      (scheme.title && scheme.title.toLowerCase().includes(term)) ||
      (scheme.desc && scheme.desc.toLowerCase().includes(term)) ||
      (scheme.tag && scheme.tag.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', 
        color: 'white', 
        padding: '5rem 0 4rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(255,255,255,0) 70%)' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,128,61,0.15) 0%, rgba(255,255,255,0) 70%)' }}></div>
        
        <div className="container flex justify-between items-center" style={{ gap: '4rem', position: 'relative', zIndex: 10 }}>
          
          {/* Left Content */}
          <div style={{ flex: 1, maxWidth: '800px' }}>
            <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{ color: 'var(--color-accent)' }}>नवीन</span> • सर्व सरकारी योजना आता एकाच ठिकाणी
            </div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.15, textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              सरकारी योजनांची माहिती<br/><span className="text-gradient">आता तुमच्या बोटांवर</span>
            </h1>
            <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '600px', lineHeight: 1.6 }}>
              विविध सरकारी कल्याणकारी योजनांचे लाभ घेण्यासाठी तुमची पात्रता तपासा आणि थेट अर्ज करा.
            </p>
            
            <div className="glass" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '0.5rem', borderRadius: '12px' }}>
              <Search color="var(--color-primary)" size={24} style={{ margin: 'auto 0 auto 1rem' }} />
              <input 
                type="text" 
                placeholder="योजना शोधा... (उदा. पीक विमा, Ladki Bahin, PM-KISAN)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', color: 'black', background: 'transparent' }}
              />
              <button className="btn-primary" style={{ padding: '0.875rem 2.5rem', borderRadius: '8px' }}>शोधा</button>
            </div>

            <div className="flex items-center gap-4">
              <span style={{ fontSize: '0.875rem', opacity: 0.8, fontWeight: 500 }}>लोकप्रिय श्रेणी:</span>
              <div className="flex gap-2">
                <span onClick={() => setSearchTerm('')} style={{ backgroundColor: searchTerm === '' ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s' }}>सर्व (All)</span>
                <span onClick={() => setSearchTerm('Kisan')} style={{ backgroundColor: searchTerm === 'Kisan' ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s' }}>कृषी</span>
                <span onClick={() => setSearchTerm('Scholarship')} style={{ backgroundColor: searchTerm === 'Scholarship' ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s' }}>शिक्षण</span>
                <span onClick={() => setSearchTerm('Ayushman')} style={{ backgroundColor: searchTerm === 'Ayushman' ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s' }}>आरोग्य</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Notice */}
      <div style={{ backgroundColor: 'var(--color-accent)', color: 'white', padding: '0.5rem 0', fontSize: '0.875rem' }}>
        <div className="container flex items-center gap-4 overflow-hidden">
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>महत्त्वाची सूचना:</span>
          <div style={{ whiteSpace: 'nowrap', animation: 'marquee 20s linear infinite' }}>
            • प्रधानमंत्री किसान सन्मान निधी योजनेचा १४ वा हप्ता जमा करण्यात आला आहे. &nbsp;&nbsp;&nbsp;&nbsp; • नवीन शैक्षणिक शिष्यवृत्तीसाठी अर्ज करण्याची शेवटची तारीख ३१ ऑक्टोबर.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Main Content Area */}
      <section style={{ padding: '3rem 0', backgroundColor: 'var(--color-bg-main)', flex: 1 }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          
          {/* Left Column: Schemes Grid */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span style={{ color: 'var(--color-primary)' }}>✤</span> नवीनतम योजना (Latest Schemes)
              </h2>
              <Link to="#" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-accent)', fontWeight: 500 }}>
                सर्व पहा <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: filteredSchemes.length > 0 ? 'repeat(3, 1fr)' : '1fr', gap: '1.5rem' }}>
              {filteredSchemes.length > 0 ? (
                filteredSchemes.map((scheme) => (
                  <div key={scheme.id} className="card flex flex-col" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white' }}>
                    <div className="flex justify-between items-start mb-4">
                      <span style={{ backgroundColor: scheme.tagColor, color: scheme.tagTextColor, padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {scheme.tag}
                      </span>
                      <button style={{ color: '#cbd5e1' }}><Heart size={20} /></button>
                    </div>
                    
                    <h3 className="text-lg font-bold mb-2 text-primary">{scheme.title}</h3>
                    <p className="text-sm text-muted mb-6" style={{ flex: 1 }}>{scheme.desc}</p>
                    
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.875rem' }}>{scheme.amount}</span>
                      <Link to={`/scheme/${scheme.id}`} style={{ backgroundColor: '#e2e8f0', color: 'var(--color-text-main)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}>
                        अधिक माहिती
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', marginBottom: '0' }}>
                    कोणतीही योजना सापडली नाही. कृपया दुसरा शब्द शोधून पहा.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="flex flex-col gap-6">
            
            {/* Notifications Card */}
            <div className="card" style={{ padding: '0', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f1f5f9', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} color="#ef4444" />
                <h3 className="font-semibold text-primary">सूचना (Notifications)</h3>
              </div>
              
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>१८ ऑक्टोबर २०२४</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>महात्मा जोतिराव फुले शेतकरी कर्जमुक्ती योजनेची नवीन यादी जाहीर.</div>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-1.5rem', top: 0, bottom: 0, width: '3px', backgroundColor: '#ef4444' }}></div>
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.25rem' }}>तात्काळ (Urgent)</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>पॅन कार्ड आधारशी लिंक करण्याची शेवटची तारीख वाढवली.</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>१५ ऑक्टोबर २०२४</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>घरकुल योजनेच्या लाभार्थ्यांचे जिओ टॅगिंग सुरू झाले आहे.</div>
                </div>
              </div>
              
              <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                <Link to="#" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-accent)' }}>सर्व सूचना पहा</Link>
              </div>
            </div>

          </div>
        </div>

        {/* Check Eligibility CTA - Premium Version */}
        <div className="container" style={{ marginTop: '4rem', marginBottom: '4rem' }}>
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)', 
            color: 'white', 
            padding: '3rem 2.5rem', 
            position: 'relative', 
            overflow: 'hidden',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2)'
          }}>
            <div style={{ position: 'absolute', right: '-10px', top: '-20px', opacity: 0.05, transform: 'scale(1.5)' }}>
              <CheckCircle size={200} />
            </div>
            
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: '40px', height: '2px', backgroundColor: 'var(--color-accent)' }}></span>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.875rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Quick Check</span>
                </div>
                <h3 className="text-3xl font-bold mb-2">तुमची पात्रता तपासा</h3>
                <p className="text-lg mb-0" style={{ opacity: 0.9, maxWidth: '500px' }}>फक्त ५ सोप्या प्रश्नांची उत्तरे द्या आणि तुमच्यासाठी सर्वोत्तम योजना शोधा.</p>
              </div>
              
              <Link to="/women-eligibility" className="btn-primary" style={{ 
                backgroundColor: 'white', 
                color: 'var(--color-primary)', 
                fontSize: '1.125rem', 
                padding: '1rem 2.5rem', 
                borderRadius: '50px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}>
                आत्ताच सुरू करा <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
