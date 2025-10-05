import { skillStyles, skills } from "~/lib/constants";
import { hexToRgba } from "~/lib/utils";

export function ProfileCard() {
	return (
		<section className="card-surface rounded-md p-6 shadow-lg">
			<h1 className="mb-4 text-3xl font-bold text-white">Connor Young</h1>
			<p className="mb-6 leading-relaxed text-gray-300">
				Backend software developer focusing on scalable infrastructure for game
				services. I have extensive experience building backend services,
				matchmaking systems, and building game services for kubernetes.
			</p>
			<div className="mb-6">
				<h3 className="mb-3 text-lg font-semibold text-white">Skills</h3>
				<div className="flex flex-wrap gap-2">
					{skills.map((skill) => {
						const { base, text } = skillStyles[skill] ?? {
							base: "#14b8a6",
							text: "#ecfeff",
						};

						return (
							<span
								key={skill}
								className="inline-flex items-center gap-2 rounded-md border px-2 py-0.5 text-xs font-medium"
								style={{
									backgroundColor: hexToRgba(base, 0.18),
									borderColor: hexToRgba(base, 0.35),
									color: text,
								}}
							>
								<span
									aria-hidden="true"
									className="h-2.5 w-2.5 rounded-full"
									style={{ backgroundColor: base }}
								/>
								{skill}
							</span>
						);
					})}
				</div>
			</div>
		</section>
	);
}
