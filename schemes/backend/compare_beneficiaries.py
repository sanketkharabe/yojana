import os
import re
import json
import unicodedata
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from datetime import datetime
from rapidfuzz import fuzz

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORTS_DIR = os.path.join(PROJECT_ROOT, 'govt-data', 'reports')
os.makedirs(REPORTS_DIR, exist_ok=True)

COMPARE_LOG_PATH = os.path.join(os.path.dirname(__file__), 'comparison.log')

# Clear previous log
with open(COMPARE_LOG_PATH, 'w', encoding='utf-8') as f:
    f.write(f"--- Comparison Engine Log started at {datetime.now().isoformat()} ---\n")

def log_message(msg):
    print(msg)
    with open(COMPARE_LOG_PATH, 'a', encoding='utf-8') as f:
        f.write(msg + '\n')

def normalize_text(text):
    if text is None:
        return ""
    # Convert to lowercase, strip, normalize unicode
    s = str(text).lower().strip()
    s = unicodedata.normalize('NFKC', s)
    # Remove extra spaces, special characters
    s = re.sub(r'[\s\-_,\.\(\)]+', '', s)
    return s

def check_scheme_eligibility(record):
    # Base schemes they belong to
    eligible_schemes = ["Pradhan Mantri Kisan Samman Nidhi"]
    
    gender = record.get('gender')
    # Normalize gender
    is_female = False
    if gender:
        g_norm = str(gender).lower().strip()
        if g_norm in ['f', 'female', 'महिला', 'म']:
            is_female = True

    # 1. Ladki Bahin Yojana (needs female)
    if is_female:
        eligible_schemes.append("Mukhyamantri Majhi Ladki Bahin Yojana")
        
    # 2. Stand Up India (needs female)
    if is_female:
        eligible_schemes.append("Stand Up India Scheme")
        
    # 3. PM Ujjwala Yojana (needs female)
    if is_female:
        eligible_schemes.append("Pradhan Mantri Ujjwala Yojana (PMUY)")
        
    # 4. PM Suraksha Bima Yojana (PMSBY) (available for everyone aged 18-70)
    eligible_schemes.append("Pradhan Mantri Suraksha Bima Yojana (PMSBY)")
    
    # 5. PM Jeevan Jyoti Bima Yojana (PMJJBY) (available for everyone aged 18-50)
    eligible_schemes.append("Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)")
    
    # 6. Ayushman Bharat (PM-JAY)
    eligible_schemes.append("Ayushman Bharat (PM-JAY)")

    # 7. Agro Service Provider
    eligible_schemes.append("Agro Service Provider Scheme")

    return eligible_schemes

