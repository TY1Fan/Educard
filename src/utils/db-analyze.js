/**
 * Database Performance Analysis Utility
 * Use this script to check index usage and query performance
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

/**
 * Check if table exists
 */
async function tableExists(tableName) {
  const [results] = await sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '${tableName}'
    );
  `);
  return results[0].exists;
}

/**
 * List all indexes for a table
 */
async function getTableIndexes(tableName) {
  if (!await tableExists(tableName)) {
    return [];
  }

  const [indexes] = await sequelize.query(`
    SELECT
      i.relname as index_name,
      a.attname as column_name,
      am.amname as index_type,
      idx.indisunique as is_unique,
      idx.indisprimary as is_primary
    FROM
      pg_class t,
      pg_class i,
      pg_index idx,
      pg_attribute a,
      pg_am am
    WHERE
      t.oid = idx.indrelid
      AND i.oid = idx.indexrelid
      AND a.attrelid = t.oid
      AND a.attnum = ANY(idx.indkey)
      AND t.relname = '${tableName}'
      AND am.oid = i.relam
    ORDER BY
      i.relname,
      array_position(idx.indkey, a.attnum);
  `);

  return indexes;
}

/**
 * Get table statistics
 */
async function getTableStats(tableName) {
  if (!await tableExists(tableName)) {
    return null;
  }

  const [stats] = await sequelize.query(`
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      n_tup_ins AS inserts,
      n_tup_upd AS updates,
      n_tup_del AS deletes,
      n_live_tup AS live_rows,
      n_dead_tup AS dead_rows,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE tablename = '${tableName}';
  `);

  return stats[0] || null;
}

/**
 * Check for missing indexes on foreign keys
 */
async function checkMissingForeignKeyIndexes() {
  const [results] = await sequelize.query(`
    SELECT
      c.conrelid::regclass AS table_name,
      a.attname AS column_name,
      c.confrelid::regclass AS referenced_table
    FROM
      pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      LEFT JOIN pg_index i ON i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
    WHERE
      c.contype = 'f' -- Foreign key constraints only
      AND i.indexrelid IS NULL; -- No index exists
  `);

  return results;
}

/**
 * Analyze a specific query with EXPLAIN
 */
async function explainQuery(query) {
  const [results] = await sequelize.query(`EXPLAIN ANALYZE ${query}`);
  return results;
}

/**
 * Get slow queries (requires pg_stat_statements extension)
 */
async function getSlowQueries() {
  try {
    const [results] = await sequelize.query(`
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        max_time,
        stddev_time
      FROM pg_stat_statements
      WHERE mean_time > 100 -- Queries taking more than 100ms on average
      ORDER BY mean_time DESC
      LIMIT 10;
    `);
    return results;
  } catch (error) {
    console.log('⚠️  pg_stat_statements extension not available');
    return [];
  }
}

/**
 * Main analysis function
 */
async function analyzeDatabase() {
  console.log('\n=== Database Performance Analysis ===\n');

  try {
    const tables = ['categories', 'threads', 'posts', 'users', 'notifications', 'post_reactions', 'reports'];

    for (const table of tables) {
      console.log(`\n📊 Table: ${table}`);
      console.log('─'.repeat(60));

      // Get table statistics
      const stats = await getTableStats(table);
      if (stats) {
        console.log(`Size: ${stats.size}`);
        console.log(`Live Rows: ${stats.live_rows}`);
        console.log(`Dead Rows: ${stats.dead_rows}`);
        console.log(`Inserts: ${stats.inserts}, Updates: ${stats.updates}, Deletes: ${stats.deletes}`);
      }

      // Get indexes
      const indexes = await getTableIndexes(table);
      if (indexes.length > 0) {
        console.log('\nIndexes:');
        const groupedIndexes = {};
        indexes.forEach(idx => {
          if (!groupedIndexes[idx.index_name]) {
            groupedIndexes[idx.index_name] = {
              columns: [],
              type: idx.index_type,
              unique: idx.is_unique,
              primary: idx.is_primary
            };
          }
          groupedIndexes[idx.index_name].columns.push(idx.column_name);
        });

        Object.entries(groupedIndexes).forEach(([name, info]) => {
          const flags = [];
          if (info.primary) flags.push('PRIMARY');
          if (info.unique) flags.push('UNIQUE');
          const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
          console.log(`  ✓ ${name}: ${info.columns.join(', ')}${flagStr}`);
        });
      } else {
        console.log('No indexes found');
      }
    }

    // Check for missing foreign key indexes
    console.log('\n\n🔍 Checking for Missing Foreign Key Indexes');
    console.log('─'.repeat(60));
    const missingIndexes = await checkMissingForeignKeyIndexes();
    if (missingIndexes.length > 0) {
      console.log('⚠️  Warning: Foreign keys without indexes found:');
      missingIndexes.forEach(fk => {
        console.log(`  • ${fk.table_name}.${fk.column_name} -> ${fk.referenced_table}`);
      });
    } else {
      console.log('✅ All foreign keys have indexes');
    }

    // Get slow queries
    console.log('\n\n🐌 Slow Queries (mean time > 100ms)');
    console.log('─'.repeat(60));
    const slowQueries = await getSlowQueries();
    if (slowQueries.length > 0) {
      slowQueries.forEach((q, i) => {
        console.log(`\n${i + 1}. Mean Time: ${Math.round(q.mean_time)}ms | Calls: ${q.calls}`);
        console.log(`   ${q.query.substring(0, 100)}...`);
      });
    } else {
      console.log('✅ No slow queries detected (or pg_stat_statements not enabled)');
    }

    console.log('\n\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error analyzing database:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run analysis
if (require.main === module) {
  analyzeDatabase();
}

module.exports = {
  getTableIndexes,
  getTableStats,
  checkMissingForeignKeyIndexes,
  explainQuery,
  getSlowQueries,
  analyzeDatabase
};
