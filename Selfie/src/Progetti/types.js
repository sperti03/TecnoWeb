// Runtime enums/constants for Projects module (JavaScript version)

// TaskStatus enum replacement
export const TaskStatus = {
	NON_ATTIVABILE: "Non attivabile",
	ATTIVABILE: "Attivabile",
	ATTIVA: "Attiva",
	CONCLUSA: "Conclusa",
	RIATTIVATA: "Riattivata",
	IN_RITARDO: "In ritardo",
	ABBANDONATA: "Abbandonata",
};

// ViewMode enum replacement
export const ViewMode = {
	LIST: "list",
	GANTT: "gantt",
};

// SortBy enum replacement
export const SortBy = {
	DATE: "date",
	ACTOR: "actor",
	PHASE: "phase",
	STATUS: "status",
};

// Optional JSDoc typedefs for editor intellisense (no runtime impact)
/**
 * @typedef {Object} Task
 * @property {string=} _id
 * @property {string} name
 * @property {string} description
 * @property {string[]} actors
 * @property {string} phase
 * @property {string} subphase
 * @property {string} start
 * @property {string} end
 * @property {string} input
 * @property {string} output
 * @property {keyof typeof TaskStatus} status
 * @property {boolean} milestone
 * @property {string=} milestoneDate
 * @property {string[]} dependencies
 */

/**
 * @typedef {Object} Phase
 * @property {string=} _id
 * @property {string} name
 * @property {Task[]} tasks
 */

/**
 * @typedef {Object} Project
 * @property {string=} _id
 * @property {string} name
 * @property {string} description
 * @property {string} owner
 * @property {Phase[]} phases
 * @property {string} notes
 * @property {string=} createdAt
 * @property {string=} updatedAt
 */

