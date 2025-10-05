type ProjectSummary = {
	name: string;
	description: string;
	stars: number;
	topics: string[];
	languages: string[];
	url: string;
};

type TopProjectsProps = {
	projects: ProjectSummary[];
	languageColors: Record<string, string>;
};

const toPascalCase = (value: string) => {
	const tokens = value
		.replace(/[_-]+/g, " ")
		.replace(/[^A-Za-z0-9\s]/g, " ")
		.trim()
		.split(/\s+/)
		.filter(Boolean);

	if (tokens.length === 0) {
		return value;
	}

	return tokens
		.map(
			(token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase(),
		)
		.join("");
};

export function TopProjects({ projects, languageColors }: TopProjectsProps) {
	return (
		<section className="card-surface rounded-md p-6 shadow-lg">
			<h3 className="mb-4 text-lg font-semibold text-white">Top Projects</h3>
			<div className="space-y-4">
				{projects.map((project) => {
					type LabelToken = { label: string; color?: string | null };
					const seen = new Set<string>();

					const rawLabels: LabelToken[] = project.languages.map((language) => ({
						label: toPascalCase(language),
						color: languageColors[language.toLowerCase()] ?? null,
					}));

					const labels = rawLabels.filter(({ label }) => {
						const key = label.toLowerCase();
						if (seen.has(key)) return false;
						seen.add(key);
						return true;
					});

					return (
						<div
							key={project.url}
							className="space-y-3 border-l-4 border-[#a97bff] pl-4"
						>
							<div className="space-y-1">
								<div className="flex flex-wrap items-start justify-between gap-2">
									<h4 className="font-medium text-white">{project.name}</h4>
									<span
										className="flex items-center gap-1 text-xs text-gray-500"
									>
										<svg
											className="h-3.5 w-3.5 opacity-70"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
										>
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.382 2.457a1 1 0 00-.364 1.118l1.287 3.97c.3.922-.755 1.688-1.538 1.118l-3.382-2.456a1 1 0 00-1.176 0l-3.382 2.456c-.783.57-1.838-.196-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.097 9.397c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.97z" />
										</svg>
										{project.stars.toLocaleString()}
									</span>
								</div>
								<p className="text-sm text-gray-400">{project.description}</p>
							</div>
							{labels.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{labels.map(({ label, color }) => (
										<span
											key={label}
											className="inline-flex items-center gap-2 rounded-md border border-teal-500/30 bg-teal-900/20 px-2 py-0.5 text-xs text-teal-200"
										>
											{color && (
												<span
													className="h-2.5 w-2.5 rounded-full"
													style={{ backgroundColor: color }}
													aria-hidden="true"
												/>
											)}
											{label}
										</span>
									))}
								</div>
							)}
							<a
								href={project.url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-sm text-[#a97bff] transition hover:text-[#a97bff]"
							>
								View on GitHub
								<svg
									className="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path d="M11 3a1 1 0 100 2h2.586L8.293 10.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
									<path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
								</svg>
							</a>
						</div>
					);
				})}
			</div>
		</section>
	);
}
