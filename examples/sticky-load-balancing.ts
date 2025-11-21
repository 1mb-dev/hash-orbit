/**
 * Sticky Load Balancing Example
 *
 * Demonstrates load balancing with session affinity where user sessions
 * consistently route to the same application server.
 *
 * Run: npx tsx examples/sticky-load-balancing.ts
 */

import { HashOrbit } from '../src/index.js';

// Mock application server for demonstration
interface AppServer {
  id: string;
  healthy: boolean;
  activeConnections: number;
  handleRequest(sessionId: string): Promise<string>;
}

class MockAppServer implements AppServer {
  public activeConnections = 0;
  private sessions = new Map<string, { data: Record<string, unknown>; lastAccess: Date }>();

  constructor(
    public id: string,
    public healthy: boolean = true
  ) {}

  async handleRequest(sessionId: string): Promise<string> {
    this.activeConnections++;

    // Simulate session storage
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        data: { visits: 1, createdAt: new Date() },
        lastAccess: new Date(),
      });
    } else {
      const session = this.sessions.get(sessionId)!;
      const visits = (session.data.visits as number) + 1;
      session.data.visits = visits;
      session.lastAccess = new Date();
    }

    const session = this.sessions.get(sessionId)!;
    const response = `Handled by ${this.id} (visit #${session.data.visits})`;

    // Simulate request processing
    await new Promise((resolve) => setTimeout(resolve, 10));

    this.activeConnections--;
    return response;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}

// Sticky load balancer using consistent hashing
class StickyLoadBalancer {
  private ring: HashOrbit;
  private servers: Map<string, AppServer>;

  constructor(replicas: number = 150) {
    this.ring = new HashOrbit({ replicas });
    this.servers = new Map();
  }

  /**
   * Add an application server to the load balancer
   */
  addServer(serverId: string): void {
    this.ring.add(serverId);
    this.servers.set(serverId, new MockAppServer(serverId));
    console.log(`✅ Added server: ${serverId}`);
  }

  /**
   * Remove an application server from the load balancer
   */
  removeServer(serverId: string): void {
    this.ring.remove(serverId);
    this.servers.delete(serverId);
    console.log(`❌ Removed server: ${serverId}`);
  }

  /**
   * Mark a server as unhealthy (without removing it)
   */
  markServerUnhealthy(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.healthy = false;
      console.log(`⚠️  Marked server as unhealthy: ${serverId}`);
    }
  }

  /**
   * Get the server for a session, with fallback to healthy servers
   */
  private getServerForSession(sessionId: string): AppServer | undefined {
    // Try primary server
    const primaryServerId = this.ring.get(sessionId);
    if (primaryServerId) {
      const server = this.servers.get(primaryServerId);
      if (server?.healthy) {
        return server;
      }
    }

    // Fallback: find any healthy server
    for (const server of this.servers.values()) {
      if (server.healthy) {
        return server;
      }
    }

    return undefined;
  }

  /**
   * Route a request to the appropriate server based on session ID
   */
  async routeRequest(sessionId: string): Promise<string> {
    const server = this.getServerForSession(sessionId);
    if (!server) {
      throw new Error('No healthy servers available');
    }

    const serverId = this.ring.get(sessionId);
    const isPrimary = server.id === serverId;
    const marker = isPrimary ? '🎯' : '🔄';

    console.log(`  ${marker} Routing session ${sessionId} to ${server.id}`);

    return server.handleRequest(sessionId);
  }

  /**
   * Get load balancer statistics
   */
  getStats(): {
    totalServers: number;
    healthyServers: number;
    totalSessions: number;
    serverLoad: Map<string, { connections: number; sessions: number }>;
  } {
    const healthyServers = Array.from(this.servers.values()).filter((s) => s.healthy).length;
    let totalSessions = 0;
    const serverLoad = new Map<string, { connections: number; sessions: number }>();

    for (const [serverId, server] of this.servers.entries()) {
      if (server instanceof MockAppServer) {
        const sessions = server.getSessionCount();
        totalSessions += sessions;
        serverLoad.set(serverId, {
          connections: server.activeConnections,
          sessions,
        });
      }
    }

    return {
      totalServers: this.ring.size,
      healthyServers,
      totalSessions,
      serverLoad,
    };
  }
}

// ============================================================================
// Demo: Sticky Load Balancing
// ============================================================================

async function demo() {
  console.log('🚀 Sticky Load Balancing Demo\n');

  // Create load balancer
  const lb = new StickyLoadBalancer();

  // Add application servers
  console.log('📦 Setting up server cluster...');
  lb.addServer('app-server-1');
  lb.addServer('app-server-2');
  lb.addServer('app-server-3');
  console.log();

  // Simulate user sessions
  console.log('👥 Simulating user sessions...');
  const sessions = ['session-alice', 'session-bob', 'session-charlie', 'session-diana'];

  // Each user makes multiple requests
  for (let round = 1; round <= 3; round++) {
    console.log(`\n📞 Round ${round} of requests:`);
    for (const sessionId of sessions) {
      const response = await lb.routeRequest(sessionId);
      console.log(`    ${response}`);
    }
  }
  console.log();

  // Show load distribution
  console.log('📊 Load distribution:');
  const stats1 = lb.getStats();
  for (const [serverId, load] of stats1.serverLoad.entries()) {
    console.log(`  ${serverId}: ${load.sessions} sessions, ${load.connections} active connections`);
  }
  console.log();

  // Simulate server failure
  console.log('⚠️  Simulating app-server-2 failure...');
  lb.markServerUnhealthy('app-server-2');
  console.log();

  // Sessions from failed server automatically failover
  console.log('🔄 Requests after server failure (automatic failover):');
  for (const sessionId of sessions) {
    const response = await lb.routeRequest(sessionId);
    console.log(`  ${response}`);
  }
  console.log();

  // Add new server for scaling
  console.log('⚡ Adding new server for horizontal scaling...');
  lb.addServer('app-server-4');
  console.log();

  // New sessions will use all servers including new one
  console.log('👤 New user sessions after scaling:');
  const newSessions = ['session-eve', 'session-frank'];
  for (const sessionId of newSessions) {
    const response = await lb.routeRequest(sessionId);
    console.log(`  ${response}`);
  }
  console.log();

  // Final load distribution
  console.log('📊 Final load distribution:');
  const stats2 = lb.getStats();
  console.log(
    `  Total: ${stats2.totalServers} servers (${stats2.healthyServers} healthy), ${stats2.totalSessions} sessions`
  );
  for (const [serverId, load] of stats2.serverLoad.entries()) {
    console.log(`  ${serverId}: ${load.sessions} sessions`);
  }
  console.log();

  console.log('✅ Demo complete!');
  console.log();
  console.log('Key takeaways:');
  console.log('  • Each session consistently routes to the same server');
  console.log('  • Session affinity maintained across multiple requests');
  console.log('  • Automatic failover when servers become unhealthy');
  console.log('  • Minimal session redistribution when topology changes');
  console.log('  • No external session store needed for sticky routing');
}

// Run the demo
demo().catch(console.error);
