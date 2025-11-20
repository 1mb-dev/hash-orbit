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

    // sortedKeys will be populated by add() method
    // replicas will be used by add() to create virtual nodes
    void this.replicas;
    void this.sortedKeys;
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
}
