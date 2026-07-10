// Rules Engine for Yojana Shodhak Backend
// Contains CJS definitions of direct and indirect rules for all schemes.

const logicTrees = {
  "ladki bhainn": {
    id: "ladki bhainn",
    name_en: "Mukhyamantri Majhi Ladki Bahin Yojana",
    name_mr: "मुख्यमंत्री माझी लाडकी बहीण योजना",
    questions: [
      { id: "gender", label_en: "Gender", label_mr: "लिंग", type: "select", options: [{value: "Female", label_mr: "महिला", label_en: "Female"}, {value: "Male", label_mr: "पुरुष", label_en: "Male"}] },
      { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" },
      { id: "income", label_en: "Annual Family Income (₹)", label_mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number" },
      { id: "isTaxpayer", label_en: "Is anyone in family a Taxpayer?", label_mr: "कुटुंबात कोणी आयकरदाता (Taxpayer) आहे का?", type: "boolean" },
      { id: "isGovtEmployee", label_en: "Is anyone in family a Government Employee?", label_mr: "कुटुंबात कोणी सरकारी कर्मचारी आहे का?", type: "boolean" },
      { id: "hasFourWheeler", label_en: "Does family own a 4-wheeler (excluding tractor)?", label_mr: "कुटुंबाकडे चारचाकी वाहन आहे का? (ट्रॅक्टर वगळून)", type: "boolean" },
      { id: "hasRccBuilding", label_en: "Do you own an RCC/Concrete Building (e.g., for solar panels)?", label_mr: "तुमच्याकडे पक्के आरसीसी (RCC) घर/इमारत आहे का? (उदा. सोलर पॅनेलसाठी लागणारी)", type: "boolean" },
      { id: "hasSaurPump", label_en: "Have you availed/applied for Solar Pump/Surya Ghar scheme?", label_mr: "तुम्ही सौर पंप (Saur Pump) किंवा सौर ऊर्जा योजनेचा लाभ घेतला आहे का?", type: "boolean" }
    ],
    direct_rules: [
      {
        id: "gender_check",
        field: "gender",
        check: (val) => val === "Female",
        message_en: "Scheme is only open to female applicants.",
        message_mr: "ही योजना केवळ महिला अर्जदारांसाठी खुली आहे."
      },
      {
        id: "age_check",
        field: "age",
        check: (val) => val >= 21 && val <= 65,
        message_en: "Applicant must be between 21 and 65 years old.",
        message_mr: "वय २१ ते ६५ वर्षांच्या दरम्यान असावे."
      },
      {
        id: "income_check",
        field: "income",
        check: (val) => val <= 250000,
        message_en: "Annual family income must be less than or equal to ₹2,50,000.",
        message_mr: "कुटुंबाचे वार्षिक उत्पन्न २.५ लाख रुपयांपेक्षा कमी किंवा समान असावे."
      },
      {
        id: "taxpayer_check",
        field: "isTaxpayer",
        check: (val) => !val,
        message_en: "Taxpayers or families of taxpayers are not eligible.",
        message_mr: "कुटुंबात कोणीही आयकरदाता नसावा."
      },
      {
        id: "govt_check",
        field: "isGovtEmployee",
        check: (val) => !val,
        message_en: "Government employees or their families are not eligible.",
        message_mr: "कुटुंबात कोणीही शासकीय नोकरीत नसावा."
      },
      {
        id: "vehicle_check",
        field: "hasFourWheeler",
        check: (val) => !val,
        message_en: "Families owning a four-wheeler (except tractor) are not eligible.",
        message_mr: "कुटुंबाकडे चारचाकी वाहन (ट्रॅक्टर सोडून) नसावे."
      }
    ],
    indirect_rules: [
      {
        id: "solar_to_rcc",
        trigger_field: "hasSaurPump",
        trigger_value: true,
        implied_field: "hasRccBuilding",
        implied_value: true,
        reason_en: "Applying for Surya Ghar Solar scheme requires a strong concrete RCC roof/building.",
        reason_mr: "सौर ऊर्जा किंवा सोलर पॅनेलच्या स्थापनेसाठी पक्के आरसीसी (RCC) छत/इमारत असणे आवश्यक आहे."
      },
      {
        id: "rcc_to_income",
        trigger_field: "hasRccBuilding",
        trigger_value: true,
        implied_field: "income",
        implied_value: 250001,
        reason_en: "Owning a concrete RCC building indicates family income exceeds the BPL/EWS thresholds (typically > ₹2 Lakhs per year).",
        reason_mr: "पक्के आरसीसी घर असणे हे दर्शवते की कुटुंबाचे वार्षिक उत्पन्न २ लाख रुपयांपेक्षा जास्त आहे, ज्यामुळे ही योजना अपात्र ठरू शकते."
      }
    ]
  },

  "awas": {
    id: "awas",
    name_en: "Pradhan Mantri Awas Yojana (PMAY)",
    name_mr: "प्रधानमंत्री आवास योजना",
    questions: [
      { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" },
      { id: "hasPuccaHouse", label_en: "Does family own a pucca house anywhere in India?", label_mr: "कुटुंबाच्या मालकीचे भारतात कुठेही पक्के घर (Pucca House) आहे का?", type: "boolean" },
      { id: "income", label_en: "Annual Family Income (₹)", label_mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number" },
      { id: "hasRccBuilding", label_en: "Do you own an RCC/Concrete Building?", label_mr: "तुमच्याकडे पक्के आरसीसी (RCC) घर/इमारत आहे का?", type: "boolean" },
      { id: "hasSaurPump", label_en: "Have you availed/applied for Solar Pump/Surya Ghar scheme?", label_mr: "तुम्ही सौर पंप किंवा सौर ऊर्जा योजनेचा लाभ घेतला आहे का?", type: "boolean" }
    ],
    direct_rules: [
      {
        id: "age_check",
        field: "age",
        check: (val) => val >= 18,
        message_en: "Applicant must be at least 18 years old.",
        message_mr: "वय १८ वर्षे किंवा त्याहून अधिक असावे."
      },
      {
        id: "pucca_house_check",
        field: "hasPuccaHouse",
        check: (val) => !val,
        message_en: "Family must not own a pucca (concrete) house anywhere in India.",
        message_mr: "अर्जदाराच्या कुटुंबाकडे भारतात कुठेही पक्के घर नसावे."
      }
    ],
    indirect_rules: [
      {
        id: "solar_to_rcc",
        trigger_field: "hasSaurPump",
        trigger_value: true,
        implied_field: "hasRccBuilding",
        implied_value: true,
        reason_en: "Solar panels require an RCC building roof.",
        reason_mr: "सोलर पॅनेल बसवण्यासाठी पक्के आरसीसी छत आवश्यक आहे."
      },
      {
        id: "rcc_to_pucca",
        trigger_field: "hasRccBuilding",
        trigger_value: true,
        implied_field: "hasPuccaHouse",
        implied_value: true,
        reason_en: "Possessing an RCC building means you already own a pucca house, which directly invalidates PMAY housing eligibility.",
        reason_mr: "आरसीसी इमारत असण्याचा अर्थ असा आहे की तुमच्याकडे आधीपासूनच पक्के घर आहे, जे प्रधानमंत्री आवास योजनेच्या पात्रतेला थेट अवैध करते."
      }
    ]
  },

  "pm kisan samman": {
    id: "pm kisan samman",
    name_en: "Pradhan Mantri Kisan Samman Nidhi",
    name_mr: "प्रधानमंत्री - किसान सन्मान निधी",
    questions: [
      { id: "hasLand", label_en: "Do you own cultivable agricultural land?", label_mr: "तुमच्याकडे लागवडीयोग्य शेतजमीन आहे का?", type: "boolean" },
      { id: "isTaxpayer", label_en: "Is anyone in family a Taxpayer?", label_mr: "कुटुंबात कोणी आयकरदाता (Taxpayer) आहे का?", type: "boolean" },
      { id: "isGovtEmployee", label_en: "Is anyone in family a Government Employee?", label_mr: "कुटुंबात कोणी सरकारी कर्मचारी आहे का?", type: "boolean" }
    ],
    direct_rules: [
      {
        id: "land_check",
        field: "hasLand",
        check: (val) => val === true,
        message_en: "Must own cultivable agricultural land to avail farmer benefits.",
        message_mr: "लाभार्थी कुटुंबाच्या नावावर लागवडीयोग्य शेतजमीन असणे बंधनकारक आहे."
      },
      {
        id: "taxpayer_check",
        field: "isTaxpayer",
        check: (val) => !val,
        message_en: "Income taxpayers are excluded from PM-KISAN.",
        message_mr: "आयकर भरणारे शेतकरी या योजनेसाठी अपात्र आहेत."
      },
      {
        id: "govt_check",
        field: "isGovtEmployee",
        check: (val) => !val,
        message_en: "Government employees or retired pensioners receiving > ₹10,000/month are excluded.",
        message_mr: "सरकारी कर्मचारी किंवा १०,००० रुपयांपेक्षा जास्त पेन्शन घेणारे सेवानिवृत्त अधिकारी अपात्र आहेत."
      }
    ],
    indirect_rules: []
  },

  "ujwala scheme": {
    id: "ujwala scheme",
    name_en: "Pradhan Mantri Ujjwala Yojana (PMUY)",
    name_mr: "प्रधानमंत्री उज्ज्वला योजना",
    questions: [
      { id: "gender", label_en: "Gender", label_mr: "लिंग", type: "select", options: [{value: "Female", label_mr: "महिला", label_en: "Female"}, {value: "Male", label_mr: "पुरुष", label_en: "Male"}] },
      { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" },
      { id: "hasLpgConnection", label_en: "Does household already have an LPG connection?", label_mr: "घरात आधीपासून एलपीजी गॅस कनेक्शन आहे का?", type: "boolean" },
      { id: "income", label_en: "Annual Family Income (₹)", label_mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number" }
    ],
    direct_rules: [
      {
        id: "gender_check",
        field: "gender",
        check: (val) => val === "Female",
        message_en: "Scheme is only open to female applicants representing the household.",
        message_mr: "ही योजना फक्त कुटुंबातील महिला सदस्यासाठीच खुली आहे."
      },
      {
        id: "age_check",
        field: "age",
        check: (val) => val >= 18,
        message_en: "Applicant must be at least 18 years old.",
        message_mr: "वय १८ वर्षे पूर्ण असावे."
      },
      {
        id: "lpg_check",
        field: "hasLpgConnection",
        check: (val) => !val,
        message_en: "Household must not already possess any LPG connection.",
        message_mr: "कुटुंबात आधीपासून कोणतेही एलपीजी गॅस जोडणी नसावी."
      },
      {
        id: "income_check",
        field: "income",
        check: (val) => val <= 150000,
        message_en: "Must belong to BPL or low income household (typically < ₹1,50,000).",
        message_mr: "कुटुंब दारिद्र्यरेषेखालील (BPL) किंवा अल्प उत्पन्न गटातील असावे."
      }
    ],
    indirect_rules: []
  },

  "Ayushman Bharat": {
    id: "Ayushman Bharat",
    name_en: "Ayushman Bharat (PM-JAY)",
    name_mr: "आयुष्मान भारत योजना",
    questions: [
      { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" },
      { id: "income", label_en: "Annual Family Income (₹)", label_mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number" },
      { id: "hasRccBuilding", label_en: "Do you own an RCC/Concrete Building?", label_mr: "तुमच्याकडे पक्के आरसीसी (RCC) घर/इमारत आहे का?", type: "boolean" }
    ],
    direct_rules: [
      {
        id: "senior_override",
        field: "age",
        check: (val) => true,
        message_en: "Senior Citizens aged 70+ are automatically eligible under the Vay Vandana Card scheme regardless of income.",
        message_mr: "७० वर्षांवरील सर्व ज्येष्ठ नागरिक उत्पन्नाची अट न ठेवता थेट पात्र आहेत."
      }
    ],
    indirect_rules: [
      {
        id: "rcc_implies_not_poor",
        trigger_field: "hasRccBuilding",
        trigger_value: true,
        implied_field: "income",
        implied_value: 250001,
        reason_en: "RCC building ownership implies non-BPL status, which may limit regular SECC-2011 qualification.",
        reason_mr: "पक्के घर असल्यास सामान्यतः बीपीएल (BPL) यादीतून वगळले जाऊ शकते."
      }
    ]
  },

  "Indira Gandhi National Widow Pension Scheme": {
    id: "Indira Gandhi National Widow Pension Scheme",
    name_en: "Indira Gandhi National Widow Pension Scheme",
    name_mr: "इंदिरा गांधी राष्ट्रीय विधवा निवृत्तीवेतन योजना",
    questions: [
      { id: "gender", label_en: "Gender", label_mr: "लिंग", type: "select", options: [{value: "Female", label_mr: "महिला", label_en: "Female"}] },
      { id: "isWidow", label_en: "Are you a Widow?", label_mr: "तुम्ही विधवा आहात का?", type: "boolean" },
      { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" },
      { id: "income", label_en: "Annual Family Income (₹)", label_mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number" }
    ],
    direct_rules: [
      {
        id: "gender_check",
        field: "gender",
        check: (val) => val === "Female",
        message_en: "Must be female.",
        message_mr: "अर्जदार महिला असणे आवश्यक आहे."
      },
      {
        id: "widow_check",
        field: "isWidow",
        check: (val) => val === true,
        message_en: "Must be a widow.",
        message_mr: "अर्जदार विधवा असणे आवश्यक आहे."
      },
      {
        id: "age_check",
        field: "age",
        check: (val) => val >= 40 && val <= 79,
        message_en: "Age must be between 40 and 79 years.",
        message_mr: "वय ४० ते ७९ वर्षांच्या दरम्यान असावे."
      },
      {
        id: "income_check",
        field: "income",
        check: (val) => val <= 100000,
        message_en: "Must belong to BPL category (family income <= ₹1,00,000).",
        message_mr: "कुटुंब दारिद्र्यरेषेखालील (BPL) असावे."
      }
    ],
    indirect_rules: []
  },

  "indira gandhi disability ": {
    id: "indira gandhi disability ",
    name_en: "Indira Gandhi National Disability Pension Scheme",
    name_mr: "इंदिरा गांधी राष्ट्रीय अपंगत्व निनिवृत्तीवेतन योजना",
    questions: [
      { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" },
      { id: "disabilityPercent", label_en: "Disability Percentage (%)", label_mr: "अपंगत्वाचे प्रमाण (%)", type: "number" },
      { id: "income", label_en: "Annual Family Income (₹)", label_mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number" }
    ],
    direct_rules: [
      {
        id: "age_check",
        field: "age",
        check: (val) => val >= 18 && val <= 79,
        message_en: "Age must be between 18 and 79 years.",
        message_mr: "वय १८ ते ७९ वर्षांच्या दरम्यान असावे."
      },
      {
        id: "disability_check",
        field: "disabilityPercent",
        check: (val) => val >= 80,
        message_en: "Must have a minimum of 80% severe or multiple disability.",
        message_mr: "अपंगत्वाचे प्रमाण ८०% किंवा त्यापेक्षा जास्त असावे."
      },
      {
        id: "income_check",
        field: "income",
        check: (val) => val <= 100000,
        message_en: "Must be below poverty line (BPL) with income <= ₹1,00,000.",
        message_mr: "कुटुंब दारिद्र्यरेषेखालील असावे."
      }
    ],
    indirect_rules: []
  },

  "national_scholarship_scheme_details": {
    id: "national_scholarship_scheme_details",
    name_en: "National Scholarship Scheme",
    name_mr: "राष्ट्रीय शिष्यवृत्ती योजना",
    questions: [
      { id: "isStudent", label_en: "Are you a student currently studying?", label_mr: "तुम्ही सध्या शिक्षण घेत असलेले विद्यार्थी आहात का?", type: "boolean" },
      { id: "academicPercent", label_en: "Marks in Previous Class (%)", label_mr: "मागील वर्षाचे गुण (%)", type: "number" },
      { id: "income", label_en: "Annual Family Income (₹)", label_mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number" }
    ],
    direct_rules: [
      {
        id: "student_check",
        field: "isStudent",
        check: (val) => val === true,
        message_en: "Applicant must be actively studying.",
        message_mr: "अर्जदार सध्या शिक्षण घेत असलेला असावा."
      },
      {
        id: "marks_check",
        field: "academicPercent",
        check: (val) => val >= 50,
        message_en: "Must have secured minimum 50% marks in the final exam of the previous class.",
        message_mr: "मागील परीक्षेत किमान ५०% गुण असणे आवश्यक आहे."
      },
      {
        id: "income_check",
        field: "income",
        check: (val) => val <= 200000,
        message_en: "Annual family income must not exceed ₹2,00,000.",
        message_mr: "कुटुंबाचे एकूण वार्षिक उत्पन्न २ लाख रुपयांपेक्षा कमी असावे."
      }
    ],
    indirect_rules: []
  },

  "pm jivan jyoti": {
    id: "pm jivan jyoti",
    name_en: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
    name_mr: "प्रधानमंत्री जीवन ज्योती विमा योजना",
    questions: [
      { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" }
    ],
    direct_rules: [
      {
        id: "age_check",
        field: "age",
        check: (val) => val >= 18 && val <= 50,
        message_en: "Age must be between 18 and 50 years.",
        message_mr: "वय १८ ते ५० वर्षांच्या दरम्यान असावे."
      }
    ],
    indirect_rules: []
  },

  "pm suraksha ": {
    id: "pm suraksha ",
    name_en: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
    name_mr: "घा प्रधानमंत्री सुरक्षा विमा योजना",
    questions: [
      { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" }
    ],
    direct_rules: [
      {
        id: "age_check",
        field: "age",
        check: (val) => val >= 18 && val <= 70,
        message_en: "Age must be between 18 and 70 years.",
        message_mr: "वय १८ ते ७० वर्षांच्या दरम्यान असावे."
      }
    ],
    indirect_rules: []
  },

  "stand_up_india_details": {
    id: "stand_up_india_details",
    name_en: "Stand Up India Scheme",
    name_mr: "स्टँड अप इंडिया योजना",
    questions: [
      { id: "gender", label_en: "Gender", label_mr: "लिंग", type: "select", options: [{value: "Female", label_mr: "महिला", label_en: "Female"}, {value: "Male", label_mr: "पुरुष", label_en: "Male"}] },
      { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" },
      { id: "isScOrSt", label_en: "Do you belong to SC or ST category?", label_mr: "तुम्ही अनुसूचित जाती (SC) किंवा अनुसूचित जमाती (ST) वर्गातील आहात का?", type: "boolean" }
    ],
    direct_rules: [
      {
        id: "age_check",
        field: "age",
        check: (val) => val >= 18,
        message_en: "Must be at least 18 years old.",
        message_mr: "वय किमान १८ वर्षे असावे."
      },
      {
        id: "category_check",
        field: "isScOrSt",
        check: (val, allInputs) => val === true || allInputs.gender === "Female",
        message_en: "Borrower must be SC/ST and/or Female.",
        message_mr: "अर्जदार हा अनुसूचित जाती/जमाती (SC/ST) किंवा महिला असणे बंधनकारक आहे."
      }
    ],
    indirect_rules: []
  },

  "startup_india_details": {
    id: "startup_india_details",
    name_en: "Startup India Scheme",
    name_mr: "स्टार्टअप इंडिया योजना",
    questions: [
      { id: "isRegisteredEntity", label_en: "Is your entity a Private Ltd / LLP / Registered Partnership?", label_mr: "तुमची संस्था प्रा. लि. / LLP / नोंदणीकृत भागीदारी फर्म आहे का?", type: "boolean" },
      { id: "yearsSinceIncorporation", label_en: "Years since Incorporation/Registration", label_mr: "स्थापनेपासून झालेली वर्षे", type: "number" },
      { id: "annualTurnover", label_en: "Maximum turnover in any FY (₹)", label_mr: "स्थापनेपासूनचे कमाल वार्षिक उलाढाल (₹)", type: "number" }
    ],
    direct_rules: [
      {
        id: "entity_check",
        field: "isRegisteredEntity",
        check: (val) => val === true,
        message_en: "Must be a Private Limited Company, Partnership Firm, or LLP.",
        message_mr: "संस्था प्रायव्हेट लिमिटेड, भागीदारी फर्म किंवा एलएलपी म्हणून नोंदणीकृत असावी."
      },
      {
        id: "incorporation_check",
        field: "yearsSinceIncorporation",
        check: (val) => val <= 10,
        message_en: "Entity age must not exceed 10 years from the date of incorporation.",
        message_mr: "स्थापनेपासून १० वर्षांपेक्षा जास्त कालावधी झालेला नसावा."
      },
      {
        id: "turnover_check",
        field: "annualTurnover",
        check: (val) => val <= 1000000000,
        message_en: "Turnover must not have exceeded ₹100 crore in any previous financial year.",
        message_mr: "उलाढाल १०० कोटी रुपयांपेक्षा जास्त गेलेली नसावी."
      }
    ],
    indirect_rules: []
  },

  "svannidi": {
    id: "svannidi",
    name_en: "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
    name_mr: "पीएम स्वनिधी योजना",
    questions: [
      { id: "isStreetVendor", label_en: "Are you a street vendor?", label_mr: "तुम्ही फेरीवाले (Street Vendor) आहात का?", type: "boolean" }
    ],
    direct_rules: [
      {
        id: "vendor_check",
        field: "isStreetVendor",
        check: (val) => val === true,
        message_en: "Scheme is only for street vendors/hawkers.",
        message_mr: "ही योजना केवळ पथविक्रेते/फेरीवाल्यांसाठी आहे."
      }
    ],
    indirect_rules: []
  }
};

// Map database names, DB IDs, or short_names to logicTrees keys
function resolveSchemeKey(identifier) {
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

  if (logicTrees[identifier]) return identifier;
  return null;
}

function checkEligibility(schemeIdentifier, inputs) {
  const resolvedKey = resolveSchemeKey(schemeIdentifier);
  const tree = logicTrees[resolvedKey];
  
  if (!tree) {
    return { eligible: true, reasons: [], auditLog: [] };
  }

  const reasons = [];
  const auditLog = [];
  const resolvedInputs = { ...inputs };

  if (resolvedInputs.age) resolvedInputs.age = Number(resolvedInputs.age);
  if (resolvedInputs.income) resolvedInputs.income = Number(resolvedInputs.income);
  if (resolvedInputs.disabilityPercent) resolvedInputs.disabilityPercent = Number(resolvedInputs.disabilityPercent);
  if (resolvedInputs.annualTurnover) resolvedInputs.annualTurnover = Number(resolvedInputs.annualTurnover);
  if (resolvedInputs.yearsSinceIncorporation) resolvedInputs.yearsSinceIncorporation = Number(resolvedInputs.yearsSinceIncorporation);
  if (resolvedInputs.academicPercent) resolvedInputs.academicPercent = Number(resolvedInputs.academicPercent);

  // Evaluate indirect rules first
  if (tree.indirect_rules && tree.indirect_rules.length > 0) {
    for (const rule of tree.indirect_rules) {
      const triggerVal = resolvedInputs[rule.trigger_field];
      if (triggerVal === rule.trigger_value) {
        const originalVal = resolvedInputs[rule.implied_field];
        if (rule.implied_field === "income") {
          resolvedInputs[rule.implied_field] = Math.max(originalVal || 0, rule.implied_value);
        } else {
          resolvedInputs[rule.implied_field] = rule.implied_value;
        }

        auditLog.push({
          type: "indirect",
          success: false,
          ruleId: rule.id,
          message_en: `Inferred: ${rule.reason_en}`,
          message_mr: `अप्रत्यक्ष निष्कर्ष: ${rule.reason_mr}`
        });
      }
    }
  }

  // Senior override
  if (resolvedKey === "Ayushman Bharat" && resolvedInputs.age >= 70) {
    auditLog.push({
      type: "override",
      success: true,
      ruleId: "senior_override",
      message_en: "Eligible via senior citizen 70+ Vay Vandana override.",
      message_mr: "७०+ ज्येष्ठ नागरिक वाय वंदना सवलतीद्वारे थेट पात्र."
    });
    return { eligible: true, reasons: [], auditLog };
  }

  // Direct rules
  for (const rule of tree.direct_rules) {
    const value = resolvedInputs[rule.field];

    if (value === undefined || value === null || value === "") continue;

    const isPass = rule.check(value, resolvedInputs);
    if (!isPass) {
      reasons.push(rule.message_en);
      auditLog.push({
        type: "direct",
        success: false,
        ruleId: rule.id,
        message_en: `Disqualified: ${rule.message_en}`,
        message_mr: `अपात्र: ${rule.message_mr}`
      });
    } else {
      auditLog.push({
        type: "direct",
        success: true,
        ruleId: rule.id,
        message_en: `Verified: Valid ${rule.field}`,
        message_mr: `सत्यशोधन: वैध ${rule.field}`
      });
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    auditLog
  };
}

module.exports = {
  checkEligibility,
  logicTrees,
  resolveSchemeKey
};
