import { createHandler } from '../utils/create-handler';
import widget from './meta';

interface ProxmoxResource {
  type: 'node' | 'qemu' | 'lxc' | 'storage' | 'pool';
  node?: string;
  status?: string;
  cpu?: number;
  maxcpu?: number;
  mem?: number;
  maxmem?: number;
  template?: number;
}

interface ProxmoxResponse {
  data: ProxmoxResource[];
}

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    const response = await fetch(`${vars.url}/api2/json/cluster/resources`, {
      headers: {
        Authorization: `PVEAPIToken=${vars.username}=${vars.password}`,
      },
      // Skip SSL verification for self-signed certs (common in homelabs)
      // @ts-expect-error - Bun-specific TLS option
      tls: {
        rejectUnauthorized: false,
      },
    });

    if (!response.ok) {
      throw new Error(`Proxmox API error: ${response.status} ${response.statusText}`);
    }

    const json: ProxmoxResponse = await response.json();
    const resources = json.data;

    // Filter by node if specified
    const targetNode = vars.node;
    
    // Count VMs
    const vms = resources.filter((r) => r.type === 'qemu' && r.template !== 1);
    const vmsRunning = vms.filter((r) => r.status === 'running').length;
    const vmsTotal = vms.length;

    // Count LXC containers
    const lxc = resources.filter((r) => r.type === 'lxc' && r.template !== 1);
    const lxcRunning = lxc.filter((r) => r.status === 'running').length;
    const lxcTotal = lxc.length;

    // Calculate CPU and Memory
    const nodes = resources.filter((r) => r.type === 'node');
    
    let cpu = 0;
    let mem = 0;
    let nodeName: string | undefined;

    if (targetNode) {
      // Single node metrics
      const node = nodes.find((r) => r.node === targetNode);
      if (node) {
        cpu = (node.cpu ?? 0) * 100;
        mem = node.mem && node.maxmem ? (node.mem / node.maxmem) * 100 : 0;
        nodeName = node.node;
      }
    } else {
      // Cluster average
      const onlineNodes = nodes.filter((r) => r.status === 'online');
      if (onlineNodes.length > 0) {
        const totalCpu = onlineNodes.reduce((sum, n) => sum + (n.cpu ?? 0), 0);
        const totalMem = onlineNodes.reduce((sum, n) => sum + (n.mem ?? 0), 0);
        const totalMaxMem = onlineNodes.reduce((sum, n) => sum + (n.maxmem ?? 0), 0);
        
        cpu = (totalCpu / onlineNodes.length) * 100;
        mem = totalMaxMem > 0 ? (totalMem / totalMaxMem) * 100 : 0;
      }
    }

    return {
      vms: { running: vmsRunning, total: vmsTotal },
      lxc: { running: lxcRunning, total: lxcTotal },
      cpu: Math.round(cpu * 10) / 10,
      mem: Math.round(mem * 10) / 10,
      node: nodeName,
    };
  },
});