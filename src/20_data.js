/* ---------- 4. world constants ------------------------------ */
/* The pitch is WIDER than the 200-unit viewport, so the camera scrolls on
   both axes. PW sets the geometry - walls, centre, studs, kickoff spots and
   the camera clamp all derive from it. Goal width does NOT: a small mouth in
   a big arena is the point, and scaling it with PW doubled the scoreline.  */
const FL = 8, PW = 300, FR = FL + PW, CX = FL + PW / 2;   // side walls, centre
const CAMX = FR + 6 - W;                            // max horizontal scroll
const MED = [0, 0, 4];   // what the medics 'wear': enough TKL to show a band
const OUT = 20;      // how far past the walls and goal lines the camera may look
const GOALT = 120;   // how long the goal camera holds - goalCam() ramps off it too
const HURTCAM = 80;  // and how long the injury portrait holds before the medics move
const VT = 24, VH = 264, VB = VT + VH;              // viewport window on screen
let FT = 0, FB = 560;                               // pitch runs 0..FB in world y
let GX0 = 79, GX1 = 121, STARY = [], cam = 0, camX = 0, AR = {};

const TEAMS = [   // n, hue, stat bias [str spd tkl], aggression
  { n: 'SUNSHINE',       h: 45,  b: [1,1,1],          ag: .3 },
  { n: 'PRETTY PONIES',  h: 330, b: [.8,1.35,.6],     ag: .22 },
  { n: 'SUGAR RUSH',     h: 20,  b: [.75,1.5,.55],    ag: .45 },
  { n: 'CLOUD NINE',     h: 195, b: [.9,1.2,.8],      ag: .3 },
  { n: 'DEATH RAINBOWS', h: 300, b: [1.2,.95,1.4],    ag: .62 },
  { n: 'ROYAL HORNS',    h: 50,  b: [1.35,1,1.15],    ag: .35 },
  { n: 'NIGHTMARE MOON', h: 265, b: [1.15,.9,1],      ag: .4 },
  { n: 'BRUTAL DELUXE',  h: 0,   b: [1.35,1.15,1.45], ag: .72 }
];
const DIVS = ['FLUFFY','SPARKLE','RAINBOW','BRUTAL'];   // + ' LEAGUE' where there is room
/* Archetype: stat weighting `w`, and the look that goes with it. `m` shifts the
   mane, tail and hooves off the team hue - so a team still reads as one team,
   but a bruiser is not a pixie - and `k` adds pixels to the horn. Both are
   offsets from the team hue on purpose; absolute colours would break the
   team read. The earned gold (STR horn, SPD hooves) still overrides them. */
const ARCH = [   // n, stat weighting str spd tkl, mane offset, horn
  { n: 'PIXIE',     w: [.5,1.8,.5],   m: 330, k: 0 },
  { n: 'BRUISER',   w: [1.3,.6,1.7],  m: 20,  k: 0 },
  { n: 'SPARK',     w: [1.8,1,.6],    m: 60,  k: 1 },
  { n: 'PEGASUS',   w: [.8,1.5,.9],   m: 200, k: 0 },
  { n: 'TANKICORN', w: [1.1,.4,1.8],  m: 280, k: 0 },
  { n: 'WIZARD',    w: [1.5,.9,.7],   m: 250, k: 2 }
];
/* Five a side: a keeper, two backs, two up. `dy` is a FRACTION of the pitch,
   not a distance - at fixed distances a formation spread over a longer pitch
   leaves the centre, and therefore the whole viewport, empty at kickoff. Only
   the keeper is absolute, because a goal line is a goal line. */
const FORM = [[0,0],[-66,.21],[66,.21],[-48,.44],[48,.44]];
const home = (k, t, L) => {
  const f = FORM[k], dy = k ? f[1] * L : 14;
  return [CX + f[0] * (t ? -1 : 1), t ? dy : L - dy];
};
const STN = ['STR','SPD','TKL'];
/* what each stat does, shown under the bars so the numbers mean something */
/* First time you reach each of these, the game explains itself. Plain English
   costs little once Roadroller has modelled it. */
/* Eight achievements, one bit each, saved as a single number. They are chosen
   to pull in different directions: two are about scoring, one about not
   conceding, one about violence, two about the season, two about the desk -
   so no single good match collects several at once. */
const ACH = ['FIRST GOAL', 'HAT TRICK', 'CLEAN SHEET', 'AMBULANCE',
             'PROMOTED', 'BRUTAL', 'MAXED', 'SPECTRUM'];
/* One card, once: the first kickoff of a new game explains the match. The desk
   explains itself - every row says what it costs and what it does - so it lost
   its card. A second card means a key list again: see git for TKEY. */
