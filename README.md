# hash-orbit

[![CI](https://github.com/vnykmshr/hash-orbit/actions/workflows/ci.yml/badge.svg)](https://github.com/vnykmshr/hash-orbit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/hash-orbit.svg)](https://www.npmjs.com/package/hash-orbit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Consistent hashing implementation for distributed systems. Routes keys to nodes with minimal redistribution when the cluster changes.

## Why

Traditional modulo hashing (`hash(key) % N`) reassigns most keys when nodes are added or removed. Consistent hashing with virtual nodes minimizes this to ~1/N keys, making it ideal for:

- Cache sharding (Redis, Memcached)
- Database partitioning
- Load balancing with sticky sessions
- Distributed storage replication

Pure algorithm implementation with no opinions about your infrastructure. Compose it with whatever caching, database, or networking library you use.

## Installation

```bash
npm install hash-orbit
```

## Quick Start

```typescript
import { HashOrbit } from 'hash-orbit';

const ring = new HashOrbit({ replicas: 150 });

// Add nodes
ring.add('cache-1');
ring.add('cache-2');
ring.add('cache-3');

// Route a key to a node (deterministic)
const node = ring.get('user:123'); // => 'cache-2'

// Get multiple nodes for replication
const nodes = ring.getN('user:123', 2); // => ['cache-2', 'cache-1']

// Remove a node (only ~1/3 of keys will move)
ring.remove('cache-2');
ring.get('user:123'); // => 'cache-1' (new assignment)
```

## API

### Constructor

```typescript
new HashOrbit(options?: { replicas?: number })
```

Creates a hash ring. `replicas` controls the number of virtual nodes per physical node (default: 150). Higher values improve distribution but use more memory.

### Methods

**`add(node: string): void`**
Add a node to the ring.

**`remove(node: string): void`**
Remove a node from the ring.

**`get(key: string): string | undefined`**
Get the node responsible for a key. Returns `undefined` if ring is empty.

**`getN(key: string, count: number): string[]`**
Get N unique nodes for a key (useful for replication).

**`toJSON(): { nodes: string[], replicas: number }`**
Serialize ring state for persistence or transfer between processes.

**`static fromJSON(json): HashOrbit`**
Restore a ring from serialized state.

### Properties

**`size: number`** - Number of nodes in the ring
**`nodes: string[]`** - List of all nodes

## Usage Examples

### Cache Sharding

```typescript
const ring = new HashOrbit();
ring.add('redis-1:6379');
ring.add('redis-2:6379');
ring.add('redis-3:6379');

async function get(key: string) {
  const server = ring.get(key);
  return redisClients[server].get(key);
}

async function set(key: string, value: string) {
  const server = ring.get(key);
  return redisClients[server].set(key, value);
}
```

### Data Replication

```typescript
const ring = new HashOrbit({ replicas: 200 });
ring.add('storage-1');
ring.add('storage-2');
ring.add('storage-3');

async function writeWithReplication(key: string, data: Buffer) {
  const targets = ring.getN(key, 2); // Write to 2 nodes
  await Promise.all(targets.map((node) => storage[node].write(key, data)));
}
```

### State Persistence

```typescript
// Save ring state
const state = ring.toJSON();
await fs.writeFile('ring.json', JSON.stringify(state));

// Restore later
const restored = HashOrbit.fromJSON(JSON.parse(await fs.readFile('ring.json')));
restored.get('user:123'); // Routes to same node as original
```

## How It Works

**Virtual Nodes**: Each physical node gets `replicas` positions on the ring (default 150). This ensures even distribution and minimal disruption when nodes change.

**Binary Search**: Keys are hashed to a position, then binary search finds the next node clockwise on the ring in O(log n) time.

**Minimal Redistribution**: When adding/removing nodes, only ~1/N keys need to move (where N is the number of nodes).

## Performance

| Operation  | Complexity      | Example (3 nodes, 150 replicas) |
| ---------- | --------------- | ------------------------------- |
| add/remove | O(r × log(r×n)) | ~450 positions, ~9ms            |
| get        | O(log(r×n))     | ~9 comparisons, <1μs            |
| getN       | O(r×n) worst    | Usually much faster             |

Memory: ~64 bytes per virtual node position (30KB for 450 positions).

## TypeScript

Fully typed with strict mode. Ships with `.d.ts` files.

```typescript
import { HashOrbit, hash32 } from 'hash-orbit';

const ring: HashOrbit = new HashOrbit({ replicas: 100 });
const node: string | undefined = ring.get('key');
const nodes: string[] = ring.getN('key', 3);
```

## Development

```bash
npm install      # Install dependencies
npm test         # Run tests (fast: ~300ms)
npm run coverage # Generate coverage report
npm run build    # Build for production
```

100% test coverage. All tests run in <500ms.

## Examples

See [`examples/`](./examples) for complete working examples:

- Cache replication with failover
- Database sharding
- Session-based load balancing

## License

MIT © [vnykmshr](https://github.com/vnykmshr)

## References

- [Consistent Hashing and Random Trees (Karger et al.)](https://www.akamai.com/us/en/multimedia/documents/technical-publication/consistent-hashing-and-random-trees-distributed-caching-protocols-for-relieving-hot-spots-on-the-world-wide-web-technical-publication.pdf)
- [Amazon Dynamo Paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
