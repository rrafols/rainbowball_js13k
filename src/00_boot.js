// canvas + context; every module below shares this top-level scope
/* ============================================================
   RAINBOWBALL 2: BRUTAL UNICORNS  -  js13k prototype
   Everything you see is generated from code:
   one procedural unicorn shape + hue numbers + tiny overlays.
   No images, no fonts, no external assets.
   ============================================================ */

const CV = document.getElementById('cv'), X = CV.getContext('2d');   // two letters: the packer's decoder owns the single ones
const W = 200, H = 300;                 // virtual resolution (CSS upscales it)
CV.width = W; CV.height = H;
X.imageSmoothingEnabled = false;
const fitCV = () => {
  let k = Math.min((window.innerWidth || W) / W, (window.innerHeight || H) / H);
  if (k >= 2) k |= 0;
  CV.style.width = W * k + 'px'; CV.style.height = H * k + 'px';
};
addEventListener('resize', fitCV); fitCV();
