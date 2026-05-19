// ============================================================
// Database Connection (Supabase)
// ============================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase = null;
let isConnected = false;

/**
 * Initialize Supabase connection
 */
async function initDB() {
    if (supabase) return supabase;

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
        }

        supabase = createClient(supabaseUrl, supabaseKey);

        // Test connection by checking auth status
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            throw error;
        }

        // Validate required tables exist in the configured Supabase project
        const requiredTables = ['users', 'inventory'];
        for (const table of requiredTables) {
            const { error: tableError } = await supabase
                .from(table)
                .select('id')
                .limit(1);

            if (tableError) {
                throw new Error(
                    `Required table '${table}' is missing or inaccessible. ` +
                    `Run database/supabase_schema.sql in Supabase SQL Editor and check RLS policies.`
                );
            }
        }

        isConnected = true;
        console.log('✅ Supabase connected successfully');
        return supabase;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        isConnected = false;
        throw error;
    }
}

/**
 * Get the Supabase client
 */
function getClient() {
    if (!supabase) {
        throw new Error('Supabase not initialized. Call initDB() first.');
    }
    return supabase;
}

/**
 * Check if database is connected
 */
function isDBConnected() {
    return isConnected;
}

/**
 * Query helper for Supabase
 * @param {string} table - Table name
 * @param {object} options - Query options (select, filters, orderBy, limit)
 */
async function query(table, options = {}) {
    const db = getClient();
    try {
        let q = db.from(table).select(options.select || '*');

        // Apply filters
        if (options.filters) {
            for (const [key, value] of Object.entries(options.filters)) {
                q = q.eq(key, value);
            }
        }

        // Apply ordering
        if (options.orderBy) {
            q = q.order(options.orderBy.column, {
                ascending: options.orderBy.ascending !== false,
            });
        }

        // Apply limit
        if (options.limit) {
            q = q.limit(options.limit);
        }

        const { data, error } = await q;
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[DB Query Error]', error.message);
        throw error;
    }
}

/**
 * Insert a record
 */
async function insert(table, data) {
    const db = getClient();
    try {
        const { data: result, error } = await db
            .from(table)
            .insert([data])
            .select();

        if (error) {
            console.error(`[DB Insert Error - ${table}]`, {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            });
            throw error;
        }
        return result[0];
    } catch (error) {
        console.error(`[DB Insert Error - ${table}]`, error.message);
        throw error;
    }
}

/**
 * Update a record
 */
async function update(table, data, filters) {
    const db = getClient();
    try {
        let q = db.from(table).update(data);

        for (const [key, value] of Object.entries(filters)) {
            q = q.eq(key, value);
        }

        const { data: result, error } = await q.select();
        if (error) throw error;
        return result;
    } catch (error) {
        console.error('[DB Update Error]', error.message);
        throw error;
    }
}

/**
 * Delete a record
 */
async function deleteRecord(table, filters) {
    const db = getClient();
    try {
        let q = db.from(table);

        for (const [key, value] of Object.entries(filters)) {
            q = q.eq(key, value);
        }

        const { error } = await q.delete();
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('[DB Delete Error]', error.message);
        throw error;
    }
}

module.exports = {
    initDB,
    getClient,
    isDBConnected,
    query,
    insert,
    update,
    deleteRecord,
};
