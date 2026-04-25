export type Milestone = {
  day: number;
  title: string;
  description: string;
};

export const MILESTONES: Milestone[] = [
  {
    day: 1,
    title: "24 hours in",
    description: "Carbon monoxide leaves your blood. Oxygen levels begin to normalize.",
  },
  {
    day: 3,
    title: "72 hours",
    description: "Nicotine is fully out of your system. Breathing starts to feel easier.",
  },
  {
    day: 7,
    title: "One week",
    description: "Sense of taste and smell sharpen. Energy levels start climbing.",
  },
  {
    day: 14,
    title: "Two weeks",
    description: "Circulation improves. Walking and exercise feel less strained.",
  },
  {
    day: 30,
    title: "One month",
    description: "Lung function increases up to 30%. Coughing fits fade.",
  },
  {
    day: 90,
    title: "Three months",
    description: "Fertility improves. Risk of heart attack already starts dropping.",
  },
  {
    day: 365,
    title: "One year",
    description: "Risk of coronary heart disease is cut in half compared to a smoker.",
  },
];
