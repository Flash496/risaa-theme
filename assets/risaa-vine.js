/**
 * RiSaa Vine — Scroll-driven SVG path drawing
 * No GSAP dependency. Pure scroll + IntersectionObserver.
 * Paths draw themselves as the user scrolls down the page.
 */
(function () {
  'use strict';

  // Only run on homepage
  if (!document.body.classList.contains('template-index')) return;

  // ── SVG Markup ───────────────────────────────────────────────────
  // Injected into DOM so it works without a Liquid snippet
  const VINE_SVG = [
    '<div id="risaa-vine-canvas" aria-hidden="true">',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 5000" preserveAspectRatio="xMidYMid slice">',

    '<!-- LEFT MAIN STEM: originates top-left, sweeps down and right -->',
    '<path class="vine-path vine-stem" d="',
    'M -20,0',
    'C 40,120 10,200 60,320',
    'C 110,440 30,520 80,660',
    'C 130,800 60,900 120,1040',
    'C 180,1180 100,1280 160,1420',
    'C 220,1560 140,1660 200,1800',
    'C 260,1940 180,2040 240,2180',
    'C 300,2320 220,2420 280,2560',
    'C 340,2700 260,2800 320,2940',
    'C 380,3080 300,3180 360,3320',
    'C 420,3460 340,3560 400,3700',
    'C 460,3840 380,3940 440,4080',
    'C 500,4220 420,4320 480,4460',
    'C 540,4600 460,4700 520,4840',
    '"/>',

    '<!-- RIGHT MAIN STEM: originates top-right, mirrors left -->',
    '<path class="vine-path vine-stem" d="',
    'M 1460,0',
    'C 1400,140 1430,240 1380,380',
    'C 1330,520 1410,620 1360,760',
    'C 1310,900 1390,1000 1340,1140',
    'C 1290,1280 1370,1380 1320,1520',
    'C 1270,1660 1350,1760 1300,1900',
    'C 1250,2040 1330,2140 1280,2280',
    'C 1230,2420 1310,2520 1260,2660',
    'C 1210,2800 1290,2900 1240,3040',
    'C 1190,3180 1270,3280 1220,3420',
    'C 1170,3560 1250,3660 1200,3800',
    'C 1150,3940 1230,4040 1180,4180',
    'C 1130,4320 1210,4420 1160,4560',
    'C 1110,4700 1190,4800 1140,4940',
    '"/>',

    '<!-- LEFT BRANCHES -->',
    '<path class="vine-path vine-branch" d="M 60,320 C 140,290 220,260 300,240"/>',
    '<path class="vine-path vine-branch" d="M 80,660 C 180,620 280,580 380,550"/>',
    '<path class="vine-path vine-branch" d="M 120,1040 C 230,990 340,950 460,920"/>',
    '<path class="vine-path vine-branch" d="M 160,1420 C 280,1370 400,1330 530,1300"/>',
    '<path class="vine-path vine-branch" d="M 200,1800 C 320,1750 450,1710 580,1680"/>',
    '<path class="vine-path vine-branch" d="M 240,2180 C 360,2130 490,2090 620,2060"/>',
    '<path class="vine-path vine-branch" d="M 280,2560 C 400,2510 530,2470 660,2440"/>',
    '<path class="vine-path vine-branch" d="M 320,2940 C 440,2890 570,2850 700,2820"/>',
    '<path class="vine-path vine-branch" d="M 360,3320 C 480,3270 610,3230 740,3200"/>',
    '<path class="vine-path vine-branch" d="M 400,3700 C 520,3650 650,3610 780,3580"/>',
    '<path class="vine-path vine-branch" d="M 440,4080 C 560,4030 690,3990 820,3960"/>',
    '<path class="vine-path vine-branch" d="M 480,4460 C 600,4410 730,4370 860,4340"/>',

    '<!-- RIGHT BRANCHES -->',
    '<path class="vine-path vine-branch" d="M 1380,380 C 1300,350 1220,320 1140,300"/>',
    '<path class="vine-path vine-branch" d="M 1360,760 C 1260,720 1160,680 1060,650"/>',
    '<path class="vine-path vine-branch" d="M 1340,1140 C 1230,1090 1120,1050 1000,1020"/>',
    '<path class="vine-path vine-branch" d="M 1320,1520 C 1200,1470 1080,1430 950,1400"/>',
    '<path class="vine-path vine-branch" d="M 1300,1900 C 1180,1850 1050,1810 920,1780"/>',
    '<path class="vine-path vine-branch" d="M 1280,2280 C 1160,2230 1030,2190 900,2160"/>',
    '<path class="vine-path vine-branch" d="M 1260,2660 C 1140,2610 1010,2570 880,2540"/>',
    '<path class="vine-path vine-branch" d="M 1240,3040 C 1120,2990 990,2950 860,2920"/>',
    '<path class="vine-path vine-branch" d="M 1220,3420 C 1100,3370 970,3330 840,3300"/>',
    '<path class="vine-path vine-branch" d="M 1200,3800 C 1080,3750 950,3710 820,3680"/>',

    '<!-- TENDRILS — small curly offshoots -->',
    '<path class="vine-path vine-tendril" d="M 300,240 C 320,220 340,200 330,180 C 320,160 300,165 310,185"/>',
    '<path class="vine-path vine-tendril" d="M 380,550 C 400,530 425,510 415,488 C 405,466 382,472 394,492"/>',
    '<path class="vine-path vine-tendril" d="M 460,920 C 485,898 510,875 498,852 C 486,829 462,836 476,858"/>',
    '<path class="vine-path vine-tendril" d="M 530,1300 C 555,1278 582,1254 569,1230 C 556,1206 531,1214 546,1237"/>',
    '<path class="vine-path vine-tendril" d="M 580,1680 C 605,1658 632,1634 619,1610 C 606,1586 581,1594 596,1617"/>',
    '<path class="vine-path vine-tendril" d="M 620,2060 C 645,2038 672,2014 659,1990 C 646,1966 621,1974 636,1997"/>',
    '<path class="vine-path vine-tendril" d="M 1140,300 C 1118,278 1094,254 1107,230 C 1120,206 1145,214 1130,237"/>',
    '<path class="vine-path vine-tendril" d="M 1060,650 C 1038,628 1014,604 1027,580 C 1040,556 1065,564 1050,587"/>',
    '<path class="vine-path vine-tendril" d="M 1000,1020 C 978,998 954,974 967,950 C 980,926 1005,934 990,957"/>',
    '<path class="vine-path vine-tendril" d="M 950,1400 C 928,1378 904,1354 917,1330 C 930,1306 955,1314 940,1337"/>',

    '<!-- LEAVES on left branches -->',
    '<path class="vine-path vine-leaf" d="M 200,255 C 210,235 230,225 250,230 C 240,250 220,260 200,255 Z"/>',
    '<path class="vine-path vine-leaf" d="M 240,248 C 255,228 278,220 298,226 C 285,248 262,256 240,248 Z"/>',
    '<path class="vine-path vine-leaf" d="M 180,565 C 192,543 215,534 236,540 C 224,562 200,570 180,565 Z"/>',
    '<path class="vine-path vine-leaf" d="M 280,558 C 295,536 320,528 342,535 C 328,558 303,566 280,558 Z"/>',
    '<path class="vine-path vine-leaf" d="M 340,935 C 354,912 380,903 403,910 C 388,934 362,942 340,935 Z"/>',
    '<path class="vine-path vine-leaf" d="M 420,928 C 436,904 464,895 488,903 C 472,928 444,936 420,928 Z"/>',
    '<path class="vine-path vine-leaf" d="M 400,1315 C 416,1290 445,1281 470,1289 C 453,1315 424,1323 400,1315 Z"/>',
    '<path class="vine-path vine-leaf" d="M 490,1308 C 508,1282 538,1273 564,1282 C 546,1308 515,1316 490,1308 Z"/>',
    '<path class="vine-path vine-leaf" d="M 460,1695 C 478,1668 509,1659 536,1668 C 517,1695 485,1703 460,1695 Z"/>',
    '<path class="vine-path vine-leaf" d="M 555,1688 C 575,1660 608,1651 636,1661 C 616,1688 582,1696 555,1688 Z"/>',
    '<path class="vine-path vine-leaf" d="M 500,2075 C 520,2046 554,2037 583,2047 C 562,2075 527,2083 500,2075 Z"/>',
    '<path class="vine-path vine-leaf" d="M 600,2068 C 622,2038 658,2029 688,2040 C 666,2068 629,2076 600,2068 Z"/>',

    '<!-- LEAVES on right branches -->',
    '<path class="vine-path vine-leaf" d="M 1240,315 C 1228,293 1205,284 1183,290 C 1196,313 1220,321 1240,315 Z"/>',
    '<path class="vine-path vine-leaf" d="M 1160,308 C 1146,285 1122,276 1099,283 C 1113,307 1138,315 1160,308 Z"/>',
    '<path class="vine-path vine-leaf" d="M 1160,665 C 1146,641 1121,632 1098,639 C 1113,663 1138,671 1160,665 Z"/>',
    '<path class="vine-path vine-leaf" d="M 1060,658 C 1044,633 1018,624 994,632 C 1010,657 1036,665 1060,658 Z"/>',
    '<path class="vine-path vine-leaf" d="M 1100,1035 C 1084,1009 1057,1000 1032,1008 C 1049,1034 1076,1042 1100,1035 Z"/>',
    '<path class="vine-path vine-leaf" d="M 1000,1028 C 982,1001 954,992 928,1001 C 946,1027 974,1035 1000,1028 Z"/>',
    '<path class="vine-path vine-leaf" d="M 1050,1415 C 1032,1388 1003,1379 977,1388 C 996,1415 1025,1423 1050,1415 Z"/>',
    '<path class="vine-path vine-leaf" d="M 948,1408 C 928,1380 898,1371 871,1381 C 891,1408 921,1416 948,1408 Z"/>',

    '<!-- LEAF VEINS (white highlights) -->',
    '<path class="vine-path vine-vein" d="M 225,242 L 235,228"/>',
    '<path class="vine-path vine-vein" d="M 269,233 L 280,218"/>',
    '<path class="vine-path vine-vein" d="M 208,552 L 218,537"/>',
    '<path class="vine-path vine-vein" d="M 311,545 L 323,529"/>',
    '<path class="vine-path vine-vein" d="M 372,921 L 384,905"/>',
    '<path class="vine-path vine-vein" d="M 454,914 L 467,897"/>',
    '<path class="vine-path vine-vein" d="M 435,1301 L 449,1283"/>',
    '<path class="vine-path vine-vein" d="M 527,1294 L 542,1275"/>',
    '<path class="vine-path vine-vein" d="M 1212,301 L 1200,285"/>',
    '<path class="vine-path vine-vein" d="M 1130,294 L 1116,277"/>',
    '<path class="vine-path vine-vein" d="M 1130,651 L 1116,634"/>',
    '<path class="vine-path vine-vein" d="M 1027,644 L 1011,626"/>',

    '<!-- FLOWERS — 5-petal rosettes at branch tips -->',

    '<!-- Flower 1 — left, ~y300 -->',
    '<path class="vine-path vine-petal" d="M 300,240 C 308,228 320,224 328,232 C 320,244 308,248 300,240 Z"/>',
    '<path class="vine-path vine-petal" d="M 300,240 C 312,232 324,234 326,244 C 314,250 302,248 300,240 Z"/>',
    '<path class="vine-path vine-petal" d="M 300,240 C 310,250 308,262 298,264 C 292,254 294,242 300,240 Z"/>',
    '<path class="vine-path vine-petal" d="M 300,240 C 288,250 284,262 292,268 C 300,258 304,246 300,240 Z"/>',
    '<path class="vine-path vine-petal" d="M 300,240 C 288,232 286,220 296,218 C 304,228 306,238 300,240 Z"/>',
    '<path class="vine-path vine-flower-center" d="M 300,240 m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0"/>',

    '<!-- Flower 2 — left, ~y660 -->',
    '<path class="vine-path vine-petal" d="M 380,550 C 388,538 400,534 408,542 C 400,554 388,558 380,550 Z"/>',
    '<path class="vine-path vine-petal" d="M 380,550 C 392,542 404,544 406,554 C 394,560 382,558 380,550 Z"/>',
    '<path class="vine-path vine-petal" d="M 380,550 C 390,560 388,572 378,574 C 372,564 374,552 380,550 Z"/>',
    '<path class="vine-path vine-petal" d="M 380,550 C 368,560 364,572 372,578 C 380,568 384,556 380,550 Z"/>',
    '<path class="vine-path vine-petal" d="M 380,550 C 368,542 366,530 376,528 C 384,538 386,548 380,550 Z"/>',
    '<path class="vine-path vine-flower-center" d="M 380,550 m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0"/>',

    '<!-- Flower 3 — left, ~y1040 -->',
    '<path class="vine-path vine-petal" d="M 460,920 C 468,908 480,904 488,912 C 480,924 468,928 460,920 Z"/>',
    '<path class="vine-path vine-petal" d="M 460,920 C 472,912 484,914 486,924 C 474,930 462,928 460,920 Z"/>',
    '<path class="vine-path vine-petal" d="M 460,920 C 470,930 468,942 458,944 C 452,934 454,922 460,920 Z"/>',
    '<path class="vine-path vine-petal" d="M 460,920 C 448,930 444,942 452,948 C 460,938 464,926 460,920 Z"/>',
    '<path class="vine-path vine-petal" d="M 460,920 C 448,912 446,900 456,898 C 464,908 466,918 460,920 Z"/>',
    '<path class="vine-path vine-flower-center" d="M 460,920 m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0"/>',

    '<!-- Flower 4 — right, ~y380 -->',
    '<path class="vine-path vine-petal" d="M 1140,300 C 1132,288 1120,284 1112,292 C 1120,304 1132,308 1140,300 Z"/>',
    '<path class="vine-path vine-petal" d="M 1140,300 C 1128,292 1116,294 1114,304 C 1126,310 1138,308 1140,300 Z"/>',
    '<path class="vine-path vine-petal" d="M 1140,300 C 1130,310 1132,322 1142,324 C 1148,314 1146,302 1140,300 Z"/>',
    '<path class="vine-path vine-petal" d="M 1140,300 C 1152,310 1156,322 1148,328 C 1140,318 1136,306 1140,300 Z"/>',
    '<path class="vine-path vine-petal" d="M 1140,300 C 1152,292 1154,280 1144,278 C 1136,288 1134,298 1140,300 Z"/>',
    '<path class="vine-path vine-flower-center" d="M 1140,300 m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0"/>',

    '<!-- Flower 5 — right, ~y760 -->',
    '<path class="vine-path vine-petal" d="M 1060,650 C 1052,638 1040,634 1032,642 C 1040,654 1052,658 1060,650 Z"/>',
    '<path class="vine-path vine-petal" d="M 1060,650 C 1048,642 1036,644 1034,654 C 1046,660 1058,658 1060,650 Z"/>',
    '<path class="vine-path vine-petal" d="M 1060,650 C 1050,660 1052,672 1062,674 C 1068,664 1066,652 1060,650 Z"/>',
    '<path class="vine-path vine-petal" d="M 1060,650 C 1072,660 1076,672 1068,678 C 1060,668 1056,656 1060,650 Z"/>',
    '<path class="vine-path vine-petal" d="M 1060,650 C 1072,642 1074,630 1064,628 C 1056,638 1054,648 1060,650 Z"/>',
    '<path class="vine-path vine-flower-center" d="M 1060,650 m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0"/>',

    '<!-- Flower 6 — left, ~y1800 -->',
    '<path class="vine-path vine-petal" d="M 580,1680 C 588,1668 600,1664 608,1672 C 600,1684 588,1688 580,1680 Z"/>',
    '<path class="vine-path vine-petal" d="M 580,1680 C 592,1672 604,1674 606,1684 C 594,1690 582,1688 580,1680 Z"/>',
    '<path class="vine-path vine-petal" d="M 580,1680 C 590,1690 588,1702 578,1704 C 572,1694 574,1682 580,1680 Z"/>',
    '<path class="vine-path vine-petal" d="M 580,1680 C 568,1690 564,1702 572,1708 C 580,1698 584,1686 580,1680 Z"/>',
    '<path class="vine-path vine-petal" d="M 580,1680 C 568,1672 566,1660 576,1658 C 584,1668 586,1678 580,1680 Z"/>',
    '<path class="vine-path vine-flower-center" d="M 580,1680 m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0"/>',

    '<!-- Flower 7 — right, ~y1900 -->',
    '<path class="vine-path vine-petal" d="M 920,1780 C 912,1768 900,1764 892,1772 C 900,1784 912,1788 920,1780 Z"/>',
    '<path class="vine-path vine-petal" d="M 920,1780 C 908,1772 896,1774 894,1784 C 906,1790 918,1788 920,1780 Z"/>',
    '<path class="vine-path vine-petal" d="M 920,1780 C 910,1790 912,1802 922,1804 C 928,1794 926,1782 920,1780 Z"/>',
    '<path class="vine-path vine-petal" d="M 920,1780 C 932,1790 936,1802 928,1808 C 920,1798 916,1786 920,1780 Z"/>',
    '<path class="vine-path vine-petal" d="M 920,1780 C 932,1772 934,1760 924,1758 C 916,1768 914,1778 920,1780 Z"/>',
    '<path class="vine-path vine-flower-center" d="M 920,1780 m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0"/>',

    '<!-- Flower 8 — left, ~y2560 -->',
    '<path class="vine-path vine-petal" d="M 660,2440 C 668,2428 680,2424 688,2432 C 680,2444 668,2448 660,2440 Z"/>',
    '<path class="vine-path vine-petal" d="M 660,2440 C 672,2432 684,2434 686,2444 C 674,2450 662,2448 660,2440 Z"/>',
    '<path class="vine-path vine-petal" d="M 660,2440 C 670,2450 668,2462 658,2464 C 652,2454 654,2442 660,2440 Z"/>',
    '<path class="vine-path vine-petal" d="M 660,2440 C 648,2450 644,2462 652,2468 C 660,2458 664,2446 660,2440 Z"/>',
    '<path class="vine-path vine-petal" d="M 660,2440 C 648,2432 646,2420 656,2418 C 664,2428 666,2438 660,2440 Z"/>',
    '<path class="vine-path vine-flower-center" d="M 660,2440 m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0"/>',

    '</svg>',
    '</div>',
  ].join('\n');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Group definitions ─────────────────────────────────────────────
  // Each group has a scroll range [startFraction, endFraction] of total
  // page height at which it fully draws (0 = top, 1 = bottom).
  // Elements within a group stagger slightly.
  const GROUPS = [
    { selector: '.vine-stem', start: 0.0, end: 0.55 },
    { selector: '.vine-branch', start: 0.1, end: 0.7 },
    { selector: '.vine-tendril', start: 0.2, end: 0.75 },
    { selector: '.vine-leaf', start: 0.25, end: 0.8 },
    { selector: '.vine-vein', start: 0.3, end: 0.82 },
    { selector: '.vine-petal', start: 0.4, end: 0.9 },
    { selector: '.vine-flower-center', start: 0.45, end: 0.92 },
  ];

  // ── Inject SVG into DOM ───────────────────────────────────────────
  function injectVine() {
    if (document.getElementById('risaa-vine-canvas')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = VINE_SVG;
    const canvas = wrapper.firstElementChild;
    document.body.insertBefore(canvas, document.body.firstChild);
  }

  // ── Initialise path lengths ───────────────────────────────────────
  function initPaths() {
    injectVine();
    const canvas = document.getElementById('risaa-vine-canvas');
    if (!canvas) return;

    const allPaths = canvas.querySelectorAll('.vine-path');

    if (prefersReduced) {
      allPaths.forEach((p) => {
        p.style.strokeDasharray = 'none';
        p.style.strokeDashoffset = '0';
        p.style.opacity = '0.13';
      });
      return;
    }

    allPaths.forEach((p) => {
      try {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len; // fully hidden
        p.classList.add('vine-ready');
      } catch (e) {
        // Non-path SVG elements (circles etc.) — just fade in
        p.style.opacity = '0';
      }
    });

    bindScroll();
  }

  // ── Scroll handler ────────────────────────────────────────────────
  function bindScroll() {
    const canvas = document.getElementById('risaa-vine-canvas');
    if (!canvas) return;

    function onScroll() {
      const scrollTop = window.scrollY || window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

      GROUPS.forEach((group, gi) => {
        const els = canvas.querySelectorAll(group.selector);
        const count = els.length;

        els.forEach((el, i) => {
          // Stagger each element within the group slightly
          const stagger = count > 1 ? (i / (count - 1)) * 0.06 : 0;
          const gStart = group.start + stagger;
          const gEnd = group.end + stagger * 0.5;

          const localProgress = Math.min(1, Math.max(0, (progress - gStart) / (gEnd - gStart)));

          try {
            const len = parseFloat(el.style.strokeDasharray);
            if (!isNaN(len)) {
              el.style.strokeDashoffset = len * (1 - localProgress);
            }
          } catch (e) {
            // circle / ellipse fallback
            el.style.opacity = localProgress * 0.15;
          }
        });
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  // ── Boot ──────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPaths);
  } else {
    // rAF so SVG is painted and getTotalLength() works
    requestAnimationFrame(() => requestAnimationFrame(initPaths));
  }

  // Shopify theme editor
  if (window.Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', () =>
      requestAnimationFrame(() => requestAnimationFrame(initPaths)),
    );
  }
})();
