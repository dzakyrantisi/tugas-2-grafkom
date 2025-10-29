"use strict";

var gl;
var points = [];
var colors = [];
var texcoords = [];

// GPU buffers and attribute locations (set in init)
var vBuffer, cBuffer, tBuffer;
var vPositionLoc, vColorLoc, vTexCoordLoc;
var uSamplerLoc, useTextureLoc;

var modelViewMatrixLoc, projectionMatrixLoc;
var ambientColorLoc, diffuseColorLoc, specularColorLoc, lightPosLoc;

// Variabel kamera (eye)
var camX = 0.0, camY = 0.0, camZ = 5.0;

// Cahaya
var ambientColor = [0.3, 0.3, 0.3];
var diffuseColor = [0.7, 0.7, 0.7];
var specularColor = [1.0, 1.0, 1.0];
var lightPos = [2.0, 2.0, 2.0];

// transform variables
var tx = 0.0, ty = 0.0, tz = -4.0;
var rx = 0.0, ry = 0.0, rz = 0.0;
var scaleVal = 1.0;

// handle derajat jam
var hourAngle = 90;   // default 12:00 position (0 hours)
var minuteAngle = 90; // default 12:00 position (0 minutes)

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    // native webgl context (tanpa WebGLUtils)
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) { alert("WebGL tidak tersedia"); return; }

    // buat objek sepeda
    createBike();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // create buffers (we draw per-mesh using start/count ranges)
    vBuffer = gl.createBuffer();
    cBuffer = gl.createBuffer();
    tBuffer = gl.createBuffer();

    vPositionLoc = gl.getAttribLocation(program, "vPosition");
    vColorLoc = gl.getAttribLocation(program, "vColor");
    vTexCoordLoc = gl.getAttribLocation(program, "vTexCoord");

    if (vPositionLoc < 0) { alert('vPosition attribute not found in shader'); }
    if (vColorLoc < 0) { console.warn('vColor attribute not found'); }

    // uniform for texture and flag
    uSamplerLoc = gl.getUniformLocation(program, "uSampler");
    useTextureLoc = gl.getUniformLocation(program, "useTexture");

    // initial buffer data (filled by updateBuffers())
    function updateBuffers() {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texcoords), gl.STATIC_DRAW);
    }

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    ambientColorLoc = gl.getUniformLocation(program, "ambientColor");
    diffuseColorLoc = gl.getUniformLocation(program, "diffuseColor");
    specularColorLoc = gl.getUniformLocation(program, "specularColor");
    lightPosLoc = gl.getUniformLocation(program, "lightPos");


    // pasang event listener (pastikan parseFloat!)
    document.getElementById("rotateX").addEventListener("input", function(e){ rx = parseFloat(e.target.value); });
    document.getElementById("rotateY").addEventListener("input", function(e){ ry = parseFloat(e.target.value); });
    document.getElementById("rotateZ").addEventListener("input", function(e){ rz = parseFloat(e.target.value); });
    document.getElementById("transX").addEventListener("input", function(e){ tx = parseFloat(e.target.value); });
    document.getElementById("transY").addEventListener("input", function(e){ ty = parseFloat(e.target.value); });
    document.getElementById("transZ").addEventListener("input", function(e){ tz = parseFloat(e.target.value); });
    document.getElementById("scale").addEventListener("input", function(e){ scaleVal = parseFloat(e.target.value); });

    // Event listener kamera (eye)
    document.getElementById("camX").addEventListener("input", function(e){ camX = parseFloat(e.target.value); });
    document.getElementById("camY").addEventListener("input", function(e){ camY = parseFloat(e.target.value); });
    document.getElementById("camZ").addEventListener("input", function(e){ camZ = parseFloat(e.target.value); });

    // Event listener warna cahaya
    document.getElementById("ambientColor").addEventListener("input", function(e){
        ambientColor = hexToRgb01(e.target.value);
    });
    document.getElementById("diffuseColor").addEventListener("input", function(e){
        diffuseColor = hexToRgb01(e.target.value);
    });
    document.getElementById("specularColor").addEventListener("input", function(e){
        specularColor = hexToRgb01(e.target.value);
    });

    // Event listener posisi cahaya
    document.getElementById("lightX").addEventListener("input", function(e){ lightPos[0] = parseFloat(e.target.value); });
    document.getElementById("lightY").addEventListener("input", function(e){ lightPos[1] = parseFloat(e.target.value); });
    document.getElementById("lightZ").addEventListener("input", function(e){ lightPos[2] = parseFloat(e.target.value); });

    // Bike controls
    document.getElementById('pedalSpeed').addEventListener('input', function(e){ pedalSpeed = parseFloat(e.target.value); });
    document.getElementById('steer').addEventListener('input', function(e){ steerAngle = parseFloat(e.target.value); });
    document.getElementById('animateToggle').addEventListener('change', function(e){ animateOn = e.target.checked; });

    // Event listener 
    document.getElementById("resetBtn").onclick = function() {
        tx = 0; ty = 0; tz = -4;
        rx = 0; ry = 0; rz = 0;
        scaleVal = 1;
        hourAngle = 90;
        minuteAngle = 90; 
        camX = 0; camY = 0; camZ = 5;
        ambientColor = [0.3, 0.3, 0.3];
        diffuseColor = [0.7, 0.7, 0.7];
        specularColor = [1.0, 1.0, 1.0];
        lightPos = [2.0, 2.0, 2.0];
        document.getElementById("rotateX").value = 0;
        document.getElementById("rotateY").value = 0;
        document.getElementById("rotateZ").value = 0;
        document.getElementById("transX").value = 0;
        document.getElementById("transY").value = 0;
        document.getElementById("transZ").value = -4;
    document.getElementById("scale").value = 1;
        document.getElementById("camX").value = 0;
        document.getElementById("camY").value = 0;
        document.getElementById("camZ").value = 5;
        document.getElementById("ambientColor").value = "#4d4d4d";
        document.getElementById("diffuseColor").value = "#b3b3b3";
        document.getElementById("specularColor").value = "#ffffff";
        document.getElementById("lightX").value = 2;
        document.getElementById("lightY").value = 2;
        document.getElementById("lightZ").value = 2;
    createBike();
        updateBuffers();
    // reset bike controls
    document.getElementById('pedalSpeed').value = 0;
    document.getElementById('steer').value = 0;
    document.getElementById('animateToggle').checked = false;
    pedalSpeed = 0; steerAngle = 0; animateOn = false; pedalAngle = 0; wheelAngle = 0; bikeZ = 0;
    bikeX = 0; bikeHeading = 0;
    };
