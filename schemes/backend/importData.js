const fs = require('fs');
const path = require('path');
const pool = require('./db');

const dataDir = path.join(__dirname, '../govt-data');

const createTablesQuery = `
  DROP TABLE IF EXISTS disqualification_criteria CASCADE;
  DROP TABLE IF EXISTS documents_required CASCADE;
  DROP TABLE IF EXISTS benefits CASCADE;
  DROP TABLE IF EXISTS eligibility_criteria CASCADE;
  DROP TABLE IF EXISTS application_steps CASCADE;
  DROP TABLE IF EXISTS schemes CASCADE;

  CREATE TABLE schemes (
      id SERIAL PRIMARY KEY,
      scheme_name_mr VARCHAR(255),
      scheme_name_en VARCHAR(255),
      short_name VARCHAR(100),
      launched_by VARCHAR(255),
      launch_date VARCHAR(100),
      official_website VARCHAR(500),
      helpline VARCHAR(255),
      nodal_ministry VARCHAR(255),
      implementing_agency VARCHAR(255),
      scheme_type VARCHAR(255),
      description TEXT
  );

  CREATE TABLE eligibility_criteria (
      id SERIAL PRIMARY KEY,
      scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
      criteria_name VARCHAR(255),
      details TEXT,
      is_required BOOLEAN
  );

  CREATE TABLE benefits (
      id SERIAL PRIMARY KEY,
      scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
      benefit_name VARCHAR(255),
      description TEXT
  );

  CREATE TABLE documents_required (
      id SERIAL PRIMARY KEY,
      scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
      document_name VARCHAR(255),
      doc_type VARCHAR(100) -- 'mandatory' or 'verification'
  );

  CREATE TABLE disqualification_criteria (
      id SERIAL PRIMARY KEY,
      scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
      reason TEXT
  );

  CREATE TABLE application_steps (
      id SERIAL PRIMARY KEY,
      scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
      step_no INTEGER,
      description TEXT
  );
`;

