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


// Part 2, move logic.
function GetEmptyBoard()
{
    return {
        _data: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        get: function(x, y) { return this._data[x][y]; },
        set: function(x, y, number) { this._data[x][y] = number; }
    }
}


function AddRandomNumber(board)
{
    while (true)
    {
        var x = rand(4), y = rand(4);
        if (board.get(x, y) != 0)
            continue;
        else
        {
            board.set(x, y, rand(10) < 9 ? 2 : 4);
            break;
        }
    }
}

function GetInitializedBoard()
{
    var board = GetEmptyBoard();
    AddRandomNumber(board);
    AddRandomNumber(board);
    return board;
}


// Part 3, entry point.
function Main()
{
    var board = GetInitializedBoard();
    console.log(logB(board, true));
}
window.onload = Main;


// Part 4, utils.
function logP(x, y)
{
    return "(" + x + ", " + y + ")";
}

function rand(upBnd)
{
    return Math.floor(Math.random() * upBnd);
}

function logB(board, newline=false)
{
    // TODO: ugly, rewrite.
    var log = "";
    log += newline ? "" : "[";
    for (var y = 0; y < 4; y++)
    {
        for (var x = 0; x < 4; x++)
        {
            log += board.get(x, y);
            if (x != 3)
                log += newline ? " " : ", ";
        }
        if (y != 3)
            log += newline ? "\n" : "], [";
    }
    log += newline ? "" : "]";
    return log;
}
