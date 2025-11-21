/**
 * Redis Cache Sharding Example
 *
 * Demonstrates how to distribute cache keys across multiple Redis instances
 * using consistent hashing for horizontal scalability.
 *
 * Run: npx tsx examples/redis-cache-sharding.ts
 */

import { HashOrbit } from '../src/index.js';

// Mock Redis client for demonstration
// In production, use 'redis' or 'ioredis' package
interface RedisClient {
  host: string;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MockRedisClient implements RedisClient {
  private store = new Map<string, string>();

  constructor(public host: string) {}

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Distributed cache manager using consistent hashing
class DistributedCache {
  private ring: HashOrbit;
  private clients: Map<string, RedisClient>;

  constructor(replicas: number = 150) {
    this.ring = new HashOrbit({ replicas });
    this.clients = new Map();
  }

  /**
   * Add a Redis server to the cache cluster
   */
  addServer(host: string): void {
    this.ring.add(host);
    this.clients.set(host, new MockRedisClient(host));
    console.log(`✅ Added Redis server: ${host}`);
  }

  /**
   * Remove a Redis server from the cache cluster
   */
  removeServer(host: string): void {
    this.ring.remove(host);
    this.clients.delete(host);
    console.log(`❌ Removed Redis server: ${host}`);
  }

  /**
   * Get the Redis client for a given cache key
   */
  private getClientForKey(key: string): RedisClient | undefined {
    const serverHost = this.ring.get(key);
    if (!serverHost) return undefined;
    return this.clients.get(serverHost);
  }

  /**
   * Get a value from the distributed cache
   */
  async get(key: string): Promise<string | null> {
    const client = this.getClientForKey(key);
    if (!client) {
      throw new Error('No cache servers available');
    }

    const server = this.ring.get(key);
    console.log(`📖 Reading key "${key}" from ${server}`);

    return client.get(key);
  }

  /**
   * Set a value in the distributed cache
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = this.getClientForKey(key);
    if (!client) {
      throw new Error('No cache servers available');
    }

    const server = this.ring.get(key);
    console.log(`📝 Writing key "${key}" to ${server}`);

    return client.set(key, value, ttl);
  }

  /**
   * Delete a value from the distributed cache
   */
  async delete(key: string): Promise<void> {
    const client = this.getClientForKey(key);
    if (!client) {
      throw new Error('No cache servers available');
    }

    const server = this.ring.get(key);
    console.log(`🗑️  Deleting key "${key}" from ${server}`);

    return client.del(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): { servers: number; totalKeys: number } {
    let totalKeys = 0;
    for (const client of this.clients.values()) {
      if (client instanceof MockRedisClient) {
        totalKeys += client['store'].size;
      }
    }

    return {
      servers: this.ring.size,
      totalKeys,
    };
  }
}

// ============================================================================
// Demo: Redis Cache Sharding
// ============================================================================

async function demo() {
  console.log('🚀 Redis Cache Sharding Demo\n');

  // Create distributed cache
  const cache = new DistributedCache();

  // Add Redis servers
  console.log('📦 Setting up Redis cluster...');
  cache.addServer('redis-1.example.com:6379');
  cache.addServer('redis-2.example.com:6379');
  cache.addServer('redis-3.example.com:6379');
  console.log();

  // Write cache entries
  console.log('💾 Writing cache entries...');
  await cache.set('user:1001', JSON.stringify({ name: 'Alice', age: 30 }));
  await cache.set('user:1002', JSON.stringify({ name: 'Bob', age: 25 }));
  await cache.set('user:1003', JSON.stringify({ name: 'Charlie', age: 35 }));
  await cache.set('session:abc123', JSON.stringify({ userId: 1001, token: 'xyz' }));
  await cache.set('session:def456', JSON.stringify({ userId: 1002, token: 'uvw' }));
  console.log();

  // Read cache entries
  console.log('📚 Reading cache entries...');
  const user1 = await cache.get('user:1001');
  const user2 = await cache.get('user:1002');
  const session1 = await cache.get('session:abc123');
  console.log(`  user:1001 = ${user1}`);
  console.log(`  user:1002 = ${user2}`);
  console.log(`  session:abc123 = ${session1}`);
  console.log();

  // Show distribution
  const stats1 = cache.getStats();
  console.log(`📊 Cache stats: ${stats1.servers} servers, ${stats1.totalKeys} keys`);
  console.log();

  // Add another server (horizontal scaling)
  console.log('⚡ Adding new Redis server for more capacity...');
  cache.addServer('redis-4.example.com:6379');
  console.log();

  // Keys automatically redistribute (minimal impact)
  console.log('🔄 Keys automatically redistributed with minimal impact');
  const stats2 = cache.getStats();
  console.log(`📊 Cache stats: ${stats2.servers} servers, ${stats2.totalKeys} keys`);
  console.log();

  // Simulate server failure
  console.log('⚠️  Simulating redis-2 failure...');
  cache.removeServer('redis-2.example.com:6379');
  console.log();

  // Keys from failed server are now on other servers
  console.log('🔄 Accessing keys after server removal...');
  const user1After = await cache.get('user:1001');
  const user2After = await cache.get('user:1002');
  console.log(`  user:1001 still accessible: ${user1After !== null}`);
  console.log(`  user:1002 still accessible: ${user2After !== null}`);
  console.log();

  console.log('✅ Demo complete!');
  console.log();
  console.log('Key takeaways:');
  console.log('  • Keys are automatically distributed across Redis servers');
  console.log('  • Adding servers causes minimal key redistribution (~1/n)');
  console.log('  • Consistent hashing ensures deterministic routing');
  console.log('  • Same key always routes to same server (until topology changes)');
}

// Run the demo
demo().catch(console.error);
