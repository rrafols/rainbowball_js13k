# RAINBOWBALL 2: BRUTAL UNICORNS

A Speedball 2-inspired future sport played by small, aggressive unicorns. Five a side, a pitch that scrolls both ways, a steel ball, no referee.

## Scoring

A goal is **10**. Putting an opponent in the ambulance is **10**. Seven stars run down each side rail, fourteen in all, and every one you light adds one to both, so a goal can be worth 24. Stars are contested: hit one they lit and it is yours. Own all seven on either side and the pitch goes full spectrum.

## Rainbow rails

Press **R** to fire a curved wall the ball banks off at steep angles and rides at shallow ones. Rails belong to nobody. Ride a whole one with the ball and it leaves the far end as two ghosts, both live.

## Controls

- **Keyboard:** arrows or WASD move, SPACE tackles without the ball and shoots with it, R fires a rail.
- **Touch:** drag the left half to move, tap the right half to hit, tap RAIL.
- Menus take arrows and Enter, or a tap. The speaker icon toggles sound.

## Season

Four divisions, three matches each, win two to go up. Between matches one desk: who is fit, who is carried off (a stretchering costs a match), and what a point of STR, SPD or TKL costs. Training shows: STR gilds the horn, SPD the hooves, TKL bands the flank. The last match is always DEATH RAINBOWS, sometimes on a sky pitch with no walls.

## Under the hood

Everything is generated at runtime, zero assets:

- One `unicorn()` of fifteen rectangles draws every player. A team is one hue; the six kinds and their trimmings are offsets from it. Two compositing rules, a one-pixel rim and a top light, give every pose an outline for free.
- Every arena comes from one integer: name, palette, length, goal width, layout, hazards, night matches. Studs are placed in mirrored pairs so neither end is favoured.
- Two three-voice trackers, patterns as digit strings: pentatonic for the menus, four-bar techno for the match.
- A 3x5 font as octal digits, bloom, a goal camera, a crowd that bobs. 13,302 bytes.
