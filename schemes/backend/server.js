const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { checkEligibility, resolveSchemeKey } = require('./rulesEngine');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// API: Get all schemes
app.get('/api/schemes', async (req, res) => {
  try {
    const allSchemes = await pool.query('SELECT * FROM schemes');
    res.json(allSchemes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// API: Get scheme by ID with all details
app.get('/api/schemes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const scheme = await pool.query('SELECT * FROM schemes WHERE id = $1', [id]);
    if (scheme.rows.length === 0) {
      return res.status(404).json({ error: 'Scheme not found' });
    }

    const eligibility = await pool.query('SELECT * FROM eligibility_criteria WHERE scheme_id = $1', [id]);
    const benefits = await pool.query('SELECT * FROM benefits WHERE scheme_id = $1', [id]);
    const documents = await pool.query('SELECT * FROM documents_required WHERE scheme_id = $1', [id]);
    const disqualifications = await pool.query('SELECT reason FROM disqualification_criteria WHERE scheme_id = $1', [id]);
    const applicationSteps = await pool.query('SELECT step_no, description FROM application_steps WHERE scheme_id = $1 ORDER BY step_no', [id]);

    res.json({
      ...scheme.rows[0],
      eligibility: eligibility.rows,
      benefits: benefits.rows,
      documents: documents.rows,
      disqualifications: disqualifications.rows.map(row => row.reason),
      application_steps: applicationSteps.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// API: Get disqualifications by scheme ID
app.get('/api/schemes/:id/disqualifications', async (req, res) => {
  try {
    const { id } = req.params;
    const disqualifications = await pool.query('SELECT reason FROM disqualification_criteria WHERE scheme_id = $1', [id]);
    res.json(disqualifications.rows.map(row => row.reason));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// API: Create new scheme
app.post('/api/schemes', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      scheme_name_mr, scheme_name_en, short_name, launched_by, launch_date,
      official_website, helpline, nodal_ministry, implementing_agency, scheme_type, description,
      eligibility, benefits, documents, disqualifications, application_steps
    } = req.body;

    await client.query('BEGIN');

    const schemeInsert = await client.query(
      `INSERT INTO schemes (
        scheme_name_mr, scheme_name_en, short_name, launched_by, launch_date, 
        official_website, helpline, nodal_ministry, implementing_agency, scheme_type, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        scheme_name_mr || '', scheme_name_en || '', short_name || '',
        launched_by || '', launch_date || '',
        official_website || '', helpline || '',
        nodal_ministry || '', implementing_agency || '',
        scheme_type || '', description || ''
      ]
    );
    const schemeId = schemeInsert.rows[0].id;

    if (eligibility && Array.isArray(eligibility)) {
      for (const crit of eligibility) {
        await client.query(
          `INSERT INTO eligibility_criteria (scheme_id, criteria_name, details, is_required) VALUES ($1, $2, $3, $4)`,
          [schemeId, crit.criteria_name, crit.details, crit.is_required || false]
        );
      }
    }

    if (benefits && Array.isArray(benefits)) {
      for (const b of benefits) {
        await client.query(
          `INSERT INTO benefits (scheme_id, benefit_name, description) VALUES ($1, $2, $3)`,
          [schemeId, b.benefit_name, b.description]
        );
      }
    }

    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        await client.query(
          `INSERT INTO documents_required (scheme_id, document_name, doc_type) VALUES ($1, $2, $3)`,
          [schemeId, doc.document_name || doc, doc.doc_type || 'mandatory']
        );
      }
    }

    if (disqualifications && Array.isArray(disqualifications)) {
      for (const reason of disqualifications) {
        await client.query(
          `INSERT INTO disqualification_criteria (scheme_id, reason) VALUES ($1, $2)`,
          [schemeId, reason]
        );
      }
    }

    if (application_steps && Array.isArray(application_steps)) {
      for (const step of application_steps) {
        await client.query(
          `INSERT INTO application_steps (scheme_id, step_no, description) VALUES ($1, $2, $3)`,
          [schemeId, step.step_no, step.description]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Scheme created successfully', id: schemeId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server Error during insertion' });
  } finally {
    client.release();
  }
});

// API: Update existing scheme
app.put('/api/schemes/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const {
      scheme_name_mr, scheme_name_en, short_name, launched_by, launch_date,
      official_website, helpline, nodal_ministry, implementing_agency, scheme_type, description,
      eligibility, benefits, documents, disqualifications, application_steps
    } = req.body;

    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE schemes SET 
        scheme_name_mr = $1, scheme_name_en = $2, short_name = $3, launched_by = $4, launch_date = $5, 
        official_website = $6, helpline = $7, nodal_ministry = $8, implementing_agency = $9, scheme_type = $10, description = $11
      WHERE id = $12 RETURNING id`,
      [
        scheme_name_mr, scheme_name_en, short_name, launched_by, launch_date,
        official_website, helpline, nodal_ministry, implementing_agency, scheme_type, description,
        id
      ]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Scheme not found' });
    }

    await client.query('DELETE FROM eligibility_criteria WHERE scheme_id = $1', [id]);
    await client.query('DELETE FROM benefits WHERE scheme_id = $1', [id]);
    await client.query('DELETE FROM documents_required WHERE scheme_id = $1', [id]);
    await client.query('DELETE FROM disqualification_criteria WHERE scheme_id = $1', [id]);
    await client.query('DELETE FROM application_steps WHERE scheme_id = $1', [id]);

    if (eligibility && Array.isArray(eligibility)) {
      for (const crit of eligibility) {
        await client.query(
          `INSERT INTO eligibility_criteria (scheme_id, criteria_name, details, is_required) VALUES ($1, $2, $3, $4)`,
          [id, crit.criteria_name, crit.details, crit.is_required || false]
        );
      }
    }

    if (benefits && Array.isArray(benefits)) {
      for (const b of benefits) {
        await client.query(
          `INSERT INTO benefits (scheme_id, benefit_name, description) VALUES ($1, $2, $3)`,
          [id, b.benefit_name, b.description]
        );
      }
    }

    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        await client.query(
          `INSERT INTO documents_required (scheme_id, document_name, doc_type) VALUES ($1, $2, $3)`,
          [id, doc.document_name || doc, doc.doc_type || 'mandatory']
        );
      }
    }

    if (disqualifications && Array.isArray(disqualifications)) {
      for (const reason of disqualifications) {
        await client.query(
          `INSERT INTO disqualification_criteria (scheme_id, reason) VALUES ($1, $2)`,
          [id, reason]
        );
      }
    }

    if (application_steps && Array.isArray(application_steps)) {
      for (const step of application_steps) {
        await client.query(
          `INSERT INTO application_steps (scheme_id, step_no, description) VALUES ($1, $2, $3)`,
          [id, step.step_no, step.description]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Scheme updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ error: 'Server Error during update' });
  } finally {
    client.release();
  }
});

// API: Delete a scheme
app.delete('/api/schemes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteResult = await pool.query('DELETE FROM schemes WHERE id = $1 RETURNING id', [id]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scheme not found' });
    }

    res.json({ message: 'Scheme deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error during deletion' });
  }
});

// API: Get logic tree questions config for a scheme
app.get('/api/schemes/:id/logic-tree', async (req, res) => {
  try {
    const { id } = req.params;
    const { logicTrees, resolveSchemeKey } = require('./rulesEngine');
    
    let resolvedKey = id;
    let schemeNameEn = '';
    let schemeNameMr = '';
    
    const dbScheme = await pool.query('SELECT id, short_name, scheme_name_en, scheme_name_mr FROM schemes WHERE id = $1', [id]);
    if (dbScheme.rows.length > 0) {
      const row = dbScheme.rows[0];
      resolvedKey = row.short_name || row.scheme_name_en || id;
      schemeNameEn = row.scheme_name_en || '';
      schemeNameMr = row.scheme_name_mr || '';
    }
    
    const resolvedKeyResolved = resolveSchemeKey(resolvedKey);
    let tree = logicTrees[resolvedKeyResolved];
    
    // If no custom logic tree exists, generate a dynamic fallback tree!
    if (!tree) {
      const dbCriteria = await pool.query('SELECT criteria_name, details, is_required FROM eligibility_criteria WHERE scheme_id = $1', [id]);
      
      const questions = [
        { id: "gender", label_en: "Gender", label_mr: "लिंग", type: "select", options: [{value: "Female", label_mr: "महिला", label_en: "Female"}, {value: "Male", label_mr: "पुरुष", label_en: "Male"}] },
        { id: "age", label_en: "Age (years)", label_mr: "वय (वर्षे)", type: "number" },
        { id: "income", label_en: "Annual Family Income (₹)", label_mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number" }
      ];

      // Add dynamic boolean questions for other required database criteria
      dbCriteria.rows.forEach((crit, index) => {
        const name = crit.criteria_name || '';
        const nameLower = name.toLowerCase();
        
        // Skip age, income, gender as they are already default questions
        if (nameLower.includes('age') || nameLower.includes('वय') || 
            nameLower.includes('income') || nameLower.includes('उत्पन्न') || 
            nameLower.includes('gender') || nameLower.includes('लिंग')) {
          return;
        }

        // Add custom Yes/No question
        const qId = `crit_${index}`;
        questions.push({
          id: qId,
          label_en: `Do you meet the criteria: "${name}"?`,
          label_mr: `तुम्ही "${name}" निकष पूर्ण करता का?`,
          type: "boolean",
          db_crit_name: name,
          is_required: crit.is_required
        });
      });

      tree = {
        id: id,
        name_en: schemeNameEn,
        name_mr: schemeNameMr,
        questions: questions
      };
    }
    
    res.json({
      id: tree.id,
      name_en: tree.name_en,
      name_mr: tree.name_mr,
      questions: tree.questions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// API: Check eligibility using logic trees & rules engine
app.post('/api/check-eligibility', async (req, res) => {
  try {
    const { schemeId, inputs } = req.body;
    if (!schemeId) {
      return res.status(400).json({ error: 'schemeId is required' });
    }

    let resolvedKey = schemeId;
    if (!isNaN(schemeId)) {
      const dbScheme = await pool.query('SELECT short_name, scheme_name_en FROM schemes WHERE id = $1', [schemeId]);
      if (dbScheme.rows.length > 0) {
        const row = dbScheme.rows[0];
        resolvedKey = row.short_name || row.scheme_name_en || schemeId;
      }
    }

    const resolvedKeyResolved = resolveSchemeKey(resolvedKey);
    const { logicTrees } = require('./rulesEngine');
    const customTree = logicTrees[resolvedKeyResolved];

    if (customTree) {
      const evaluation = checkEligibility(resolvedKey, inputs || {});
      return res.json(evaluation);
    }

    // Fallback: Dynamic rules evaluation using database criteria!
    const dbCriteria = await pool.query('SELECT criteria_name, details, is_required FROM eligibility_criteria WHERE scheme_id = $1', [schemeId]);
    
    const reasons = [];
    const auditLog = [];
    const resolvedInputs = inputs || {};

    // 1. Basic Age check (default >= 18)
    const age = Number(resolvedInputs.age);
    if (!isNaN(age) && resolvedInputs.age !== '') {
      if (age < 18) {
        reasons.push("Applicant must be at least 18 years old.");
        auditLog.push({
          type: "direct",
          success: false,
          ruleId: "age_check",
          message_en: "Disqualified: Applicant must be at least 18 years old.",
          message_mr: "अपात्र: अर्जदाराचे वय किमान १८ वर्षे असावे."
        });
      } else {
        auditLog.push({
          type: "direct",
          success: true,
          ruleId: "age_check",
          message_en: "Verified: Age is 18 or above.",
          message_mr: "सत्यशोधन: वय १८ किंवा अधिक आहे."
        });
      }
    }

    // 2. Dynamic criteria check
    dbCriteria.rows.forEach((crit, index) => {
      const name = crit.criteria_name || '';
      const nameLower = name.toLowerCase();
      
      if (nameLower.includes('age') || nameLower.includes('वय') || 
          nameLower.includes('income') || nameLower.includes('उत्पन्न') || 
          nameLower.includes('gender') || nameLower.includes('लिंग')) {
        return;
      }

      const qId = `crit_${index}`;
      const userValue = resolvedInputs[qId];
      
      if (userValue === false && crit.is_required) {
        reasons.push(`Does not meet required criteria: ${name}`);
        auditLog.push({
          type: "direct",
          success: false,
          ruleId: qId,
          message_en: `Disqualified: Does not meet required criteria: "${name}"`,
          message_mr: `अपात्र: "${name}" निकष पूर्ण करत नाही.`
        });
      } else if (userValue === true) {
        auditLog.push({
          type: "direct",
          success: true,
          ruleId: qId,
          message_en: `Verified: Meets criteria "${name}"`,
          message_mr: `सत्यशोधन: "${name}" निकष पूर्ण करतो.`
        });
      }
    });

    res.json({
      eligible: reasons.length === 0,
      reasons,
      auditLog
    });

  } catch (err) {
    console.error('Eligibility check error:', err.message);
    res.status(500).json({ error: 'Server Error during eligibility check' });
  }
});

// --- EXTENSION ENDPOINTS ---
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper to handle python script execution APIs
const runPythonScript = (scriptName, logName, res) => {
  const scriptPath = path.join(__dirname, scriptName);
  exec(`python "${scriptPath}"`, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running ${scriptName}:`, error);
      return res.status(500).json({ error: `Failed to run ${scriptName}`, details: error.message });
    }
    const logPath = path.join(__dirname, logName);
    fs.readFile(logPath, 'utf8', (err, logData) => {
      if (err) {
        return res.json({ message: 'Execution complete, but log file could not be read.', stdout, stderr });
      }
      res.type('text/plain').send(logData);
    });
  });
};

// Helper to serve reports
const serveReportFile = (fileName, res) => {
  const filePath = path.join(__dirname, '../govt-data/reports', fileName);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({ error: `Report ${fileName} not found. Please run the comparison engine first.` });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      res.status(500).json({ error: 'Failed to parse report file.', details: parseErr.message });
    }
  });
};

// API: Process all Excel files and import them into PostgreSQL
app.get('/process-data', (req, res) => runPythonScript('process_data.py', 'import.log', res));
app.get('/api/process-data', (req, res) => runPythonScript('process_data.py', 'import.log', res));

// API: Run the comparison and fuzzy matching engine
app.get('/compare', (req, res) => runPythonScript('compare_beneficiaries.py', 'comparison.log', res));
app.get('/api/compare', (req, res) => runPythonScript('compare_beneficiaries.py', 'comparison.log', res));

// API: Get matched people JSON report
app.get('/matched', (req, res) => serveReportFile('matched_people.json', res));
app.get('/api/matched', (req, res) => serveReportFile('matched_people.json', res));

// API: Get duplicate people JSON report
app.get('/duplicates', (req, res) => serveReportFile('duplicate_people.json', res));
app.get('/api/duplicates', (req, res) => serveReportFile('duplicate_people.json', res));

// API: Get statistics JSON report
app.get('/statistics', (req, res) => serveReportFile('statistics.json', res));
app.get('/api/statistics', (req, res) => serveReportFile('statistics.json', res));

// Helper for Jaro-Winkler distance calculation
function getJaroDistance(s1, s2) {
  if (s1 === s2) return 1.0;
  const len1 = s1.length;
  const len2 = s2.length;
  const matchWindow = Math.max(0, Math.floor(Math.max(len1, len2) / 2) - 1);
  const matches1 = new Array(len1).fill(false);
  const matches2 = new Array(len2).fill(false);
  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(len2 - 1, i + matchWindow);
    for (let j = start; j <= end; j++) {
      if (!matches2[j] && s1[i] === s2[j]) {
        matches1[i] = true;
        matches2[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (matches1[i]) {
      while (!matches2[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  transpositions = Math.floor(transpositions / 2);
  return (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3.0;
}

function getJaroWinklerSimilarity(s1, s2) {
  const jaro = getJaroDistance(s1, s2);
  if (jaro < 0.7) return jaro;
  let prefix = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1.0 - jaro);
}

// API: Search Beneficiary across all schemes (Fuzzy Name, Aadhaar, Mobile)
app.get('/api/search-beneficiary', async (req, res) => {
  try {
    const queryStr = req.query.q;
    if (!queryStr || queryStr.trim() === '') {
      return res.json([]);
    }

    const trimmed = queryStr.trim();
    const digits = trimmed.replace(/\D/g, '');

    let candidates = [];
    let matchedField = '';
    let isNameSearch = false;

    if (digits.length === 10) {
      // Mobile search
      matchedField = 'mobile';
      const result = await pool.query(
        'SELECT * FROM beneficiaries WHERE mobile LIKE $1 OR mobile LIKE $2',
        [`%${digits}%`, `%${digits}.0%`]
      );
      candidates = result.rows;
    } else if (digits.length === 4 || digits.length === 12) {
      // Aadhaar search
      matchedField = 'aadhaar';
      const last4 = digits.slice(-4);
      const result = await pool.query(
        'SELECT * FROM beneficiaries WHERE aadhaar LIKE $1',
        [`%${last4}`]
      );
      candidates = result.rows;
    } else {
      // Name search
      isNameSearch = true;
      matchedField = 'beneficiary_name';
      const words = trimmed.split(/\s+/).map(w => w.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '')).filter(w => w.length > 0);
      if (words.length > 0) {
        let sql = 'SELECT * FROM beneficiaries WHERE ';
        let params = [];
        let clauses = [];
        words.forEach((word, idx) => {
          params.push(`%${word}%`);
          clauses.push(`beneficiary_name ILIKE $${idx + 1} OR father_or_husband_name ILIKE $${idx + 1}`);
        });
        sql += clauses.join(' OR ') + ' LIMIT 500';
        const result = await pool.query(sql, params);
        candidates = result.rows;
      }
    }

    if (candidates.length === 0) {
      return res.json([]);
    }

    // Load all schemes from database
    const schemesResult = await pool.query('SELECT id, scheme_name_en, scheme_name_mr, short_name FROM schemes');
    const allSchemes = schemesResult.rows.filter(s => s.scheme_name_en || s.scheme_name_mr || s.short_name);

    // Load matched report to obtain pre-computed cross-scheme eligibility
    let matchedPeopleData = [];
    const reportPath = path.join(__dirname, '../govt-data/reports/matched_people.json');
    if (fs.existsSync(reportPath)) {
      try {
        matchedPeopleData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      } catch (e) {
        console.error('Error reading matched_people.json:', e.message);
      }
    }

    const normText = (text) => {
      if (!text) return "";
      return text.toString().toLowerCase().trim().replace(/[\s\-_,\.\(\)]+/g, '');
    };

    const normQuery = normText(trimmed);
    const uniqueIndividuals = [];

    // Process candidate search hits
    for (const record of candidates) {
      let score = 100;
      let fields = [matchedField];

      if (isNameSearch) {
        const normName = normText(record.beneficiary_name);
        const nameScore = getJaroWinklerSimilarity(normQuery, normName) * 100;

        const normFather = normText(record.father_or_husband_name);
        const fatherScore = getJaroWinklerSimilarity(normQuery, normFather) * 100;

        score = Math.max(nameScore, fatherScore);
        if (fatherScore > nameScore) {
          fields = ['father_or_husband_name'];
        }

        if (score < 60) continue;
      }

      // De-duplicate same physical individuals
      let foundGroup = uniqueIndividuals.find(ind => {
        const normNameA = normText(record.beneficiary_name);
        const normNameB = normText(ind.beneficiary_name);

        // Genders must not conflict
        const getGenderCode = (val) => {
          if (!val) return null;
          const g = val.toString().toLowerCase().trim();
          if (g === 'f' || g === 'female' || g === 'महिला' || g === 'म') return 'f';
          if (g === 'm' || g === 'male' || g === 'पुरुष' || g === 'पु') return 'm';
          return null;
        };
        const g1 = getGenderCode(record.gender);
        const g2 = getGenderCode(ind.gender);
        if (g1 && g2 && g1 !== g2) return false;

        // Names must be highly similar (Jaro-Winkler >= 0.85)
        const nameSim = getJaroWinklerSimilarity(normNameA, normNameB);
        if (nameSim >= 0.85) {
          if (record.aadhaar && ind.aadhaar && record.aadhaar === ind.aadhaar) return true;
          if (record.mobile && ind.mobile && record.mobile === ind.mobile) return true;
          if (normText(record.village) === normText(ind.village)) return true;
        }
        return false;
      });

      if (foundGroup) {
        if (score > foundGroup.matching_score) {
          foundGroup.matching_score = Math.round(score);
        }
        if (!foundGroup.records.some(r => r.id === record.id)) {
          foundGroup.records.push(record);
        }
      } else {
        uniqueIndividuals.push({
          beneficiary_name: record.beneficiary_name,
          aadhaar: record.aadhaar,
          mobile: record.mobile,
          gender: record.gender,
          village: record.village,
          taluka: record.taluka,
          district: record.district,
          matching_score: Math.round(score),
          matched_fields: fields,
          records: [record]
        });
      }
    }

    // Resolve eligibility checker rules engine resolver helper
    const resolveSchemeKey = require('./rulesEngine').resolveSchemeKey;
    const isSchemeMatch = (dbScheme, recordSchemeName) => {
      const dbKey = resolveSchemeKey(dbScheme.short_name) || resolveSchemeKey(dbScheme.scheme_name_en) || resolveSchemeKey(dbScheme.id);
      const recKey = resolveSchemeKey(recordSchemeName);
      return dbKey && recKey && dbKey === recKey;
    };

    const results = uniqueIndividuals.map(ind => {
      // Find cross-scheme registered schemes in DB records for this person
      const registeredSchemes = [];
      ind.records.forEach(r => {
        if (r.scheme_name && !registeredSchemes.includes(r.scheme_name)) {
          registeredSchemes.push(r.scheme_name);
        }
      });

      // Find if this person matches in the pre-computed matched_people.json to get their full eligibility matching list
      let matchedSchemesReport = [];
      const reportMatch = matchedPeopleData.find(item => {
        if (ind.aadhaar && item.aadhaar && ind.aadhaar === item.aadhaar) return true;
        if (ind.mobile && item.mobile && ind.mobile === item.mobile) return true;
        if (normText(ind.beneficiary_name) === normText(item.beneficiary_name)) return true;
        return false;
      });

      if (reportMatch && Array.isArray(reportMatch.matched_schemes)) {
        matchedSchemesReport = reportMatch.matched_schemes;
      }

      // Check each scheme
      const schemesStatus = allSchemes.map(dbScheme => {
        // Registered in DB
        const isRegistered = registeredSchemes.some(sName => isSchemeMatch(dbScheme, sName));
        // Eligible according to the pre-computed matching report
        const isEligible = matchedSchemesReport.some(sName => isSchemeMatch(dbScheme, sName));

        return {
          scheme_id: dbScheme.id,
          scheme_name_en: dbScheme.scheme_name_en || dbScheme.short_name || 'Government Scheme',
          scheme_name_mr: dbScheme.scheme_name_mr || dbScheme.short_name || 'सरकारी योजना',
          short_name: dbScheme.short_name,
          status: (isRegistered || isEligible) ? 'Found' : 'Not Found'
        };
      });

      return {
        beneficiary_name: ind.beneficiary_name || 'Unnamed Beneficiary',
        aadhaar: ind.aadhaar || 'N/A',
        mobile: ind.mobile || 'N/A',
        gender: ind.gender || 'N/A',
        village: ind.village || 'N/A',
        taluka: ind.taluka || 'N/A',
        district: ind.district || 'N/A',
        matching_score: ind.matching_score,
        matched_fields: ind.matched_fields,
        schemes: schemesStatus
      };
    });

    results.sort((a, b) => b.matching_score - a.matching_score);
    res.json(results);

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server Error during beneficiary search' });
  }
});

// API: Scheme-to-Scheme Comparison Engine Metrics
app.get('/api/compare-schemes', async (req, res) => {
  try {
    const { schemeA, schemeB } = req.query;
    if (!schemeA || !schemeB) {
      return res.status(400).json({ error: 'Both schemeA and schemeB query parameters are required' });
    }

    // Load schemes from DB
    const schemesResult = await pool.query('SELECT id, scheme_name_en, scheme_name_mr, short_name FROM schemes');
    const allSchemes = schemesResult.rows;

    const dbSchemeA = allSchemes.find(s => s.id === Number(schemeA) || s.short_name === schemeA || s.scheme_name_en === schemeA);
    const dbSchemeB = allSchemes.find(s => s.id === Number(schemeB) || s.short_name === schemeB || s.scheme_name_en === schemeB);

    if (!dbSchemeA || !dbSchemeB) {
      return res.status(404).json({ error: 'One or both schemes not found in database' });
    }

    // Load reports
    let matchedPeople = [];
    let duplicatePeople = [];

    const matchedPath = path.join(__dirname, '../govt-data/reports/matched_people.json');
    const duplicatesPath = path.join(__dirname, '../govt-data/reports/duplicate_people.json');

    if (fs.existsSync(matchedPath)) {
      matchedPeople = JSON.parse(fs.readFileSync(matchedPath, 'utf8'));
    }
    if (fs.existsSync(duplicatesPath)) {
      duplicatePeople = JSON.parse(fs.readFileSync(duplicatesPath, 'utf8'));
    }

    const resolveSchemeKey = require('./rulesEngine').resolveSchemeKey;
    const keyA = resolveSchemeKey(dbSchemeA.short_name) || resolveSchemeKey(dbSchemeA.scheme_name_en) || resolveSchemeKey(dbSchemeA.id);
    const keyB = resolveSchemeKey(dbSchemeB.short_name) || resolveSchemeKey(dbSchemeB.scheme_name_en) || resolveSchemeKey(dbSchemeB.id);

    const matchesKey = (resolvedKey, targetName) => {
      const targetKey = resolveSchemeKey(targetName);
      return resolvedKey && targetKey && resolvedKey === targetKey;
    };

    let totalA = 0;
    let totalB = 0;
    let common = 0;
    let duplicateCountA = 0;
    let duplicateCountB = 0;
    let duplicateCountCommon = 0;

    const normText = (text) => {
      if (!text) return "";
      return text.toString().toLowerCase().trim().replace(/[\s\-_,\.\(\)]+/g, '');
    };

    matchedPeople.forEach(person => {
      const schemesList = person.registered_schemes || person.matched_schemes || [];
      const hasA = Array.isArray(schemesList) && schemesList.some(s => matchesKey(keyA, s));
      const hasB = Array.isArray(schemesList) && schemesList.some(s => matchesKey(keyB, s));

      // Find duplicate count for this person if they are in duplicatePeople report
      let dupCount = 0;
      const dupMatch = duplicatePeople.find(dp => 
        (person.aadhaar && dp.aadhaar && person.aadhaar === dp.aadhaar) ||
        (person.mobile && dp.mobile && person.mobile === dp.mobile) ||
        (person.beneficiary_name && dp.beneficiary_name && normText(person.beneficiary_name) === normText(dp.beneficiary_name))
      );
      if (dupMatch) {
        dupCount = dupMatch.duplicate_count - 1;
      }

      if (hasA) {
        totalA++;
        duplicateCountA += dupCount;
      }
      if (hasB) {
        totalB++;
        duplicateCountB += dupCount;
      }
      if (hasA && hasB) {
        common++;
        duplicateCountCommon += dupCount;
      }
    });

    const uniqueA = totalA - common;
    const uniqueB = totalB - common;
    const union = totalA + totalB - common;
    const matchPercentageUnion = union > 0 ? Math.round((common / union) * 100 * 10) / 10 : 0;
    const matchPercentageA = totalA > 0 ? Math.round((common / totalA) * 100 * 10) / 10 : 0;

    res.json({
      schemeA: {
        id: dbSchemeA.id,
        name_en: dbSchemeA.scheme_name_en || dbSchemeA.short_name || 'Scheme A',
        name_mr: dbSchemeA.scheme_name_mr || dbSchemeA.short_name || 'योजना अ',
        short_name: dbSchemeA.short_name,
        total_beneficiaries: totalA,
        unique_beneficiaries: uniqueA,
        duplicate_beneficiaries: duplicateCountA
      },
      schemeB: {
        id: dbSchemeB.id,
        name_en: dbSchemeB.scheme_name_en || dbSchemeB.short_name || 'Scheme B',
        name_mr: dbSchemeB.scheme_name_mr || dbSchemeB.short_name || 'योजना ब',
        short_name: dbSchemeB.short_name,
        total_beneficiaries: totalB,
        unique_beneficiaries: uniqueB,
        duplicate_beneficiaries: duplicateCountB
      },
      common_beneficiaries: common,
      duplicate_beneficiaries_common: duplicateCountCommon,
      match_percentage_union: matchPercentageUnion,
      match_percentage_schemeA: matchPercentageA
    });

  } catch (err) {
    console.error('Comparison error:', err);
    res.status(500).json({ error: 'Server Error during scheme-to-scheme comparison' });
  }
});

// API: Generate Name Similarity Report of similar beneficiaries across schemes/villages
app.get('/api/similarity-report', async (req, res) => {
  try {
    const duplicatesPath = path.join(__dirname, '../govt-data/reports/duplicate_people.json');
    if (!fs.existsSync(duplicatesPath)) {
      return res.status(404).json({ error: 'Duplicate report not found. Please run the comparison engine first.' });
    }

    const duplicatePeople = JSON.parse(fs.readFileSync(duplicatesPath, 'utf8'));
    const similarityReport = [];

    const normText = (text) => {
      if (!text) return "";
      return text.toString().toLowerCase().trim().replace(/[\s\-_,\.\(\)]+/g, '');
    };

    duplicatePeople.forEach(group => {
      const records = group.records || [];
      if (records.length < 2) return;

      const primaryRec = records[0];
      
      for (let i = 1; i < records.length; i++) {
        const secondaryRec = records[i];
        const matchedFields = ['name'];
        
        const nameA = group.beneficiary_name || primaryRec.original_json?.['Farmer Name'] || primaryRec.original_json?.['Beneficiary Name'] || 'N/A';
        const nameB = secondaryRec.original_json?.['Farmer Name'] || secondaryRec.original_json?.['Beneficiary Name'] || group.beneficiary_name || 'N/A';

        const mobileA = primaryRec.original_json?.['Mobile No.'] || group.mobile || '';
        const mobileB = secondaryRec.original_json?.['Mobile No.'] || group.mobile || '';
        if (mobileA && mobileB && mobileA.toString().replace('.0','') === mobileB.toString().replace('.0','')) {
          matchedFields.push('mobile');
        }

        const aadhaarA = primaryRec.original_json?.['Aadhaar No.'] || group.aadhaar || '';
        const aadhaarB = secondaryRec.original_json?.['Aadhaar No.'] || group.aadhaar || '';
        if (aadhaarA && aadhaarB && aadhaarA === aadhaarB) {
          matchedFields.push('aadhaar');
        }

        const villageA = primaryRec.village || '';
        const villageB = secondaryRec.village || '';
        if (villageA && villageB && normText(villageA) === normText(villageB)) {
          matchedFields.push('village');
        }

        similarityReport.push({
          beneficiaryA: {
            name: nameA,
            scheme: primaryRec.scheme_name,
            village: primaryRec.village,
            taluka: primaryRec.taluka,
            district: primaryRec.district
          },
          beneficiaryB: {
            name: nameB,
            scheme: secondaryRec.scheme_name,
            village: secondaryRec.village,
            taluka: secondaryRec.taluka,
            district: secondaryRec.district
          },
          matching_score: group.matching_score || 100,
          matched_fields: matchedFields
        });
      }
    });

    res.json(similarityReport);
  } catch (err) {
    console.error('Similarity report error:', err);
    res.status(500).json({ error: 'Server Error during similarity report generation' });
  }
});

// --- AUTOMATIC FILE WATCHER & PROCESSING PIPELINE ---
const watchGovtDataDir = path.join(__dirname, '../govt-data');
const watchHingoliDir = path.join(__dirname, '../hingoli');

let isProcessing = false;
let pendingImport = false;
let pendingCompare = false;
let pendingScheme = false;
let debounceTimer = null;

function runPipeline() {
  if (isProcessing) {
    // If already running, check again in 1 second
    debounceTimer = setTimeout(runPipeline, 1000);
    return;
  }
  isProcessing = true;

  const steps = [];

  if (pendingScheme) {
    steps.push(() => runCmd('node importData.js', 'Scheme definition import'));
    pendingScheme = false;
  }
  if (pendingImport) {
    steps.push(() => runCmd('python process_data.py', 'Beneficiary Excel import'));
    pendingImport = false;
  }
  if (pendingCompare) {
    steps.push(() => runCmd('python compare_beneficiaries.py', 'Fuzzy matching compare'));
    pendingCompare = false;
  }

  if (steps.length > 0) {
    executeSteps(steps);
  } else {
    isProcessing = false;
  }
}

function runCmd(cmd, description) {
  return new Promise((resolve) => {
    console.log(`[Auto-Watcher] Starting: ${description} (${cmd})...`);
    exec(cmd, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Auto-Watcher] Error running ${cmd}:`, error.message);
      } else {
        console.log(`[Auto-Watcher] Finished: ${description}.`);
      }
      resolve();
    });
  });
}

async function executeSteps(steps) {
  try {
    for (const step of steps) {
      await step();
    }
    console.log('[Auto-Watcher] Auto-processing pipeline run completed successfully.');
  } catch (err) {
    console.error('[Auto-Watcher] Pipeline execution error:', err);
  } finally {
    isProcessing = false;
  }
}

function triggerPipeline(type) {
  if (type === 'scheme') {
    pendingScheme = true;
  } else if (type === 'beneficiary') {
    pendingImport = true;
  }
  pendingCompare = true;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runPipeline, 2000);
}

// Watch govt-data directory for new scheme json files
if (fs.existsSync(watchGovtDataDir)) {
  console.log(`[Auto-Watcher] Starting watch on government data folder: ${watchGovtDataDir}`);
  fs.watch(watchGovtDataDir, (eventType, filename) => {
    if (filename && filename.endsWith('.json')) {
      console.log(`[Auto-Watcher] Detected scheme file change: ${filename}`);
      triggerPipeline('scheme');
    }
  });
} else {
  console.warn(`[Auto-Watcher] Directory not found: ${watchGovtDataDir}`);
}

// Watch hingoli directory for new beneficiary excel files
if (fs.existsSync(watchHingoliDir)) {
  console.log(`[Auto-Watcher] Starting watch on beneficiary excel folder: ${watchHingoliDir}`);
  fs.watch(watchHingoliDir, (eventType, filename) => {
    if (filename && (filename.endsWith('.xlsx') || filename.endsWith('.xls'))) {
      console.log(`[Auto-Watcher] Detected beneficiary file change: ${filename}`);
      triggerPipeline('beneficiary');
    }
  });
} else {
  console.warn(`[Auto-Watcher] Directory not found: ${watchHingoliDir}`);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
