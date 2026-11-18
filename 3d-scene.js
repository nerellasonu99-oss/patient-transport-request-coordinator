/**
 * CareRoute 3D — Hospital city scene.
 * Fixed: proper roads with dashes, 3D hospital with instanced windows.
 * Performance: shared geometries, no shadows, capped pixel ratio.
 */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var host = document.getElementById("scene-3d");
  if (!host) return;

  /* ── Setup tilt + reveals once DOM ready ───────────────────────────────── */
  function onReady(fn) {
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn) : fn();
  }
  onReady(function () {
    if (!window.matchMedia("(pointer: coarse)").matches && window.VanillaTilt) {
      var o = { max: 6, speed: 700, glare: true, "max-glare": 0.07, scale: 1.012 };
      VanillaTilt.init(document.querySelectorAll(".summary-card, .primary-button"), o);
      var list = document.getElementById("schedule");
      if (list) {
        function tilt() {
          list.querySelectorAll(".request-card").forEach(function (c) {
            if (!c.vanillaTilt) VanillaTilt.init(c, { max:3, speed:700, glare:true, "max-glare":0.04 });
          });
        }
        tilt();
        new MutationObserver(tilt).observe(list, { childList: true });
      }
    }
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.from(".summary-card", { opacity:0, y:28, filter:"blur(6px)", duration:0.85, stagger:0.09, ease:"power3.out",
        scrollTrigger: { trigger:".summary-grid", start:"top 88%" } });
      gsap.from(".panel", { opacity:0, y:20, filter:"blur(5px)", duration:0.8, stagger:0.1, ease:"power3.out",
        scrollTrigger: { trigger:".workspace-grid", start:"top 88%" } });
    }
  });

  function waitForThree() {
    if (window.THREE) { buildScene(); return; }
    var n = 0, t = setInterval(function () {
      if (window.THREE) { clearInterval(t); buildScene(); }
      else if (++n > 80) clearInterval(t);
    }, 80);
  }
  waitForThree();

  /* ═══════════════════════════════════════════════════════════════════════
     SCENE
  ═══════════════════════════════════════════════════════════════════════ */
  function buildScene() {
    var THREE = window.THREE;
    var W = window.innerWidth, H = window.innerHeight;

    /* Renderer */
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.setClearColor(0x040c18, 1);
    host.appendChild(renderer.domElement);

    /* Scene + fog */
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040c18, 0.048);

    /* Camera */
    var camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 80);
    camera.position.set(0, 7, 16);
    camera.lookAt(0, 0.5, 0);

    /* ═══ LIGHTS ════════════════════════════════════════════════════════ */
    scene.add(new THREE.HemisphereLight(0x2a4a68, 0x080e1a, 1.0));
    var key = new THREE.DirectionalLight(0xfff3e8, 1.7);
    key.position.set(-6, 12, 7);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x2855ff, 0.7);
    rim.position.set(2, 3, -12);
    scene.add(rim);
    var fill = new THREE.DirectionalLight(0xdce8ff, 0.5);
    fill.position.set(10, 5, 4);
    scene.add(fill);

    var pR = new THREE.PointLight(0xff2244, 0, 20);
    var pB = new THREE.PointLight(0x1a55ff, 0, 20);
    pR.position.set(-2, 4.5, 2.5);
    pB.position.set(3, 3.5, 2.5);
    scene.add(pR, pB);
    var hospGlow = new THREE.PointLight(0x88ccff, 0.85, 14);
    hospGlow.position.set(0, 5, -4.5);
    scene.add(hospGlow);

    /* ═══ MATERIAL HELPERS ══════════════════════════════════════════════ */
    function mat(col, opts) {
      return new THREE.MeshStandardMaterial(Object.assign({ color: col }, opts || {}));
    }
    function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }

    /* Shared mats */
    var mGround  = mat(0x0a1220, { roughness:1 });
    var mRoad    = mat(0x111820, { roughness:0.95 });
    var mRoadLine= mat(0xc09820, { roughness:0.75, emissive:0x604800, emissiveIntensity:0.3 });

    var mBldg    = mat(0x1a2c40, { roughness:0.7, metalness:0.2 });
    var mBldgDk  = mat(0x121e2e, { roughness:0.75, metalness:0.15 });

    var mHWall   = mat(0xc8d8e6, { roughness:0.42, metalness:0.1 });
    var mHConcrete = mat(0xa8b8c4,{ roughness:0.65, metalness:0.05 });
    var mHAccent = mat(0xc01e30, { roughness:0.4,  emissive:0x580010, emissiveIntensity:0.45 });
    var mChrome  = mat(0xb0c0cc, { metalness:0.9,  roughness:0.14 });
    var mCross   = mat(0xff2d3e, { roughness:0.3,  emissive:0xcc0012, emissiveIntensity:0.7,
      polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 });
    var mGlass   = mat(0x90b8d8, { roughness:0.08, transparent:true, opacity:0.65 });

    var mAmbBody = mat(0xedf2f7, { metalness:0.07, roughness:0.3 });
    var mAmbRed  = mat(0xd12030, { roughness:0.42, emissive:0x480010, emissiveIntensity:0.25 });
    var mTyre    = mat(0x0c1018, { roughness:0.92 });
    var mRim     = mat(0xb0bcc8, { metalness:0.86, roughness:0.18 });
    var mDark    = mat(0x0e1522, { metalness:0.45, roughness:0.5 });

    var mBR = mat(0xff2244, { emissive:0xff0022, emissiveIntensity:0.7, roughness:0.1 });
    var mBB = mat(0x1a55ff, { emissive:0x1133ff, emissiveIntensity:0.7, roughness:0.1 });

    /* Window colors */
    var mWinBlue = mat(0x5aadff, { emissive:0x1a4a90, emissiveIntensity:1.5, roughness:0.08 });
    var mWinWarm = mat(0xffdf80, { emissive:0x907030, emissiveIntensity:1.2, roughness:0.08 });
    var mWinDim  = mat(0x1a2c38, { emissive:0x060e14, emissiveIntensity:0.3, roughness:0.1 });

    /* ═══ GROUND ════════════════════════════════════════════════════════ */
    var gnd = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), mGround);
    gnd.rotation.x = -Math.PI / 2;
    gnd.position.y = 0;
    scene.add(gnd);

    /* ═══ ROADS — simple PlaneGeometry, shared dash geometry ═══════════ */
    var dashGeo = new THREE.PlaneGeometry(0.09, 0.5);  // shared by all dashes

    function makeRoad(isHorizontal, centerX, centerZ, length) {
      /* Road surface */
      var roadGeo = isHorizontal
        ? new THREE.PlaneGeometry(length, 2.5)
        : new THREE.PlaneGeometry(2.5, length);
      var roadMesh = new THREE.Mesh(roadGeo, mRoad);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(centerX, 0.01, centerZ);
      scene.add(roadMesh);

      /* Kerb edges */
      var kerbW = isHorizontal ? length : 0.12;
      var kerbD = isHorizontal ? 0.12   : length;
      [[1.2], [-1.2]].forEach(function (off) {
        var kerb = new THREE.Mesh(
          new THREE.BoxGeometry(kerbW, 0.08, kerbD),
          mat(0x1e2a38, { roughness:0.9 })
        );
        kerb.position.set(
          centerX + (isHorizontal ? 0 : off[0]),
          0.04,
          centerZ + (isHorizontal ? off[0] : 0)
        );
        scene.add(kerb);
      });

      /* Centre-line dashes — shared geometry, one mesh each */
      var dashCount = Math.floor(length / 2.0);
      for (var d = 0; d < dashCount; d++) {
        var t = -length / 2 + (d + 0.5) * (length / dashCount);
        var dm = new THREE.Mesh(dashGeo, mRoadLine);
        dm.rotation.x = -Math.PI / 2;
        if (!isHorizontal) dm.rotation.z = Math.PI / 2;
        dm.position.set(
          centerX + (isHorizontal ? t : 0),
          0.015,
          centerZ + (isHorizontal ? 0 : t)
        );
        scene.add(dm);
      }
    }

    makeRoad(true,   0,  2.5, 70);   /* main horizontal */
    makeRoad(false, -6,  0,   70);   /* left vertical   */
    makeRoad(false,  6,  0,   70);   /* right vertical  */
    makeRoad(true,  -3, -4.5, 12);   /* hospital access */

    /* Pavement beside hospital */
    var pave = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5),
      mat(0x141e28, { roughness:0.95 }));
    pave.rotation.x = -Math.PI / 2;
    pave.position.set(0, 0.005, -6.5);
    scene.add(pave);

    /* ═══ CITY BUILDINGS — proper 3D boxes ══════════════════════════════ */
    function makeBuilding(w, h, d, x, z) {
      var grp = new THREE.Group();

      /* Body */
      var body = box(w, h, d, mBldg);
      body.position.y = h / 2;
      grp.add(body);

      /* Roof darker slab */
      var roof = box(w + 0.1, 0.18, d + 0.1, mBldgDk);
      roof.position.y = h + 0.09;
      grp.add(roof);

      /* Instanced windows — ONE draw call per building */
      var cols = Math.max(2, Math.round(w / 0.65));
      var rows = Math.max(2, Math.round(h / 1.1));
      var wCount = cols * rows;
      var wMat = Math.random() > 0.5 ? mWinBlue.clone() : mWinWarm.clone();
      var wGeo = new THREE.BoxGeometry(0.28, 0.32, 0.055);
      var iMesh = new THREE.InstancedMesh(wGeo, wMat, wCount);
      var dummy = new THREE.Object3D();
      var idx = 0;
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          var wx = -w/2 + 0.4 + col * ((w - 0.5) / Math.max(1, cols - 1));
          var wy = 0.5 + row * (h / rows);
          dummy.position.set(wx, wy, d/2 + 0.03);
          dummy.updateMatrix();
          /* Randomly dim some windows */
          if (Math.random() < 0.25) {
            dummy.scale.set(0, 0, 0); /* hide = dim window */
            dummy.updateMatrix();
            dummy.scale.set(1, 1, 1);
          }
          iMesh.setMatrixAt(idx++, dummy.matrix);
        }
      }
      iMesh.instanceMatrix.needsUpdate = true;
      grp.add(iMesh);

      /* Horizontal floor bands */
      var bands = Math.floor(h / 2.5);
      for (var b = 0; b < bands; b++) {
        var band = box(w + 0.06, 0.07, d + 0.06, mBldgDk);
        band.position.y = 1.2 + b * 2.5;
        grp.add(band);
      }

      grp.position.set(x, 0, z);
      scene.add(grp);
    }

    makeBuilding(2.0, 5.5, 1.8, -10, -4.5);
    makeBuilding(1.6, 3.8, 1.5, -12, -1.5);
    makeBuilding(2.4, 7.2, 2.0,  -9,  -9);
    makeBuilding(2.8, 9.4, 2.2, -14,  -6);
    makeBuilding(2.0, 5.0, 1.8,  10,  -4);
    makeBuilding(2.4, 6.6, 2.0,  12,  -7);
    makeBuilding(2.6, 8.4, 2.2,  15,  -6);
    makeBuilding(1.4, 2.8, 1.4,  10,  -1);

    /* ═══ HOSPITAL — proper 3D facade with depth ════════════════════════ */
    var hosp = new THREE.Group();
    scene.add(hosp);
    hosp.position.set(0, 0, -7.5);

    /* — Main tower — */
    var tower = box(5.8, 8.6, 3.8, mHWall);
    tower.position.y = 4.3;
    hosp.add(tower);

    /* Facade vertical pilasters — push clearly past tower face (1.9) */
    [-2.3, -1.15, 0, 1.15, 2.3].forEach(function (px) {
      var pil = box(0.22, 8.6, 0.22, mHConcrete);
      pil.position.set(px, 4.3, 2.08);  /* was 1.92 — well clear of 1.9 face */
      hosp.add(pil);
    });

    /* Facade horizontal spandrels (floor bands) */
    for (var f = 0; f < 7; f++) {
      var span = box(5.84, 0.12, 0.16, mHConcrete);
      span.position.set(0, 0.85 + f * 1.1, 2.06);  /* was 1.93 */
      hosp.add(span);
    }

    /* — Wings — */
    var wingL = box(2.6, 4.2, 2.6, mHWall);
    wingL.position.set(-4.2, 2.1, 0.3);
    hosp.add(wingL);
    var wingR = wingL.clone(); wingR.position.x = 4.2;
    hosp.add(wingR);

    /* Wing pilasters */
    [[-4.2, 1.35], [4.2, 1.35]].forEach(function (p) {
      [-0.8, 0, 0.8].forEach(function (px) {
        var wp = box(0.16, 4.2, 0.16, mHConcrete);
        wp.position.set(p[0] + px, p[1], 1.72);  /* was 1.6 — wing front face is 1.3 */
        hosp.add(wp);
      });
    });

    /* — Podium base — */
    var podium = box(10.5, 1.2, 4.2, mHWall);
    podium.position.y = 0.6;
    hosp.add(podium);
    var podiumStep = box(11, 0.22, 4.6, mHConcrete);
    podiumStep.position.y = 0.11;
    hosp.add(podiumStep);

    /* — Roof — */
    var roofBand = box(5.9, 0.28, 3.9, mHAccent);
    roofBand.position.y = 8.74;
    hosp.add(roofBand);
    var roofSlab = box(5.95, 0.14, 3.95, mHConcrete);
    roofSlab.position.y = 8.44;
    hosp.add(roofSlab);

    /* Wing roofs */
    [-4.2, 4.2].forEach(function (px) {
      var wr = box(2.65, 0.2, 2.65, mHAccent);
      wr.position.set(px, 4.2, 0.3);
      hosp.add(wr);
    });

    /* — Helipad — */
    var helipad = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.08, 36), mHAccent);
    helipad.position.set(0, 8.9, 0);
    hosp.add(helipad);
    var heliMark = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95),
      mat(0xffffff, { roughness:0.5 }));
    heliMark.rotation.x = -Math.PI / 2;
    heliMark.position.set(0, 8.95, 0);
    hosp.add(heliMark);

    /* — Entrance canopy — */
    var canopy = box(3.2, 0.2, 2.0, mHAccent);
    canopy.position.set(0, 2.5, 2.2);
    hosp.add(canopy);
    /* Canopy underside detail */
    var cUnder = box(3.0, 0.08, 1.8, mHConcrete);
    cUnder.position.set(0, 2.4, 2.2);
    hosp.add(cUnder);
    [[-1.4, 2.4], [1.4, 2.4]].forEach(function (p) {
      var post = box(0.14, 2.4, 0.14, mChrome);
      post.position.set(p[0], 1.2, p[1]);
      hosp.add(post);
    });

    /* — Medical cross sign (3D, recessed) — */
    /* Backing plate — pushed well past tower front face (z=1.9) */
    var crossBack = box(1.4, 1.4, 0.10, mHConcrete);
    crossBack.position.set(0, 5.75, 2.12);
    hosp.add(crossBack);
    var crossH = box(1.1, 0.28, 0.12, mCross);
    crossH.position.set(0, 5.75, 2.24);
    hosp.add(crossH);
    var crossV = box(0.28, 1.1, 0.12, mCross);
    crossV.position.set(0, 5.75, 2.24);
    hosp.add(crossV);

    /* — Hospital WINDOWS — instanced, one draw call ─ */
    function hospWindows(cols, rows, w, startX, startY, z, colorMat) {
      var count = cols * rows;
      var iw = new THREE.InstancedMesh(
        new THREE.BoxGeometry(w, w * 1.1, 0.07), colorMat, count
      );
      var dm = new THREE.Object3D();
      var idx = 0;
      var spacingX = (cols > 1) ? (5.4 / (cols - 1)) : 0;
      var spacingY = 1.1;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          dm.position.set(startX + c * spacingX, startY + r * spacingY, z);
          dm.rotation.set(0, 0, 0);
          dm.scale.set(1, 1, 1);
          dm.updateMatrix();
          iw.setMatrixAt(idx++, dm.matrix);
        }
      }
      iw.instanceMatrix.needsUpdate = true;
      return iw;
    }

    /* Tower windows — 5 cols × 7 rows = 35, ONE draw call */
    var twBlue = hospWindows(5, 7, 0.5, -2.7, 0.75, 2.05, mWinBlue.clone());
    tower.add(twBlue);

    /* Randomly replace some with warm/dim */
    var twWarm = hospWindows(5, 3, 0.5, -2.7, 0.75, 2.07, mWinWarm.clone());
    tower.add(twWarm);

    /* Wing windows */
    function wingWins(wing, side) {
      var iw = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.42, 0.46, 0.065),
        Math.random() > 0.5 ? mWinBlue.clone() : mWinWarm.clone(),
        6
      );
      var dm = new THREE.Object3D();
      var idx = 0;
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 2; col++) {
          dm.position.set(-0.52 + col * 1.04, 0.65 + row * 1.1, 1.48);
          dm.updateMatrix();
          iw.setMatrixAt(idx++, dm.matrix);
        }
      }
      iw.instanceMatrix.needsUpdate = true;
      wing.add(iw);
    }
    wingWins(wingL); wingWins(wingR);

    /* — Roof spinning beacon — */
    var beaconGrp = new THREE.Group();
    beaconGrp.position.set(0, 9.1, 0);
    hosp.add(beaconGrp);
    var bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.7, 8), mChrome);
    bPost.position.y = 0.35;
    beaconGrp.add(bPost);
    var hospBR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), mBR);
    var hospBB = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), mBB);
    hospBR.position.set(0.28, 0.72, 0);
    hospBB.position.set(-0.28, 0.72, 0);
    beaconGrp.add(hospBR, hospBB);

    /* — Floodlights at base of hospital — */
    var floodL = new THREE.PointLight(0xfff4e0, 0.6, 7);
    floodL.position.set(-2.5, 1.5, -5.4);
    scene.add(floodL);
    var floodR = new THREE.PointLight(0xfff4e0, 0.6, 7);
    floodR.position.set(2.5, 1.5, -5.4);
    scene.add(floodR);

    /* ═══ AMBULANCE FACTORY ═════════════════════════════════════════════ */
    function makeAmb() {
      var g = new THREE.Group();

      var body = box(2.1, 0.8, 1.0, mAmbBody);
      body.position.set(-0.14, 0.58, 0); g.add(body);

      var cab = box(0.75, 0.68, 0.96, mAmbBody);
      cab.position.set(1.17, 0.52, 0); g.add(cab);

      /* Windshield */
      var ws = box(0.065, 0.36, 0.72, mGlass);
      ws.position.set(1.55, 0.6, 0); g.add(ws);

      /* Side windows */
      var swL = box(0.38, 0.24, 0.05, mGlass);
      swL.position.set(1.18, 0.62,  0.49); g.add(swL);
      var swR = swL.clone(); swR.position.z = -0.49; g.add(swR);

      /* Red stripe */
      var stripe = box(1.9, 0.09, 0.03, mAmbRed);
      stripe.position.set(-0.1, 0.52,  0.505); g.add(stripe);
      var stripeB = stripe.clone(); stripeB.position.z = -0.505; g.add(stripeB);

      /* Cross */
      var cH = box(0.32, 0.075, 0.03, mCross);
      var cV = box(0.075, 0.32, 0.03, mCross);
      cH.position.set(-0.46, 0.76, 0.52); g.add(cH);
      cV.position.set(-0.46, 0.76, 0.52); g.add(cV);

      /* Light bar */
      var lb = box(0.68, 0.075, 0.2, mDark);
      lb.position.set(-0.1, 1.0, 0); g.add(lb);
      var lbBase = box(0.7, 0.03, 0.22, mChrome);
      lbBase.position.set(-0.1, 0.96, 0); g.add(lbBase);

      /* Beacons */
      var ambBR = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), mBR.clone());
      var ambBB = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8), mBB.clone());
      ambBR.position.set(-0.26, 1.07, 0); g.add(ambBR);
      ambBB.position.set( 0.1,  1.07, 0); g.add(ambBB);
      g.userData.bR = ambBR; g.userData.bB = ambBB;

      /* Bumper */
      var bumper = box(0.065, 0.22, 0.88, mChrome);
      bumper.position.set(1.6, 0.42, 0); g.add(bumper);

      /* Headlights */
      var hlM = mat(0xfff8e0, { emissive:0xfff0d0, emissiveIntensity:1.5, roughness:0.05 });
      [[0.36], [-0.36]].forEach(function (z) {
        var hl = box(0.055, 0.1, 0.18, hlM);
        hl.position.set(1.62, 0.56, z[0]); g.add(hl);
      });

      /* Rear lights */
      var rlM = mat(0xff1122, { emissive:0xcc0010, emissiveIntensity:0.9, roughness:0.1 });
      [[0.4], [-0.4]].forEach(function (z) {
        var rl = box(0.05, 0.12, 0.17, rlM);
        rl.position.set(-1.19, 0.6, z[0]); g.add(rl);
      });

      /* Wheels — shared geometries */
      var tyreGeo = new THREE.CylinderGeometry(0.185, 0.185, 0.12, 16);
      var rimGeo  = new THREE.CylinderGeometry(0.12,  0.12,  0.13, 14);
      [[0.72, 0.185, 0.47], [0.72, 0.185, -0.47],
       [-0.72, 0.185, 0.47], [-0.72, 0.185, -0.47]].forEach(function (p) {
        var wg = new THREE.Group();
        wg.add(new THREE.Mesh(tyreGeo, mTyre));
        wg.add(new THREE.Mesh(rimGeo,  mRim));
        wg.rotation.x = Math.PI / 2;
        wg.position.set(p[0], p[1], p[2]);
        g.add(wg);
      });

      /* Chassis */
      var ch = box(2.95, 0.09, 0.9, mDark);
      ch.position.set(0.08, 0.1, 0); g.add(ch);

      return g;
    }

    /* ═══ PLACE AMBULANCES ══════════════════════════════════════════════ */
    var HALF = 15;
    var ambList = [];
    function addAmb(scale, speed, t0, route, oz, ox, dir, lane) {
      var a = makeAmb();
      a.scale.setScalar(scale);
      scene.add(a);
      ambList.push({ mesh:a, speed:speed, t:t0, route:route,
        oz:oz||0, ox:ox||0, dir:dir, lane:lane||0 });
    }
    addAmb(0.78, 0.0024, 0.0,  "h",  2.5, 0,  1,  0.52);
    addAmb(0.64, 0.0017, 0.52, "h",  2.5, 0, -1, -0.52);
    addAmb(0.68, 0.0021, 0.28, "v",  0,  -6,  1,  0.0);

    /* ═══ EKG LINE ══════════════════════════════════════════════════════ */
    var ekgPat = [0,0,0,0.14,-0.09,1.0,-0.36,0.12,0,0];
    var ekgPts = [];
    var ekgSpan = 8, ekgCyc = 3, ekgTotal = ekgPat.length * ekgCyc;
    for (var c = 0; c < ekgCyc; c++) {
      ekgPat.forEach(function (h, i) {
        ekgPts.push(new THREE.Vector3(
          -ekgSpan/2 + ((c*ekgPat.length+i)/ekgTotal)*ekgSpan, h*0.52, 0));
      });
    }
    var ekg = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ekgPts),
      new THREE.LineBasicMaterial({ color:0xff3355, transparent:true, opacity:0.6 })
    );
    ekg.position.set(0, -1.5, -1.0);
    scene.add(ekg);

    /* ═══ PARTICLES — 80 pts, every-2nd-frame update ════════════════════ */
    var PN = 80;
    var pPos = new Float32Array(PN * 3);
    for (var i = 0; i < PN; i++) {
      pPos[i*3]   = (Math.random()-0.5)*24;
      pPos[i*3+1] = Math.random()*9 - 0.5;
      pPos[i*3+2] = (Math.random()-0.5)*14 - 2;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
      color:0x80b8d0, size:0.03, transparent:true, opacity:0.28,
      sizeAttenuation:true, depthWrite:false
    })));

    /* ═══ MOUSE / SCROLL ════════════════════════════════════════════════ */
    var mouse = {x:0,y:0}, mT = {x:0,y:0};
    window.addEventListener("mousemove", function (e) {
      mT.x = (e.clientX/window.innerWidth  - 0.5)*2;
      mT.y = (e.clientY/window.innerHeight - 0.5)*2;
    }, { passive:true });

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(camera.position, { z:10.5, y:5.0, ease:"none",
        scrollTrigger: { trigger:document.body, start:"top top", end:"bottom bottom", scrub:1.6 } });
    }

    window.addEventListener("resize", function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    /* ═══ RENDER LOOP ═══════════════════════════════════════════════════ */
    var t0 = performance.now();
    var paused = document.hidden;
    var frame = 0;
    document.addEventListener("visibilitychange", function () {
      paused = document.hidden; if (!paused) loop();
    });

    function loop() {
      if (paused) return;
      requestAnimationFrame(loop);
      frame++;
      var elapsed = (performance.now()-t0)*0.001;

      mouse.x += (mT.x - mouse.x)*0.035;
      mouse.y += (mT.y - mouse.y)*0.035;

      /* Beacon strobe */
      var rP = Math.pow(Math.max(0, Math.sin(elapsed*5.5)), 2.5);
      var bP = Math.pow(Math.max(0, Math.sin(elapsed*5.5+Math.PI)), 2.5);
      mBR.emissiveIntensity = 0.5 + rP*4.0;
      mBB.emissiveIntensity = 0.5 + bP*4.0;
      pR.intensity = rP*3.0; pB.intensity = bP*2.6;
      beaconGrp.rotation.y = elapsed*1.5;

      /* Ambulances */
      ambList.forEach(function (d) {
        d.t = (d.t + d.speed) % 1;
        var pos = -HALF + d.t*HALF*2;
        if (d.route === "h") {
          d.mesh.position.set(pos*d.dir, 0.16, d.oz + d.lane*d.dir);
          d.mesh.rotation.y = d.dir > 0 ? 0 : Math.PI;
        } else {
          d.mesh.position.set(d.ox + d.lane, 0.16, pos*d.dir);
          d.mesh.rotation.y = d.dir > 0 ? Math.PI/2 : -Math.PI/2;
        }
        d.mesh.position.y += Math.sin(elapsed*7 + d.t*20)*0.007;
        if (d.mesh.userData.bR) {
          d.mesh.userData.bR.material.emissiveIntensity = 0.4 + rP*3.2;
          d.mesh.userData.bB.material.emissiveIntensity = 0.4 + bP*3.2;
        }
      });

      /* EKG */
      ekg.position.x = ((elapsed*0.55) % 2.6) - 1.3;

      /* Hospital float */
      hosp.position.y = Math.sin(elapsed*0.4)*0.04;

      /* Particles every 2nd frame */
      if (frame % 2 === 0) {
        for (var pi = 0; pi < PN; pi++) {
          pPos[pi*3+1] += 0.0006; pPos[pi*3] += 0.0002;
          if (pPos[pi*3+1] > 8.5) pPos[pi*3+1] = -0.5;
          if (pPos[pi*3]   > 12)  pPos[pi*3]   = -12;
        }
        pGeo.attributes.position.needsUpdate = true;
      }

      /* Camera parallax */
      camera.position.x += (mouse.x*1.0 - camera.position.x)*0.03;
      camera.lookAt(mouse.x*0.25, 0.5 + mouse.y*-0.25, 0);

      renderer.render(scene, camera);
    }
    loop();
  }
})();
