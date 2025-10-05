import "./cli.css";
import {
	ExternalLink,
	Github,
	Linkedin,
	Mails,
	Octagon,
	Star,
} from "lucide-react";
import GitHubCalendar from "react-github-calendar";
import { useLoaderData } from "react-router";
import type { BadgeColors } from "~/lib/constants";
import {
	languageColors2,
	repoUrls,
	skillStyles,
	skills,
} from "~/lib/constants";
import { hexToRgba } from "~/lib/utils";
import { fetchGitHubProjects } from "~/services/github";
import type { Route } from "./+types/cli";

export async function loader({ context }: Route.LoaderArgs) {
	const projects = await fetchGitHubProjects(
		repoUrls,
		context.cloudflare.env.GITHUB_TOKEN,
	);

	return { projects };
}

function TitleBox() {
	return (
		<div className="title-box" box-="no-bottom" shear-="top">
			<div className="header">
				<span is-="badge" variant-="foreground0">
					Connor Young
				</span>
			</div>
			<div className="box-text">
				Backend software developer focusing on scalable infrastructure for game
				services. I have extensive experience building backend services,
				matchmaking systems, and building game services for kubernetes.
			</div>
		</div>
	);
}

function SkillsBox() {
	return (
		<div className="skills-box" box-="no-bottom" shear-="top">
			<div>
				<span
					className="header"
					variant-="foreground0"
					is-="badge"
					cap-="triangle"
				>
					Skills
				</span>
			</div>
			<div className="box-text">
				<div className="flex flex-wrap gap-2">
					{skills.map((skill) => {
						const { base, text } = skillStyles[skill] ?? {
							base: "#14b8a6",
							text: "#ecfeff",
						};

						return (
							<span
								key={skill}
								is-="badge"
								cap-="round"
								style={
									{
										"--badge-color": base,
										"--badge-text": text,
										borderColor: hexToRgba(base, 0.35),
									} as React.CSSProperties
								}
							>
								{skill}
							</span>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function ContactBox() {
	return (
		<div className="contact-box" box-="square" shear-="top">
			<div>
				<span
					className="header"
					variant-="foreground0"
					is-="badge"
					cap-="triangle"
				>
					Contact Me
				</span>
			</div>
			<div className="box-text">
				<div className="flex items-center gap-1">
					<a
						href="https://github.com/utfunderscore"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-opacity hover:opacity-70"
						aria-label="GitHub Profile"
					>
						<div className="relative">
							<Octagon className="h-12 w-12 text-white fill-white absolute inset-0" />
							<div className="relative z-10 flex items-center justify-center h-12 w-12">
								<Github className="h-6 w-6 stroke-2 text-black" />
							</div>
						</div>
					</a>
					<a
						href="mailto:connor@connoryoung.dev"
						className="transition-opacity hover:opacity-70"
						aria-label="Email Contact"
					>
						<div className="relative">
							<Octagon className="h-12 w-12 text-white fill-white absolute inset-0" />
							<div className="relative z-10 flex items-center justify-center h-12 w-12">
								<Mails className="h-6 w-6 stroke-2 text-black" />
							</div>
						</div>
					</a>
					<a
						href="https://linkedin.com/in/connoryoungdev"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-opacity hover:opacity-70"
						aria-label="LinkedIn Profile"
					>
						<div className="relative">
							<Octagon className="h-12 w-12 text-white fill-white absolute inset-0" />
							<div className="relative z-10 flex items-center justify-center h-12 w-12">
								<Linkedin className="h-6 w-6 stroke-2 text-black" />
							</div>
						</div>
					</a>
				</div>
			</div>
		</div>
	);
}

function ProjectsPanel() {
	const { projects } = useLoaderData<typeof loader>();

	return (
		<div className="blog-box" box-="square" shear-="top">
			<div className="header">
				<span is-="badge" variant-="foreground0">
					Projects
				</span>
			</div>
			<div className="space-y-4 inside-projects">
				{projects.map((project) => {
					type LabelToken = { label: string; colors?: BadgeColors | null };
					const seen = new Set<string>();

					const rawLabels: LabelToken[] = project.languages.map((language) => ({
						label: language,
						colors: languageColors2?.get(language.toLowerCase()) ?? null,
					}));

					const labels = rawLabels.filter(({ label }) => {
						const key = label.toLowerCase();
						if (seen.has(key)) return false;
						seen.add(key);
						return true;
					});

					return (
						<div key={project.name} className="project">
							<div
								key={project.url}
								className="space-y-1 border-l-4 pl-4"
								style={{
									borderLeftColor: labels[0]?.colors?.backgroundColor ?? "#000",
								}}
							>
								<div className="space-y-1">
									<div className="flex flex-wrap justify-between">
										<p>
											<code>{project.name}</code>
										</p>
										<span className="flex items-center gap-1">
											<Star
												className="h-3.5 w-3.5 opacity-70 flex-shrink-0"
												aria-hidden="true"
											/>
											{project.stars.toLocaleString()}
										</span>
									</div>
									{project.description}
								</div>
								{labels.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{labels.map(({ label, colors }) => (
											<span
												key={label}
												is-="badge"
												cap-="round"
												style={
													{
														"--badge-color": colors?.backgroundColor ?? "#000",
														"--badge-text": colors?.textColor ?? "",
													} as React.CSSProperties
												}
											>
												{label}
											</span>
										))}
									</div>
								)}
								<a
									href={project.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 transition underline"
								>
									View on GitHub
									<ExternalLink
										className="h-4 w-4 flex-shrink-0"
										aria-hidden="true"
									/>
								</a>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function GitActivityBox() {
	return (
		<div className="contact-box" box-="square" shear-="top">
			<div>
				<span
					className="header"
					variant-="foreground0"
					is-="badge"
					cap-="triangle"
				>
					Activity
				</span>
			</div>
			<div className="box-text">
				<GitHubCalendar username="utfunderscore" />
			</div>
		</div>
	);
}

export default function Home() {
	return (
		<div className="min-h-screen text-gray-100">
			<div className="mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,_3fr)_minmax(0,_4fr)_minmax(0,_3fr)]">
				<div className="island1">
					<TitleBox />
					<SkillsBox />
					<ContactBox />
					<GitActivityBox />
				</div>
				<div className="island2">
					<div className="blog-box" box-="square" shear-="top">
						<div className="header">
							<span is-="badge" variant-="foreground0">
								Blog
							</span>
						</div>
						<div className="box-text">
							Backend software developer focusing on scalable infrastructure for
							game services. I have extensive experience building backend
							services, matchmaking systems, and building game services for
							kubernetes.
						</div>
					</div>
				</div>
				<div className="island3">
					<ProjectsPanel />
				</div>
			</div>
		</div>
	);
}