// Helper konversi hex ke rgb [0,1]
function hexToRgb01(hex) {
    hex = hex.replace('#','');
    if(hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return [r/255, g/255, b/255];
}

    console.log("Jumlah vertex:", points.length, "Jumlah warna:", colors.length);

    // Agar fungsi ini dapat diakses dari HTML
    window.updateBuffers = updateBuffers;
    window.createBike = createBike;

    // create and bind texture
    var checkerTex = createCheckerTexture(64,64);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, checkerTex);
    gl.uniform1i(uSamplerLoc, 0);

    updateBuffers();

    render();
};

// helper: push triangle dengan color
function addTriangle(a,b,c, col) {
    points.push(a, b, c);
    colors.push(col, col, col);
}
function addQuad(a,b,c,d, col) {
    addTriangle(a,b,c, col);
    addTriangle(a,c,d, col);
}

// Helper untuk membuat sisi silinder (menghubungkan dua lingkaran)
function addCylinderSides(topCircle, bottomCircle, color, numSegments) {
    for (var i = 0; i < numSegments; i++) {
        var next = (i + 1) % numSegments;
        
        // Buat persegi di antara dua segmen lingkaran
        var topA = topCircle[i];
        var topB = topCircle[next];
        var bottomA = bottomCircle[i];
        var bottomB = bottomCircle[next];
        
        addQuad(topA, topB, bottomB, bottomA, color);
    }
}

// Membuat geometri sepeda sederhana, disimpan ke arrays global dan direkam ranges per-mesh
var meshes = {}; // name -> { start, count }

// bike state for animation
var pedalSpeed = 0.0;
var pedalAngle = 0.0;
var wheelAngle = 0.0;
var steerAngle = 0.0;
var bikeZ = 0.0;
var bikeX = 0.0;        // lateral/world X position
var bikeHeading = 0.0;  // heading in degrees, 0 = facing -Z
var animateOn = false;
var _debugLogged = false;

function addTriLocal(a,b,c, col) {
    points.push(a, b, c);
    colors.push(col, col, col);
    // texcoord planar mapping
    texcoords.push(vec2((a[0]+1.0)/2.0, (a[1]+1.0)/2.0));
    texcoords.push(vec2((b[0]+1.0)/2.0, (b[1]+1.0)/2.0));
    texcoords.push(vec2((c[0]+1.0)/2.0, (c[1]+1.0)/2.0));
}

function addQuadLocal(a,b,c,d, col) {
    addTriLocal(a,b,c,col);
    addTriLocal(a,c,d,col);
}

function makeWheel(cx, cy, rOuter, rInner, z, color, name) {
    // replace with thicker extruded wheel (rim + tire)
}

