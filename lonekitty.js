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
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;
const CANVAS_CENTER_X = CANVAS_WIDTH * 0.5;
const CANVAS_CENTER_Y = CANVAS_HEIGHT * 0.5;
const KITTY_SPEED = 2.0;
const KITTY_SIZE = 64;
const KITTY_FRAME_COUNT = 2;
const KITTY_ANIM_SPEED = 0.1;
const LIGHT_MIN_SIZE = 128;
const LIGHT_MAX_SIZE = 350;
const SPIDER_SPEED = 0.5;
const SPIDER_TURN_SPEED = 0.01;
const SPIDER_SIZE = 32;
const SPIDER_FRAME_COUNT = 16;
const SPIDER_ANIM_SPEED = 0.01;
const SPIDERDEATH_FRAME_COUNT = 4;
const SPIDERDEATH_ANIM_SPEED = 0.05;
const SPIDER_COUNT = 128;
const SPIDER_FLEE_MARGIN = 20;
const SPIDER_FLEE_FACTOR = 5.0;
const SPIDER_SAFE_MARGIN = 100;
const AREA_RADIUS = 210;
const EXIT_URL = "http://www.youtube.com/v/QH2-TGUlwu4?autoplay=1";
const START_FLEE_DIST = 60;
const END_FLEE_DIST = 80;
const END_FLEE_DIST_GROW = 0.5;

//-------------------------------------------------------------------------------
// log
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
            const MAX_LOG_LINES = 20;
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
var g_lastTime = new Date().getTime();
var g_tick = 0;
var g_exited = false;
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
    if (!g_exited)
    {
        const AIM_FPS = 60.0;
        const MIN_DT = 1000.0 / AIM_FPS;
        setTimeout("update()", MIN_DT);
    }
}

