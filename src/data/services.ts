export type Service = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  intro: string;
  detailTitle: string;
  detailText: string;
  bullets: string[];
  notice?: string;
  seoTitle: string;
  seoDescription: string;
};

export const services: Service[] = [
  {
    slug: 'bilvask',
    title: 'Håndvask og udvendig bilpleje',
    eyebrow: 'Grundig vask. Flot finish.',
    summary: 'Skånsom håndvask med forvask, fælgrens, shampoo, grundig aftørring og afsluttende dækpleje.',
    intro:
      'En god håndvask starter, før vaskehånden rammer lakken. Vi bruger forvask til at løsne snavs, rengør fælgene separat og vasker bilen i hånden. Til sidst skylles og tørres bilen grundigt, og dækkene får en pæn afslutning.',
    detailTitle: 'Skånsom vask fra start til slut',
    detailText:
      'Målet er ikke bare at få bilen ren hurtigt, men at gøre det på en måde, der tager hensyn til lak og detaljer. Derfor fjerner vi så meget løst snavs som muligt, inden den egentlige håndvask går i gang.',
    bullets: [
      'Fælgrens, så bremsestøv og almindeligt vejsnavs løsnes fra fælgene',
      'Forvask, der fjerner mest muligt løst snavs før håndvasken',
      'Grundig håndvask med bilshampoo',
      'Skylning og skånsom aftørring med rene mikrofiberklude',
      'Dækpleje som afslutning'
    ],
    seoTitle: 'Bilvask og håndvask i Esbjerg | Esbjerg Shine',
    seoDescription:
      'Få bilen håndvasket i Esbjerg med forvask, fælgrens, bilshampoo, grundig aftørring og dækpleje hos Esbjerg Shine.'
  },
  {
    slug: 'indvendig-bilpleje',
    title: 'Indvendig bilpleje',
    eyebrow: 'En renere og mere indbydende kabine.',
    summary:
      'Grundig rengøring af kabinen – fra sæder, måtter og bagagerum til instrumentbord, luftdyser, knapper og sprækker.',
    intro:
      'Vi arbejder os systematisk gennem kabinen, både på de store flader og i de små detaljer. Rengøringen tilpasses materialerne, så tekstil, læder, plast og vinyl behandles på en måde, der passer til overfladen.',
    detailTitle: 'Rengøring tilpasset kabinens materialer',
    detailText:
      'Tekstil, læder, plast og vinyl kræver ikke den samme behandling. Vi vurderer derfor kabinens materialer og stand først og tilpasser rengøringen, så resultatet bliver jævnt og velplejet uden unødigt hård behandling.',
    bullets: [
      'Grundig støvsugning af kabine, sæder, måtter og bagagerum',
      'Rens af sæder efter materiale og behov',
      'Rens af gulvtæpper og måtter',
      'Rengøring af instrumentbord, døre og midterkonsol',
      'Detaljerens af luftdyser, knapper, samlinger og sprækker',
      'Rens af loftbeklædning efter behov',
      'Indvendig ruderens',
      'Rengøring af pedaler og fodområde',
      'Opfriskning af kabinen og fokus på generende lugt',
      'Pleje af relevante plast-, vinyl- og læderflader',
      'Afslutning med Esbjerg Shines bilduft'
    ],
    seoTitle: 'Indvendig bilpleje i Esbjerg | Esbjerg Shine',
    seoDescription:
      'Grundig indvendig bilpleje i Esbjerg med støvsugning, sæderens, måtter, ruder og rengøring tilpasset kabinens materialer.'
  },
  {
    slug: 'komplet-klargoering',
    title: 'Komplet klargøring',
    eyebrow: 'Hele bilen samlet i én behandling.',
    summary: 'En samlet klargøring, hvor både kabinen og bilens udvendige flader får en grundig gennemgang.',
    intro:
      'Komplet klargøring samler indvendig og udvendig bilpleje i én behandling. Vi aftaler omfanget ud fra bilens stand og det resultat, du ønsker, så tiden bliver brugt dér, hvor bilen har mest brug for det.',
    detailTitle: 'Én samlet gennemgang af bilen',
    detailText:
      'Klargøringen er til dig, der gerne vil have hele bilen frisket op på én gang. Vi kombinerer de relevante dele af den indvendige og udvendige bilpleje og tilpasser arbejdet efter bilen frem for at følge en fast standardpakke.',
    bullets: [
      'Udvendig vask og gennemgang af bilens synlige flader',
      'Indvendig støvsugning og rengøring af kabinen',
      'Fokus på fælge, dørfalser og andre udsatte detaljer',
      'Ruder rengøres indvendigt og udvendigt',
      'Omfanget tilpasses bilens stand og det aftalte resultat'
    ],
    seoTitle: 'Bilklargøring i Esbjerg | Esbjerg Shine',
    seoDescription:
      'Komplet bilklargøring i Esbjerg med indvendig og udvendig bilpleje samlet i én behandling, tilpasset bilens stand og behov.'
  },
  {
    slug: 'polering',
    title: 'Polering',
    eyebrow: 'Mere glans og dybde i lakken.',
    summary: 'Polering med fokus på at løfte glansen og gøre lette vaskespor mindre synlige.',
    intro:
      'Før vi polerer, ser vi på lakkens stand og aftaler, hvad der er realistisk at opnå. Metode og omfang tilpasses bilen, så poleringen passer til både lakken og det ønskede resultat.',
    detailTitle: 'Polering tilpasset lakken',
    detailText:
      'Målet er en mere ensartet glans og tydeligere dybde i lakken. Hvor meget vaskespor og mindre mærker kan dæmpes, afhænger af laktype, bilens stand og hvor dybt mærkerne ligger. Derfor afstemmer vi forventningen, før arbejdet går i gang.',
    bullets: [
      'Vurdering af lakkens aktuelle stand',
      'Polering tilpasset laktype og ønsket resultat',
      'Fokus på mere glans og dybde',
      'Lette vaskespor kan blive mindre synlige afhængigt af lakkens stand'
    ],
    seoTitle: 'Bilpolering i Esbjerg | Esbjerg Shine',
    seoDescription:
      'Bilpolering i Esbjerg med fokus på glans, dybde og mindre synlige vaskespor. Behandlingen tilpasses lakkens stand hos Esbjerg Shine.'
  },
  {
    slug: 'motorvask',
    title: 'Motorvask',
    eyebrow: 'Rent motorrum. Med omtanke.',
    summary:
      'Skånsom rengøring af tilgængelige flader i motorrummet med særlig omtanke omkring elektriske og følsomme komponenter.',
    intro:
      'Motorvask kan fjerne ophobet støv, snavs og olieholdige belægninger fra de tilgængelige flader i motorrummet. Vi arbejder forsigtigt omkring elektriske og andre følsomme komponenter, og behandlingen udføres kun efter aftale.',
    detailTitle: 'Forsigtig rengøring omkring følsomme dele',
    detailText:
      'Et motorrum skal ikke behandles som bilens almindelige karrosseri. Vi arbejder derfor kontrolleret på de tilgængelige områder og tager særligt hensyn til elektriske forbindelser, sensorer og andre komponenter, der ikke bør udsættes for unødig fugt.',
    bullets: [
      'Skånsom rengøring af tilgængelige overflader i motorrummet',
      'Fokus på støv, snavs og olieholdige belægninger',
      'Forsigtig behandling omkring elektriske og andre følsomme komponenter',
      'Aftørring og opfriskning af relevante plast- og gummidele'
    ],
    notice:
      'Motorvask udføres kun efter en konkret vurdering af motorrummets stand. Fugt kan indebære en særlig risiko ved blandt andet ældre, beskadigede eller eftermonterede elektriske komponenter, stik og tætninger. Oplys derfor om kendte fejl, utætheder eller ændringer inden behandlingen. Esbjerg Shine er ikke ansvarlig for allerede eksisterende fejl eller forhold, som ikke med rimelighed kunne opdages før arbejdet. Dette begrænser ikke kundens ufravigelige rettigheder efter dansk ret.',
    seoTitle: 'Motorvask i Esbjerg | Esbjerg Shine',
    seoDescription:
      'Motorvask i Esbjerg med forsigtig rengøring af motorrummets tilgængelige flader og omtanke omkring elektriske og følsomme komponenter.'
  },
  {
    slug: 'saederens',
    title: 'Sæde- og tekstilrens',
    eyebrow: 'Når støvsugning ikke er nok.',
    summary: 'Målrettet rens af bilens sæder og tekstilflader, når snavs og pletter kræver en mere grundig behandling.',
    intro:
      'Sæder og tekstiler samler med tiden snavs, støv og pletter, som ikke forsvinder med en almindelig støvsugning. Vi vurderer materialet og vælger en behandling, der passer til overfladen og dens aktuelle stand.',
    detailTitle: 'Rens efter materiale og tilstand',
    detailText:
      'Forskellige tekstiler og pletter reagerer forskelligt på rengøring. Derfor vurderer vi sæderne først og arbejder kontrolleret frem for at love, at alle mærker kan fjernes. Målet er et renere og mere ensartet udtryk.',
    bullets: [
      'Rens af tekstilsæder efter behov',
      'Rens af måtter og relevante tekstilflader',
      'Behandling tilpasset materialet og dets stand',
      'Fokus på et renere og mere ensartet resultat'
    ],
    seoTitle: 'Sæderens og tekstilrens i Esbjerg | Esbjerg Shine',
    seoDescription:
      'Sæderens og tekstilrens til bil i Esbjerg. Behandlingen tilpasses materialet og bilens stand hos Esbjerg Shine.'
  }
];

export const getService = (slug: string) => services.find((service) => service.slug === slug);