// create a simple box (rectangular prism) from x0,y0 to x1,y1 centered at z with depth
function makeBox(x0,y0,x1,y1,zCenter,depth,color,name) {
    var start = points.length;
    var z0 = zCenter - depth/2;
    var z1 = zCenter + depth/2;
    var a = vec4(x0,y0,z0,1), b = vec4(x1,y0,z0,1), c = vec4(x1,y1,z0,1), d = vec4(x0,y1,z0,1);
    var a2 = vec4(x0,y0,z1,1), b2 = vec4(x1,y0,z1,1), c2 = vec4(x1,y1,z1,1), d2 = vec4(x0,y1,z1,1);
    // bottom
    addQuadLocal(a,b,c,d,color);
    // top
    addQuadLocal(a2,d2,c2,b2,color);
    // sides
    addQuadLocal(a,a2,b2,b,color);
    addQuadLocal(b,b2,c2,c,color);
    addQuadLocal(c,c2,d2,d,color);
    addQuadLocal(d,d2,a2,a,color);
    meshes[name] = { start: start, count: points.length - start, center: vec3((x0+x1)/2,(y0+y1)/2,zCenter) };
}

// create a thicker wheel by extruding ring along z (depth) and adding spokes
function makeThickWheel(cx, cy, rOuter, rInner, zCenter, depth, color, name, rimColor) {
    var start = points.length;
    var segs = 48;
    var z0 = zCenter - depth/2;
    var z1 = zCenter + depth/2;
    // front and back faces (caps)
    for(var i=0;i<segs;i++){
        var a1 = (i/segs)*2*Math.PI;
        var a2 = ((i+1)/segs)*2*Math.PI;
        var outerA0 = vec4(cx + rOuter*Math.cos(a1), cy + rOuter*Math.sin(a1), z0,1);
        var outerB0 = vec4(cx + rOuter*Math.cos(a2), cy + rOuter*Math.sin(a2), z0,1);
        var innerA0 = vec4(cx + rInner*Math.cos(a1), cy + rInner*Math.sin(a1), z0,1);
        var innerB0 = vec4(cx + rInner*Math.cos(a2), cy + rInner*Math.sin(a2), z0,1);
        // front cap (z0)
        addQuadLocal(innerA0, outerA0, outerB0, innerB0, color);

        var outerA1 = vec4(cx + rOuter*Math.cos(a1), cy + rOuter*Math.sin(a1), z1,1);
        var outerB1 = vec4(cx + rOuter*Math.cos(a2), cy + rOuter*Math.sin(a2), z1,1);
        var innerA1 = vec4(cx + rInner*Math.cos(a1), cy + rInner*Math.sin(a1), z1,1);
        var innerB1 = vec4(cx + rInner*Math.cos(a2), cy + rInner*Math.sin(a2), z1,1);
        // back cap (z1)
        addQuadLocal(innerA1, innerB1, outerB1, outerA1, color);

        // outer side between front and back
        addQuadLocal(outerA0, outerA1, outerB1, outerB0, color);
        // inner side
        addQuadLocal(innerB0, innerB1, innerA1, innerA0, color);
    }

    // spokes: thin boxes from inner radius to outer radius at mid z
    var spokeCount = 20;
    var spokeWidth = (rOuter - rInner) * 0.08;
    var sColor = vec4(0.85,0.85,0.85,1.0);
    for(var s=0;s<spokeCount;s++){
        var ang = (s/spokeCount)*2*Math.PI;
        var dirX = Math.cos(ang), dirY = Math.sin(ang);
        var perpX = -dirY, perpY = dirX;
        var outer1 = vec4(cx + (rOuter-0.01)*dirX + perpX*(spokeWidth/2), cy + (rOuter-0.01)*dirY + perpY*(spokeWidth/2), z0+0.001, 1.0);
        var outer2 = vec4(cx + (rOuter-0.01)*dirX - perpX*(spokeWidth/2), cy + (rOuter-0.01)*dirY - perpY*(spokeWidth/2), z0+0.001, 1.0);
        var inner1 = vec4(cx + (rInner+0.01)*dirX - perpX*(spokeWidth/2), cy + (rInner+0.01)*dirY - perpY*(spokeWidth/2), z1-0.001, 1.0);
        var inner2 = vec4(cx + (rInner+0.01)*dirX + perpX*(spokeWidth/2), cy + (rInner+0.01)*dirY + perpY*(spokeWidth/2), z1-0.001, 1.0);
        addQuadLocal(inner1, inner2, outer2, outer1, sColor);
    }

    // rim band (velg) - more visible: thicker radial band and slight z offset to avoid z-fighting
    if(!rimColor) rimColor = vec4(0.75,0.75,0.78,1.0); // default silver-ish
    var rimInner = rInner + (rOuter - rInner) * 0.65;
    var rimOuter = rOuter - (rOuter - rInner) * 0.12;
    // draw the rim slightly above the wheel mid-plane to reduce z-fighting with side faces
    var zmid = zCenter + 0.001;
    for(var i=0;i<segs;i++){
        var a1 = (i/segs)*2*Math.PI;
        var a2 = ((i+1)/segs)*2*Math.PI;
        var inA = vec4(cx + rimInner*Math.cos(a1), cy + rimInner*Math.sin(a1), zmid,1);
        var inB = vec4(cx + rimInner*Math.cos(a2), cy + rimInner*Math.sin(a2), zmid,1);
        var outA = vec4(cx + rimOuter*Math.cos(a1), cy + rimOuter*Math.sin(a1), zmid,1);
        var outB = vec4(cx + rimOuter*Math.cos(a2), cy + rimOuter*Math.sin(a2), zmid,1);
        // make rim triangles slightly thicker by extruding two closely spaced quads (gives some thickness)
        addQuadLocal(inA, outA, outB, inB, rimColor);
        var inA2 = vec4(cx + (rimInner+0.005)*Math.cos(a1), cy + (rimInner+0.005)*Math.sin(a1), zmid+0.0005,1);
        var inB2 = vec4(cx + (rimInner+0.005)*Math.cos(a2), cy + (rimInner+0.005)*Math.sin(a2), zmid+0.0005,1);
        var outA2 = vec4(cx + (rimOuter+0.005)*Math.cos(a1), cy + (rimOuter+0.005)*Math.sin(a1), zmid+0.0005,1);
        var outB2 = vec4(cx + (rimOuter+0.005)*Math.cos(a2), cy + (rimOuter+0.005)*Math.sin(a2), zmid+0.0005,1);
        addQuadLocal(inA2, outA2, outB2, inB2, rimColor);
    }

    meshes[name] = { start: start, count: points.length - start, center: vec3(cx, cy, zCenter) };
}

