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

function MergeNumber(n, x, y, mergeX, mergeY)
{
    MoveNumber(n, x, y, mergeX, mergeY);
    SubstituteNumber(n * 2, mergeX, mergeY);
}


// Part 2, move logic.
function EmptyBoard()
{
    this._data = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    this.get = function(x, y) { return this._data[x][y]; };
    this.set = function(x, y, number) { this._data[x][y] = number; };
    this.context = new ActionContext();
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
            var n = rand(10) < 9 ? 2 : 4;
            board.set(x, y, n);
            board.context.EmergeHandler(n, x, y);
            break;
        }
    }
}

function GetInitializedBoard()
{
    var board = new EmptyBoard();
    AddRandomNumber(board);
    AddRandomNumber(board);
    return board;
}

function ActionContext()
{
    var self = this;
    this._data = {move: [], substitute: []};
    this.MoveHandler = function(number, fromX, fromY, toX, toY)
    {
        self._data.move.push({fromX: fromX, fromY: fromY, toX: toX,
            toY: toY, number: number});
    };
    this.MergeHandler = function(number, fromX, fromY, toX, toY)
    {
        // console.log(self);
        self._data.move.push({fromX: fromX, fromY: fromY, toX: toX,
            toY: toY, number: number});
        self._data.substitute.push({x: toX, y: toY, number: number * 2});
    };
    this.EmergeHandler = function(number, x, y)
    {
        self._data.substitute.push({x: x, y: y, number: number});
    }
    this.Trigger = function(delay)
    {
        function SubstituteProccess()
        {
            while (self._data.substitute.length > 0)
            {
                var sub = self._data.substitute.pop();
                SubstituteNumber(sub.number, sub.x, sub.y);
            }
        }

        if (self._data.move.length > 0)
        {
            while (self._data.move.length > 0)
            {
                var move = self._data.move.pop();
                MoveNumber(move.number, move.fromX, move.fromY, move.toX,
                    move.toY);
            }
            if (self._data.substitute.length > 0)
            {
                setTimeout(SubstituteProccess, delay * 1000);
            }
        }
        else
            SubstituteProccess();
    };
}

function SlideBoard(board, direction, move, merge)
{
    // direction: 0 up, 1 right, 2 down, 3 left
    var moved = false;
    if (direction == 0 || direction == 2)
    {
        for (var x = 0; x < 4; x++)
        {
            var vector = new Array();
            for (var y = 0; y < 4; y++)
                vector.push(board.get(x, y));
            function VectorMove(num, from, to)
            {
                // console.log("moving from " + from + " to " + to);
                move(num, x, from, x, to);
            }
            function VectorMerge(num, from, to)
            {
                // console.log("merging from " + from + " to " + to);
                merge(num, x, from, x, to);
            }
            var m = SlideVector(vector, direction == 0 ? 0 : 1, VectorMove,
                VectorMerge);
            moved = m ? true : moved;
            for (y = 0; y < 4; y++)
                board.set(x, y, vector[y]);
        }
    }
    else
    {
        for (var y = 0; y < 4; y++)
        {
            // console.log("working on col #" + y);
            function VectorMove(num, from, to)
            {
                // console.log("moving from " + from + " to " + to);
                move(num, from, y, to, y);
            }
            function VectorMerge(num, from, to)
            {
                // console.log("merging from " + from + " to " + to);
                merge(num, from, y, to, y);
            }
            var vector = new Array();
            for (var x = 0; x < 4; x++)
                vector.push(board.get(x, y));
            var m = SlideVector(vector, direction == 3 ? 0 : 1, VectorMove,
                VectorMerge);
            moved = m ? true : moved;
            for (x = 0; x < 4; x++)
                board.set(x, y, vector[x]);
        }
    }
    if (moved)
    {
        AddRandomNumber(board);
        return AliveSituation(board);
    }
    else
        return true;
}

function SlideVector(numbers, destination, move, merge)
{
    // destination: 0 to the start of vector, 1 to the end
    var modifiable = [true, true, true, true];
    var start = destination ? 2 : 1;  // Number already at dest shall not move.
    var moved = false;
    for (var i = start; i >= 0 && i <= 3; i = destination ? i - 1 : i + 1)
    {
        // console.log("  working on number#" + i + "(" + numbers[i] + ")");
        if (numbers[i] == 0)
            continue;
        var rangeStart = destination ? i + 1 : i - 1;
        for (var j = rangeStart; j >= 0 && j <= 3;
                j = destination ? j + 1 : j - 1)
        {
            // The moved position should not be modified again.
            if (!modifiable[j])
            {
                // console.log("Postion #" + j + " has been moved.");

                var arrived = destination ? j - 1 : j + 1;
                if (i != arrived)
                {
                    move(numbers[i], i, arrived);
                    numbers[arrived] = numbers[i];
                    numbers[i] = 0;
                    moved = true;
                }
                break;
            }
            if (numbers[j] != 0)
            {
                // console.log("Postion #" + j + " not zero.");
                if (numbers[j] == numbers[i])
                {
                    merge(numbers[i], i, j);
                    // console.log(numbers);
                    numbers[j] += numbers[i];
                    numbers[i] = 0;
                    modifiable[j] = false;
                    moved = true;
                }
                else
                {
                    var arrived = destination ? j - 1 : j + 1;
                    if (i != arrived)
                    {
                        move(numbers[i], i, arrived);
                        numbers[arrived] = numbers[i];
                        numbers[i] = 0;
                        moved = true;
                    }
                }
                break;
            }
            // Move to empty position on the edge.
            if (j == (destination ? 3 : 0))
            {
                move(numbers[i], i, j);
                // console.log(numbers);
                numbers[j] = numbers[i];
                numbers[i] = 0;
                moved = true;
                break;
            }
        }
    }
    return moved;
}


// Part 3, entry point.
function Main()
{
    var board = GetInitializedBoard();
    console.log(logB(board, true));
    context = board.context;
    context.Trigger(0.5);
    function KeyPressHandler(event)
    {
        var map = {w: 0, d: 1, s: 2, a: 3};
        if (event.key in map)
        {
            var alive = SlideBoard(board, map[event.key], context.MoveHandler,
                context.MergeHandler);
            if (alive)
            {
                console.log(logB(board, true));
                context.Trigger(0.5);
            }
            else
            {
                console.log("Game over.");
                window.onkeypress = null;
            }
        }
    }
    window.onkeypress = KeyPressHandler;
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
    log = "";
    if (newline)
    {
        for (var y = 0; y < 4; y++)
        {
            for (var x = 0; x < 4; x++)
                log += board.get(x, y) + " ";
            if (y < 3)
                log += "\n";
        }
    }
    else
    {
        log += "[";
        for (var y = 0; y < 4; y++)
        {
            log += "[";
            for (var x = 0; x < 4; x++)
            {
                log += board.get(x, y);
                if (x < 3)
                    log += ", ";
            }
            log += "]";
            if (y < 3)
                log += ", ";
        }
        log += "]";
    }
    return log;
}

function AliveSituation(board)
{
    for (var x = 0; x < 4; x++)
    {
        for (var y = 0; y < 4; y++)
        {
            if (board.get(x, y) == 0)
                return true;

            if (x > 0 && board.get(x - 1, y) == board.get(x, y))
                return true;
            if (x < 3 && board.get(x + 1, y) == board.get(x, y))
                return true;
            if (y > 0 && board.get(x, y - 1) == board.get(x, y))
                return true;
            if (y < 3 && board.get(x, y + 1) == board.get(x, y))
                return true;
        }
    }
    return false;
}
