/*
 * lonekitty.js
 * ----------
 *
 * Lone Kitty
 * Copyright (c) 2008 Laurent Couvidou
 * Contact : lorancou@free.fr
 *
 * This program is free software - see README for details.
 */

//-------------------------------------------------------------------------------
// main constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CANVAS_CENTER_X = CANVAS_WIDTH * 0.5;
const CANVAS_CENTER_Y = CANVAS_HEIGHT * 0.5;
const KITTY_SPEED = 5.0;
const KITTY_SIZE = 64;
const LIGHT_SIZE = 256;
const SPIDER_SIZE = 32;
const SPIDER_COUNT = 128;
const SPIDER_FLEE_DIST = 70;
const SPIDER_FLEE_FACTOR = 0.2;
const SPIDER_AREA_RADIUS = 200;

//-------------------------------------------------------------------------------
// log
const MAX_LOG_LINES = 32;
function log(msg)
{
    var begin = "<ul><li>";
    var middle = "</li><li>";
    var end = "</li></ul>";

    console.log(msg);

    var output_div = document.getElementById("output");
    if ( output_div )
    {
        var lines = output_div.innerHTML;
        var lineList;
        
        if (lines.length > 0)
        {
            lineList = lines.substring(begin.length, lines.length - end.length).split(middle);
            while (lineList.length >= MAX_LOG_LINES)
            {
                lineList.shift();
            }
            lineList.push(msg);
        }
        else
        {
            lineList = [ msg ];
        }
        
        output_div.innerHTML = begin +lineList.join(middle) +end;
    }
}

//-------------------------------------------------------------------------------
// main init
var g_context;
function init()
{
    log("initializing...");
    
    // get canvas element
    var canvasElement = document.getElementById("canvas");
    if (!canvasElement)
    {
        log("ERROR: missing canvas element");
        return;
    }

    // set its size
    canvasElement.width = CANVAS_WIDTH;
    canvasElement.height = CANVAS_HEIGHT;

    // get canvas context
    g_context = canvasElement.getContext("2d");
    if (!g_context)
    {
        log("ERROR: missing canvas context");
        return;
    }

    // clear canvas
    g_context.fillStyle = "#000000";
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // inputs init
    document.onkeydown = keyDown;
    document.onkeyup = keyUp;

    // init the interesting stuff
    gameInit();
    
    // run
    setTimeout("update()", 0.0);

    log("done");
}

//-------------------------------------------------------------------------------
// main update
const AIM_FPS = 60.0;
const MIN_DT = 1000.0 / AIM_FPS;
var g_lastTime = new Date().getTime();
var g_tick = 0;
function update()
{
    var time = new Date().getTime();
    var dt = time - g_lastTime;
    var fps = 1000.0 / dt;
   
    // update the intersting stuff
    gameUpdate(dt);
    gameDraw();
    
    // print FPS
    var fpsElement = document.getElementById("fps")
    if (fpsElement)
    {
        var fpsString = fps.toFixed(0);
        fpsElement.innerHTML = "FPS: " + fpsString;
    }
    
    // move on to next update
    g_lastTime = time;
    g_tick++;   
    setTimeout("update()", MIN_DT);
}

//-------------------------------------------------------------------------------
// inputs
var g_ie = document.all ? true : false;	
var g_leftPressed = false;
var g_upPressed = false;
var g_rightPressed = false;
var g_downPressed = false;
function keyDown(e)
{
	var ev = null;
	if (g_ie) ev = event;
	else ev = e;
    if (ev == null) return;
    
	log("key down: " + ev.keyCode);

    switch ( ev.keyCode )
    {
    case 37: case 81: case 65: g_leftPressed = true; break;
    case 38: case 90: case 87: g_upPressed = true; break;
    case 39: case 68: g_rightPressed = true; break;
    case 40: case 83: g_downPressed = true; break;
    }
}
function keyUp(e)
{
	var ev = null;
	if (g_ie) ev = event;
	else ev = e;
    if (ev == null) return;
    
	log("key up: " + ev.keyCode);

    switch ( ev.keyCode )
    {
    case 37: case 81: case 65: g_leftPressed = false; break;
    case 38: case 90: case 87: g_upPressed = false; break;
    case 39: case 68: g_rightPressed = false; break;
    case 40: case 83: g_downPressed = false; break;
    }
}

//-------------------------------------------------------------------------------
// maths
function lerp(t, a, b)
{
    return a + t * (b -a);
}

//-------------------------------------------------------------------------------
// game init
var g_kittyImg;
var g_kittyfImg;
var g_darknessImg;
var g_spiderImg;
var g_spiderX = new Array(SPIDER_COUNT);
var g_spiderY = new Array(SPIDER_COUNT);
var g_spiderOut = new Array(SPIDER_COUNT);
function gameInit()
{
    g_kittyImg = new Image();
    g_kittyImg.src = "kitty.png";
    g_kittyImg.onload = function() {};

    g_kittyfImg = new Image();
    g_kittyfImg.src = "kittyf.png";
    g_kittyfImg.onload = function() {};

    g_darknessImg = new Image();
    g_darknessImg.src = "darkness.png";
    g_darknessImg.onload = function() {};

    g_spiderImg = new Image();
    g_spiderImg.src = "spider.png";
    g_spiderImg.onload = function() {};

    for (var i=0; i<SPIDER_COUNT; ++i)
    {
        g_spiderX[i] = Math.floor(Math.random() * CANVAS_WIDTH);
        g_spiderY[i] = Math.floor(Math.random() * CANVAS_HEIGHT);
        g_spiderOut[i] = false;
    }
}