// create a rotated box (rectangle extruded in Z) centered at cx,cy with given width/height
function makeRotatedBox(cx, cy, width, height, zCenter, depth, angleDeg, color, name) {
    var start = points.length;
    var hw = width/2, hh = height/2;
    var angle = radians(angleDeg);
    var c = Math.cos(angle), s = Math.sin(angle);
    function rotLocal(x, y) {
        return [ cx + x*c - y*s, cy + x*s + y*c ];
    }
    var z0 = zCenter - depth/2;
    var z1 = zCenter + depth/2;
    // four corners in XY at z0 and z1
    var p = [];
    var a = rotLocal(-hw, -hh), b = rotLocal(hw, -hh), cc = rotLocal(hw, hh), d = rotLocal(-hw, hh);
    p.push(vec4(a[0], a[1], z0, 1));
    p.push(vec4(b[0], b[1], z0, 1));
    p.push(vec4(cc[0], cc[1], z0, 1));
    p.push(vec4(d[0], d[1], z0, 1));
    p.push(vec4(a[0], a[1], z1, 1));
    p.push(vec4(b[0], b[1], z1, 1));
    p.push(vec4(cc[0], cc[1], z1, 1));
    p.push(vec4(d[0], d[1], z1, 1));

    // bottom (z0): a,b,cc,d
    addQuadLocal(p[0], p[1], p[2], p[3], color);
    // top (z1): a4,d4,cc4,b4  (note winding to face outward)
    addQuadLocal(p[4], p[7], p[6], p[5], color);
    // sides
    addQuadLocal(p[0], p[4], p[5], p[1], color);
    addQuadLocal(p[1], p[5], p[6], p[2], color);
    addQuadLocal(p[2], p[6], p[7], p[3], color);
    addQuadLocal(p[3], p[7], p[4], p[0], color);

    meshes[name] = { start: start, count: points.length - start, center: vec3(cx, cy, zCenter) };
}

// create a tube (rotated box) between two 2D points (x0,y0) -> (x1,y1)
function makeTubeBetween(x0,y0,x1,y1,zCenter,thickness,depth,color,name) {
    var dx = x1 - x0, dy = y1 - y0;
    var len = Math.sqrt(dx*dx + dy*dy);
    if(len < 0.0001) len = 0.0001;
    var angle = Math.atan2(dy, dx) * 180.0 / Math.PI; // degrees
    var cx = (x0 + x1)/2.0, cy = (y0 + y1)/2.0;
    // width = length, height = thickness
    makeRotatedBox(cx, cy, len, thickness, zCenter, depth, angle, color, name);
}

