/**
 * hash-orbit: Consistent hashing ring for distributed systems
 * @module hash-orbit
 */

import { hash32 } from 'murmur-hash';

// Export hash function for debugging and custom use cases
export { hash32 };

/**
 * Configuration options for HashOrbit
 */
export interface HashOrbitOptions {
  /**
   * Number of virtual nodes per physical node
   * More replicas = better distribution but more memory
   * @default 150
   */
  replicas?: number;
}

/**
 * HashOrbit - A consistent hashing implementation using virtual nodes
 * @class
 */
export class HashOrbit {
  private readonly ring: Map<number, string>;
  private sortedKeys: number[];
  private readonly replicas: number;

  /**
   * Creates a new HashOrbit instance
   * @param options - Configuration options for the hash ring
   */
  constructor(options: HashOrbitOptions = {}) {
    this.replicas = options.replicas ?? 150;
    this.ring = new Map();
    this.sortedKeys = [];
  }

  /**
   * Validates a string identifier (node or key)
   * @param value - The identifier to validate
   * @param name - The name of the parameter for error messages
   * @throws Error if the identifier is invalid
   * @private
   */
  private validateIdentifier(value: string, name: string): void {
    if (!value || value.length === 0) {
      throw new Error(`${name} cannot be empty`);
    }
    if (value.length > 1000) {
      throw new Error(`${name} exceeds maximum length of 1000 characters`);
    }
  }

  /**
   * Adds a node to the consistent hash ring
   * Creates virtual nodes (replicas) for better key distribution
   * @param node - The node identifier to add
   * @throws Error if the node identifier is invalid
   */
  add(node: string): void {
    this.validateIdentifier(node, 'Node identifier');
    for (let i = 0; i < this.replicas; i++) {
      const key = `${node}:${i}`;
      const position = hash32(key);
      this.ring.set(position, node);
    }
    this.sortedKeys = [...this.ring.keys()].sort((a, b) => a - b);
  }

  /**
   * Removes a node from the consistent hash ring
   * Cleans up all virtual nodes for the given physical node
   * @param node - The node identifier to remove
   * @throws Error if the node identifier is invalid
   */
  remove(node: string): void {
    this.validateIdentifier(node, 'Node identifier');
    for (let i = 0; i < this.replicas; i++) {
      const key = `${node}:${i}`;
      const position = hash32(key);
      this.ring.delete(position);
    }
    this.sortedKeys = [...this.ring.keys()].sort((a, b) => a - b);
  }

  /**
   * Binary search to find the first position >= target (lower bound)
   * @param target - The hash position to search for
   * @returns Index of the first element >= target, or sortedKeys.length if not found
   * @private
   */
  private binarySearch(target: number): number {
    let left = 0;
    let right = this.sortedKeys.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedKeys[mid]! < target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  /**
   * Gets the node responsible for a given key
   * @param key - The key to look up
   * @returns The node identifier, or undefined if the ring is empty
   * @throws Error if the key is invalid
   */
  get(key: string): string | undefined {
    this.validateIdentifier(key, 'Key');
    if (this.ring.size === 0) return undefined;

    const position = hash32(key);
    let idx = this.binarySearch(position);

    // Wrap around if necessary
    if (idx >= this.sortedKeys.length) idx = 0;

    return this.ring.get(this.sortedKeys[idx]!);
  }

  /**
   * Gets N unique nodes responsible for a given key (for replication)
   * @param key - The key to look up
   * @param count - Number of unique nodes to return
   * @returns Array of node identifiers (up to count unique nodes)
   * @throws Error if the key is invalid
   */
  getN(key: string, count: number): string[] {
    this.validateIdentifier(key, 'Key');
    if (this.ring.size === 0 || count <= 0) return [];

    const result: string[] = [];
    const seen = new Set<string>();
    const position = hash32(key);
    let idx = this.binarySearch(position);

    // Iterate through sortedKeys to find N unique nodes
    for (let i = 0; i < this.sortedKeys.length && result.length < count; i++) {
      if (idx >= this.sortedKeys.length) idx = 0;

      const node = this.ring.get(this.sortedKeys[idx]!);
      if (node && !seen.has(node)) {
        seen.add(node);
        result.push(node);
      }
      idx++;
    }

    return result;
  }

  /**
   * Gets the number of nodes in the ring
   * @returns The number of physical nodes
   */
  get size(): number {
    // Count unique nodes in the ring
    const uniqueNodes = new Set(this.ring.values());
    return uniqueNodes.size;
  }

  /**
   * Gets all nodes in the ring
   * @returns Array of node identifiers
   */
  get nodes(): string[] {
    // Return unique nodes from the ring
    const uniqueNodes = new Set(this.ring.values());
    return Array.from(uniqueNodes);
  }

  /**
   * Serializes the hash ring to a JSON-compatible object
   * @returns Object containing nodes and configuration
   */
  toJSON(): { nodes: string[]; replicas: number } {
    return {
      nodes: this.nodes,
      replicas: this.replicas,
    };
  }

  /**
   * Creates a HashOrbit instance from a serialized object
   * @param json - The serialized ring data
   * @returns A new HashOrbit instance with the same configuration and nodes
   */
  static fromJSON(json: { nodes: string[]; replicas: number }): HashOrbit {
    const ring = new HashOrbit({ replicas: json.replicas });
    for (const node of json.nodes) {
      ring.add(node);
    }
    return ring;
  }

  /**
   * Returns a string representation of the ring for debugging
   * @returns Debug information about the ring
   */
  toString(): string {
    return `HashOrbit(nodes=${this.size}, positions=${this.sortedKeys.length}, replicas=${this.replicas})`;
  }
}
