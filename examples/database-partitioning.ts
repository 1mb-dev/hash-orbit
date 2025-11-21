/**
 * Database Partitioning Example
 *
 * Demonstrates how to route database queries to the correct shard
 * based on user ID or partition key using consistent hashing.
 *
 * Run: npx tsx examples/database-partitioning.ts
 */

import { HashOrbit } from '../src/index.js';

// Mock database client for demonstration
// In production, use actual database drivers (pg, mysql2, mongodb, etc.)
interface DatabaseClient {
  shardId: string;
  query<T>(sql: string, params: unknown[]): Promise<T[]>;
  insert(table: string, data: Record<string, unknown>): Promise<number>;
}

class MockDatabaseClient implements DatabaseClient {
  private records = new Map<string, Map<number, Record<string, unknown>>>();

  constructor(public shardId: string) {}

  async query<T>(sql: string, _params: unknown[]): Promise<T[]> {
    // Simplified query implementation for demo
    const [, table] = sql.match(/FROM (\w+)/i) || [];
    if (!table) return [];

    const tableData = this.records.get(table);
    if (!tableData) return [];

    return Array.from(tableData.values()) as T[];
  }

  async insert(table: string, data: Record<string, unknown>): Promise<number> {
    if (!this.records.has(table)) {
      this.records.set(table, new Map());
    }

    const tableData = this.records.get(table)!;
    const id = tableData.size + 1;
    tableData.set(id, { ...data, id });

    return id;
  }

  getRecordCount(table: string): number {
    return this.records.get(table)?.size || 0;
  }
}

// Sharded database manager using consistent hashing
class ShardedDatabase {
  private ring: HashOrbit;
  private shards: Map<string, DatabaseClient>;

  constructor(replicas: number = 150) {
    this.ring = new HashOrbit({ replicas });
    this.shards = new Map();
  }

  /**
   * Add a database shard to the cluster
   */
  addShard(shardId: string): void {
    this.ring.add(shardId);
    this.shards.set(shardId, new MockDatabaseClient(shardId));
    console.log(`✅ Added database shard: ${shardId}`);
  }

  /**
   * Remove a database shard from the cluster
   */
  removeShard(shardId: string): void {
    this.ring.remove(shardId);
    this.shards.delete(shardId);
    console.log(`❌ Removed database shard: ${shardId}`);
  }

  /**
   * Get the database shard for a given partition key
   */
  private getShardForKey(partitionKey: string): DatabaseClient | undefined {
    const shardId = this.ring.get(partitionKey);
    if (!shardId) return undefined;
    return this.shards.get(shardId);
  }

  /**
   * Insert a record into the correct shard
   */
  async insert(
    table: string,
    data: Record<string, unknown>,
    partitionKey: string
  ): Promise<number> {
    const shard = this.getShardForKey(partitionKey);
    if (!shard) {
      throw new Error('No database shards available');
    }

    const shardId = this.ring.get(partitionKey);
    console.log(`  📝 INSERT into ${table} on shard ${shardId} (key: ${partitionKey})`);

    return shard.insert(table, data);
  }

  /**
   * Query records from the correct shard
   */
  async query<T>(sql: string, partitionKey: string): Promise<T[]> {
    const shard = this.getShardForKey(partitionKey);
    if (!shard) {
      throw new Error('No database shards available');
    }

    const shardId = this.ring.get(partitionKey);
    console.log(`  🔍 QUERY on shard ${shardId} (key: ${partitionKey})`);

    return shard.query<T>(sql, []);
  }

  /**
   * Query across all shards (scatter-gather)
   */
  async queryAll<T>(sql: string): Promise<T[]> {
    console.log(`  🌐 QUERY ALL shards (scatter-gather)`);

    const results = await Promise.all(
      Array.from(this.shards.values()).map((shard) => shard.query<T>(sql, []))
    );

    return results.flat();
  }

  /**
   * Get distribution statistics
   */
  getDistribution(table: string): Map<string, number> {
    const distribution = new Map<string, number>();

    for (const [shardId, shard] of this.shards.entries()) {
      if (shard instanceof MockDatabaseClient) {
        distribution.set(shardId, shard.getRecordCount(table));
      }
    }

    return distribution;
  }

  getStats(): { shards: number } {
    return { shards: this.ring.size };
  }
}

// ============================================================================
// Demo: Database Partitioning
// ============================================================================

interface User {
  id: number;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

async function demo() {
  console.log('🚀 Database Partitioning Demo\n');

  // Create sharded database
  const db = new ShardedDatabase();

  // Add database shards
  console.log('📦 Setting up database cluster...');
  db.addShard('db-shard-1');
  db.addShard('db-shard-2');
  db.addShard('db-shard-3');
  console.log();

  // Insert user records (partitioned by user ID)
  console.log('💾 Inserting user records...');
  const users = [
    { userId: 'user:1001', name: 'Alice Smith', email: 'alice@example.com' },
    { userId: 'user:1002', name: 'Bob Johnson', email: 'bob@example.com' },
    { userId: 'user:1003', name: 'Charlie Brown', email: 'charlie@example.com' },
    { userId: 'user:1004', name: 'Diana Prince', email: 'diana@example.com' },
    { userId: 'user:1005', name: 'Eve Davis', email: 'eve@example.com' },
    { userId: 'user:1006', name: 'Frank Miller', email: 'frank@example.com' },
  ];

  for (const user of users) {
    await db.insert('users', { ...user, createdAt: new Date().toISOString() }, user.userId);
  }
  console.log();

  // Show data distribution
  console.log('📊 Data distribution across shards:');
  const distribution = db.getDistribution('users');
  for (const [shardId, count] of distribution.entries()) {
    console.log(`  ${shardId}: ${count} records`);
  }
  console.log();

  // Query specific user (single shard)
  console.log('🔍 Querying specific user (single shard lookup)...');
  const userRecords = await db.query<User>('SELECT * FROM users', 'user:1002');
  console.log(`  Found ${userRecords.length} record(s) for user:1002`);
  console.log();

  // Query all users (scatter-gather across all shards)
  console.log('🌐 Querying all users (scatter-gather)...');
  const allUsers = await db.queryAll<User>('SELECT * FROM users');
  console.log(`  Found ${allUsers.length} total users across all shards`);
  console.log();

  // Add a new shard for horizontal scaling
  console.log('⚡ Adding new database shard for more capacity...');
  db.addShard('db-shard-4');
  console.log();

  // Insert more users (they'll be distributed including new shard)
  console.log('💾 Inserting more users...');
  const newUsers = [
    { userId: 'user:1007', name: 'Grace Hopper', email: 'grace@example.com' },
    { userId: 'user:1008', name: 'Henry Ford', email: 'henry@example.com' },
  ];

  for (const user of newUsers) {
    await db.insert('users', { ...user, createdAt: new Date().toISOString() }, user.userId);
  }
  console.log();

  // Show updated distribution
  console.log('📊 Updated data distribution:');
  const distribution2 = db.getDistribution('users');
  for (const [shardId, count] of distribution2.entries()) {
    console.log(`  ${shardId}: ${count} records`);
  }
  console.log();

  console.log('✅ Demo complete!');
  console.log();
  console.log('Key takeaways:');
  console.log('  • User data is automatically distributed across database shards');
  console.log('  • Same user always routes to same shard (consistent reads/writes)');
  console.log('  • Single-user queries hit only one shard (fast)');
  console.log('  • Cross-user queries use scatter-gather (slower but necessary)');
  console.log('  • Adding shards is seamless with minimal redistribution');
}

// Run the demo
demo().catch(console.error);