def run_comparison():
    log_message("Starting Comparison Engine...")

    # Connect to DB
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
    cur = conn.cursor(cursor_factory=RealDictCursor)

    log_message("Fetching beneficiaries from database...")
    cur.execute("SELECT id, scheme_name, beneficiary_name, father_or_husband_name, aadhaar, mobile, gender, date_of_birth, age, district, taluka, village, bank_account, ifsc, extra_fields, original_json FROM beneficiaries")
    records = cur.fetchall()
    log_message(f"Fetched {len(records)} records.")

    if not records:
        log_message("No beneficiaries to compare. Exiting.")
        cur.close()
        conn.close()
        return

    # Pre-normalize records and group them by blocking keys to optimize performance
    log_message("Normalizing records for matching...")
    normalized_records = {}
    
    aadhaar_blocks = {}
    mobile_blocks = {}
    name_blocks = {}

    for r in records:
        rid = r['id']
        
        norm_name = normalize_text(r['beneficiary_name'])
        norm_aadhaar = normalize_text(r['aadhaar'])
        norm_mobile = normalize_text(r['mobile'])
        norm_father = normalize_text(r['father_or_husband_name'])
        
        # Save normalized representation
        normalized_records[rid] = {
            'record': r,
            'name_norm': norm_name,
            'aadhaar_norm': norm_aadhaar,
            'mobile_norm': norm_mobile,
            'father_norm': norm_father,
            'village_norm': normalize_text(r['village']),
            'district_norm': normalize_text(r['district']),
            'taluka_norm': normalize_text(r['taluka']),
            'bank_norm': normalize_text(r['bank_account']),
            'ifsc_norm': normalize_text(r['ifsc'])
        }

        # Indexing for blocking
        if norm_aadhaar and len(norm_aadhaar) >= 4:
            aadhaar_blocks.setdefault(norm_aadhaar, []).append(rid)
            
        if norm_mobile and len(norm_mobile) >= 10:
            mobile_blocks.setdefault(norm_mobile, []).append(rid)

        if norm_name and len(norm_name) >= 3:
            prefix = norm_name[:3]
            name_blocks.setdefault(prefix, []).append(rid)

    log_message("Matching records using blocked pairwise comparisons...")
    
    matches = []
    compared_pairs = set()

    def compare_pair(id1, id2):
        pair = (min(id1, id2), max(id1, id2))
        if pair in compared_pairs:
            return
        compared_pairs.add(pair)

        r1 = normalized_records[id1]
        r2 = normalized_records[id2]

        # Check for conflicting genders first
        def get_gender_code(val):
            if not val:
                return None
            g_norm = str(val).lower().strip()
            if g_norm in ['f', 'female', 'महिला', 'म']:
                return 'f'
            if g_norm in ['m', 'male', 'पुरुष', 'पु']:
                return 'm'
            return None

        g1 = get_gender_code(r1['record']['gender'])
        g2 = get_gender_code(r2['record']['gender'])
        if g1 and g2 and g1 != g2:
            return

        score = 0
        matched_fields = []

        name_sim = fuzz.token_sort_ratio(r1['name_norm'], r2['name_norm'])
        
        # Helper to check if Aadhaar is masked (starts with X or has X in it)
        def is_masked_aadhaar(val):
            return 'x' in val.lower()

        # 1. Check if both have Aadhaar and they match
        aadhaar_matches = False
        if r1['aadhaar_norm'] and r2['aadhaar_norm'] and r1['aadhaar_norm'] == r2['aadhaar_norm']:
            if is_masked_aadhaar(r1['aadhaar_norm']):
                # If Aadhaar is masked, we require Name similarity >= 85% to confirm it's a match
                if name_sim >= 85:
                    aadhaar_matches = True
            else:
                # Full unmasked Aadhaar is a direct match
                aadhaar_matches = True

        # 2. Check if both have Mobile and they match
        mobile_matches = False
        if r1['mobile_norm'] and r2['mobile_norm'] and r1['mobile_norm'] == r2['mobile_norm']:
            # Mobile match is very strong, but we still require Name similarity >= 85% to prevent matching different family members on a shared mobile
            if name_sim >= 85:
                mobile_matches = True

        # Determine Match Score and Fields
        if aadhaar_matches:
            # If they also share mobile or village, score is higher
            score = 100 if (mobile_matches or r1['village_norm'] == r2['village_norm']) else 98
            matched_fields.append('aadhaar')
            matched_fields.append('beneficiary_name')
            if mobile_matches:
                matched_fields.append('mobile')
            if r1['village_norm'] == r2['village_norm']:
                matched_fields.append('village')

        elif mobile_matches:
            score = 95
            matched_fields.append('mobile')
            matched_fields.append('beneficiary_name')
            if r1['village_norm'] == r2['village_norm']:
                matched_fields.append('village')

        else:
            # If no Aadhaar/Mobile match, we can match on Name + Village + Father Name (if present)
            # or just Name + Village if name similarity is extremely high
            if r1['village_norm'] and r2['village_norm'] and r1['village_norm'] == r2['village_norm']:
                if name_sim >= 92:
                    score = round(name_sim, 1)
                    matched_fields.append('beneficiary_name')
                    matched_fields.append('village')
                    
                    # If they also have matching father's name, increase confidence
                    if r1['father_norm'] and r2['father_norm']:
                        father_sim = fuzz.token_sort_ratio(r1['father_norm'], r2['father_norm'])
                        if father_sim >= 85:
                            score = max(score, 95.0)
                            matched_fields.append('father_or_husband_name')

        if score > 90:
            matches.append({
                'id1': id1,
                'id2': id2,
                'score': score,
                'matched_fields': matched_fields
            })

    # Execute comparisons in blocks
    # 1. Compare within Aadhaar blocks
    for rid_list in aadhaar_blocks.values():
        if len(rid_list) > 1:
            for i in range(len(rid_list)):
                for j in range(i + 1, len(rid_list)):
                    compare_pair(rid_list[i], rid_list[j])

    # 2. Compare within Mobile blocks
    for rid_list in mobile_blocks.values():
        if len(rid_list) > 1:
            for i in range(len(rid_list)):
                for j in range(i + 1, len(rid_list)):
                    compare_pair(rid_list[i], rid_list[j])

    # 3. Compare within Name prefix blocks (Taluka-localized to prevent scaling bottleneck)
    for rid_list in name_blocks.values():
        if len(rid_list) > 1:
            # Group prefix matches by taluka
            taluka_groups = {}
            for rid in rid_list:
                t_norm = normalized_records[rid]['taluka_norm']
                taluka_groups.setdefault(t_norm, []).append(rid)
            
            for t_rids in taluka_groups.values():
                if len(t_rids) > 1:
                    for i in range(len(t_rids)):
                        for j in range(i + 1, len(t_rids)):
                            compare_pair(t_rids[i], t_rids[j])

    log_message(f"Found {len(matches)} match relationships.")

    # Disjoint Set Union (Grouping duplicates)
    parent = {rid: rid for rid in normalized_records.keys()}

    def find(i):
        path = []
        while parent[i] != i:
            path.append(i)
            i = parent[i]
        for node in path:
            parent[node] = i
        return i

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j

    # Link matched records
    log_message("Building groups of matching records...")
    for m in matches:
        union(m['id1'], m['id2'])

    # Group records by root
    groups = {}
    for rid in normalized_records.keys():
        root = find(rid)
        groups.setdefault(root, []).append(rid)

    # Pre-index match relationships for O(N) lookup
    log_message("Indexing match scores and fields for groups...")
    root_max_scores = {}
    root_matched_fields = {}

    for m in matches:
        root = find(m['id1'])
        score = m['score']
        fields = m['matched_fields']
        
        # Track max score for this root/group
        if root not in root_max_scores or score > root_max_scores[root]:
            root_max_scores[root] = score
            
        # Accumulate matched fields
        if root not in root_matched_fields:
            root_matched_fields[root] = set()
        root_matched_fields[root].update(fields)

    # Compile Duplicate People Report
    log_message("Compiling report datasets...")
    duplicate_people = []
    statistics_village = {}
    statistics_district = {}

    for root, rids in groups.items():
        if len(rids) > 1:
            recs = [normalized_records[rid]['record'] for rid in rids]
            rep_rec = recs[0]
            
            # Lookup pre-indexed match attributes
            max_score = root_max_scores.get(root, 100.0)
            fields = list(root_matched_fields.get(root, ['beneficiary_name']))

            duplicate_group = {
                "beneficiary_name": rep_rec['beneficiary_name'],
                "aadhaar": rep_rec['aadhaar'],
                "mobile": rep_rec['mobile'],
                "village": rep_rec['village'],
                "district": rep_rec['district'],
                "duplicate_count": len(rids),
                "matching_score": max_score,
                "matched_fields": fields,
                "records": [
                    {
                        "id": r['id'],
                        "scheme_name": r['scheme_name'],
                        "village": r['village'],
                        "taluka": r['taluka'],
                        "district": r['district'],
                        "original_json": r['original_json']
                    } for r in recs
                ]
            }
            duplicate_people.append(duplicate_group)

            # Record duplicate statistics
            v_name = rep_rec['village'] or 'Unknown'
            statistics_village.setdefault(v_name, {'total': 0, 'duplicates': 0, 'eligible_for_ladki_bahin': 0})
            statistics_village[v_name]['duplicates'] += len(rids) - 1

            d_name = rep_rec['district'] or 'Unknown'
            statistics_district.setdefault(d_name, {'total': 0, 'duplicates': 0})
            statistics_district[d_name]['duplicates'] += len(rids) - 1

    # Compile Matched People Report (Unique individuals and matching schemes)
    matched_people = []
    gender_distribution = {'Male': 0, 'Female': 0, 'Other': 0}

    for root, rids in groups.items():
        rep_id = rids[0]
        rep_norm = normalized_records[rep_id]
        rep_rec = rep_norm['record']

        matched_schemes = check_scheme_eligibility(rep_rec)
        
        # Gender statistics
        gender_val = rep_rec['gender']
        is_female = False
        if gender_val:
            g_lower = str(gender_val).lower().strip()
            if g_lower in ['f', 'female', 'महिला', 'म']:
                gender_distribution['Female'] += 1
                is_female = True
            elif g_lower in ['m', 'male', 'पुरुष', 'पु']:
                gender_distribution['Male'] += 1
            else:
                gender_distribution['Other'] += 1
        else:
            gender_distribution['Other'] += 1

        registered_schemes = list(set(normalized_records[rid]['record']['scheme_name'] for rid in rids if normalized_records[rid]['record']['scheme_name']))

        matched_person = {
            "beneficiary_name": rep_rec['beneficiary_name'],
            "aadhaar": rep_rec['aadhaar'],
            "mobile": rep_rec['mobile'],
            "gender": rep_rec['gender'],
            "village": rep_rec['village'],
            "district": rep_rec['district'],
            "matched_schemes": matched_schemes,
            "registered_schemes": registered_schemes,
            "matching_score": 100.0,
            "matched_fields": ["gender", "land_ownership"]
        }
        matched_people.append(matched_person)

        # Aggregate totals
        v_name = rep_rec['village'] or 'Unknown'
        statistics_village.setdefault(v_name, {'total': 0, 'duplicates': 0, 'eligible_for_ladki_bahin': 0})
        statistics_village[v_name]['total'] += len(rids)
        if is_female:
            statistics_village[v_name]['eligible_for_ladki_bahin'] += 1

        d_name = rep_rec['district'] or 'Unknown'
        statistics_district.setdefault(d_name, {'total': 0, 'duplicates': 0})
        statistics_district[d_name]['total'] += len(rids)

    log_message("Writing report files...")

    # Save matched_people.json
    matched_file_path = os.path.join(REPORTS_DIR, 'matched_people.json')
    with open(matched_file_path, 'w', encoding='utf-8') as f:
        json.dump(matched_people, f, ensure_ascii=False, indent=4)
    log_message(f"Saved report: {matched_file_path}")

    # Save duplicate_people.json
    duplicate_file_path = os.path.join(REPORTS_DIR, 'duplicate_people.json')
    with open(duplicate_file_path, 'w', encoding='utf-8') as f:
        json.dump(duplicate_people, f, ensure_ascii=False, indent=4)
    log_message(f"Saved report: {duplicate_file_path}")

    # Save statistics.json
    stats = {
        "total_beneficiaries": len(records),
        "total_unique_people": len(groups),
        "gender_distribution": gender_distribution,
        "village_statistics": statistics_village,
        "district_statistics": statistics_district
    }
    stats_file_path = os.path.join(REPORTS_DIR, 'statistics.json')
    with open(stats_file_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=4)
    log_message(f"Saved report: {stats_file_path}")

    # Save comparison_report.json
    scheme_counts = {}
    for person in matched_people:
        for scheme in person['matched_schemes']:
            scheme_counts[scheme] = scheme_counts.get(scheme, 0) + 1

    comparison_report = {
        "timestamp": datetime.now().isoformat(),
        "total_records_analyzed": len(records),
        "total_unique_people": len(groups),
        "total_duplicates_found": sum(len(rids) - 1 for rids in groups.values() if len(rids) > 1),
        "details": [
            {
                "scheme_name": scheme,
                "total_eligible_beneficiaries": count
            } for scheme, count in scheme_counts.items()
        ]
    }
    report_file_path = os.path.join(REPORTS_DIR, 'comparison_report.json')
    with open(report_file_path, 'w', encoding='utf-8') as f:
        json.dump(comparison_report, f, ensure_ascii=False, indent=4)
    log_message(f"Saved report: {report_file_path}")

    cur.close()
    conn.close()

    log_message("\n=== COMPARISON RUN COMPLETE ===")
    log_message(f"Analyzed: {len(records)} records")
    log_message(f"Duplicates: {comparison_report['total_duplicates_found']} records")
    log_message(f"Unique individuals: {len(groups)}")
    log_message("================================")

if __name__ == "__main__":
    run_comparison()