//-------------------------------------------------------------------------------
// game update
const LIGHT_SMOOTH = 0.3;
const LIGHT_SMOOTH2 = 0.3;
var g_kittyX = CANVAS_WIDTH * 0.5;
var g_kittyY = CANVAS_HEIGHT * 0.5;
var g_kittyFlip = false;
var g_lightX = CANVAS_WIDTH * 0.5;
var g_lightY = CANVAS_HEIGHT * 0.5;
var g_lightTargetX = CANVAS_WIDTH * 0.5;
var g_lightTargetY = CANVAS_HEIGHT * 0.5;
function gameUpdate()
{
    // move kitty
    if (g_leftPressed) g_kittyX -= KITTY_SPEED;
    if (g_upPressed) g_kittyY -= KITTY_SPEED;
    if (g_rightPressed) g_kittyX += KITTY_SPEED;
    if (g_downPressed) g_kittyY += KITTY_SPEED;

    // flip kitty
    if (g_leftPressed && !g_rightPressed && !g_kittyFlip) g_kittyFlip = true;
    if (g_rightPressed && !g_leftPressed && g_kittyFlip) g_kittyFlip = false;

    // move light with a bit of smoothing
    g_lightTargetX = lerp(LIGHT_SMOOTH, g_lightTargetX, g_kittyX);
    g_lightTargetY = lerp(LIGHT_SMOOTH, g_lightTargetY, g_kittyY);
    g_lightX = lerp(LIGHT_SMOOTH2, g_lightX, g_lightTargetX);
    g_lightY = lerp(LIGHT_SMOOTH2, g_lightY, g_lightTargetY);

    // fleeing spiders
    var sqFleeDist = SPIDER_FLEE_DIST*SPIDER_FLEE_DIST;
    var sqAreaRadius = SPIDER_AREA_RADIUS*SPIDER_AREA_RADIUS;
    for (var i=0; i<SPIDER_COUNT; ++i)
    {
        if (!g_spiderOut[i])
        {
            // flee kitty
            var dx = g_spiderX[i] - g_kittyX;
            var dy = g_spiderY[i] - g_kittyY;
            var sqDist = dx*dx + dy*dy;
            if (sqDist < sqFleeDist)
            {
                log("spider " + i + " fleeing");
                var t = 1.0 - (sqDist / sqFleeDist);
                var fleeVecX = t * dx * SPIDER_FLEE_FACTOR;
                var fleeVecY = t * dy * SPIDER_FLEE_FACTOR;
                g_spiderX[i] += fleeVecX;
                g_spiderY[i] += fleeVecY;
            }

            // "die" when outside area
            dx = g_spiderX[i] - CANVAS_CENTER_X;
            dy = g_spiderY[i] - CANVAS_CENTER_Y;
            sqDist = dx*dx + dy*dy;
            if (sqDist > sqAreaRadius)
            {
                g_spiderOut[i] = true;
            }
        }
    }
}

//-------------------------------------------------------------------------------
// game draw
const LIGHT_CLEARSIZE = LIGHT_SIZE * 0.85;
function gameDraw()
{
    // light bottom clear
    var lightClearX = g_lightX - LIGHT_CLEARSIZE * 0.5;
    var lightClearY = g_lightY - LIGHT_CLEARSIZE * 0.5;
    g_context.fillStyle = "#FFFFFF";
    g_context.fillRect(
        lightClearX, lightClearY,
        LIGHT_CLEARSIZE, LIGHT_CLEARSIZE);

    // draw spiders
    // NB: only if inside halo to preserve perf, extra borders prevent popping
    var darknessImgX = g_lightX - LIGHT_SIZE * 0.5;
    var darknessImgY = g_lightY - LIGHT_SIZE * 0.5;
    for (var i=0; i<SPIDER_COUNT; ++i)
    {
        if (!g_spiderOut[i])
        {
            var spiderImgX = g_spiderX[i] - SPIDER_SIZE * 0.5;
            var spiderImgY = g_spiderY[i] - SPIDER_SIZE * 0.5;
            if (spiderImgX > darknessImgX &&
                (spiderImgX+SPIDER_SIZE) < (darknessImgX+LIGHT_SIZE) &&
                spiderImgY > darknessImgY &&
                (spiderImgY+SPIDER_SIZE) < (darknessImgY+LIGHT_SIZE))
            {            
                g_context.drawImage(
                    g_spiderImg,
                    spiderImgX, spiderImgY,
                    SPIDER_SIZE, SPIDER_SIZE);
            }
        }
    }

    // draw spider area
    g_context.beginPath();
    g_context.arc(CANVAS_CENTER_X, CANVAS_CENTER_Y, SPIDER_AREA_RADIUS, 0, Math.PI*2, true);
    g_context.strokeStyle = "black"; // line color
    g_context.closePath();
    g_context.stroke();

    // draw kitty
    var kittyImgX = g_kittyX - KITTY_SIZE * 0.5;
    var kittyImgY = g_kittyY - KITTY_SIZE * 0.5;
    g_context.drawImage(
        g_kittyFlip ? g_kittyfImg : g_kittyImg,
        kittyImgX, kittyImgY,
        KITTY_SIZE, KITTY_SIZE);

    // darkness halo
    g_context.drawImage(
        g_darknessImg,
        darknessImgX, darknessImgY,
        LIGHT_SIZE, LIGHT_SIZE);
}
