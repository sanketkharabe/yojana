import os
import psycopg2
from dotenv import load_dotenv

def create_table():
    # Load .env
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path)

    db_host = os.getenv('DB_HOST', 'localhost')
    db_name = os.getenv('DB_NAME')
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    db_port = os.getenv('DB_PORT', '5432')

    print(f"Connecting to database '{db_name}' on '{db_host}' as '{db_user}'...")
    conn = psycopg2.connect(
        host=db_host,
        database=db_name,
        user=db_user,
        password=db_password,
        port=db_port
    )
    cur = conn.cursor()

    try:
        # Create beneficiaries table if not exists
        create_table_query = """
        CREATE TABLE IF NOT EXISTS beneficiaries (
            id SERIAL PRIMARY KEY,
            scheme_name VARCHAR(255),
            beneficiary_name VARCHAR(255),
            father_or_husband_name VARCHAR(255),
            aadhaar VARCHAR(50),
            mobile VARCHAR(50),
            gender VARCHAR(50),
            date_of_birth VARCHAR(50),
            age INTEGER,
            district VARCHAR(255),
            taluka VARCHAR(255),
            village VARCHAR(255),
            occupation VARCHAR(255),
            annual_income NUMERIC,
            bank_account VARCHAR(100),
            ifsc VARCHAR(50),
            extra_fields JSONB,
            original_json JSONB,
            import_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        cur.execute(create_table_query)
        print("Success: Table 'beneficiaries' created or already exists.")

        # Create unique index to handle duplicate prevention across fields, ignoring null differences
        create_index_query = """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_beneficiary ON beneficiaries (
            scheme_name,
            COALESCE(beneficiary_name, ''),
            COALESCE(father_or_husband_name, ''),
            COALESCE(village, ''),
            COALESCE(taluka, ''),
            COALESCE(district, ''),
            COALESCE(aadhaar, ''),
            COALESCE(mobile, ''),
            COALESCE(bank_account, '')
        );
        """
        cur.execute(create_index_query)
        print("Success: Unique index 'idx_unique_beneficiary' created or already exists.")

        conn.commit()
        print("Database initialization completed successfully.")
    except Exception as e:
        conn.rollback()
        print("Error initializing database:", str(e))
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    create_table()
