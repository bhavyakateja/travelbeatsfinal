export type DestinationData = {
  id: string;
  name: string;
  slug: string;
  region: string;
  country: string;
  tags: string[];
  summary: string;
  description: string;
  image: string;
  images?: string[];
};

export type JourneyData = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  images?: string[];
};

export type JournalData = {
  id: string;
  title: string;
  slug: string;
  category: string;
  readingMinutes: number;
  excerpt: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
};

export const fallbackDestinations: DestinationData[] = [
  {
    id: "c1532f49-85f8-4d61-bde3-4fb15ce7ef21",
    name: "Morocco",
    slug: "morocco",
    region: "North Africa",
    country: "Morocco",
    tags: ["Culture", "Adventure", "Luxury"],
    summary: "Markets, mountain air, desert light, and slow riad mornings.",
    description:
      "A destination for colour, craft, food and changing landscapes — from the medinas of Marrakech to the Atlas foothills and beyond.",
    image: "/media/journey-sky.jpg",
  },
  {
    id: "1dc9a934-16da-462a-b7d0-54322bca5ff6",
    name: "Japan",
    slug: "japan",
    region: "East Asia",
    country: "Japan",
    tags: ["Culture", "Luxury", "Food"],
    summary: "A thoughtful balance of quiet rituals, design, food and energy.",
    description:
      "Move from the calm of Kyoto to the pulse of Tokyo, with room for regional food, thoughtful stays and the everyday details that make Japan memorable.",
    image: "/media/journey-sky.jpg",
  },
  {
    id: "b0afdb3f-01df-4fa3-a76f-e7c37bc0c7d2",
    name: "Italy",
    slug: "italy",
    region: "Southern Europe",
    country: "Italy",
    tags: ["Romantic", "Luxury", "Food"],
    summary: "Long lunches, coastal roads, old towns and an easy pace.",
    description:
      "Italy rewards travellers who leave space for the table, the piazza and the road between places — from city culture to coast and countryside.",
    image: "/media/journey-sky.jpg",
  },
];

export const fallbackJourneys: JourneyData[] = [
  {
    id: "fallback-journey-1",
    title: "Mediterranean slow days",
    slug: "mediterranean-slow-days",
    summary: "Coastal light, long tables and enough time to actually arrive.",
  },
  {
    id: "fallback-journey-2",
    title: "Japan, in a quieter key",
    slug: "japan-quieter-key",
    summary: "Design, ritual, food and neighbourhoods beyond the obvious route.",
  },
  {
    id: "fallback-journey-3",
    title: "Morocco through the senses",
    slug: "morocco-through-the-senses",
    summary: "Riad courtyards, mountain air, craft and desert horizons.",
  },
  {
    id: "fallback-journey-4",
    title: "A week of island light",
    slug: "island-light",
    summary: "A slower rhythm shaped around water, food and open horizons.",
  },
];

export const fallbackJournal: JournalData[] = [
  {
    id: "fallback-journal-1",
    title: "The art of leaving room for the unexpected.",
    slug: "leaving-room-for-the-unexpected",
    category: "Travel Note",
    readingMinutes: 6,
    excerpt: "Why the most memorable journeys usually have a little space left unplanned.",
    coverImageUrl: "/media/journey-sky.jpg",
    coverImageAlt: "A scenic travel horizon",
  },
  {
    id: "fallback-journal-2",
    title: "Three ways to slow down in Kyoto.",
    slug: "slow-down-in-kyoto",
    category: "Destination",
    readingMinutes: 5,
    excerpt: "A quieter way to experience one of Japan's most layered cities.",
    coverImageUrl: "/media/kyoto.jpg",
    coverImageAlt: "Quiet street in Kyoto",
  },
  {
    id: "fallback-journal-3",
    title: "What makes a stay feel like yours?",
    slug: "what-makes-a-stay-feel-like-yours",
    category: "Field Notes",
    readingMinutes: 4,
    excerpt: "The details that turn a beautiful hotel into the right hotel.",
  },
  {
    id: "fallback-journal-4",
    title: "Chasing light along the Mediterranean.",
    slug: "chasing-light-mediterranean",
    category: "Inspiration",
    readingMinutes: 7,
    excerpt: "A route shaped by coastlines, late dinners and the changing colour of the day.",
  },
];