export interface SampleCard {
    front: string;
    back: string;
    lang: string;
    tag: string;
}

export const SAMPLE_DECK: SampleCard[] = [
    {
        front: 'Ephemeral',
        back: 'Lasting for a very short time.',
        lang: 'EN · adjective',
        tag: 'Vocabulary',
    },
    {
        front: 'Sonder',
        back: 'The realization that every passerby is living a life as vivid as your own.',
        lang: 'EN · noun',
        tag: 'Vocabulary',
    },
    {
        front: 'Mitochondrion',
        back: "Organelle that generates most of a cell's supply of ATP.",
        lang: 'Biology',
        tag: 'Bio 201',
    },
    {
        front: '木漏れ日',
        back: 'Komorebi — sunlight filtering through trees.',
        lang: 'JP · noun',
        tag: 'Japanese',
    },
    {
        front: 'Pareto principle',
        back: 'Roughly 80% of effects come from 20% of causes.',
        lang: 'Concept',
        tag: 'Heuristics',
    },
];
