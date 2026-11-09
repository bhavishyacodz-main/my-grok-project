export type HiringTemplateId = "small-business" | "corporate" | "creative-gaming" | "cultural-festival";

export type HiringTemplate = {
  id: HiringTemplateId;
  name: string;
  audience: string;
  description: string;
  visualStyle: string;
  accent: string;
  surface: string;
  sampleRole: string;
  sampleLocation: string;
  sections: readonly string[];
};

export const hiringTemplates: readonly HiringTemplate[] = [
  {
    id: "small-business",
    name: "Small Business",
    audience: "Local teams and growing businesses",
    description: "Warm, straightforward and welcoming, with the role and essential details easy to find.",
    visualStyle: "Warm & approachable",
    accent: "#17634d",
    surface: "#f4efe5",
    sampleRole: "Customer Support Associate",
    sampleLocation: "On-site · Indore",
    sections: ["About the business", "The opportunity", "What you'll do", "What we're looking for", "How to apply"],
  },
  {
    id: "corporate",
    name: "Corporate",
    audience: "Established organisations and professional teams",
    description: "A structured, editorial layout for clear role information and a confident employer identity.",
    visualStyle: "Structured & refined",
    accent: "#25466f",
    surface: "#edf2f7",
    sampleRole: "Business Operations Analyst",
    sampleLocation: "Hybrid · Mumbai",
    sections: ["Company overview", "Role summary", "Responsibilities", "Qualifications", "Benefits & application"],
  },
  {
    id: "creative-gaming",
    name: "Creative / Gaming",
    audience: "Studios, creative teams and game developers",
    description: "Expressive typography and bold colour, while keeping application information readable.",
    visualStyle: "Expressive & modern",
    accent: "#6942a5",
    surface: "#f1ebfa",
    sampleRole: "Junior Game Designer",
    sampleLocation: "Remote · India",
    sections: ["Our studio", "The project", "Your craft", "Skills & portfolio", "Join the team"],
  },
  {
    id: "cultural-festival",
    name: "Cultural / Festival",
    audience: "Events, festivals and cultural organisations",
    description: "A human, story-led presentation for seasonal teams, events and community work.",
    visualStyle: "Story-led & vibrant",
    accent: "#a24b2e",
    surface: "#f8eee6",
    sampleRole: "Festival Operations Assistant",
    sampleLocation: "On-site · Bhopal",
    sections: ["About the event", "The experience", "Event responsibilities", "Availability & skills", "Application details"],
  },
] as const;

export function getHiringTemplate(id: HiringTemplateId): HiringTemplate | undefined {
  return hiringTemplates.find((template) => template.id === id);
}
