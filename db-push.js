import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the tables directly
async function createTables() {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create projects table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        custom_prompt TEXT,
        preferred_model TEXT,
        form_fields TEXT,
        example_image_path TEXT,
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create form_fields table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_fields (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        field_type TEXT NOT NULL,
        required BOOLEAN DEFAULT FALSE,
        options TEXT,
        default_value TEXT,
        placeholder TEXT,
        validation_rules TEXT,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create ocr_results table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ocr_results (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        file_name TEXT NOT NULL,
        file_size INTEGER,
        original_image_path TEXT,
        gemini_data TEXT,
        openai_data TEXT,
        gemini_result TEXT,
        openai_result TEXT,
        extracted_data TEXT,
        selected_result TEXT,
        status TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Database tables created/updated successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createTables().catch(console.error);