//-------------------------------------------------------------------------------
// exit
function exit()
{
    log("exit");
    window.location = EXIT_URL;
    g_exited = true;
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
    
	//log("key down: " + ev.keyCode);

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
    
	//log("key up: " + ev.keyCode);

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
function clamp(v, min, max)
{
    if (v < min) return min;
    if (v > max) return max;
    return v;
}

//-------------------------------------------------------------------------------
// animation
function drawAnimated(img, imgX, imgY, width, height, cursor, frameCount)
{
    var frame = Math.floor(cursor * frameCount);
    var frameWidth = img.width / frameCount;
    var sourceX = (frame % frameCount) * frameWidth;
    var sourceY = 0;
    // log("sourceX= " + sourceX + " sourceY= " + sourceY);
    // log("frameWidth= " + frameWidth);
    // log("imgX= " + imgX + " imgY= " + imgY);
    // log("width= " + width + " height= " + height);
    g_context.drawImage(
        img,
        sourceX, sourceY,
        frameWidth, img.height,
        imgX, imgY,
        width, height);
}

//-------------------------------------------------------------------------------
// game init
var g_kittyImg;
var g_kittyfImg;
var g_kittysleepImg;
var g_kittysleepfImg;
var g_darknessImg;
var g_spiderImg;
var g_spiderdeathImg;
var g_areaImg;
const MEOW_SFX_COUNT = 1;
var g_meowSfx = new Array(MEOW_SFX_COUNT);
const POUITCH_SFX_COUNT = 3;
var g_pouitchSfx = new Array(MEOW_SFX_COUNT);
var g_lastPouitchTick = 0;
var g_footstepSfx;
var g_spiderX = new Array(SPIDER_COUNT);
var g_spiderY = new Array(SPIDER_COUNT);
var g_spiderAngle = new Array(SPIDER_COUNT);
var g_spiderTargetAngle = new Array(SPIDER_COUNT);
var g_spiderTurnCursor = new Array(SPIDER_COUNT);
var g_spiderAnimCursor = new Array(SPIDER_COUNT);
var g_spiderdeathAnimCursor = new Array(SPIDER_COUNT);
var g_spiderOut = new Array(SPIDER_COUNT);
var g_smReady = false;
function gameInit()
{
    g_kittyImg = new Image();
    g_kittyImg.src = "kitty.png";
    g_kittyImg.onload = function() { /* game should wait for this to start, but meh. */ };

    g_kittyfImg = new Image();
    g_kittyfImg.src = "kittyf.png";
    g_kittyfImg.onload = function() {};

    g_kittysleepImg = new Image();
    g_kittysleepImg.src = "kittysleep.png";
    g_kittysleepImg.onload = function() { /* game should wait for this to start, but meh. */ };

    g_kittysleepfImg = new Image();
    g_kittysleepfImg.src = "kittysleepf.png";
    g_kittysleepfImg.onload = function() {};

    g_darknessImg = new Image();
    g_darknessImg.src = "darkness.png";
    g_darknessImg.onload = function() {};

    g_spiderImg = new Image();
    g_spiderImg.src = "spider.png";
    g_spiderImg.onload = function() {};

    g_spiderdeathImg = new Image();
    g_spiderdeathImg.src = "spiderdeath.png";
    g_spiderdeathImg.onload = function() {};

    g_areaImg = new Image();
    g_areaImg.src = "area.png";
    g_areaImg.onload = function() {};

    // grr doesnt work
    /*soundManager.url='swf'
    soundManager.debugMode=false;
    soundManager.flashVersion='9';
    soundManager.bgColor='#666666';
    soundManager.useFlashBlock=true;
    var snd = {};
    function init_snd(){
	    snd.laser = soundManager.createSound({
			id:'snd_laser',
	   		url:'warmkitty.ogg',
			autoPlay: true,
			autoLoad: true,
	    });
        g_smReady = true;
    }
    soundManager.onready(init_snd);*/

    for (var i=0; i<MEOW_SFX_COUNT; ++i)
    {
        g_meowSfx[i] = new Audio();
        g_meowSfx[i].src = "meow" + i + ".mp3"
        //g_meowSfx[i].src = "footstep.mp3";
        //g_meowSfx[i].load();
    }

    for (var i=0; i<POUITCH_SFX_COUNT; ++i)
    {
        g_pouitchSfx[i] = new Audio();
        g_pouitchSfx[i].src = "pouitch" + i +".mp3";
        //g_pouitchSfx[i].src = "footstep.mp3";
        //g_pouitchSfx[i].load();
    }

    g_footstepSfx = new Audio();
    g_footstepSfx.src = "footstep.mp3";
    //g_footstepSfx.loop = true;
    //g_footstepSfx.play();

    for (var i=0; i<SPIDER_COUNT; ++i)
    {
        var minDist = LIGHT_MIN_SIZE * 0.5;
        var distFromCenter = minDist + Math.random() * (AREA_RADIUS - minDist);
        var angle = Math.random() * Math.PI * 2;

        //log("spider spawn " + i + " d=" + distFromCenter + " a=" + angle);

        g_spiderX[i] = CANVAS_CENTER_X + distFromCenter * Math.cos(angle);
        g_spiderY[i] = CANVAS_CENTER_Y + distFromCenter * Math.sin(angle);

        g_spiderAngle[i] = Math.random() * Math.PI * 2;
        g_spiderTargetAngle[i] = Math.random() * Math.PI * 2;
        g_spiderTurnCursor[i] = Math.random();

        g_spiderAnimCursor[i] = Math.random();
        g_spiderdeathAnimCursor[i] = 0.0;

        g_spiderOut[i] = false;
    }
}

//-------------------------------------------------------------------------------
// game update
var g_kittyX = CANVAS_WIDTH * 0.5;
var g_kittyY = CANVAS_HEIGHT * 0.5;
var g_kittyFlip = false;
var g_kittyMoving = false;
var g_kittyAnimCursor = 0.0;
var g_lightX = CANVAS_WIDTH * 0.5;
var g_lightY = CANVAS_HEIGHT * 0.5;
var g_lightTargetX = CANVAS_WIDTH * 0.5;
var g_lightTargetY = CANVAS_HEIGHT * 0.5;
var g_lightSize = LIGHT_MIN_SIZE;
var g_deadSpiderCount = 0;
var g_fadeStarted = false;
var g_fadeTick = 0;
const FADE_TICK_COUNT = 100;
function gameUpdate()
{
    // move kitty
    g_kittyMoving = false;
    if (!g_fadeStarted)
    {
        if (g_leftPressed)
        {
            g_kittyX -= KITTY_SPEED;
            g_kittyMoving = true;
        }
        if (g_upPressed)
        {
            g_kittyY -= KITTY_SPEED;
            g_kittyMoving = true;
        }
        if (g_rightPressed)
        {
            g_kittyX += KITTY_SPEED;
            g_kittyMoving = true;
        }
        if (g_downPressed)
        {
            g_kittyY += KITTY_SPEED;
            g_kittyMoving = true;
        }
    }

    // meow and footsteps once in a while
    if (g_kittyMoving && 0==(g_tick%80))
    {
        var index = Math.floor(Math.random() * (MEOW_SFX_COUNT+5));
        if (index < MEOW_SFX_COUNT)
        {
            //log(g_meowSfx[index].src);
            g_meowSfx[index].play();
        }
        else
        {
            //log(g_footstepSfx.src);
            g_footstepSfx.play();
        }
    }

    // restrict to spider area
    var sqAreaRadius = AREA_RADIUS*AREA_RADIUS;
    var dx = g_kittyX - CANVAS_CENTER_X;
    var dy = g_kittyY - CANVAS_CENTER_Y;
    var sqDist = dx*dx + dy*dy;
    if (sqDist > sqAreaRadius)
    {
        // maybe proper collision handling would be less glitchy :-/
        //log("bringing kitty back to spider area");
        var t = sqAreaRadius / sqDist;
        g_kittyX = CANVAS_CENTER_X + dx * t;
        g_kittyY = CANVAS_CENTER_Y + dy * t;
    }

    // flip kitty
    if (g_leftPressed && !g_rightPressed && !g_kittyFlip) g_kittyFlip = true;
    if (g_rightPressed && !g_leftPressed && g_kittyFlip) g_kittyFlip = false;

    // update kitty anim cursor
    g_kittyAnimCursor += KITTY_ANIM_SPEED;

    // move light with a bit of smoothing
    const LIGHT_SMOOTH = 0.3;
    const LIGHT_SMOOTH2 = 0.3;
    g_lightTargetX = lerp(LIGHT_SMOOTH, g_lightTargetX, g_kittyX);
    g_lightTargetY = lerp(LIGHT_SMOOTH, g_lightTargetY, g_kittyY);
    g_lightX = lerp(LIGHT_SMOOTH2, g_lightX, g_lightTargetX);
    g_lightY = lerp(LIGHT_SMOOTH2, g_lightY, g_lightTargetY);

    // update light size
    var progress = g_deadSpiderCount / SPIDER_COUNT;
    if (!g_fadeStarted)
    {
        g_lightSize = lerp(
            progress,
            LIGHT_MIN_SIZE, LIGHT_MAX_SIZE
        );

        // glow
        const GLOW_AMP = 15.0;
        var t = g_tick * 0.04 % (Math.PI * 2);
        var glow = Math.cos(t) * GLOW_AMP;
        //log ("t=" + t + " glow=" + glow);
        g_lightSize += glow;
    }
    else
    {
        g_lightSize = lerp(
            g_fadeTick / FADE_TICK_COUNT,
            LIGHT_MAX_SIZE, LIGHT_MIN_SIZE
        );
    }

    // spiders
    var fleeDist = END_FLEE_DIST;
    if (progress < END_FLEE_DIST_GROW)
    {
        fleeDist = lerp(progress/END_FLEE_DIST_GROW, START_FLEE_DIST, END_FLEE_DIST);
    }
    //log(fleeDist);
    var sqFleeDist = fleeDist * fleeDist;
    g_deadSpiderCount = 0;
    for (var i=0; i<SPIDER_COUNT; ++i)
    {
        if (!g_spiderOut[i])
        {
            var fleeing = false;

            // vector: kitty -> spider
            dx = g_spiderX[i] - g_kittyX;
            dy = g_spiderY[i] - g_kittyY;
            sqDist = dx*dx + dy*dy;
            if (sqDist < sqFleeDist)
            {
                //log("spider " + i + " fleeing");
                // t = 1.0 - (sqDist / sqFleeDist);
                // g_spiderX[i] += t * dx * SPIDER_FLEE_FACTOR;
                // g_spiderY[i] += t * dy * SPIDER_FLEE_FACTOR;

                // flee kitty
                var newAngle = Math.atan2(dy, dx);
                g_spiderAngle[i] = newAngle;
                g_spiderTargetAngle[i] = newAngle;
                fleeing = true;
            }
            else
            {
                // vector: canvas center -> spider
                dx = g_spiderX[i] - CANVAS_CENTER_X;
                dy = g_spiderY[i] - CANVAS_CENTER_Y;
                sqDist = dx*dx + dy*dy;
                if (sqDist < (sqAreaRadius - SPIDER_SAFE_MARGIN*SPIDER_SAFE_MARGIN))
                {
                    // if in safe zone, move randomly 
                    g_spiderTurnCursor[i] += SPIDER_TURN_SPEED;
                    while (g_spiderTurnCursor[i] > 1.0)
                    {
                        g_spiderAngle[i] = Math.random() * Math.PI * 2;
                        g_spiderTargetAngle[i] = Math.random() * Math.PI * 2;
                        g_spiderTurnCursor[i] -= 1.0;
                    }
                }
                else
                {
                    // otherwise move towards center
                    var newAngle = Math.atan2(-dy, -dx);
                    g_spiderAngle[i] = newAngle;
                    g_spiderTargetAngle[i] = newAngle;
                }
            }

            // move in chosen direction
            var angle = lerp(g_spiderTurnCursor[i], g_spiderAngle[i], g_spiderTargetAngle[i]);
            var speed = SPIDER_SPEED;
            if (fleeing)
            {
                speed *= SPIDER_FLEE_FACTOR;
            }
            g_spiderX[i] += Math.cos(angle) * speed;
            g_spiderY[i] += Math.sin(angle) * speed;

            // update animation cursor
            g_spiderAnimCursor[i] += SPIDER_ANIM_SPEED;
            while (g_spiderAnimCursor[i] > 1.0)
            {
                g_spiderAnimCursor[i] -= 1.0;
            }

            // "die" when outside area
            dx = g_spiderX[i] - CANVAS_CENTER_X;
            dy = g_spiderY[i] - CANVAS_CENTER_Y;
            sqDist = dx*dx + dy*dy;
            if (sqDist > sqAreaRadius)
            {
                //log("spider " + i + " out");
                g_spiderOut[i] = true;

                // play "pouitch" sfx
                if ((g_tick - g_lastPouitchTick) > 15)
                {
                    var index = Math.floor(Math.random() * POUITCH_SFX_COUNT);
                    //log(g_pouitchSfx[index].src);
                    g_pouitchSfx[index].play();

                    g_lastPouitchTick = g_tick;
                }
            }
        }
        else if (g_spiderdeathAnimCursor[i] < 1.0)
        {
            // update death anim cursor
            g_spiderdeathAnimCursor[i] += SPIDERDEATH_ANIM_SPEED;
        }
        else
        {
            ++g_deadSpiderCount;
        }
    }

    // win condition: all spiders out and dead
    if (g_deadSpiderCount == SPIDER_COUNT && !g_fadeStarted)
    {
        g_fadeStarted = true;
    }

    // fade to black
    if (g_fadeStarted)
    {
        //log(g_fadeTick);
        if ((g_fadeTick++) > FADE_TICK_COUNT)
        {
            exit();
        }
    }
}

//-------------------------------------------------------------------------------
// game draw
function gameDraw()
{
    // clear
    // g_context.fillStyle = "white";
    // g_context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // draw area / clear canvas (partly)
    // NB: this works as long as the area image fits the canvas
    var darknessImgX = Math.floor(g_lightX - g_lightSize * 0.5);
    var darknessImgY = Math.floor(g_lightY - g_lightSize * 0.5);
    var leftX = clamp(darknessImgX, 0, CANVAS_WIDTH);
    var topY = clamp(darknessImgY, 0, CANVAS_HEIGHT);
    var rightX = clamp(darknessImgX + g_lightSize, 0, CANVAS_WIDTH);
    var bottomY = clamp(darknessImgY + g_lightSize, 0, CANVAS_HEIGHT);
    //log ("lx=" + leftX + " ty=" + topY + " rx=" + rightX + " by=" + bottomY);
    g_context.drawImage(
        g_areaImg,
        leftX, topY,                    // source pos
        rightX - leftX, bottomY - topY, // source size
        leftX, topY,                    // dest pos
        rightX - leftX, bottomY - topY  // dest size
    );

    // draw spiders
    // NB: only if inside halo to preserve perf
    for (var i=0; i<SPIDER_COUNT; ++i)
    {
        var spiderImgX = g_spiderX[i] - SPIDER_SIZE * 0.5;
        var spiderImgY = g_spiderY[i] - SPIDER_SIZE * 0.5;
        if ((spiderImgX + SPIDER_SIZE) > darknessImgX &&
            spiderImgX < (darknessImgX + g_lightSize) &&
            (spiderImgY + SPIDER_SIZE) > darknessImgY &&
            spiderImgY < (darknessImgY + g_lightSize))
        {
            if (!g_spiderOut[i])
            {
                drawAnimated(
                    g_spiderImg,
                    spiderImgX, spiderImgY,
                    SPIDER_SIZE, SPIDER_SIZE,
                    g_spiderAnimCursor[i], SPIDER_FRAME_COUNT
                );
            }
            else if (g_spiderdeathAnimCursor[i] < 1.0)
            {
                drawAnimated(
                  g_spiderdeathImg,
                    spiderImgX, spiderImgY,
                    SPIDER_SIZE, SPIDER_SIZE,
                    g_spiderdeathAnimCursor[i],
                    SPIDERDEATH_FRAME_COUNT
                );
            }
        }
    }

    // draw kitty
    var kittyImgX = g_kittyX - KITTY_SIZE * 0.5;
    var kittyImgY = g_kittyY - KITTY_SIZE * 0.5;
    var kittyImg;
    var kittyFrameCount;
    if (g_kittyMoving)
    {
        if (g_kittyFlip)
        {
            kittyImg = g_kittyfImg;
            kittyFrameCount = KITTY_FRAME_COUNT;
        }
        else
        {
            kittyImg = g_kittyImg;
            kittyFrameCount = KITTY_FRAME_COUNT;
        }
    }
    else
    {
        if (g_kittyFlip)
        {
            kittyImg = g_kittysleepfImg;
            kittyFrameCount = 1;
        }
        else
        {
            kittyImg = g_kittysleepImg;
            kittyFrameCount = 1;
        }
    }
    drawAnimated(
        kittyImg,
        kittyImgX, kittyImgY,
        KITTY_SIZE, KITTY_SIZE,
        g_kittyAnimCursor,
        kittyFrameCount
    );

    // darkness halo
    g_context.drawImage(
        g_darknessImg,
        darknessImgX, darknessImgY,
        g_lightSize, g_lightSize);

    // extra clearing strips to hide spiders
    var clearSize = g_lightSize + SPIDER_SIZE * 2;
    var clearX = g_lightX - clearSize * 0.5;
    var clearY = g_lightY - clearSize * 0.5;
    const MARGIN = 2;
    var xleft = clearX - MARGIN;
    var xright = clearX + g_lightSize + SPIDER_SIZE - MARGIN;
    var xleft2 = clearX + SPIDER_SIZE - MARGIN;
    var ytop = clearY - MARGIN;
    var ybottom = clearY + g_lightSize + SPIDER_SIZE - MARGIN;
    var vwidth = SPIDER_SIZE + MARGIN * 2;
    var vheight = clearSize + MARGIN * 2;
    var hwidth = g_lightSize + MARGIN * 2;
    var hheight = SPIDER_SIZE + MARGIN * 2;
    g_context.fillStyle = "black";
    g_context.fillRect(xleft, ytop, vwidth, vheight); // left strip
    g_context.fillRect(xright, ytop, vwidth, vheight); // right strip
    g_context.fillRect(xleft2, ytop, hwidth, hheight); // top strip
    g_context.fillRect(xleft2, ybottom, hwidth, hheight); // top strip
    // debug draw
    // g_context.strokeStyle = "red";
    // g_context.strokeRect(clearX+4, clearY+4, clearSize-8, clearSize-8);

    if (g_fadeStarted)
    {
        var alpha = g_fadeTick / FADE_TICK_COUNT;
        g_context.fillStyle = "rgba(0,0,0," + alpha +")";
        //log(g_context.fillStyle);
        g_context.fillRect(clearX, clearY, clearSize, clearSize); // full clear rect
    }
}