function makeRect(x0,y0,x1,y1,z,color,name) {
    var start = points.length;
    var a = vec4(x0,y0,z,1);
    var b = vec4(x1,y0,z,1);
    var c = vec4(x1,y1,z,1);
    var d = vec4(x0,y1,z,1);
    addQuadLocal(a,b,c,d,color);
    meshes[name] = { start: start, count: points.length - start, center: vec3((x0+x1)/2,(y0+y1)/2,z) };
}

function createBike() {
    points.length = 0; colors.length = 0; texcoords.length = 0; meshes = {};
    // debug marker: a small visible box at origin to verify rendering pipeline
    makeBox(-0.12, -0.12, 0.12, 0.12, 0.0, 0.02, vec4(0.8,0.2,0.2,1.0), 'debugMarker');
    // thicker frame built from tubes to approximate the reference
    // reference points
    var rearHub = { x: -0.5, y: -0.25 };
    var frontHub = { x: 0.5, y: -0.25 };
    var bb = { x: 0.0, y: 0.0 }; // bottom bracket / pedal center
    var seatTop = { x: -0.12, y: 0.18 };
    var head = { x: 0.45, y: 0.08 };

    // top tube (seatTop -> head)
    makeTubeBetween(seatTop.x, seatTop.y, head.x, head.y, 0.04, 0.04, 0.06, vec4(0.12,0.12,0.14,1.0), 'topTube');
    // down tube (head -> bottom bracket)
    makeTubeBetween(head.x, head.y - 0.02, bb.x, bb.y, 0.02, 0.05, 0.06, vec4(0.12,0.12,0.14,1.0), 'downTube');
    // seat tube (seatTop -> bottom bracket)
    makeTubeBetween(seatTop.x, seatTop.y, bb.x, bb.y, 0.03, 0.04, 0.06, vec4(0.12,0.12,0.14,1.0), 'seatTube');

    // chainstay (bottom bracket -> rear hub)
    makeTubeBetween(bb.x, bb.y, rearHub.x, rearHub.y, -0.02, 0.04, 0.06, vec4(0.12,0.12,0.14,1.0), 'chainstay');

    // seat stays (two thin tubes from seatTop to rear hub)
    makeTubeBetween(seatTop.x + 0.02, seatTop.y - 0.02, rearHub.x + 0.02, rearHub.y + 0.02, 0.03, 0.02, 0.04, vec4(0.12,0.12,0.14,1.0), 'seatStay1');
    makeTubeBetween(seatTop.x - 0.02, seatTop.y - 0.02, rearHub.x - 0.02, rearHub.y + 0.02, 0.03, 0.02, 0.04, vec4(0.12,0.12,0.14,1.0), 'seatStay2');

    // fork legs (two thin tubes from head down to front hub)
    makeTubeBetween(head.x - 0.02, head.y - 0.02, frontHub.x - 0.01, frontHub.y + 0.02, 0.03, 0.03, 0.06, vec4(0.12,0.12,0.14,1.0), 'forkLeft');
    makeTubeBetween(head.x + 0.02, head.y - 0.02, frontHub.x + 0.01, frontHub.y + 0.02, 0.03, 0.03, 0.06, vec4(0.12,0.12,0.14,1.0), 'forkRight');

    // small head tube box for a nicer join
    makeBox(head.x - 0.05, head.y - 0.03, head.x + 0.05, head.y + 0.07, 0.03, 0.06, vec4(0.14,0.14,0.16,1.0), 'headTube');

    // stem: vertical connector from head tube up to handlebar center (will rotate with steering)
    makeBox(head.x - 0.02, head.y + 0.04, head.x + 0.02, head.y + 0.14, 0.05, 0.04, vec4(0.11,0.11,0.13,1.0), 'stem');

    // saddle: narrower and centered directly above the seat tube
    makeRotatedBox(seatTop.x, seatTop.y + 0.06, 0.18, 0.06, 0.06, 0.04, -6, vec4(0.05,0.05,0.05,1.0), 'saddle');

    // pedals / crank center as a short thick box (bottom bracket)
    makeBox(bb.x - 0.04, bb.y - 0.04, bb.x + 0.04, bb.y + 0.04, 0.02, 0.04, vec4(0.18,0.18,0.18,1.0), 'pedalCenter');
    // crank arms (two thin rods) — will rotate with pedalModel in render
    makeRotatedBox(-0.14, 0.0, 0.28, 0.02, 0.02, 0.03, 0, vec4(0.9,0.6,0.05,1.0), 'crankLeft');
    makeRotatedBox(0.14, 0.0, 0.28, 0.02, 0.02, 0.03, 0, vec4(0.9,0.6,0.05,1.0), 'crankRight');

    // thicker wheels (outer radius, inner rim radius, z center, depth)
    // add wheels: pass rimColor (silver) for visible velg
    var rimSilver = vec4(0.75,0.75,0.78,1.0);
    makeThickWheel(rearHub.x, rearHub.y, 0.34, 0.25, 0.0, 0.08, vec4(0.05,0.05,0.05,1.0), 'rearWheel', rimSilver);
    makeThickWheel(frontHub.x, frontHub.y, 0.34, 0.25, 0.0, 0.08, vec4(0.05,0.05,0.05,1.0), 'frontWheel', rimSilver);

    // realistic handlebar: left and right arms attached to stem top (use head/stem position)
    var hbCenter = { x: head.x, y: head.y + 0.14 };
    var leftEnd = { x: hbCenter.x - 0.16, y: hbCenter.y };
    var rightEnd = { x: hbCenter.x + 0.16, y: hbCenter.y };
    // split each arm into inner straight segment and outer bent segment to simulate slight curvature
    var leftMid = { x: hbCenter.x - 0.08, y: hbCenter.y - 0.01 };
    var rightMid = { x: hbCenter.x + 0.08, y: hbCenter.y - 0.01 };
    // inner segments (near stem)
    makeTubeBetween(hbCenter.x, hbCenter.y, leftMid.x, leftMid.y, 0.06, 0.02, 0.03, vec4(0.12,0.12,0.12,1.0), 'leftBar1');
    makeTubeBetween(hbCenter.x, hbCenter.y, rightMid.x, rightMid.y, 0.06, 0.02, 0.03, vec4(0.12,0.12,0.12,1.0), 'rightBar1');
    // outer bent segments (toward grips) slightly lower in Z to suggest downward sweep
    makeTubeBetween(leftMid.x, leftMid.y, leftEnd.x, leftEnd.y, 0.055, 0.02, 0.03, vec4(0.12,0.12,0.12,1.0), 'leftBar2');
    makeTubeBetween(rightMid.x, rightMid.y, rightEnd.x, rightEnd.y, 0.055, 0.02, 0.03, vec4(0.12,0.12,0.12,1.0), 'rightBar2');
    // grips at ends (more horizontal)
    makeRotatedBox(leftEnd.x, leftEnd.y, 0.09, 0.03, 0.06, 0.04, -4, vec4(0.02,0.02,0.02,1.0), 'gripLeft');
    makeRotatedBox(rightEnd.x, rightEnd.y, 0.09, 0.03, 0.06, 0.04, -4, vec4(0.02,0.02,0.02,1.0), 'gripRight');

    // rear cog (small disk/box at rear hub) and a simple chain connecting BB to rear hub
    makeRotatedBox(rearHub.x, rearHub.y, 0.06, 0.06, 0.02, 0.03, 0, vec4(0.06,0.06,0.06,1.0), 'rearCog');
    // chain: approximate by a thin tube between bottom bracket and rear hub
    makeTubeBetween(bb.x, bb.y - 0.01, rearHub.x, rearHub.y + 0.01, 0.00, 0.015, 0.02, vec4(0.08,0.08,0.08,1.0), 'chain');

    console.log('Meshes created:', Object.keys(meshes));
}

