/**
 * hash-orbit: Consistent hashing ring for distributed systems
 * @module hash-orbit
 */

/**
 * HashOrbit - A consistent hashing implementation using virtual nodes
 * @class
 */
export class HashOrbit {
  private readonly virtualNodes: number;

  /**
   * Creates a new HashOrbit instance
   * @param virtualNodes - Number of virtual nodes per physical node (default: 150)
   */
  constructor(virtualNodes: number = 150) {
    this.virtualNodes = virtualNodes;
  }

  /**
   * Gets the number of virtual nodes per physical node
   * @returns The number of virtual nodes
   */
  getVirtualNodes(): number {
    return this.virtualNodes;
  }
}
