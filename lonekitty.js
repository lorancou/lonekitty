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

// log
const MAX_LOG_LINES = 16;
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

    // get canvas context
    g_context = canvasElement.getContext('2d');
    if (!g_context)
    {
        log("ERROR: missing context");
        return;
    }

    gameInit();

    // plan first update
    setTimeout('update()', 0.0);
    
    log("done");
}

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

// game init
function gameInit()
{
}

// game update
function gameUpdate()
{
}