// create simple procedural checker texture
function createCheckerTexture(width, height) {
    var pixels = new Uint8Array(width*height*4);
    for(var y=0;y<height;y++){
        for(var x=0;x<width;x++){
            var i = (y*width + x)*4;
            var v = ((Math.floor(x/8)+Math.floor(y/8))%2) ? 200 : 60;
            pixels[i] = v; pixels[i+1] = v; pixels[i+2] = v; pixels[i+3] = 255;
        }
    }
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
}

// custom scalem 
function scalem(sx, sy, sz) {
    if (arguments.length === 1) { sy = sz = sx; }
    var result = mat4();
    result[0][0] = sx;
    result[1][1] = sy || sx;
    result[2][2] = sz || sx;
    result[3][3] = 1.0;
    return result;
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Kamera dinamis: gunakan lookAt(eye, at, up)
    var eye = vec3(camX, camY, camZ);
    var at = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);
    var mv = lookAt(eye, at, up);

    mv = mult(mv, translate(tx, ty, tz));
    mv = mult(mv, rotateX(rx));
    mv = mult(mv, rotateY(ry));
    mv = mult(mv, rotateZ(rz));
    mv = mult(mv, scalem(scaleVal, scaleVal, scaleVal));

    var aspect = gl.canvas.width / gl.canvas.height;
    var p = perspective(60, aspect, 0.1, 50.0);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(p));

    // Kirim warna dan posisi cahaya ke shader
    gl.uniform3fv(ambientColorLoc, ambientColor);
    gl.uniform3fv(diffuseColorLoc, diffuseColor);
    gl.uniform3fv(specularColorLoc, specularColor);
    gl.uniform3fv(lightPosLoc, lightPos);

    // simple animation updates: wheel rotation drives bike displacement and heading
    if (animateOn || Math.abs(pedalSpeed) > 0.0001) {
        // degrees per frame for pedal/wheel (wheelAngle is in degrees)
        var pedalDeltaDeg = pedalSpeed * 0.8;
        var wheelDeltaDeg = pedalSpeed * 1.2;
        pedalAngle += pedalDeltaDeg;
        wheelAngle += wheelDeltaDeg;

        // Convert wheel delta to linear travel: s = r * theta (theta in radians)
        var wheelRadius = 0.295; // average of outer/inner radii used when creating thick wheel (0.34/0.25)
        var wheelDeltaRad = radians(wheelDeltaDeg);
        var travel = wheelRadius * wheelDeltaRad;
        // scale travel to pleasant speed
        var travelScaled = travel * 0.5;

        // bicycle turning model (approx): heading change proportional to tan(steer)/wheelbase
        var steerRad = radians(steerAngle);
        var wheelbase = 1.0; // default wheelbase
        if(meshes['frontWheel'] && meshes['rearWheel']){
            var f = meshes['frontWheel'].center, r = meshes['rearWheel'].center;
            if(f && r) wheelbase = Math.abs(f[0] - r[0]) || wheelbase;
        }
        var deltaHeadingRad = 0.0;
        if (Math.abs(steerRad) > 1e-5) {
            deltaHeadingRad = (travelScaled * Math.tan(steerRad)) / wheelbase;
        }

        // update heading (store in degrees because rotateY expects degrees elsewhere)
        bikeHeading += deltaHeadingRad * 180.0 / Math.PI;

        // update position in world X,Z using heading (0 deg => facing -Z)
        var headingRad = radians(bikeHeading);
        bikeX += Math.sin(headingRad) * travelScaled;
        bikeZ += -Math.cos(headingRad) * travelScaled;
    }

    // bind buffers and attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(vPositionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.vertexAttribPointer(vColorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColorLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.vertexAttribPointer(vTexCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoordLoc);

    // enable texture usage
    gl.uniform1i(useTextureLoc, true);

    // place bike at (bikeX, 0, bikeZ) and rotate to current heading
    var bikeBase = mult(mv, mult(translate(bikeX, 0, bikeZ), rotateY(bikeHeading)));

    // draw static frame parts that don't have extra per-part transforms
    var staticParts = ['topTube','downTube','seatTube','chainstay','seatStay1','seatStay2','headTube','saddle'];
    for(var i=0;i<staticParts.length;i++){
        var mname = staticParts[i];
        if(meshes[mname]){
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(bikeBase));
            gl.drawArrays(gl.TRIANGLES, meshes[mname].start, meshes[mname].count);
        }
    }

    // draw rear wheel (rotate around its center)
    if(meshes['rearWheel']){
        var c = meshes['rearWheel'].center;
        // rotate wheel around Z (wheel plane is XY); negative sign so rotation direction matches motion
        var wheelModel = mult(bikeBase, mult(translate(c[0], c[1], c[2]), mult(rotateZ(-wheelAngle), translate(-c[0], -c[1], -c[2]))));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(wheelModel));
        gl.drawArrays(gl.TRIANGLES, meshes['rearWheel'].start, meshes['rearWheel'].count);
    }

    // draw front wheel and steering-linked parts (steer affects fork, handlebar, grips, and front wheel spin)
    if(meshes['frontWheel']){
    var c2 = meshes['frontWheel'].center;
    // compute steering pivot: use headTube center (top of stem) if available, otherwise fall back to wheel center
    var headCenter = (meshes['headTube'] && meshes['headTube'].center) ? meshes['headTube'].center : c2;
    // steer-only transform rotates around head/stem pivot so bars/fork pivot correctly
    var steerOnly = mult(bikeBase, mult(translate(headCenter[0], headCenter[1], headCenter[2]), mult(rotateY(steerAngle), translate(-headCenter[0], -headCenter[1], -headCenter[2]))));
        // draw fork legs attached to steering
        if(meshes['forkLeft']){
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(steerOnly));
            gl.drawArrays(gl.TRIANGLES, meshes['forkLeft'].start, meshes['forkLeft'].count);
        }
        if(meshes['forkRight']){
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(steerOnly));
            gl.drawArrays(gl.TRIANGLES, meshes['forkRight'].start, meshes['forkRight'].count);
        }

        // front wheel (apply spin after steering)
        var frontModel = mult(steerOnly, mult(rotateZ(-wheelAngle), mat4()));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(frontModel));
        gl.drawArrays(gl.TRIANGLES, meshes['frontWheel'].start, meshes['frontWheel'].count);

        // draw handlebar and grips using the steering-only transform (no wheel spin)
            // draw stem (rotates with steering)
            if(meshes['stem']){
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(steerOnly));
                gl.drawArrays(gl.TRIANGLES, meshes['stem'].start, meshes['stem'].count);
            }
            // draw left/right handlebar arm segments with a slight pitch tilt
            if(meshes['leftBar1']){
                var lbCenter1 = meshes['leftBar1'].center;
                var lbTilt1 = mult(steerOnly, mult(translate(lbCenter1[0], lbCenter1[1], lbCenter1[2]), mult(rotateX(-6), translate(-lbCenter1[0], -lbCenter1[1], -lbCenter1[2]))));
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(lbTilt1));
                gl.drawArrays(gl.TRIANGLES, meshes['leftBar1'].start, meshes['leftBar1'].count);
            }
            if(meshes['leftBar2']){
                var lbCenter2 = meshes['leftBar2'].center;
                var lbTilt2 = mult(steerOnly, mult(translate(lbCenter2[0], lbCenter2[1], lbCenter2[2]), mult(rotateX(-6), translate(-lbCenter2[0], -lbCenter2[1], -lbCenter2[2]))));
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(lbTilt2));
                gl.drawArrays(gl.TRIANGLES, meshes['leftBar2'].start, meshes['leftBar2'].count);
            }
            if(meshes['rightBar1']){
                var rbCenter1 = meshes['rightBar1'].center;
                var rbTilt1 = mult(steerOnly, mult(translate(rbCenter1[0], rbCenter1[1], rbCenter1[2]), mult(rotateX(-6), translate(-rbCenter1[0], -rbCenter1[1], -rbCenter1[2]))));
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(rbTilt1));
                gl.drawArrays(gl.TRIANGLES, meshes['rightBar1'].start, meshes['rightBar1'].count);
            }
            if(meshes['rightBar2']){
                var rbCenter2 = meshes['rightBar2'].center;
                var rbTilt2 = mult(steerOnly, mult(translate(rbCenter2[0], rbCenter2[1], rbCenter2[2]), mult(rotateX(-6), translate(-rbCenter2[0], -rbCenter2[1], -rbCenter2[2]))));
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(rbTilt2));
                gl.drawArrays(gl.TRIANGLES, meshes['rightBar2'].start, meshes['rightBar2'].count);
            }
            // grips: draw each with a slightly stronger pitch so they point slightly downward
            if(meshes['gripLeft']){
                var g = meshes['gripLeft'].center;
                    var gTransform = mult(steerOnly, mult(translate(g[0], g[1], g[2]), mult(rotateX(-4), translate(-g[0], -g[1], -g[2]))));
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(gTransform));
                gl.drawArrays(gl.TRIANGLES, meshes['gripLeft'].start, meshes['gripLeft'].count);
            }
            if(meshes['gripRight']){
                var g2 = meshes['gripRight'].center;
                    var g2Transform = mult(steerOnly, mult(translate(g2[0], g2[1], g2[2]), mult(rotateX(-4), translate(-g2[0], -g2[1], -g2[2]))));
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(g2Transform));
                gl.drawArrays(gl.TRIANGLES, meshes['gripRight'].start, meshes['gripRight'].count);
            }
    }

    // draw pedals (rotate)
    if(meshes['pedalCenter']){
        var pc = meshes['pedalCenter'].center || vec3(0,0,0);
        var pedalModel = mult(bikeBase, mult(translate(pc[0], pc[1], pc[2]), mult(rotateZ(pedalAngle), translate(-pc[0], -pc[1], -pc[2]))));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(pedalModel));
        gl.drawArrays(gl.TRIANGLES, meshes['pedalCenter'].start, meshes['pedalCenter'].count);
        // draw crank arms with the same pedal rotation
        if(meshes['crankLeft']){
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(pedalModel));
            gl.drawArrays(gl.TRIANGLES, meshes['crankLeft'].start, meshes['crankLeft'].count);
        }
        if(meshes['crankRight']){
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(pedalModel));
            gl.drawArrays(gl.TRIANGLES, meshes['crankRight'].start, meshes['crankRight'].count);
        }
    }

    requestAnimationFrame(render);
}