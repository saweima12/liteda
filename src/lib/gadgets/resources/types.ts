import { z } from 'zod';

export const resourcesVarsSchema = z.object({
	// Data source
	backend: z.enum(['local', 'glances']).default('local'),
	url: z.string().url().optional(),
	version: z.number().default(4),
	username: z.string().optional(),
	password: z.string().optional(),

	// Display items
	cpu: z.boolean().default(true),
	memory: z.boolean().default(true),
	disk: z.union([z.string(), z.array(z.string())]).optional(),
	cputemp: z.boolean().default(false),

	// Display options
	refresh: z.number().default(5000),
	showGraph: z.boolean().default(true),
	tempUnit: z.enum(['celsius', 'fahrenheit']).default('celsius'),
	tempWarn: z.number().default(80),
});

export const resourcesConfigSchema = z.object({
	type: z.literal('resources'),
	vars: resourcesVarsSchema.optional(),
});

export type ResourcesVars = z.infer<typeof resourcesVarsSchema>;
export type ResourcesConfig = z.infer<typeof resourcesConfigSchema>;

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
