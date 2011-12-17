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
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

//-------------------------------------------------------------------------------
// log
const MAX_LOG_LINES = 32;
function log(msg)
{
    var begin = '<ul><li>';
    var middle = '</li><li>';
    var end = '</li></ul>';

    console.log(msg);

    var output_div = document.getElementById("output");
    if ( output_div )
    {
        var lines = output_div.innerHTML; //.toLowerCase();
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
    var canvasElement = document.getElementById('canvas');
    if (!canvasElement)
    {
        log("ERROR: missing canvas");
        return;
    }

    // set its size
    canvasElement.width = CANVAS_WIDTH;
    canvasElement.height = CANVAS_HEIGHT;

    // get canvas context
    g_context = canvasElement.getContext('2d');
    if (!g_context)
    {
        log("ERROR: missing context");
        return;
    }

    // clear canvas
    g_context.fillStyle = '#000000';
    g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    gameInit();

    // plan first update
    setTimeout('update()', 0.0);
    
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
    //log("update");

    var time = new Date().getTime();
    var dt = time - g_lastTime;
    var fps = 1000.0 / dt;
   
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
    setTimeout('update()', MIN_DT);
}

//-------------------------------------------------------------------------------
// game init
var g_kittyImg;
var g_kittyfImg;
var g_darknessImg;
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

    document.onkeydown = keyDown;
    document.onkeyup = keyUp;
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
// game update
const KITTY_SPEED = 5.0;
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

    // reset inputs
    //g_leftPressed = g_upPressed = g_rightPressed = g_downPressed = false;
}

//-------------------------------------------------------------------------------
// game draw
const LIGHT_SIZE = 256;
const LIGHT_CLEARSIZE = LIGHT_SIZE * 0.85;
const KITTY_SIZE = 64;
function gameDraw()
{
    // light bottom clear
    var lightClearX = g_lightX - LIGHT_CLEARSIZE * 0.5;
    var lightClearY = g_lightY - LIGHT_CLEARSIZE * 0.5;
    g_context.fillStyle = '#FFFFFF';
    g_context.fillRect(
        lightClearX, lightClearY,
        LIGHT_CLEARSIZE, LIGHT_CLEARSIZE);
    
    // draw kitty
    var kittyImgX = g_kittyX - KITTY_SIZE * 0.5;
    var kittyImgY = g_kittyY - KITTY_SIZE * 0.5;
    g_context.drawImage(
        g_kittyFlip ? g_kittyfImg : g_kittyImg,
        kittyImgX, kittyImgY,
        KITTY_SIZE, KITTY_SIZE);

    // light darkness halo
    var lightImgX = g_lightX - LIGHT_SIZE * 0.5;
    var lightImgY = g_lightY - LIGHT_SIZE * 0.5;
    g_context.drawImage(
        g_darknessImg,
        lightImgX, lightImgY,
        LIGHT_SIZE, LIGHT_SIZE);
}
