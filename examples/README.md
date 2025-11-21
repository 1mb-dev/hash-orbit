# hash-orbit Examples

This directory contains practical examples demonstrating real-world use cases of hash-orbit.

## Running Examples

All examples are standalone TypeScript files that can be run with:

```bash
# Using tsx (recommended)
npx tsx examples/redis-cache-sharding.ts

# Or compile and run
npx tsc examples/redis-cache-sharding.ts --target ES2022 --module NodeNext
node examples/redis-cache-sharding.js
```

## Examples

### 1. Redis Cache Sharding (`redis-cache-sharding.ts`)

Demonstrates how to distribute cache keys across multiple Redis instances using consistent hashing.

**Use case:** Horizontal scaling of Redis cache by sharding data across multiple servers.

**Key features:**

- Add/remove Redis nodes dynamically
- Minimal key redistribution on topology changes
- Deterministic key routing

### 2. Database Partitioning (`database-partitioning.ts`)

Shows how to route database queries to the correct shard based on user ID or other partition keys.

**Use case:** Sharding a large database across multiple servers for improved performance and scalability.

**Key features:**

- Route queries to correct database shard
- Support for database failover
- Multi-tenant data isolation

### 3. Load Balancing with Sticky Sessions (`sticky-load-balancing.ts`)

Implements sticky session routing where user sessions consistently route to the same application server.

**Use case:** Load balancing with session affinity for stateful applications.

**Key features:**

- Session-based routing
- Server health monitoring
- Graceful server removal

### 4. Distributed Cache Replication (`cache-replication.ts`)

Demonstrates using `getN()` for multi-node data replication across cache servers.

**Use case:** High availability cache with redundant data copies.

**Key features:**

- Write to multiple replicas
- Read from primary replica
- Fallback to secondary replicas

## Common Patterns

### Pattern 1: Adding Nodes Dynamically

```typescript
import { HashOrbit } from 'hash-orbit';

const ring = new HashOrbit({ replicas: 150 });

// Add initial nodes
ring.add('server-1');
ring.add('server-2');

// Later, add more capacity
ring.add('server-3'); // Only ~33% of keys redistribute
```

### Pattern 2: Removing Failed Nodes

```typescript
// Detect node failure
if (await isNodeDown('server-2')) {
  ring.remove('server-2');
  // Keys from server-2 automatically redistribute
}
```

### Pattern 3: Multi-Region Setup

```typescript
const ring = new HashOrbit({ replicas: 200 });

// Add nodes from multiple regions
ring.add('us-east-1:server-1');
ring.add('us-west-2:server-1');
ring.add('eu-west-1:server-1');

// Route to nearest region based on key
const node = ring.get(`user:${userId}`);
```

## Dependencies

These examples use mock implementations to avoid external dependencies. In production, you would:

- Replace mock Redis clients with real `redis` or `ioredis`
- Replace mock database clients with actual database drivers
- Add proper error handling and retry logic
- Implement health checks and monitoring

## Learn More

- [Consistent Hashing Explained](https://en.wikipedia.org/wiki/Consistent_hashing)
- [Redis Cluster Specification](https://redis.io/docs/reference/cluster-spec/)
- [Database Sharding Strategies](https://www.mongodb.com/features/database-sharding-explained)