async function importData() {
  const client = await pool.connect();
  
  try {
    console.log('Recreating database tables for clean import...');
    await client.query(createTablesQuery);
    console.log('Tables created successfully.');

    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} JSON files in govt-data folder.`);

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(rawData);

        // Extract basic scheme info with robust fallbacks for different JSON layouts
        const scheme = data.scheme || data.scheme_details || {};
        const name = scheme.name || {
          marathi: scheme.scheme_name_mr || data.scheme_name_mr || '',
          english: scheme.scheme_name_en || scheme.scheme_name || data.scheme_name || '',
          short_name: scheme.short_name || data.short_name || ''
        };
        const obj = data.objective || {};
        const desc = obj.primary || scheme.objective || 'सरकारी योजना';

        // 1. Insert Scheme
        const schemeRes = await client.query(
          `INSERT INTO schemes (
            scheme_name_mr, scheme_name_en, short_name, launched_by, launch_date, 
            official_website, helpline, nodal_ministry, implementing_agency, scheme_type, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
          [
            name.marathi || '', name.english || '', name.short_name || '',
            scheme.launched_by || '', scheme.launch_date || '',
            scheme.official_website || (data.contact_details && data.contact_details.official_website) || (data.support_and_contact && data.support_and_contact.grievance_portal) || '',
            scheme.helpline || (data.contact_details && data.contact_details.helpline) || (data.support_and_contact && data.support_and_contact.toll_free_helpline && data.support_and_contact.toll_free_helpline[0]) || '',
            scheme.nodal_ministry || scheme.ministry || '', scheme.implementing_agency || '',
            scheme.scheme_type || (data.statistics && data.statistics.scheme_type) || '', desc
          ]
        );
        
        const schemeId = schemeRes.rows[0].id;
        console.log(`Imported Scheme: ${name.english || name.short_name || file} (ID: ${schemeId})`);

        // 2. Insert Eligibility Criteria
        if (data.eligibility_criteria) {
          for (const [key, val] of Object.entries(data.eligibility_criteria)) {
            if (key === 'excluded_categories') {
              // Insert into disqualifications instead
              const exclusions = Array.isArray(val) ? val : [val];
              for (const reason of exclusions) {
                await client.query(
                  `INSERT INTO disqualification_criteria (scheme_id, reason) VALUES ($1, $2)`,
                  [schemeId, reason]
                );
              }
            } else {
              const isReq = (val.required === true || val.required === 'true'); // ensure boolean
              const details = val.details || JSON.stringify(val);
              await client.query(
                `INSERT INTO eligibility_criteria (scheme_id, criteria_name, details, is_required) VALUES ($1, $2, $3, $4)`,
                [schemeId, key.replace(/_/g, ' '), details, isReq]
              );
            }
          }
        }

        // 3. Insert Benefits
        if (data.benefits) {
          for (const [key, val] of Object.entries(data.benefits)) {
            let benefitDesc = '';
            if (val.amount) benefitDesc = `₹${val.amount} ${val.currency || ''}`;
            else if (val.number_of_installments) benefitDesc = `${val.number_of_installments} installments of ₹${val.amount_per_installment}`;
            else benefitDesc = JSON.stringify(val);
            
            await client.query(
              `INSERT INTO benefits (scheme_id, benefit_name, description) VALUES ($1, $2, $3)`,
              [schemeId, key.replace(/_/g, ' '), benefitDesc]
            );
          }
        }

        // 4. Insert Documents
        if (data.documents_required) {
          const mandatory = data.documents_required.mandatory || [];
          const verification = data.documents_required.verification_documents || [];

          for (const doc of mandatory) {
            await client.query(
              `INSERT INTO documents_required (scheme_id, document_name, doc_type) VALUES ($1, $2, $3)`,
              [schemeId, doc, 'mandatory']
            );
          }

          for (const doc of verification) {
            await client.query(
              `INSERT INTO documents_required (scheme_id, document_name, doc_type) VALUES ($1, $2, $3)`,
              [schemeId, doc, 'verification']
            );
          }
        }

        // 5. Insert Application Steps (User's parser logic)
        if (data.application_process) {
          let stepNo = 1;
          for (const [key, val] of Object.entries(data.application_process)) {
            // Case 1: step_1, step_2 ...
            if (key.startsWith("step_")) {
              await client.query(
                `
                INSERT INTO application_steps
                (scheme_id, step_no, description)
                VALUES ($1, $2, $3)
                `,
                [schemeId, stepNo++, val]
              );
            }
            // Case 2: online.steps / offline.steps
            else if (
              typeof val === "object" &&
              val !== null &&
              Array.isArray(val.steps)
            ) {
              for (const step of val.steps) {
                await client.query(
                  `
                  INSERT INTO application_steps
                  (scheme_id, step_no, description)
                  VALUES ($1, $2, $3)
                  `,
                  [schemeId, stepNo++, step]
                );
              }
            }
            // Case 3: Direct array
            else if (Array.isArray(val)) {
              for (const item of val) {
                await client.query(
                  `
                  INSERT INTO application_steps
                  (scheme_id, step_no, description)
                  VALUES ($1, $2, $3)
                  `,
                  [schemeId, stepNo++, item]
                );
              }
            }
            // Case 4: String values like processing_time
            else if (typeof val === "string") {
              await client.query(
                `
                INSERT INTO application_steps
                (scheme_id, step_no, description)
                VALUES ($1, $2, $3)
                `,
                [schemeId, stepNo++, `${key}: ${val}`]
              );
            }
          }
        }
      } catch (err) {
        console.error(`Skipping ${file} due to error:`, err.message);
      }
    }

    console.log('✅ ALL JSON DATA IMPORTED SUCCESSFULLY INTO POSTGRESQL!');
  } catch (e) {
    console.error('❌ Error importing data:', e);
  } finally {
    client.release();
    pool.end();
  }
}

importData();
