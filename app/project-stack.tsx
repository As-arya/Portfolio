import { skills } from "./data";

export function TechnologyIcon({ name }: { name: string }) {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const skill = skills.find(item => item.name.toLowerCase().replace(/[^a-z0-9]/g, "") === key || item.icon === key);
  return skill ? <img className={`stack-icon stack-icon-${skill.icon}`} src={`/icons/${skill.icon}.${skill.icon === "claude-code" ? "png" : "svg"}`} width={18} height={18} alt="" loading="lazy" /> : null;
}

export default function StackTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return <div className="project-tags">{tags.map(tag => <span key={tag}><TechnologyIcon name={tag} />{tag}</span>)}</div>;
}
