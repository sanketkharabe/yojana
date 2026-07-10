const modules = import.meta.glob('./schemes/*.json', { eager: true });

export const getSchemesData = () => {
  const schemesList = [];
  
  for (const path in modules) {
    const data = modules[path].default || modules[path]; // Vite imports JSON as default export or directly
    const id = path.split('/').pop().replace('.json', '');
    
    // Normalize Title
    let title = 'Unknown Scheme';
    if (data.scheme?.name?.marathi) {
      title = data.scheme.name.marathi;
    } else if (data.scheme?.name?.english) {
      title = data.scheme.name.english;
    } else if (data.scheme_details?.scheme_name) {
      title = data.scheme_details.scheme_name;
    } else if (data.scheme_name) {
      title = data.scheme_name;
    } else if (data.Scheme_Name) {
      title = data.Scheme_Name;
    } else if (data.name) {
      title = data.name;
    }
    
    // Normalize Description
    let desc = '';
    if (data.objective?.primary) {
      desc = data.objective.primary;
    } else if (data.scheme_details?.objective) {
      desc = data.scheme_details.objective;
    } else if (data.Objective) {
      desc = data.Objective;
    } else if (typeof data.objective === 'string') {
      desc = data.objective;
    } else if (data.description) {
      desc = data.description;
    }
    
    // Normalize Tag
    let tag = 'इतर (Other)';
    let tagColor = '#f3f4f6';
    let tagTextColor = '#374151';
    
    const lowerTitle = title.toLowerCase();
    const idLower = id.toLowerCase();
    const combinedStr = lowerTitle + ' ' + idLower;
    
    if (combinedStr.includes('kisan') || combinedStr.includes('शेतकरी') || combinedStr.includes('agro') || combinedStr.includes('कृषी')) {
      tag = 'कृषी (Agriculture)';
      tagColor = '#dcfce7';
      tagTextColor = '#166534';
    } else if (combinedStr.includes('bhai') || combinedStr.includes('बहीण') || combinedStr.includes('widow') || combinedStr.includes('महिला') || combinedStr.includes('ladki') || combinedStr.includes('ujwala')) {
      tag = 'महिला (Women)';
      tagColor = '#e0e7ff';
      tagTextColor = '#3730a3';
    } else if (combinedStr.includes('scholarship') || combinedStr.includes('education') || combinedStr.includes('शिक्षण')) {
      tag = 'शिक्षण (Education)';
      tagColor = '#dbeafe';
      tagTextColor = '#1e40af';
    } else if (combinedStr.includes('startup') || combinedStr.includes('skill') || combinedStr.includes('stand up') || combinedStr.includes('svannidi') || combinedStr.includes('business')) {
      tag = 'कौशल्य/उद्योग (Business/Skill)';
      tagColor = '#f3e8ff';
      tagTextColor = '#6b21a8';
    } else if (combinedStr.includes('ayushman') || combinedStr.includes('health') || combinedStr.includes('आरोग्य') || combinedStr.includes('disability')) {
      tag = 'आरोग्य/अपंगत्व (Health/Disability)';
      tagColor = '#fee2e2';
      tagTextColor = '#991b1b';
    } else if (combinedStr.includes('awas') || combinedStr.includes('housing') || combinedStr.includes('घरकुल')) {
      tag = 'गृहनिर्माण (Housing)';
      tagColor = '#ffedd5';
      tagTextColor = '#9a3412';
    } else if (combinedStr.includes('pension') || combinedStr.includes('jyoti') || combinedStr.includes('suraksha')) {
      tag = 'सामाजिक सुरक्षा (Social Security)';
      tagColor = '#e0f2fe';
      tagTextColor = '#075985';
    }
    
    // Normalize Amount
    let amount = 'अधिक माहितीसाठी पहा';
    if (data.benefits?.annual_financial_assistance?.amount) {
      amount = `₹ ${data.benefits.annual_financial_assistance.amount}/वर्ष`;
    } else if (data.benefits?.monthly_financial_assistance?.standard_amount) {
      amount = `₹ ${data.benefits.monthly_financial_assistance.standard_amount}/महिना`;
    } else if (data.important_features?.annual_assistance) {
      amount = data.important_features.annual_assistance;
    } else if (data.key_benefits_and_incentives?.funding_support) {
      amount = 'Funding Support';
    }

    schemesList.push({
      id,
      title,
      desc: desc.length > 120 ? desc.substring(0, 120) + '...' : desc,
      tag,
      tagColor,
      tagTextColor,
      amount,
      rawData: data
    });
  }
  
  return schemesList;
};

export const getSchemeById = (id) => {
  const allSchemes = getSchemesData();
  return allSchemes.find(scheme => scheme.id === id);
};
