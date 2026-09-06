/* ---------- 5. game state ----------------------------------- */
let st = 'title', t = 0, phase = 0;
let sc = [0, 0], gls = 0, clock = 90, money = 900, wins = 0, held = 0, sd = 0;
let dw = 0, pup = 0;                                          // wins this division, and whether you went up
let div = 0, mIn = 0, squad = [], sel = 0, mi = 0;
let sweep = 0;
let meter = 0;                                     // rail fuel, filled by playing rough
let ban = '', banT = 0, shake = 0;
let pl = [], ball = {}, fx = [], bumps = [], bows = [], bank = [], ghs = [];   // ghs: prism ghosts
let hero = null;                                   // player-controlled unicorn
let hurt = null, foeBench = [];                    // stretcher run, away substitutes
let scorer = null;                                 // who to put on the goal camera
let dcol = 0;                                      // squad screen: 0 list, 1 actions
let lit = 0;            // has the player touched anything yet - audio needs a gesture
let tipI = -1, tutSeen = 0;                        // tutorial: current card, shown yet
/* The one thing this game keeps between sessions. localStorage throws outright
   in some privacy modes, so every touch of it is wrapped and a failure just
   means the achievements do not persist - never that the game does not run. */
let achG = 0, achT = 0, achI = 0;
try { achG = +localStorage.rb || 0; } catch (e) { }
let hstop = 0, LP = [];   // hit-stop frames; team light pools
let specT = 0, specTeam = 0;        // full spectrum: ticks left, whose
