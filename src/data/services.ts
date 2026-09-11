export type Service = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  intro: string;
  bullets: string[];
  seoTitle: string;
  seoDescription: string;
};

export const services: Service[] = [
  {
    slug: 'bilvask',
    title: 'Håndvask & udvendig bilpleje',
    eyebrow: 'Ren bil. Skarp finish.',
    summary: 'Skånsom udvendig vask med fokus på detaljer, fælge, kanter og en ensartet finish.',
    intro: 'En god bilvask handler om mere end at få snavset af. Vi arbejder metodisk omkring lak, fælge, dørfalser og detaljer, så bilen afleveres ren og velplejet uden unødigt hård behandling.',
    bullets: ['Skånsom håndvask', 'Fælge og synlige detaljer', 'Aftørring med fokus på finish'],
    seoTitle: 'Bilvask i Esbjerg | Esbjerg Shine',
    seoDescription: 'Skånsom håndvask og udvendig bilpleje i Esbjerg. Esbjerg Shine hjælper med en ren, velplejet bil og en skarp finish.'
  },
  {
    slug: 'indvendig-bilpleje',
    title: 'Indvendig bilpleje',
    eyebrow: 'Kabinen tilbage i form.',
    summary: 'Grundig rengøring af kabine, overflader, måtter og svært tilgængelige områder.',
    intro: 'Kabinen bliver brugt hver dag, og støv, sand, pletter og almindeligt slid sætter sig hurtigt. Vi arbejder systematisk gennem bilen og tilpasser behandlingen til materialerne.',
    bullets: ['Støvsugning og rengøring', 'Måtter, paneler og detaljer', 'Pleje tilpasset materialerne'],
    seoTitle: 'Indvendig bilpleje i Esbjerg | Esbjerg Shine',
    seoDescription: 'Indvendig rengøring og bilpleje i Esbjerg med fokus på kabine, måtter, paneler og detaljer. Kontakt Esbjerg Shine for et tilbud.'
  },
  {
    slug: 'komplet-klargoering',
    title: 'Komplet klargøring',
    eyebrow: 'Hele bilen. Én samlet behandling.',
    summary: 'En samlet løsning til bilen, hvor både kabine og udvendige flader får grundig opmærksomhed.',
    intro: 'Komplet klargøring samler den indvendige og udvendige bilpleje i én gennemgang. Omfanget tilpasses bilens stand og det resultat, du ønsker.',
    bullets: ['Indvendig og udvendig gennemgang', 'Detaljer omkring fælge og falser', 'Tilpasset bilens stand og behov'],
    seoTitle: 'Bilklargøring i Esbjerg | Esbjerg Shine',
    seoDescription: 'Komplet bilklargøring i Esbjerg. Indvendig og udvendig bilpleje samlet i én løsning hos Esbjerg Shine.'
  },
  {
    slug: 'polering',
    title: 'Polering & lakforbedring',
    eyebrow: 'Mere dybde. Mere glans.',
    summary: 'Polering der kan forbedre glans, dybde og reducere synlige vaskespor og lette lakdefekter.',
    intro: 'Polering bør tilpasses lakken frem for at følge en fast opskrift. Før arbejdet vurderes bilens overflade, så metode og ambitionsniveau passer til lakken og forventningen.',
    bullets: ['Vurdering af lakkens stand', 'Forbedring af glans og dybde', 'Reduktion af lette vaskespor'],
    seoTitle: 'Bilpolering i Esbjerg | Esbjerg Shine',
    seoDescription: 'Professionel bilpolering i Esbjerg med fokus på glans, dybde og en flottere lak. Få et uforpligtende tilbud fra Esbjerg Shine.'
  },
  {
    slug: 'lakbeskyttelse',
    title: 'Lakbeskyttelse & coating',
    eyebrow: 'Bevar resultatet længere.',
    summary: 'Beskyttende behandlinger der vælges efter bil, lak og ønsket holdbarhed.',
    intro: 'Efter vask eller polering kan en beskyttende behandling gøre den efterfølgende vedligeholdelse lettere og hjælpe med at bevare finishen. Valget af produkt og proces aftales ud fra bilen og ønsket holdbarhed.',
    bullets: ['Lakforsegling', 'Coating efter behov', 'Råd om efterfølgende vedligeholdelse'],
    seoTitle: 'Lakbeskyttelse og coating i Esbjerg | Esbjerg Shine',
    seoDescription: 'Lakbeskyttelse og coating i Esbjerg. Esbjerg Shine tilpasser behandlingen til bilen, lakken og den ønskede holdbarhed.'
  },
  {
    slug: 'saederens',
    title: 'Sæde- & tekstilrens',
    eyebrow: 'Når en almindelig støvsugning ikke er nok.',
    summary: 'Målrettet rens af sæder og tekstiler, når kabinen kræver en mere grundig behandling.',
    intro: 'Tekstiler samler snavs og pletter, som ofte kræver mere end almindelig rengøring. Vi vurderer materialet og arbejder med en behandling, der passer til overfladen.',
    bullets: ['Rens af tekstilsæder', 'Måtter og tekstilflader', 'Behandling tilpasset materialet'],
    seoTitle: 'Sæderens og tekstilrens i Esbjerg | Esbjerg Shine',
    seoDescription: 'Sæderens og tekstilrens til bil i Esbjerg. Få kabinen frisket op med grundig bilpleje hos Esbjerg Shine.'
  }
];

export const getService = (slug: string) => services.find((service) => service.slug === slug);
