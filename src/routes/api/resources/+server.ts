import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import si from 'systeminformation';

export interface ResourcesData {
	cpu: {
		usage: number;
		load: number;
	} | null;
	memory: {
		used: number;
		total: number;
		free: number;
		usedPercent: number;
	} | null;
	disk: {
		used: number;
		total: number;
		free: number;
		usedPercent: number;
		mount: string;
	} | null;
	temperature: {
		main: number | null;
		max: number | null;
	} | null;
}

// Cache for reducing system calls
const cacheMap = new Map<string, { data: ResourcesData; timestamp: number }>();
const CACHE_TTL = 2000; // 2 seconds

/**
 * Get resources from local system using systeminformation
 */
async function getLocalResources(diskPath?: string): Promise<ResourcesData> {
	const cacheKey = `local:${diskPath || '/'}`;
	const now = Date.now();
	const cached = cacheMap.get(cacheKey);

	if (cached && now - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}

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

	const data: ResourcesData = {
		cpu: {
			usage: Math.round(currentLoad.currentLoad),
			load: Math.round(cpuLoad.avgLoad * 100) / 100,
		},
		memory: {
			used: mem.active,
			total: mem.total,
			free: mem.available,
			usedPercent: Math.round((mem.active / mem.total) * 100),
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

	cacheMap.set(cacheKey, { data, timestamp: now });
	return data;
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
	diskPath?: string,
	username?: string,
	password?: string
): Promise<ResourcesData> {
	const cacheKey = `glances:${url}:${diskPath || '/'}`;
	const now = Date.now();
	const cached = cacheMap.get(cacheKey);

	if (cached && now - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}

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
			usedPercent: Math.round(memData.percent),
		};
	}

	// Parse Filesystem
	let disk: ResourcesData['disk'] = null;
	if (fsRes.status === 'fulfilled' && fsRes.value.ok) {
		const fsData: GlancesFs[] = await fsRes.value.json();
		const targetMount = diskPath || '/';
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

	const data: ResourcesData = { cpu, memory, disk, temperature };
	cacheMap.set(cacheKey, { data, timestamp: now });
	return data;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const backend = url.searchParams.get('backend') || 'local';
		const diskPath = url.searchParams.get('disk') || '/';

		if (backend === 'glances') {
			const glancesUrl = url.searchParams.get('url');
			if (!glancesUrl) {
				return json({ error: 'Glances URL is required' }, { status: 400 });
			}
			const version = parseInt(url.searchParams.get('version') || '4', 10);
			const username = url.searchParams.get('username') || undefined;
			const password = url.searchParams.get('password') || undefined;

			const data = await getGlancesResources(glancesUrl, version, diskPath, username, password);
			return json(data);
		}

		// Default: local
		const data = await getLocalResources(diskPath);
		return json(data);
	} catch (error) {
		console.error('Failed to get system resources:', error);
		return json(
			{ error: 'Failed to get system resources' },
			{ status: 500 }
		);
	}
};
