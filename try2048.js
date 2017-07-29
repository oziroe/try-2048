//
// try2048.js
// An impl of the game "2048" with AI.
//
// Created by oziroe on July 30, 2017.
//


// Part 1, basic interfaces.
function MoveNumber(number, fromX, fromY, toX, toY)
{
    console.log("Moving number " + number + " from " + logP(fromX, fromY) +
        " to " + logP(toX, toY) + ".");
    // TODO: Impl this method.
}

function SubstituteNumber(number, x, y)
{
    console.log("Position " + logP(x, y) + " change to " + number + ".");
    // TODO: Impl this method.
}

function MergeNumber(n, x1, y1, x2, y2, mergeX, mergeY)
{
    MoveNumber(n, x1, y1, mergeX, mergeY);
    MoveNumber(n, x2, y2, mergeX, mergeY);
    SubstituteNumber(n * 2, mergeX, mergeY);
}


// Part 2, entry point.
function Main()
{
    MergeNumber(256, 1, 3, 2, 3, 3, 3);
}
window.onload = Main;


// Part 3, utils.
function logP(x, y)
{
    return "(" + x + ", " + y + ")";
}
