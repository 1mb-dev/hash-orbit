/**
 * hash-orbit: Consistent hashing ring for distributed systems
 * @module hash-orbit
 */

import { hash32 } from 'murmur-hash';

// Re-export hash32 for potential external use
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
   * Adds a node to the consistent hash ring
   * Creates virtual nodes (replicas) for better key distribution
   * @param node - The node identifier to add
   */
  add(node: string): void {
    for (let i = 0; i < this.replicas; i++) {
      const key = `${node}:${i}`;
      const position = hash32(key);
      this.ring.set(position, node);
    }
    this.sortedKeys = [...this.ring.keys()].sort((a, b) => a - b);
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
   * Returns a string representation of the ring for debugging
   * @returns Debug information about the ring
   */
  toString(): string {
    return `HashOrbit(nodes=${this.size}, positions=${this.sortedKeys.length}, replicas=${this.replicas})`;
  }
}
