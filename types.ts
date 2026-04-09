
export type ProjectCategory = 'Intelligence' | 'Engineering' | 'Analytics' | 'Automation' | 'Strategy';

export interface CaseStudy {
  id: string;
  title: string;
  category: ProjectCategory;
  friction: string;
  architecture: string[];
  outcome: string;
  codeSnippet?: string;
  imageUrl?: string;
  gallery?: string[];
  deeperDiveUrl?: string;
  videoUrl?: string;
}

export interface SkillCategory {
  title: string;
  skills: string[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  label: string;
  description: string;
  category: 'academic' | 'project' | 'skill';
  details: string[];
}