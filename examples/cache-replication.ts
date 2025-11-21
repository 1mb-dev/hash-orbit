/**
 * Cache Replication Example
 *
 * Demonstrates using getN() for multi-node data replication across
 * cache servers for high availability.
 *
 * Run: npx tsx examples/cache-replication.ts
 */

import { HashOrbit } from '../src/index.js';

// Mock cache node for demonstration
interface CacheNode {
  id: string;
  available: boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

class MockCacheNode implements CacheNode {
  private store = new Map<string, string>();

  constructor(
    public id: string,
    public available: boolean = true
  ) {}

  async get(key: string): Promise<string | null> {
    if (!this.available) {
      throw new Error(`Cache node ${this.id} is unavailable`);
    }
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.available) {
      throw new Error(`Cache node ${this.id} is unavailable`);
    }
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    if (!this.available) {
      throw new Error(`Cache node ${this.id} is unavailable`);
    }
    this.store.delete(key);
  }

  getSize(): number {
    return this.store.size;
  }
}

// Replicated cache manager using consistent hashing
class ReplicatedCache {
  private ring: HashOrbit;
  private nodes: Map<string, CacheNode>;
  private replicationFactor: number;

  constructor(replicationFactor: number = 2, replicas: number = 150) {
    this.ring = new HashOrbit({ replicas });
    this.nodes = new Map();
    this.replicationFactor = replicationFactor;
  }

  /**
   * Add a cache node to the cluster
   */
  addNode(nodeId: string): void {
    this.ring.add(nodeId);
    this.nodes.set(nodeId, new MockCacheNode(nodeId));
    console.log(`✅ Added cache node: ${nodeId}`);
  }

  /**
   * Remove a cache node from the cluster
   */
  removeNode(nodeId: string): void {
    this.ring.remove(nodeId);
    this.nodes.delete(nodeId);
    console.log(`❌ Removed cache node: ${nodeId}`);
  }

  /**
   * Mark a node as unavailable (simulating failure)
   */
  markNodeUnavailable(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.available = false;
      console.log(`⚠️  Marked node as unavailable: ${nodeId}`);
    }
  }

  /**
   * Get replica nodes for a key
   */
  private getReplicaNodes(key: string): CacheNode[] {
    const nodeIds = this.ring.getN(key, this.replicationFactor);
    return nodeIds
      .map((id) => this.nodes.get(id))
      .filter((node): node is CacheNode => node !== undefined);
  }

  /**
   * Set a value with replication
   */
  async set(key: string, value: string): Promise<void> {
    const replicas = this.getReplicaNodes(key);
    if (replicas.length === 0) {
      throw new Error('No cache nodes available');
    }

    console.log(`  📝 Writing "${key}" to ${replicas.length} replicas`);

    // Write to all replicas in parallel
    const writes = replicas.map(async (node, index) => {
      try {
        await node.set(key, value);
        console.log(`    ✅ Replica ${index + 1}: ${node.id}`);
      } catch (_error) {
        console.log(`    ❌ Replica ${index + 1}: ${node.id} (failed)`);
      }
    });

    await Promise.allSettled(writes);
  }

  /**
   * Get a value with replica fallback
   */
  async get(key: string): Promise<string | null> {
    const replicas = this.getReplicaNodes(key);
    if (replicas.length === 0) {
      throw new Error('No cache nodes available');
    }

    console.log(`  🔍 Reading "${key}" (trying ${replicas.length} replicas)`);

    // Try each replica in order until one succeeds
    for (let i = 0; i < replicas.length; i++) {
      const node = replicas[i]!;
      try {
        const value = await node.get(key);
        const replicaLabel = i === 0 ? 'primary' : `backup ${i}`;
        console.log(`    ✅ Read from ${replicaLabel} replica: ${node.id}`);
        return value;
      } catch (_error) {
        console.log(`    ❌ Failed reading from replica ${i + 1}: ${node.id}`);
        // Continue to next replica
      }
    }

    throw new Error(`Failed to read "${key}" from any replica`);
  }

  /**
   * Delete a value from all replicas
   */
  async delete(key: string): Promise<void> {
    const replicas = this.getReplicaNodes(key);
    if (replicas.length === 0) {
      throw new Error('No cache nodes available');
    }

    console.log(`  🗑️  Deleting "${key}" from ${replicas.length} replicas`);

    const deletes = replicas.map(async (node) => {
      try {
        await node.del(key);
        console.log(`    ✅ Deleted from ${node.id}`);
      } catch (_error) {
        console.log(`    ❌ Failed to delete from ${node.id}`);
      }
    });

    await Promise.allSettled(deletes);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    nodes: number;
    availableNodes: number;
    replicationFactor: number;
    nodeStats: Map<string, { available: boolean; keys: number }>;
  } {
    const availableNodes = Array.from(this.nodes.values()).filter((n) => n.available).length;
    const nodeStats = new Map<string, { available: boolean; keys: number }>();

    for (const [nodeId, node] of this.nodes.entries()) {
      if (node instanceof MockCacheNode) {
        nodeStats.set(nodeId, {
          available: node.available,
          keys: node.getSize(),
        });
      }
    }

    return {
      nodes: this.ring.size,
      availableNodes,
      replicationFactor: this.replicationFactor,
      nodeStats,
    };
  }
}