/* two cards, one each for a keyboard and a touch screen: tick() picks by
   `touch`, which the boot tap has set by the time the first kickoff comes */
const TUTS = [
  ['HOW TO PLAY',
   'ARROWS MOVE',
   'SPACE TACKLES / SHOOTS',
   'R FIRES A RAIL'],
  ['HOW TO PLAY',
   'DRAG THE LEFT SIDE TO MOVE',
   'TAP THE RIGHT SIDE TO HIT',
   'TAP RAIL FOR A RAINBOW']
];
const AN1 = ['CLOUD','CANDY','MOON','THUNDER','STAR','SUGAR','NIGHT','CRYSTAL','FLUFF','STORM'];
const AN2 = ['KINGDOM','FACTORY','PALACE','FALLS','DOME','GARDEN','HOLLOW','PIT','FIELDS','CIRCUS'];
/* An arena is generated from one integer. Layout is rotationally
   symmetric about the centre spot, so neither end is favoured.     */
function genArena(n) {
  let s2 = (n + 1) * 1103515245 + 12345;
  const r = () => {                                   // xorshift, well mixed from tiny seeds
    s2 ^= s2 << 13; s2 ^= s2 >>> 17; s2 ^= s2 << 5;
    return ((s2 >>> 0) % 100000) / 100000;
  };
  for (let i = 6; i--;) r();
  const hue = (n * 97 + r() * 60) % 360, dark = r() < .35;
  const A = {
    n: AN1[(n * 3 + r() * 10) % 10 | 0] + ' ' + AN2[(n * 7 + r() * 10) % 10 | 0],
    f: hue, fl: dark ? 24 + r() * 10 | 0 : 74 + r() * 10 | 0,
    b: (hue + 90 + r() * 140) % 360 | 0, bp: r() * 2 | 0,
    len: 640 + (r() * 6 | 0) * 48, gw: 46 + (r() * 4 | 0) * 6,
    /* hazards arrive with the divisions: a division 0 pitch is usually clean,
       a division 3 one is electrified, sliding and slippery about a third of
       the time each. div is read live, so this costs no extra r() calls. */
    kind: r() * 4 | 0, zap: r() < .1 + div * .1, move: r() < .1 + div * .1,
    ice: r() < .24 + div * .08,   // ~1 in 4, was 1 in 11 and never seen
    bumps: [], stars: []
  };
  const L = A.len;
  /* f is a fraction across the pitch, so layouts survive a change of PW.
     Every stud gets its twin at (mirrored x, L - y): 180-degree symmetry.  */
  const add = (f, y, rr) => {
    A.bumps.push({ x: FL + PW * f, y, r: rr, l: 0 });
    A.bumps.push({ x: FR - PW * f, y: L - y, r: rr, l: 0 });
  };
  if (A.kind === 0) { add(.24, L * .2, 11); add(.76, L * .2, 11); }         // open
  else if (A.kind === 1) {                                                  // corridor
    add(.27, L * .45, 13); add(.73, L * .45, 13); add(.5, L * .22, 9);
  } else if (A.kind === 2) {                                                // gauntlet
    for (let i = 0; i < 3; i++) { add(.16, L * (.18 + i * .11), 8); add(.84, L * (.18 + i * .11), 8); }
  } else { add(.5, L * .3, 12); add(.26, L * .5, 10); }                     // diamond
  /* and one more pair of studs per division on top of the archetype, so a
     division 3 arena is visibly busier than the one you started on */
  for (let i = 0; i < div; i++) add(.62 - i * .26, L / 2 - 96 - i * 40, 8);
  /* seven stars down each side, one a colour of the rainbow: light all seven
     in your colour and the pitch goes full spectrum (see hitWall) */
  for (let i = 0; i < 7; i++) A.stars.push(Math.round(L * (.1 + i * .133)));
  /* the final division sometimes plays in the sky: no side walls, the ball is
     lost over the edge unless a rail catches it */
  A.sky = div > 2 && r() < .5;
  return A;
}
const N1 = ['GLITTER','MOON','STAR','THUNDER','CANDY','DOOM'];
const N2 = ['HOOF','BEAM','CAKE','HORN','CRUSHER','PONY'];
const nameGen = () => pick(N1) + pick(N2);   // the odd names (SUSAN, DAVE, CUPCAKE III) went for bytes

/* Price of the next point, by current level. Its LENGTH is the cap: unicorns
   are generated at 0-5, training goes on to 8, and every formula in 70_sim.js
   simply keeps scaling - a 7 runs, launches and tackles like a 7. This is the
   late-game money sink; the perks it replaced were a separate mechanic for the
   same job at 224 B. */
const COST = [200, 350, 550, 800, 1200, 1700, 2300, 3000];
