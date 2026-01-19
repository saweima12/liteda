import { createGadgetHandler } from '$lib/gadgets/utils/create-handler.server';
import { resourcesVarsSchema, type ResourcesData } from './types';
import si from 'systeminformation';

/**
 * Get resources from local system using systeminformation
 */
async function getLocalResources(diskPath?: string): Promise<ResourcesData> {
	// Fetch all data in parallel
	const [cpuLoad, currentLoad, mem, fsSize, temp] = await Promise.all([
		si.currentLoad(),
		si.currentLoad(),
		si.mem(),
		si.fsSize(),
		si.cpuTemperature(),
	]);

	// Find the target disk (default to root)
	const targetMount = diskPath || '/';
	const targetDisk = fsSize.find((fs) => fs.mount === targetMount) || fsSize[0];

	// Calculate actual used memory (works across Linux/macOS/Windows)
	// On macOS: mem.used includes cache, so we use total - available
	// On Linux: both approaches should give similar results
	const memoryUsed = mem.total - mem.available;

	return {
		cpu: {
			usage: Math.round(currentLoad.currentLoad),
			load: Math.round(cpuLoad.avgLoad * 100) / 100,
		},
		memory: {
			used: memoryUsed,
			total: mem.total,
			free: mem.available,
			usedPercent: Math.round((memoryUsed / mem.total) * 100),
		},
		disk: targetDisk
			? {
					used: targetDisk.used,
					total: targetDisk.size,
					free: targetDisk.available,
					usedPercent: Math.round(targetDisk.use),
					mount: targetDisk.mount,
				}
			: null,
		temperature: {
			main: temp.main !== null ? Math.round(temp.main * 10) / 10 : null,
			max: temp.max !== null ? Math.round(temp.max * 10) / 10 : null,
		},
	};
}

/**
 * Glances API response types
 */
interface GlancesCpu {
	total: number;
	user: number;
	system: number;
	idle: number;
}

interface GlancesLoad {
	min1: number;
	min5: number;
	min15: number;
}

interface GlancesMem {
	total: number;
	available: number;
	percent: number;
	used: number;
	free: number;
	active: number;
}

interface GlancesFs {
	device_name: string;
	fs_type: string;
	mnt_point: string;
	size: number;
	used: number;
	free: number;
	percent: number;
}

interface GlancesSensor {
	label: string;
	value: number;
	unit: string;
	type: string;
}

/**
 * Get resources from Glances API
 */
async function getGlancesResources(
	url: string,
	version: number,
	diskPath?: string | string[],
	username?: string,
	password?: string
): Promise<ResourcesData> {
	const baseUrl = url.replace(/\/$/, '');
	const apiVersion = version || 4;
	const apiBase = `${baseUrl}/api/${apiVersion}`;

	// Build headers for authentication
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
	};
	if (username && password) {
		headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
	}

	// Fetch all data in parallel
	const [cpuRes, loadRes, memRes, fsRes, sensorsRes] = await Promise.allSettled([
		fetch(`${apiBase}/cpu`, { headers }),
		fetch(`${apiBase}/load`, { headers }),
		fetch(`${apiBase}/mem`, { headers }),
		fetch(`${apiBase}/fs`, { headers }),
		fetch(`${apiBase}/sensors`, { headers }),
	]);

	// Parse CPU
	let cpu: ResourcesData['cpu'] = null;
	if (cpuRes.status === 'fulfilled' && cpuRes.value.ok) {
		const cpuData: GlancesCpu = await cpuRes.value.json();
		let load = 0;
		if (loadRes.status === 'fulfilled' && loadRes.value.ok) {
			const loadData: GlancesLoad = await loadRes.value.json();
			load = Math.round(loadData.min1 * 100) / 100;
		}
		cpu = {
			usage: Math.round(cpuData.total),
			load,
		};
	}

	// Parse Memory
	let memory: ResourcesData['memory'] = null;
	if (memRes.status === 'fulfilled' && memRes.value.ok) {
		const memData: GlancesMem = await memRes.value.json();
		memory = {
			used: memData.used,
			total: memData.total,
			free: memData.available,
			usedPercent: Math.round((memData.used / memData.total) * 100),
		};
	}

	// Parse Filesystem
	let disk: ResourcesData['disk'] = null;
	if (fsRes.status === 'fulfilled' && fsRes.value.ok) {
		const fsData: GlancesFs[] = await fsRes.value.json();
		const targetPath = typeof diskPath === 'string' ? diskPath : (Array.isArray(diskPath) ? diskPath[0] : '/');
		const targetMount = targetPath || '/';
		const targetFs = fsData.find((fs) => fs.mnt_point === targetMount) || fsData[0];
		if (targetFs) {
			disk = {
				used: targetFs.used,
				total: targetFs.size,
				free: targetFs.free,
				usedPercent: Math.round(targetFs.percent),
				mount: targetFs.mnt_point,
			};
		}
	}

	// Parse Temperature (from sensors)
	let temperature: ResourcesData['temperature'] = { main: null, max: null };
	if (sensorsRes.status === 'fulfilled' && sensorsRes.value.ok) {
		const sensorsData: GlancesSensor[] = await sensorsRes.value.json();
		// Find temperature sensors
		const tempSensors = sensorsData.filter(
			(s) => s.type === 'temperature_core' || s.type === 'temperature_hdd'
		);
		if (tempSensors.length > 0) {
			// Use first core temperature as main, find max
			const coreSensor = tempSensors.find((s) => s.type === 'temperature_core');
			const maxTemp = Math.max(...tempSensors.map((s) => s.value));
			temperature = {
				main: coreSensor ? Math.round(coreSensor.value * 10) / 10 : null,
				max: Math.round(maxTemp * 10) / 10,
			};
		}
	}

	return { cpu, memory, disk, temperature };
}

/**
 * GET /api/gadgets/resources?id=<gadget-id>
 * Query parameter:
 *   - id: string (gadget instance ID)
 *
 * Server-side vars (from settings.yaml):
 *   - backend: 'local' | 'glances' (default: 'local')
 *   - disk: string | string[] (mount point, optional)
 *   - url: string (required for glances backend)
 *   - version: number (glances API version, default: 4)
 *   - username: string (optional, for glances auth)
 *   - password: string (optional, for glances auth)
 */
export const GET = createGadgetHandler({
	varsSchema: resourcesVarsSchema,
	async fetch(vars) {
		if (vars.backend === 'glances') {
			if (!vars.url) {
				throw new Error('Glances URL is required');
			}
			return getGlancesResources(
				vars.url,
				vars.version ?? 4,
				vars.disk,
				vars.username,
				vars.password
			);
		}

		// Default: local
		const diskPath = typeof vars.disk === 'string' ? vars.disk : (Array.isArray(vars.disk) ? vars.disk[0] : undefined);
		return getLocalResources(diskPath);
	},
	cacheTtl: 2000, // 2 seconds
	getCacheKey: (vars) => `resources:${vars.backend}:${vars.disk || '/'}:${vars.url || ''}`,
});
