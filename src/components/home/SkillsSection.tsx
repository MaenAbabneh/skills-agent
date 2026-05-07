import type { SkillType } from "@/components/skillcard";
import SkillCard from "@/components/skillcard";

export interface SkillsSectionProps {
	skills: SkillType[];
	isGridView: boolean;
}

const SkillsSection = ({ skills, isGridView }: SkillsSectionProps) => {
	return (
		<section
			id="skills"
			className={`
        grid gap-6
        ${isGridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}
      `}
		>
			{skills.map((skill) => (
				<div key={skill.id} className="skill-card-anim">
					<SkillCard {...skill} />
				</div>
			))}
		</section>
	);
};

export default SkillsSection;
