#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'ebook-reader.db');

console.log('Database cleanup script');
console.log('Target database:', dbPath);

// Check if database exists
if (!fs.existsSync(dbPath)) {
    console.log('Database file does not exist:', dbPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Function to get all table names
function getAllTables() {
    return new Promise((resolve, reject) => {
        const query = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows.map(row => row.name));
            }
        });
    });
}

// Function to delete all records from a table
function clearTable(tableName) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM ${tableName}`;
        db.run(query, [], function(err) {
            if (err) {
                reject(err);
            } else {
                console.log(`✓ Cleared table '${tableName}' (${this.changes} rows deleted)`);
                resolve(this.changes);
            }
        });
    });
}

// Function to reset auto-increment sequences
function resetAutoIncrement(tableName) {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM sqlite_sequence WHERE name='${tableName}'`;
        db.run(query, [], function(err) {
            if (err) {
                // Table might not have auto-increment, that's okay
                resolve();
            } else {
                if (this.changes > 0) {
                    console.log(`✓ Reset auto-increment for '${tableName}'`);
                }
                resolve();
            }
        });
    });
}

// Function to vacuum database
function vacuumDatabase() {
    return new Promise((resolve, reject) => {
        db.run('VACUUM', [], function(err) {
            if (err) {
                reject(err);
            } else {
                console.log('✓ Database vacuumed');
                resolve();
            }
        });
    });
}

// Main cleanup function
async function cleanup() {
    try {
        console.log('\n--- Starting database cleanup ---');
        
        // Get all tables
        const tables = await getAllTables();
        console.log(`Found ${tables.length} tables:`, tables.join(', '));
        
        if (tables.length === 0) {
            console.log('No tables found to clean');
            return;
        }
        
        console.log('\n--- Clearing tables ---');
        
        // Clear all tables
        for (const table of tables) {
            try {
                await clearTable(table);
                await resetAutoIncrement(table);
            } catch (err) {
                console.error(`Error clearing table '${table}':`, err.message);
            }
        }
        
        console.log('\n--- Optimizing database ---');
        await vacuumDatabase();
        
        console.log('\n✅ Database cleanup completed successfully!');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node cleanup-database.js [options]

Options:
  --help, -h     Show this help message
  --force, -f    Skip confirmation prompt

This script will:
1. Delete all records from all tables in the database
2. Reset auto-increment sequences
3. Vacuum the database to reclaim space

Database location: ${dbPath}
    `);
    process.exit(0);
}

// Confirmation prompt (unless --force is used)
if (!args.includes('--force') && !args.includes('-f')) {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('⚠️  This will DELETE ALL DATA from the database. Continue? (y/N): ', (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            cleanup();
        } else {
            console.log('Cleanup cancelled');
            process.exit(0);
        }
    });
} else {
    cleanup();
}