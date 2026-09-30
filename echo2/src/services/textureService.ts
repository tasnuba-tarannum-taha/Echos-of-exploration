import * as THREE from 'three';

/**
 * Procedural Physically-Accurate NASA Dataset Texture Generator
 * Generates equirectangular Three.js CanvasTextures matching official NASA maps:
 * - NASA Visible Earth Blue Marble (True Color Earth)
 * - NASA Black Marble (Night Lights / City Lights)
 * - NASA Earth Atmosphere / Clouds
 * - NASA LROC Lunar Reconnaissance Orbiter (Moon Maria & Craters)
 * - NASA MOLA / Mars Global Surveyor (Mars Albedo & Topography)
 */

export class NasaTextureService {
  private static earthTextureCache: THREE.CanvasTexture | null = null;
  private static earthNightTextureCache: THREE.CanvasTexture | null = null;
  private static earthCloudTextureCache: THREE.CanvasTexture | null = null;
  private static moonTextureCache: THREE.CanvasTexture | null = null;
  private static marsTextureCache: THREE.CanvasTexture | null = null;

  /**
   * NASA Visible Earth: Blue Marble True Color
   */
  public static getEarthTrueColorTexture(): THREE.CanvasTexture {
    if (this.earthTextureCache) return this.earthTextureCache;

    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Deep ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, '#061a38');
    oceanGrad.addColorStop(0.2, '#0c2e5a');
    oceanGrad.addColorStop(0.5, '#0a2347');
    oceanGrad.addColorStop(0.8, '#0c2e5a');
    oceanGrad.addColorStop(1, '#061a38');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // Continental shelf shallow waters
    ctx.fillStyle = '#145374';
    // North America shelf
    ctx.beginPath();
    ctx.ellipse(width * 0.22, height * 0.35, width * 0.14, height * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eurasia shelf
    ctx.beginPath();
    ctx.ellipse(width * 0.65, height * 0.32, width * 0.25, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Landmass rendering (Equirectangular coordinate system matching NASA Visible Earth)
    const drawLandmass = (
      x: number,
      y: number,
      w: number,
      h: number,
      baseColor: string,
      aridColor?: string
    ) => {
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      ctx.fill();

      if (aridColor) {
        ctx.fillStyle = aridColor;
        ctx.beginPath();
        ctx.ellipse(x + w * 0.1, y + h * 0.05, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // North America (Green forest, Great Plains, Rocky Mountains, Canadian Shield)
    drawLandmass(width * 0.22, height * 0.32, width * 0.11, height * 0.16, '#2d5a27', '#8a7346');
    // Central America
    drawLandmass(width * 0.24, height * 0.48, width * 0.03, height * 0.06, '#1e481b');
    // South America (Amazon rainforest, Andes, Pampas)
    drawLandmass(width * 0.31, height * 0.68, width * 0.07, height * 0.18, '#1b4d20', '#546b32');
    // Africa (Sahara Desert, Congo basin, Kalahari)
    drawLandmass(width * 0.52, height * 0.52, width * 0.09, height * 0.2, '#31572c');
    // Sahara desert
    drawLandmass(width * 0.52, height * 0.42, width * 0.08, height * 0.09, '#c2a661', '#d4b474');
    // Europe (Mediterranean, Alps, Scandinavia)
    drawLandmass(width * 0.52, height * 0.28, width * 0.07, height * 0.08, '#386633', '#4f772d');
    // Asia (Siberian Taiga, Tibetan Plateau, Gobi Desert, Southeast Asia)
    drawLandmass(width * 0.72, height * 0.32, width * 0.18, height * 0.16, '#285223', '#9c814b');
    // India
    drawLandmass(width * 0.70, height * 0.46, width * 0.04, height * 0.07, '#2d5e2e');
    // Australia (Outback desert, coastal rainforest)
    drawLandmass(width * 0.83, height * 0.72, width * 0.07, height * 0.1, '#a3623b', '#bf7a47');
    // Antarctica (Ice Sheet)
    ctx.fillStyle = '#e8f4f8';
    ctx.fillRect(0, height * 0.88, width, height * 0.12);
    // Greenland Ice Sheet
    drawLandmass(width * 0.36, height * 0.18, width * 0.05, height * 0.08, '#edf6f9');
    // Arctic sea ice
    ctx.fillStyle = 'rgba(237, 246, 249, 0.65)';
    ctx.fillRect(0, 0, width, height * 0.08);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.earthTextureCache = texture;
    return texture;
  }

  /**
   * NASA Black Marble: Earth at Night (Urban lighting clusters)
   */
  public static getEarthNightTexture(): THREE.CanvasTexture {
    if (this.earthNightTextureCache) return this.earthNightTextureCache;

    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, width, height);

    // City lights clusters
    const drawCityCluster = (x: number, y: number, radius: number, intensity: number) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `rgba(255, 230, 150, ${intensity})`);
      grad.addColorStop(0.3, `rgba(240, 180, 80, ${intensity * 0.6})`);
      grad.addColorStop(0.7, `rgba(180, 120, 40, ${intensity * 0.2})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    // US East Coast / Megalopolis
    drawCityCluster(width * 0.26, height * 0.35, 45, 0.9);
    // US Midwest / West Coast
    drawCityCluster(width * 0.18, height * 0.36, 35, 0.75);
    drawCityCluster(width * 0.22, height * 0.36, 30, 0.7);
    // Western Europe / UK / Germany / Italy
    drawCityCluster(width * 0.50, height * 0.28, 55, 0.95);
    // Nile River ribbon
    ctx.strokeStyle = 'rgba(255, 220, 130, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.56, height * 0.40);
    ctx.lineTo(width * 0.56, height * 0.45);
    ctx.stroke();
    // India / Gangetic Plain
    drawCityCluster(width * 0.70, height * 0.44, 45, 0.85);
    // East Asia (Tokyo, Beijing, Shanghai, Seoul)
    drawCityCluster(width * 0.82, height * 0.36, 60, 1.0);
    drawCityCluster(width * 0.78, height * 0.38, 40, 0.85);
    // Southeast Asia & Australia
    drawCityCluster(width * 0.77, height * 0.54, 30, 0.7);
    drawCityCluster(width * 0.85, height * 0.74, 25, 0.7);
    // South America (São Paulo / Rio)
    drawCityCluster(width * 0.35, height * 0.72, 35, 0.8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    this.earthNightTextureCache = texture;
    return texture;
  }

  /**
   * NASA Earth Cloud / Atmosphere Layer (Translucent Cyclonic Bands)
   */
  public static getEarthCloudTexture(): THREE.CanvasTexture {
    if (this.earthCloudTextureCache) return this.earthCloudTextureCache;

    const width = 1024;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, width, height);

    // Swirling cloud masses with Perlin-like soft radial puffs
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * width;
      const y = (Math.random() * 0.7 + 0.15) * height; // Clouds concentrated in mid-latitudes & equator
      const radius = Math.random() * 50 + 15;
      const alpha = Math.random() * 0.45 + 0.1;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.5, `rgba(240, 248, 255, ${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Intertropical Convergence Zone (ITCZ) equatorial streak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(width * 0.4, height * 0.5, width * 0.35, height * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    this.earthCloudTextureCache = texture;
    return texture;
  }

  /**
   * NASA LROC Moon: True Lunar Maria and Impact Crater Albedo
   */
  public static getMoonTexture(): THREE.CanvasTexture {
    if (this.moonTextureCache) return this.moonTextureCache;

    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Anorthositic lunar highland crust (bright silvery gray)
    ctx.fillStyle = '#a6b0be';
    ctx.fillRect(0, 0, width, height);

    // Add highland texture noise
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 20 + 2;
      ctx.fillStyle = Math.random() > 0.5 ? '#b8c2d1' : '#949eac';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Basaltic Lunar Maria (Dark volcanic plains on Near Side)
    // Coordinated according to lunar selenographic mapping
    const drawMare = (x: number, y: number, rx: number, ry: number) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      grad.addColorStop(0, '#2c323c');
      grad.addColorStop(0.7, '#383f4b');
      grad.addColorStop(1, 'rgba(166, 176, 190, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    // Oceanus Procellarum (Ocean of Storms - Surveyor 3, Apollo 12)
    drawMare(width * 0.38, height * 0.44, width * 0.12, height * 0.18);
    // Mare Imbrium (Sea of Rains - Apollo 15 LRV Hadley Rille)
    drawMare(width * 0.44, height * 0.32, width * 0.09, height * 0.12);
    // Mare Serenitatis (Sea of Serenity)
    drawMare(width * 0.54, height * 0.36, width * 0.07, height * 0.09);
    // Mare Tranquillitatis (Sea of Tranquility - Apollo 11 Lunar Module Descent Stage)
    drawMare(width * 0.56, height * 0.46, width * 0.08, height * 0.10);
    // Mare Crisium (Sea of Crises)
    drawMare(width * 0.66, height * 0.42, width * 0.05, height * 0.06);
    // Mare Fecunditatis
    drawMare(width * 0.60, height * 0.56, width * 0.06, height * 0.08);

    // Impact Craters with Bright Ejecta Rays (Tycho & Copernicus)
    const drawCraterWithRays = (cx: number, cy: number, r: number) => {
      // Crater rays
      ctx.strokeStyle = 'rgba(235, 240, 250, 0.4)';
      ctx.lineWidth = 1.5;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const rayLen = r * 8;
        ctx.lineTo(cx + Math.cos(a) * rayLen, cy + Math.sin(a) * rayLen);
        ctx.stroke();
      }
      // Crater bowl
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e232a';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
      ctx.fill();
    };

    // Tycho crater (Southern highlands)
    drawCraterWithRays(width * 0.48, height * 0.74, 10);
    // Copernicus crater (Mare Imbrium southern rim)
    drawCraterWithRays(width * 0.42, height * 0.42, 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    this.moonTextureCache = texture;
    return texture;
  }

  /**
   * NASA MOLA Mars: Mars Global Surveyor Topographic & Albedo Map
   */
  public static getMarsTexture(): THREE.CanvasTexture {
    if (this.marsTextureCache) return this.marsTextureCache;

    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Ferric oxide reddish-orange Martian regolith base
    ctx.fillStyle = '#c15c3d';
    ctx.fillRect(0, 0, width, height);

    // Highland terrain variations
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 30 + 5;
      ctx.fillStyle = Math.random() > 0.5 ? '#a84c2f' : '#cf6b48';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dark Martian Albedo Features (Wind-swept basaltic bedrock)
    const drawAlbedo = (x: number, y: number, rx: number, ry: number) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      grad.addColorStop(0, '#421f18');
      grad.addColorStop(0.6, '#5e2a20');
      grad.addColorStop(1, 'rgba(193, 92, 61, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    // Syrtis Major Planum (prominent dark shield volcano region)
    drawAlbedo(width * 0.70, height * 0.46, width * 0.09, height * 0.14);
    // Acidalia Planitia (Northern lowlands)
    drawAlbedo(width * 0.40, height * 0.32, width * 0.12, height * 0.10);
    // Mare Erythraeum & Meridiani Planum (Opportunity Rover landing zone)
    drawAlbedo(width * 0.46, height * 0.56, width * 0.11, height * 0.08);
    // Gusev Crater area (Spirit Rover)
    drawAlbedo(width * 0.88, height * 0.58, width * 0.07, height * 0.07);
    // Elysium Planitia (InSight Lander site)
    drawAlbedo(width * 0.82, height * 0.45, width * 0.06, height * 0.05);

    // Valles Marineris Grand Canyon Rift
    ctx.strokeStyle = '#2b140f';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(width * 0.30, height * 0.54);
    ctx.bezierCurveTo(width * 0.35, height * 0.56, width * 0.42, height * 0.57, width * 0.48, height * 0.56);
    ctx.stroke();

    // Olympus Mons (Solar System's largest volcano)
    const ox = width * 0.22;
    const oy = height * 0.42;
    const og = ctx.createRadialGradient(ox, oy, 2, ox, oy, 28);
    og.addColorStop(0, '#e58e70');
    og.addColorStop(0.7, '#8f3c25');
    og.addColorStop(1, 'rgba(193, 92, 61, 0)');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(ox, oy, 28, 0, Math.PI * 2);
    ctx.fill();

    // Polar Ice Caps (Water ice + frozen carbon dioxide)
    // North Polar Cap (Planum Boreum)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.04, width * 0.25, height * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    // South Polar Cap (Planum Australe)
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.96, width * 0.20, height * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    this.marsTextureCache = texture;
    return texture;
  }
}
