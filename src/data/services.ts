export type Service = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  intro: string;
  bullets: string[];
  notice?: string;
  seoTitle: string;
  seoDescription: string;
};

export const services: Service[] = [
  {
    slug: 'bilvask',
    title: 'Håndvask & udvendig bilpleje',
    eyebrow: 'Ren bil. Skarp finish.',
    summary: 'Grundig udvendig håndvask med fælgrens, forvask, shampoo, skånsom aftørring og dækshine.',
    intro: 'Vi går bilen igennem trin for trin, så snavs løsnes inden selve håndvasken, og lakken behandles så skånsomt som muligt. Fælgene får deres egen rengøring, bilen håndvaskes med shampoo og afsluttes med omhyggelig aftørring og dækshine.',
    bullets: [
      'Fælgrens – fælgene rengøres grundigt for bremsestøv og snavs',
      'Forvask – skidt og snavs opløses og fjernes, så den efterfølgende håndvask bliver mere skånsom',
      'Håndvask med shampoo – bilen vaskes grundigt i hånden med kvalitetsshampoo',
      'Skylning og aftørring – bilen skylles grundigt og tørres forsigtigt med rene mikrofiberklude',
      'Dækshine – dækkene får som afslutning en ren, mørk og blank finish'
    ],
    seoTitle: 'Bilvask i Esbjerg | Esbjerg Shine',
    seoDescription: 'Grundig håndvask og udvendig bilpleje i Esbjerg med fælgrens, forvask, shampoo, skånsom aftørring og dækshine hos Esbjerg Shine.'
  },
  {
    slug: 'indvendig-bilpleje',
    title: 'Indvendig bilpleje',
    eyebrow: 'Kabinen tilbage i form.',
    summary: 'En komplet rengøring af kabinen – fra sæder, måtter og bagagerum til luftdyser, knapper og sprækker.',
    intro: 'Vi tager hele kabinen fra de store flader til de små detaljer. Behandlingen tilpasses materialerne, så tekstil, læder, plast og vinyl får den rigtige rengøring og pleje. Til sidst friskes kabinen op med vores egen bilduft.',
    bullets: [
      'Grundig støvsugning af hele kabinen – inkl. sæder, måtter og bagagerum',
      'Dybdegående sæderens – tekstil eller læder behandles efter materialet',
      'Rens af gulvtæpper og måtter',
      'Aftørring og rengøring af instrumentbord, døre og midterkonsol',
      'Detaljerens af luftdyser, knapper, samlinger og sprækker',
      'Rens af loftbeklædning ved behov',
      'Indvendig ruderens for en klar og stribefri finish',
      'Rengøring af pedaler og fodområde',
      'Lugtreduktion og opfriskning af kabinen',
      'Pleje af plast, vinyl og læder for en pæn og ensartet finish',
      'Afsluttes med vores egen bilduft, så kabinen føles frisk og ren'
    ],
    seoTitle: 'Indvendig bilpleje i Esbjerg | Esbjerg Shine',
    seoDescription: 'Grundig indvendig bilpleje i Esbjerg med støvsugning, sæderens, måtter, detaljer, ruder og materialetilpasset pleje hos Esbjerg Shine.'
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
    slug: 'motorvask',
    title: 'Motorvask',
    eyebrow: 'Rent motorrum. Med omtanke.',
    summary: 'Skånsom rengøring af motorrummet med fokus på synligt snavs og tilgængelige flader. Udføres på eget ansvar.',
    intro: 'Motorvask kan friske motorrummet op og fjerne ophobet støv, skidt og olieholdige belægninger fra tilgængelige overflader. Vi arbejder forsigtigt omkring elektriske og andre følsomme komponenter, og behandlingen udføres kun efter aftale.',
    bullets: [
      'Skånsom rengøring af tilgængelige overflader i motorrummet',
      'Fokus på støv, snavs og olieholdige belægninger',
      'Forsigtig behandling omkring elektriske og andre følsomme komponenter',
      'Aftørring og opfriskning af relevante plast- og gummidele'
    ],
    notice: 'Motorvask udføres efter aftale og på kundens eget ansvar. Motorrummet indeholder elektriske og andre følsomme komponenter, og derfor kan der ikke gives garanti for, hvordan disse reagerer på rengøringen.',
    seoTitle: 'Motorvask i Esbjerg | Esbjerg Shine',
    seoDescription: 'Motorvask i Esbjerg med skånsom rengøring af motorrummets tilgængelige flader. Udføres efter aftale og på kundens eget ansvar hos Esbjerg Shine.'
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
