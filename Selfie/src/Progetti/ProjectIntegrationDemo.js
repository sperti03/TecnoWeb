import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, Alert, LinearProgress, Chip } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TaskIcon from '@mui/icons-material/Task';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import CalendarProjectIntegration from './CalendarProjectIntegration.js';
import projectService from './ProjectService.js';

const h = React.createElement;

const ProjectIntegrationDemo = () => {
	const [projects, setProjects] = useState([]);
	const [syncing, setSyncing] = useState(false);
	const [syncComplete, setSyncComplete] = useState(false);
	const [stats, setStats] = useState(null);
	const [error, setError] = useState(null);
	const integration = new CalendarProjectIntegration();

	useEffect(() => { loadProjects(); }, []);

	const loadProjects = async () => {
		try {
			const projectsData = await projectService.getProjects();
			setProjects(projectsData);
			const integrationStats = integration.getIntegrationStats(projectsData);
			setStats(integrationStats);
		} catch (err) {
			setError('Errore nel caricamento dei progetti');
			console.error(err);
		}
	};

	const handleSync = async (options) => {
		try {
			setSyncing(true);
			setError(null);
			await integration.syncProjectsToCalendar(projects, options);
			setSyncComplete(true);
			setTimeout(() => setSyncComplete(false), 3000);
		} catch (err) {
			setError('Errore durante la sincronizzazione');
			console.error(err);
		} finally {
			setSyncing(false);
		}
	};

	const syncMilestones = () => handleSync({ includeAllTasks: false, includeMilestones: true, onlyUserTasks: true, notificationLeadTime: 120 });
	const syncAllTasks = () => handleSync({ includeAllTasks: true, includeMilestones: true, onlyUserTasks: true, notificationLeadTime: 30 });

	return h(
		Box,
		{ sx: { p: 3, maxWidth: 1000, margin: '0 auto' } },
		h(
			Box,
			{ sx: { display: 'flex', alignItems: 'center', gap: 2, mb: 4 } },
			h(IntegrationInstructionsIcon, { sx: { fontSize: 40, color: 'primary.main' } }),
			h(Typography, { variant: 'h4', component: 'h1', sx: { fontWeight: 600 } }, 'Integrazione Calendario-Progetti')
		),
		error
			? h(Alert, { severity: 'error', sx: { mb: 3 } }, error)
			: null,
		syncComplete
			? h(Alert, { severity: 'success', sx: { mb: 3 } }, '✅ Sincronizzazione completata con successo!')
			: null,
		syncing
			? h(
				Box,
				{ sx: { mb: 3 } },
				h(
					Alert,
					{ severity: 'info' },
					h(
						Box,
						{ sx: { display: 'flex', alignItems: 'center', gap: 2 } },
						h(Typography, null, 'Sincronizzazione in corso...'),
						h(LinearProgress, { sx: { flex: 1 } })
					)
				)
			)
			: null,
		h(
			Grid,
			{ container: true, spacing: 3 },
			h(
				Grid,
				{ item: true, xs: 12 },
				h(
					Card,
					null,
					h(
						CardContent,
						null,
						h(Typography, { variant: 'h6', gutterBottom: true }, '📊 Statistiche Progetti'),
						stats
							? h(
								Grid,
								{ container: true, spacing: 2 },
								h(
									Grid,
									{ item: true, xs: 6, md: 3 },
									h(
										Box,
										{ sx: { textAlign: 'center' } },
										h(Typography, { variant: 'h4', color: 'primary.main' }, String(projects.length)),
										h(Typography, { variant: 'body2', color: 'text.secondary' }, 'Progetti Totali')
									)
								),
								h(
									Grid,
									{ item: true, xs: 6, md: 3 },
									h(
										Box,
										{ sx: { textAlign: 'center' } },
										h(Typography, { variant: 'h4', color: 'success.main' }, String(stats.totalTasks)),
										h(Typography, { variant: 'body2', color: 'text.secondary' }, 'Task Totali')
									)
								),
								h(
									Grid,
									{ item: true, xs: 6, md: 3 },
									h(
										Box,
										{ sx: { textAlign: 'center' } },
										h(Typography, { variant: 'h4', color: 'warning.main' }, String(stats.totalMilestones)),
										h(Typography, { variant: 'body2', color: 'text.secondary' }, 'Milestone Totali')
									)
								),
								h(
									Grid,
									{ item: true, xs: 6, md: 3 },
									h(
										Box,
										{ sx: { textAlign: 'center' } },
										h(
											Typography,
											{ variant: 'h4', color: 'info.main' },
											String(stats.syncableTasks + stats.syncableMilestones)
										),
										h(Typography, { variant: 'body2', color: 'text.secondary' }, 'Elementi Sincronizzabili')
									)
								)
							)
							: h(Typography, null, 'Caricamento statistiche...')
						)
					)
				),
			h(
				Grid,
				{ item: true, xs: 12, md: 6 },
				h(
					Card,
					null,
					h(
						CardContent,
						null,
						h(
							Box,
							{ sx: { display: 'flex', alignItems: 'center', gap: 1, mb: 2 } },
							h(EmojiEventsIcon, { color: 'warning' }),
							h(Typography, { variant: 'h6' }, 'Sincronizza Milestone')
						),
						h(
							Typography,
							{ variant: 'body2', color: 'text.secondary', paragraph: true },
							'Sincronizza solo le milestone dei progetti nel calendario per tenere traccia delle scadenze importanti.'
						),
						h(
							Box,
							{ sx: { display: 'flex', gap: 1, alignItems: 'center', mb: 2 } },
							h(Chip, { label: `${stats?.syncableMilestones || 0} milestone`, size: 'small', color: 'warning', variant: 'outlined' }),
							h(Chip, { label: '2h preavviso', size: 'small', color: 'info', variant: 'outlined' })
						),
						h(
							Button,
							{
								variant: 'contained',
								color: 'warning',
								startIcon: h(SyncIcon, null),
								onClick: syncMilestones,
								disabled: syncing || !stats?.syncableMilestones,
								fullWidth: true,
							},
							'Sincronizza Milestone'
						)
					)
				)
			),
			h(
				Grid,
				{ item: true, xs: 12, md: 6 },
				h(
					Card,
					null,
					h(
						CardContent,
						null,
						h(
							Box,
							{ sx: { display: 'flex', alignItems: 'center', gap: 1, mb: 2 } },
							h(TaskIcon, { color: 'success' }),
							h(Typography, { variant: 'h6' }, 'Sincronizza Tutto')
						),
						h(
							Typography,
							{ variant: 'body2', color: 'text.secondary', paragraph: true },
							'Sincronizza tutti i task e le milestone dei progetti nel calendario per una vista completa.'
						),
						h(
							Box,
							{ sx: { display: 'flex', gap: 1, alignItems: 'center', mb: 2 } },
							h(Chip, { label: `${stats?.syncableTasks || 0} task`, size: 'small', color: 'success', variant: 'outlined' }),
							h(Chip, { label: `${stats?.syncableMilestones || 0} milestone`, size: 'small', color: 'warning', variant: 'outlined' })
						),
						h(
							Button,
							{
								variant: 'contained',
								color: 'success',
								startIcon: h(SyncIcon, null),
								onClick: syncAllTasks,
								disabled: syncing || (!stats?.syncableTasks && !stats?.syncableMilestones),
								fullWidth: true,
							},
							'Sincronizza Tutto'
						)
					)
				)
			),
			h(
				Grid,
				{ item: true, xs: 12 },
				h(
					Card,
					null,
					h(
						CardContent,
						null,
						h(Typography, { variant: 'h6', gutterBottom: true }, '🔗 Collegamenti Rapidi'),
						h(
							Box,
							{ sx: { display: 'flex', gap: 2, flexWrap: 'wrap' } },
							h(
								Button,
								{ variant: 'outlined', startIcon: h(CalendarMonthIcon, null), href: '/calendar' },
								'Calendario Classico'
							),
							h(
								Button,
								{ variant: 'outlined', startIcon: h(IntegrationInstructionsIcon, null), href: '/calendario-unificato' },
								'Calendario Unificato'
							),
							h(
								Button,
								{ variant: 'outlined', startIcon: h(TaskIcon, null), href: '/progetti' },
								'Gestione Progetti'
							)
						)
					)
				)
		)
	);
};

export default ProjectIntegrationDemo;

 

