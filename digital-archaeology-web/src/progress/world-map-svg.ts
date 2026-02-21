// src/progress/world-map-svg.ts
// Embedded SVG world map constant for the collectible locations feature
// Simplified Natural Earth continent outlines in equirectangular projection
// viewBox: 0 0 1000 500 — dark themed, no country borders, no labels

/**
 * Simplified SVG world map string.
 * Continent outlines are approximations of Natural Earth data.
 * Equirectangular projection: x maps to longitude, y maps to latitude.
 * Dark themed to match the Digital Archaeology visual style.
 */
export const WORLD_MAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" class="da-world-map__svg">
  <defs>
    <radialGradient id="da-wm-pin-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="var(--persona-gold, #d4a574)" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="var(--persona-gold, #d4a574)" stop-opacity="0"/>
    </radialGradient>
    <filter id="da-wm-glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Ocean background -->
  <rect width="1000" height="500" fill="#0a0a12"/>

  <!-- Grid lines (subtle) -->
  <g stroke="#151525" stroke-width="0.5" fill="none" opacity="0.4">
    <line x1="0" y1="250" x2="1000" y2="250"/>
    <line x1="500" y1="0" x2="500" y2="500"/>
    <line x1="0" y1="125" x2="1000" y2="125"/>
    <line x1="0" y1="375" x2="1000" y2="375"/>
    <line x1="250" y1="0" x2="250" y2="500"/>
    <line x1="750" y1="0" x2="750" y2="500"/>
  </g>

  <!-- Continents -->
  <g fill="#1a1a2e" stroke="#2f2f52" stroke-width="1" stroke-linejoin="round">

    <!-- North America -->
    <path d="M120,80 L150,70 L190,65 L220,72 L240,80 L260,95 L270,110
             L280,120 L275,140 L260,155 L250,165 L240,175 L230,195
             L215,210 L200,215 L185,200 L170,195 L160,185 L150,175
             L140,180 L130,185 L120,180 L110,165 L105,150 L100,140
             L95,125 L100,110 L108,95 Z"/>

    <!-- Central America -->
    <path d="M185,200 L200,215 L210,225 L215,235 L220,245 L225,250
             L220,255 L210,250 L200,245 L195,240 L190,230 L185,220
             L180,210 Z"/>

    <!-- South America -->
    <path d="M220,255 L240,260 L260,270 L280,285 L295,300 L305,320
             L310,340 L308,360 L300,380 L290,395 L275,405 L260,400
             L250,390 L240,370 L235,350 L230,330 L225,310 L220,295
             L215,280 L215,265 Z"/>

    <!-- Greenland -->
    <path d="M280,50 L310,45 L330,50 L340,60 L335,75 L320,80
             L300,75 L285,65 Z"/>

    <!-- Europe -->
    <path d="M460,75 L475,70 L490,72 L505,78 L515,85 L525,92
             L530,100 L528,110 L520,118 L515,125 L510,135 L505,140
             L500,148 L495,155 L488,160 L480,158 L475,150 L470,145
             L465,138 L462,130 L458,120 L455,110 L452,100 L455,90 Z"/>

    <!-- British Isles -->
    <path d="M445,85 L455,82 L458,90 L455,98 L448,100 L443,95 Z"/>
    <path d="M438,92 L445,90 L447,96 L442,100 L436,97 Z"/>

    <!-- Scandinavia -->
    <path d="M490,50 L500,45 L515,48 L520,55 L525,65 L520,75
             L510,78 L500,72 L495,65 L490,58 Z"/>

    <!-- Africa -->
    <path d="M470,175 L485,170 L500,168 L515,170 L530,175 L545,185
             L555,200 L565,218 L570,238 L572,260 L568,280 L560,300
             L548,315 L535,325 L520,330 L505,328 L490,320 L480,305
             L472,288 L468,270 L465,250 L462,230 L460,210 L462,195
             L465,185 Z"/>

    <!-- Madagascar -->
    <path d="M580,300 L585,295 L590,305 L588,318 L582,322 L578,315 Z"/>

    <!-- Asia (main mass) -->
    <path d="M530,100 L550,90 L575,82 L600,78 L630,75 L660,72
             L690,75 L720,80 L750,85 L775,90 L790,100 L800,115
             L805,130 L800,145 L790,158 L778,168 L765,175 L750,180
             L735,182 L720,178 L705,172 L690,168 L675,170 L660,175
             L645,180 L630,182 L615,180 L600,175 L590,168 L580,160
             L570,150 L560,140 L550,130 L540,120 L535,110 Z"/>

    <!-- India -->
    <path d="M645,180 L660,175 L675,180 L685,195 L690,215 L685,235
             L675,250 L660,255 L648,245 L640,230 L635,215 L637,200 Z"/>

    <!-- Southeast Asia -->
    <path d="M720,178 L735,182 L745,195 L750,210 L748,225 L740,235
             L728,230 L718,220 L712,210 L710,200 L712,190 Z"/>

    <!-- Japan -->
    <path d="M810,115 L818,108 L825,115 L822,128 L815,135 L808,130 Z"/>

    <!-- Australia -->
    <path d="M770,310 L795,300 L820,295 L845,300 L860,310 L868,325
             L865,345 L855,358 L840,365 L820,368 L800,365 L785,355
             L775,340 L770,325 Z"/>

    <!-- New Zealand -->
    <path d="M885,365 L890,358 L895,365 L892,378 L886,382 Z"/>
    <path d="M880,380 L885,375 L888,382 L884,390 L878,388 Z"/>

    <!-- Indonesia/Malaysia -->
    <path d="M735,250 L750,248 L765,252 L775,258 L770,265 L758,268
             L745,265 L738,258 Z"/>
    <path d="M778,255 L790,252 L800,258 L798,268 L788,272 L780,265 Z"/>
  </g>

  <!-- Pin container (populated dynamically) -->
  <g class="da-world-map__pins"></g>
</svg>`;