// ============================================================================
// Demo: Cache Replication
// ============================================================================

async function demo() {
  console.log('🚀 Cache Replication Demo\n');

  // Create replicated cache with 2x replication
  const cache = new ReplicatedCache(2); // 2 replicas per key

  // Add cache nodes
  console.log('📦 Setting up cache cluster (2x replication)...');
  cache.addNode('cache-1');
  cache.addNode('cache-2');
  cache.addNode('cache-3');
  cache.addNode('cache-4');
  console.log();

  // Write replicated data
  console.log('💾 Writing data with replication...');
  await cache.set('config:feature-flags', JSON.stringify({ darkMode: true, beta: false }));
  console.log();
  await cache.set('config:rate-limits', JSON.stringify({ api: 1000, web: 100 }));
  console.log();

  // Read data (from primary replica)
  console.log('📚 Reading data (primary replica)...');
  const featureFlags = await cache.get('config:feature-flags');
  console.log(`  Value: ${featureFlags}`);
  console.log();

  // Simulate node failure
  console.log('⚠️  Simulating cache-1 failure...');
  cache.markNodeUnavailable('cache-1');
  console.log();

  // Read data (automatic failover to backup replica)
  console.log('📚 Reading data after node failure (automatic failover)...');
  const rateLimits = await cache.get('config:rate-limits');
  console.log(`  Value: ${rateLimits}`);
  console.log();

  // Write more data (replication continues with remaining nodes)
  console.log('💾 Writing new data after node failure...');
  await cache.set('config:timeout', JSON.stringify({ connect: 5000, read: 30000 }));
  console.log();

  // Show node statistics
  console.log('📊 Node statistics:');
  const stats1 = cache.getStats();
  console.log(
    `  Total nodes: ${stats1.nodes}, Available: ${stats1.availableNodes}, Replication: ${stats1.replicationFactor}x`
  );
  for (const [nodeId, stat] of stats1.nodeStats.entries()) {
    const status = stat.available ? '✅' : '❌';
    console.log(`  ${status} ${nodeId}: ${stat.keys} keys`);
  }
  console.log();

  // Add new node for scaling
  console.log('⚡ Adding new cache node...');
  cache.addNode('cache-5');
  console.log();

  // Write more data (will use new node as replica)
  console.log('💾 Writing data after adding node...');
  await cache.set('config:cache-ttl', JSON.stringify({ short: 300, long: 3600 }));
  console.log();

  // Delete replicated data
  console.log('🗑️  Deleting replicated data...');
  await cache.delete('config:feature-flags');
  console.log();

  // Final statistics
  console.log('📊 Final node statistics:');
  const stats2 = cache.getStats();
  for (const [nodeId, stat] of stats2.nodeStats.entries()) {
    const status = stat.available ? '✅' : '❌';
    console.log(`  ${status} ${nodeId}: ${stat.keys} keys`);
  }
  console.log();

  console.log('✅ Demo complete!');
  console.log();
  console.log('Key takeaways:');
  console.log('  • Each key is replicated to N nodes for high availability');
  console.log('  • Automatic failover to backup replicas when primary fails');
  console.log('  • Writes go to all replicas in parallel');
  console.log('  • Reads try replicas in order until one succeeds');
  console.log('  • Adding nodes increases total capacity and availability');
}

// Run the demo
demo().catch(console.error);
