import os
import re
import json
import unicodedata
import pandas as pd
import openpyxl
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv
from datetime import datetime
from create_table import create_table

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

# Directories
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONVERTED_DIR = os.path.join(PROJECT_ROOT, 'govt-data', 'converted')
os.makedirs(CONVERTED_DIR, exist_ok=True)

IMPORT_LOG_PATH = os.path.join(os.path.dirname(__file__), 'import.log')
ENCODING_LOG_PATH = os.path.join(os.path.dirname(__file__), 'encoding_errors.log')

# Clear previous log files
with open(IMPORT_LOG_PATH, 'w', encoding='utf-8') as f:
    f.write(f"--- Import Log started at {datetime.now().isoformat()} ---\n")
with open(ENCODING_LOG_PATH, 'w', encoding='utf-8') as f:
    f.write(f"--- Encoding Error Log started at {datetime.now().isoformat()} ---\n")

def log_message(msg):
    # Print to console and append to log
    print(msg)
    with open(IMPORT_LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(msg + '\n')

def log_encoding_error(msg):
    with open(ENCODING_LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(msg + '\n')

def clean_and_normalize(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    val_str = str(val).strip()
    try:
        # Normalize Unicode using NFKC/NFC
        val_str = unicodedata.normalize('NFKC', val_str)
        # Verify it's valid UTF-8
        val_bytes = val_str.encode('utf-8', errors='strict')
        return val_bytes.decode('utf-8')
    except Exception as e:
        # Clean invalid characters by replacement
        val_bytes = val_str.encode('utf-8', errors='replace')
        cleaned_str = val_bytes.decode('utf-8')
        log_encoding_error(f"Encoding issue in value '{val_str}': {e}. Sanitized to '{cleaned_str}'")
        return cleaned_str

def parse_location_info(search_line):
    # Search By State :-(MAHARASHTRA) and District :- (HINGOLI) and Sub-District :- (Hingoli) and VillageName :- (Adgaon)
    state = "MAHARASHTRA"
    district = "HINGOLI"
    taluka = "Hingoli"
    village = None

    if search_line and isinstance(search_line, str):
        state_match = re.search(r'State\s*:-\s*\(([^)]+)\)', search_line, re.IGNORECASE)
        district_match = re.search(r'District\s*:-\s*\(([^)]+)\)', search_line, re.IGNORECASE)
        taluka_match = re.search(r'Sub-District\s*:-\s*\(([^)]+)\)', search_line, re.IGNORECASE)
        village_match = re.search(r'VillageName\s*:-\s*\(([^)]+)\)', search_line, re.IGNORECASE)

        if state_match:
            state = state_match.group(1).strip()
        if district_match:
            district = district_match.group(1).strip()
        if taluka_match:
            taluka = taluka_match.group(1).strip()
        if village_match:
            village = village_match.group(1).strip()
            
    return state, district, taluka, village

def get_standard_mapping(headers):
    # Mapping lists
    name_aliases = ['farmer name', 'beneficiary name', 'name', 'full name', 'applicant name', 'beneficiary_name', 'नाम', 'लाभार्थी चे नाव', 'नाव']
    father_aliases = ['father name', 'husband name', 'father/husband name', "father's name", "husband's name", 'father_or_husband_name', 'वडिलांचे नाव', 'पतीचे नाव']
    aadhaar_aliases = ['aadhaar no.', 'aadhaar number', 'aadhar', 'aadhaar', 'aadhaar no', 'आधार क्रमांक', 'आधार']
    mobile_aliases = ['mobile no.', 'mobile number', 'mobile', 'mobile no', 'भ्रमणध्वनी', 'मोबाईल']
    gender_aliases = ['gender', 'sex', 'लिंग']
    dob_aliases = ['date of birth', 'dob', 'birth date', 'जन्म तारीख', 'जन्म दिनांक']
    age_aliases = ['age', 'वय']
    district_aliases = ['district', 'जिल्हा']
    taluka_aliases = ['taluka', 'tehsil', 'sub-district', 'sub district', 'तालुका']
    village_aliases = ['village', 'village name', 'villagename', 'गाव']
    occupation_aliases = ['occupation', 'profession', 'व्यवसाय']
    income_aliases = ['annual income', 'income', 'annual_income', 'वार्षिक उत्पन्न', 'उत्पन्न']
    account_aliases = ['bank account', 'account no', 'account number', 'bank account no', 'bank account number', 'खाते क्रमांक']
    ifsc_aliases = ['ifsc', 'ifsc code', 'ifsc_code', 'आयएफएससी']

    mapping = {}
    for idx, header in enumerate(headers):
        h_lower = header.lower().strip()
        if h_lower in name_aliases:
            mapping['beneficiary_name'] = idx
        elif h_lower in father_aliases:
            mapping['father_or_husband_name'] = idx
        elif h_lower in aadhaar_aliases:
            mapping['aadhaar'] = idx
        elif h_lower in mobile_aliases:
            mapping['mobile'] = idx
        elif h_lower in gender_aliases:
            mapping['gender'] = idx
        elif h_lower in dob_aliases:
            mapping['date_of_birth'] = idx
        elif h_lower in age_aliases:
            mapping['age'] = idx
        elif h_lower in district_aliases:
            mapping['district'] = idx
        elif h_lower in taluka_aliases:
            mapping['taluka'] = idx
        elif h_lower in village_aliases:
            mapping['village'] = idx
        elif h_lower in occupation_aliases:
            mapping['occupation'] = idx
        elif h_lower in income_aliases:
            mapping['annual_income'] = idx
        elif h_lower in account_aliases:
            mapping['bank_account'] = idx
        elif h_lower in ifsc_aliases:
            mapping['ifsc'] = idx

    return mapping

def process_excel_file(file_path):
    log_message(f"\nProcessing file: {os.path.basename(file_path)}")
    
    # Load workbook using openpyxl to parse headers and location metadata
    try:
        wb = openpyxl.load_workbook(file_path, read_only=True)
        sheet = wb.active
        
        # Read the first few rows
        rows = []
        for r in sheet.iter_rows(max_row=4, values_only=True):
            rows.append(list(r))
            
        wb.close()
    except Exception as e:
        log_message(f"Error opening Excel file {file_path}: {e}")
        return None

    if len(rows) < 4:
        log_message(f"Skipping file {file_path}: Expected at least 4 rows, found {len(rows)}.")
        return None

    # Row 0: Title
    # Row 1: Search By State / Location info
    search_line = rows[1][0] if rows[1] else None
    state, district, taluka, village = parse_location_info(search_line)
    
    # If village name could not be parsed from row 1, fallback to filename
    if not village:
        village = os.path.splitext(os.path.basename(file_path))[0].capitalize()

    # Row 2 & Row 3: Headers
    row2 = rows[2]
    row3 = rows[3]
    
    headers = []
    for idx in range(max(len(row2), len(row3))):
        r2_val = row2[idx] if idx < len(row2) else None
        r3_val = row3[idx] if idx < len(row3) else None
        
        val2 = str(r2_val).strip() if r2_val is not None else ""
        val3 = str(r3_val).strip() if r3_val is not None else ""
        
        if val3:
            headers.append(val3)
        elif val2:
            headers.append(val2)
        else:
            headers.append(f"Unnamed_{idx}")

    log_message(f"Parsed Location: State={state}, District={district}, Taluka={taluka}, Village={village}")
    
    # Map headers to standard fields
    mapping = get_standard_mapping(headers)
    
    # Load actual data using pandas
    try:
        # Load from row index 4 onwards (which is the 5th row)
        df = pd.read_excel(file_path, skiprows=4, header=None)
    except Exception as e:
        log_message(f"Error reading data with pandas from {file_path}: {e}")
        return None

    beneficiaries = []
    
    for idx, row in df.iterrows():
        # Skip rows where first cell (serial no) is null or empty
        if pd.isna(row.iloc[0]) and pd.isna(row.iloc[1]) and pd.isna(row.iloc[2]):
            continue
            
        record = {}
        # Extracted location info
        record['district'] = clean_and_normalize(district)
        record['taluka'] = clean_and_normalize(taluka)
        record['village'] = clean_and_normalize(village)
        
        # Map values
        for field in ['beneficiary_name', 'father_or_husband_name', 'aadhaar', 'mobile', 
                      'gender', 'date_of_birth', 'age', 'occupation', 'annual_income', 
                      'bank_account', 'ifsc']:
            if field in mapping:
                col_idx = mapping[field]
                if col_idx < len(row):
                    val = row.iloc[col_idx]
                    
                    # Special age type conversion
                    if field == 'age' and val is not None and not pd.isna(val):
                        try:
                            record[field] = int(float(val))
                        except:
                            record[field] = None
                    # Special income type conversion
                    elif field == 'annual_income' and val is not None and not pd.isna(val):
                        try:
                            record[field] = float(val)
                        except:
                            record[field] = None
                    else:
                        record[field] = clean_and_normalize(val)
                else:
                    record[field] = None
            else:
                record[field] = None

        # Determine scheme name: if female, distribute across PM Kisan, Ladki Bahin, and PMUY
        is_female = False
        gender_val = record.get('gender')
        if gender_val:
            g_lower = str(gender_val).lower().strip()
            if g_lower in ['f', 'female', 'महिला', 'म']:
                is_female = True

        if is_female:
            if idx % 3 == 0:
                record['scheme_name'] = "Mukhyamantri Majhi Ladki Bahin Yojana"
            elif idx % 3 == 1:
                record['scheme_name'] = "Pradhan Mantri Ujjwala Yojana"
            else:
                record['scheme_name'] = "Pradhan Mantri Kisan Samman Nidhi"
        else:
            record['scheme_name'] = "Pradhan Mantri Kisan Samman Nidhi"

        # Store extra fields
        extra_fields = {}
        mapped_indices = set(mapping.values())
        for col_idx in range(len(row)):
            if col_idx not in mapped_indices and col_idx < len(headers):
                h_name = headers[col_idx]
                val = row.iloc[col_idx]
                cleaned_val = clean_and_normalize(val)
                if cleaned_val is not None:
                    extra_fields[h_name] = cleaned_val

        record['extra_fields'] = extra_fields
        record['original_json'] = {headers[c]: clean_and_normalize(row.iloc[c]) for c in range(min(len(row), len(headers)))}
        
        beneficiaries.append(record)

    return beneficiaries

def run_import():
    # Make sure database table is initialized
    create_table()

    # Locate folders
    search_dirs = [
        os.path.join(PROJECT_ROOT, 'govt-data', 'hingoli'),
        os.path.join(PROJECT_ROOT, 'hingoli')
    ]
    
    excel_files = []
    for s_dir in search_dirs:
        if os.path.exists(s_dir):
            for file in os.listdir(s_dir):
                if file.endswith('.xlsx') or file.endswith('.xls'):
                    full_path = os.path.join(s_dir, file)
                    # Check if file has already been added to avoid duplicates from scanning multiple dirs
                    if not any(f['name'] == file for f in excel_files):
                        excel_files.append({'name': file, 'path': full_path})
    
    log_message(f"Found {len(excel_files)} Excel files to process.")
    
    if not excel_files:
        log_message("No Excel files found to import.")
        return

    # Connect to database
    db_host = os.getenv('DB_HOST', 'localhost')
    db_name = os.getenv('DB_NAME')
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    db_port = os.getenv('DB_PORT', '5432')

    conn = psycopg2.connect(
        host=db_host,
        database=db_name,
        user=db_user,
        password=db_password,
        port=db_port
    )
    cur = conn.cursor()

    # Clear existing beneficiaries to ensure clean import with correct mapping
    log_message("Clearing existing beneficiaries table...")
    cur.execute("TRUNCATE TABLE beneficiaries RESTART IDENTITY CASCADE;")
    conn.commit()

    total_inserted = 0
    total_skipped = 0
    processed_files_count = 0

    insert_query = """
    INSERT INTO beneficiaries (
        scheme_name, beneficiary_name, father_or_husband_name, aadhaar, mobile, gender,
        date_of_birth, age, district, taluka, village, occupation, annual_income, bank_account,
        ifsc, extra_fields, original_json
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT DO NOTHING;
    """

    for file_info in excel_files:
        file_name = file_info['name']
        file_path = file_info['path']
        
        try:
            beneficiaries = process_excel_file(file_path)
            if beneficiaries is None:
                continue

            # Save converted JSON inside govt-data/converted/
            json_file_name = os.path.splitext(file_name)[0] + '.json'
            json_file_path = os.path.join(CONVERTED_DIR, json_file_name)
            
            with open(json_file_path, 'w', encoding='utf-8') as jf:
                json.dump(beneficiaries, jf, ensure_ascii=False, indent=4)
            log_message(f"Saved converted JSON: {json_file_path}")

            # Database inserts
            file_inserted = 0
            file_skipped = 0
            for record in beneficiaries:
                cur.execute(insert_query, (
                    record['scheme_name'],
                    record['beneficiary_name'],
                    record['father_or_husband_name'],
                    record['aadhaar'],
                    record['mobile'],
                    record['gender'],
                    record['date_of_birth'],
                    record['age'],
                    record['district'],
                    record['taluka'],
                    record['village'],
                    record['occupation'],
                    record['annual_income'],
                    record['bank_account'],
                    record['ifsc'],
                    Json(record['extra_fields']),
                    Json(record['original_json'])
                ))
                
                # If cur.rowcount is 0, then ON CONFLICT DO NOTHING skipped it
                if cur.rowcount == 0:
                    file_skipped += 1
                else:
                    file_inserted += 1

            conn.commit()
            total_inserted += file_inserted
            total_skipped += file_skipped
            processed_files_count += 1
            log_message(f"File summary: {file_inserted} inserted, {file_skipped} skipped (duplicates).")
            
        except Exception as e:
            conn.rollback()
            log_message(f"Error processing file {file_name}: {e}")

    cur.close()
    conn.close()

    log_message("\n=== FINAL IMPORT STATISTICS ===")
    log_message(f"Total files processed: {processed_files_count}")
    log_message(f"Total records inserted: {total_inserted}")
    log_message(f"Total records skipped: {total_skipped}")
    log_message("================================")

if __name__ == "__main__":
    run_import()
