# hash-orbit

[![CI](https://github.com/vnykmshr/hash-orbit/actions/workflows/ci.yml/badge.svg)](https://github.com/vnykmshr/hash-orbit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/vnykmshr/hash-orbit/branch/main/graph/badge.svg)](https://codecov.io/gh/vnykmshr/hash-orbit)
[![npm version](https://badge.fury.io/js/hash-orbit.svg)](https://www.npmjs.com/package/hash-orbit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Consistent hashing ring for distributed systems with virtual nodes support.

## Features

- 🎯 **Consistent Hashing** - Minimal key redistribution (~1/n) when nodes change
- 🔄 **Virtual Nodes** - Configurable replicas for better key distribution
- ⚡ **O(log n) Lookup** - Binary search for fast key-to-node mapping
- 🔁 **Replication Support** - Get N nodes for data replication
- 📦 **Zero Dependencies** - Only requires murmur-hash for hashing
- 🎨 **TypeScript** - Full type safety with strict mode
- ✅ **100% Test Coverage** - Comprehensive test suite
- 🚀 **Lightweight** - Minimal memory footprint

## Installation

```bash
npm install hash-orbit
```

## Usage

### Basic Example

```typescript
import { HashOrbit } from 'hash-orbit';

// Create a consistent hash ring with 150 virtual nodes per physical node
const ring = new HashOrbit({ replicas: 150 });

// Add nodes
ring.add('server-1');
ring.add('server-2');
ring.add('server-3');

// Get the node responsible for a key
const node = ring.get('user:123'); // Returns: 'server-2' (deterministic)

// Get multiple nodes for replication
const nodes = ring.getN('user:123', 2); // Returns: ['server-2', 'server-3']

// Remove a node (minimal redistribution)
ring.remove('server-2');

// Keys previously on server-2 now route to other servers
ring.get('user:123'); // Returns: 'server-1' or 'server-3'

// Introspection
console.log(ring.size); // 2
console.log(ring.nodes); // ['server-1', 'server-3']
```

### Advanced Configuration

```typescript
// Fewer replicas = faster add/remove but less even distribution
const fastRing = new HashOrbit({ replicas: 50 });

// More replicas = better distribution but more memory
const balancedRing = new HashOrbit({ replicas: 500 });

// Default replicas (150) provides good balance
const ring = new HashOrbit();
```

## API

### Constructor

#### `new HashOrbit(options?)`

Creates a new consistent hash ring.

**Parameters:**

- `options.replicas` (number, optional): Number of virtual nodes per physical node. Default: `150`

### Methods

#### `add(node: string): void`

Adds a node to the ring. Creates virtual nodes for better key distribution.

**Parameters:**

- `node`: Unique identifier for the node

**Example:**

```typescript
ring.add('cache-server-1');
```

#### `remove(node: string): void`

Removes a node from the ring. All keys on this node will be redistributed to other nodes.

**Parameters:**

- `node`: Identifier of the node to remove

**Example:**

```typescript
ring.remove('cache-server-1');
```

#### `get(key: string): string | undefined`

Gets the node responsible for a given key using consistent hashing.

**Parameters:**

- `key`: The key to look up

**Returns:** Node identifier, or `undefined` if ring is empty

**Example:**

```typescript
const node = ring.get('session:abc123');
```

#### `getN(key: string, count: number): string[]`

Gets N unique nodes for a key, useful for data replication.

**Parameters:**

- `key`: The key to look up
- `count`: Number of nodes to return

**Returns:** Array of node identifiers (up to `count` unique nodes)

**Example:**

```typescript
const replicas = ring.getN('user:789', 3);
// Returns up to 3 unique nodes for replication
```

### Properties

#### `size: number`

Gets the number of physical nodes in the ring.

**Example:**

```typescript
console.log(ring.size); // 3
```

#### `nodes: string[]`

Gets all physical nodes in the ring.

**Example:**

```typescript
console.log(ring.nodes); // ['server-1', 'server-2', 'server-3']
```

### Debugging

#### `toString(): string`

Returns a string representation of the ring for debugging.

**Example:**

```typescript
console.log(ring.toString());
// Output: "HashOrbit(nodes=3, positions=450, replicas=150)"
```

## Use Cases

### 1. Cache Sharding

Distribute cache keys across multiple Redis/Memcached instances:

```typescript
const ring = new HashOrbit({ replicas: 150 });
ring.add('redis-1:6379');
ring.add('redis-2:6379');
ring.add('redis-3:6379');

const cacheKey = 'user:profile:123';
const server = ring.get(cacheKey);
// Connect to the appropriate Redis instance
```

### 2. Database Partitioning

Route queries to the correct database shard:

```typescript
const ring = new HashOrbit();
ring.add('db-shard-1');
ring.add('db-shard-2');
ring.add('db-shard-3');

const userId = 'user-456';
const shard = ring.get(userId);
// Query the appropriate database shard
```

### 3. Load Balancing with Sticky Sessions

Route user sessions to specific servers without central state:

```typescript
const ring = new HashOrbit();
ring.add('app-server-1');
ring.add('app-server-2');
ring.add('app-server-3');

const sessionId = 'session-abc';
const server = ring.get(sessionId);
// Always routes to the same server for the session
```

### 4. Data Replication

Identify multiple nodes for redundancy:

```typescript
const ring = new HashOrbit({ replicas: 200 });
ring.add('storage-1');
ring.add('storage-2');
ring.add('storage-3');

const fileId = 'document-789';
const replicas = ring.getN(fileId, 2);
// Store the file on 2 different nodes for redundancy
```

## How It Works

### Consistent Hashing

Traditional modulo hashing (`server_id = hash(key) % num_servers`) causes massive redistribution when servers change. Consistent hashing minimizes this to ~1/n keys.

### Virtual Nodes

Each physical node creates multiple virtual nodes (replicas) on the ring. This ensures:

- Better key distribution
- Reduced impact when nodes change
- More balanced load across servers

With 150 virtual nodes per physical node:

- Adding a node: ~1/n keys redistribute
- Removing a node: ~1/n keys redistribute
- Better distribution than a single position per node

### Binary Search

Keys are looked up in O(log n) time using binary search on sorted virtual node positions.

## Performance

- **Add/Remove**: O(replicas \* log(total_positions))
- **Get**: O(log(total_positions))
- **GetN**: O(total_positions) worst case, typically much faster

With 3 nodes and 150 replicas each:

- 450 positions total
- Lookup: ~9 comparisons (log₂ 450)
- Memory: ~30KB (450 positions × 64 bytes each)

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run coverage

# Run linter
npm run lint

# Format code
npm run format
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Clean build artifacts
npm run clean
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## License

MIT © [vnykmshr](https://github.com/vnykmshr)

## References

- [Consistent Hashing](https://en.wikipedia.org/wiki/Consistent_hashing)
- [Amazon Dynamo Paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
- [MurmurHash](https://github.com/perezd/node-murmurhash)
