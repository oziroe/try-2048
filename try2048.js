/*
 * try2048.js
 * An implementation of game "2048" with a robot player.
 *
 * Restarted by oziroe on July 31, 2017.
 */

// Interface Part.
// There may be many ways to present numbers on the screen, and I prefer the
// dummiest one.
// Change the implementation of this part if I change my mind in the future.
// Notice: All of these interfaces should return immediately. The action may
// last for a long time after calling. However, the hook function argument
// `finished` shall be called after the actual process.
function Advent(x, y, number, finished)
{
    console.log("Number " + number + " appears at " + StringP(x, y));
    DisplayAdvent(x, y, number, finished);
}

function Move(x, y, newX, newY, finished)
{
    console.log("The number at " + StringP(x, y) + " is now at " +
        StringP(newX, newY));
    DisplayMove(x, y, newX, newY, finished);
}

function Substitute(x, y, number, finished)
{
    console.log("The number at " + StringP(x, y) + " is now changed to " +
        number);
    DisplaySubstitute(x, y, number, finished);
}

function Score(score)
{
    DisplayScore(score);
}


// Basic Logic Part.
// There are some promises when calling basic interfaces, such as the order of
// a "turn" should be move -> substitute -> advent. This part would provide
// a higher level of abstraction for this purpose.
// Additionally, basic operation "merge" is a combination of move and
// substitute, which will also be defined in the part.
function Turn()
{
    this._actions = {advent: [], move: [], substitute: []};
    this._remain  = {advent: 0, move: 0, substitute: 0};
    this._score = 0;
    var self = this;

    this.Advent = function(x, y, number)
    {
        self._remain.advent++;
        self._actions.advent.push({x: x, y: y, number: number});
    };

    this.Move = function(x, y, newX, newY)
    {
        self._remain.move++;
        self._actions.move.push({x1: x, y1: y, x2: newX, y2: newY});
    };

    this.Merge = function(x, y, toX, toY, number)
    {
        self.Move(x, y, toX, toY);
        self._remain.substitute++;
        self._actions.substitute.push({x: toX, y: toY, number: number * 2});
        self._score += number;
    };

    this.Trigger = function(afterMove, afterSubstitute, afterAdvent, afterAll)
    {
        Score(self._score);

        function CommonPatternHere(dataSet, call, decrease, beforeNext,
            after)
        {
            return function()
            {
                if (dataSet.length === 0)
                {
                    after();
                    return;
                }
                while (dataSet.length > 0)
                {
                    var data = dataSet.pop();
                    call(data, function()
                    {
                        // It is heard that in Javascript there's no data race.
                        // The following code need fix if I was wrong.
                        // `decrease` will change count value and return its new
                        // value. It must be wrapped to change the origin var.
                        if (decrease() === 0)
                        {
                            if (beforeNext !== null)
                                beforeNext();
                            after();
                        }
                    });
                }
            };
        };
        // Unfortunately, because of the limitation of javascript, this wrapper
        // can only used for a specific kind of function.
        // If applying it to universal functions with varying number of
        // arguments, supporting within that function is needed.
        function CurryList()
        {
            this._list = [];
            var self = this;
            this.Call = function(dataSet, call, decrease, beforeNext)
            {
                self._list.push({dataSet: dataSet, call: call,
                    decrease: decrease, beforeNext: beforeNext});
                return self;
            };
            this.List = function()
            {
                return self._list.map(function(argument)
                {
                    return function(after)
                    {
                        return CommonPatternHere(argument.dataSet,
                            argument.call, argument.decrease,
                            argument.beforeNext, after);
                    };
                });
            };
        }
        new CurryList()
        .Call(self._actions.move,
            function(move, finished) {
                Move(move.x1, move.y1, move.x2, move.y2, finished);
            }, function() {  // I want pointer!
                return --self._remain.move;
            }, afterMove)
        .Call(self._actions.substitute,
            function(sub, finished) {
                Substitute(sub.x, sub.y, sub.number, finished);
            }, function() {
                return --self._remain.substitute;
            }, afterAdvent)
        .Call(self._actions.advent,
            function(advent, finished) {
                Advent(advent.x, advent.y, advent.number, finished);
            }, function() {
                return --self._remain.advent;
            }, afterAdvent)
        .List().reduceRight(
            function(after, previous) { return previous(after); },
            function() {
                if (afterAll !== null)
                    afterAll();
                console.log("All done for this turn.");
            })();
    };
}


// Slide Logic Part.
// A "slide" is the basic action player can do. The chess board object will also
// be defined in this part. Actually, a slide will be deconstructed into actions
// that all finish in one ture.
function Grid(size)
{
    this._grid = new Array(size);
    for (var i = 0; i < this._grid.length; i++)
    {
        this._grid[i] = new Array(size);
        for (var j = 0; j < this._grid[i].length; j++)
            this._grid[i][j] = 0;  // 0 means no number here.
    }
    var self = this;

    this.AddRandom = function(turn)
    {
        var full = true;
        for (var x = 0; x < size; x++)
        {
            for (var y = 0; y < size; y++)
            {
                if (self._grid[x][y] === 0)
                {
                    full = false;
                    break;
                }
            }
        }
        if (full)
            return false;

        while (true)
        {
            var x = Random(size), y = Random(size);
            if (self._grid[x][y] === 0)
            {
                var num = Random(10) > 0 ? 2 : 4;
                self._grid[x][y] = num;
                turn.Advent(x, y, num);
                break;
            }
        }
    };

    // `direction`: 0 => up, 1 => right, 2 => down, 3 => left.
    this.Slide = function(direction, turn)
    {
        // Slide `numbers` toward numbers[0].
        function SlideVector(numbers, move, merge)
        {
            var merged = new Array(size);
            for (var i = 0; i < merged.length; i++)
                merged[i] = false;
            var changed = false;
            for (var i = 1; i < size; i++)  // First number stays.
            {
                if (numbers[i] === 0)
                    continue;

                for (var j = i - 1; j >= 0; j--)
                {
                    if (merged[j])  // Merged number will not be modified again.
                    {
                        if (j + 1 !== i)
                        {
                            changed = true;
                            move(i, j + 1);
                            numbers[j + 1] = numbers[i];
                            numbers[i] = 0;
                        }
                        break;
                    }

                    if (numbers[j] !== 0)
                    {
                        if (numbers[j] === numbers[i])  // Merge same numbers.
                        {
                            changed = true;
                            merge(i, j, numbers[i]);
                            merged[j] = true;
                            numbers[j] += numbers[i];
                            numbers[i] = 0;
                        }
                        else  // Move to neighbour.
                        {
                            if (j + 1 !== i)
                            {
                                changed = true;
                                move(i, j + 1);
                                numbers[j + 1] = numbers[i];
                                numbers[i] = 0;
                            }
                        }
                        break;
                    }

                    if (j === 0)  // Stop moving on the edge.
                    {
                        changed = true;
                        move(i, 0);
                        numbers[0] = numbers[i];
                        numbers[i] = 0;
                        break;
                    }
                }
            }
            return changed;
        }

        var UP = 0, RIGHT = 1, DOWN = 2, LEFT = 3;
        var changed = false;
        for (var first = 0; first < size; first++)
        {
            var numbers = new Array(size), iX = new Array(size),
                iY = new Array(size);
            for (var second = 0; second < size; second++)
            {
                var sec = direction === UP || direction === LEFT ? second :
                    size - second - 1;
                // I hate 80 ruler.
                iX[second] =
                    direction === UP || direction === DOWN ? first : sec;
                iY[second] =
                    direction === UP || direction === DOWN ? sec : first;
                // console.log(second + " " + StringP(iX[second], iY[second]));
                numbers[second] = self._grid[iX[second]][iY[second]];
            }
            // It's a little breaking my rule to put left brace on the same line
            // of previous code, but it seems too ugly otherwise.
            var c = SlideVector(numbers, function(from, to) {
                turn.Move(iX[from], iY[from], iX[to], iY[to]);
                self._grid[iX[to]][iY[to]] = self._grid[iX[from]][iY[from]];
                self._grid[iX[from]][iY[from]] = 0;
            }, function(from, to, number) {
                turn.Merge(iX[from], iY[from], iX[to], iY[to], number);
                self._grid[iX[to]][iY[to]] += self._grid[iX[from]][iY[from]];
                self._grid[iX[from]][iY[from]] = 0;
            });
            changed = c ? true : changed;
        }

        if (changed)
            self.AddRandom(turn);
        return changed;
    };

    this.Over = function()
    {
        for (var x = 0; x < size; x++)
        {
            for (var y = 0; y < size; y++)
            {
                if (self._grid[x][y] === 0)
                    return false;
                if ((x > 0 && self._grid[x - 1][y] === self._grid[x][y]) ||
                    (x < size - 1 && self._grid[x + 1][y]
                        // I hate 80 ruler, again.
                        === self._grid[x][y]) ||
                    (y > 0 && self._grid[x][y - 1] === self._grid[x][y]) ||
                    (y < size - 1 && self._grid[x][y + 1]
                        === self._grid[x][y]))
                    return false;
            }
        }
        return true;
    };
}


// Display Part.
// This is the base of a more complicated implementation of interfaces.
function DisplayInitialize()
{
    var container = document.createElement("div");
    container.id = "board-tiles-container";
    container.style.width = container.style.height = "450px";
    document.getElementById("board-container").appendChild(container);
    document.getElementById("page-container").style.width = "452px";

    var gameOverMessage = document.getElementById("board-game-over-message");
    gameOverMessage.style.width = gameOverMessage.style.height =
        gameOverMessage.style.lineHeight = "450px";
}

// These three global var must be keeping, so I can track tiles during moving
// action. The limitation of Interface Part brings this problem. Hope it would
// be solved one day.
var searchTable = new Object, registryTable = new Object, deadQueue = new Array;

function DisplayAdvent(x, y, number, finished)
{
    var tile = document.createElement("div");
    tile.innerText = number;
    tile.classList.add("board-tile");
    tile.style.transition = "all 0.05s";
    tile.style.width = tile.style.height = 0;
    tile.style.lineHeight = "100px";
    tile.style.fontSize = 0;
    tile.style.margin = "50px";
    tile.style.top  = (y * 110 + 10) + "px";
    tile.style.left = (x * 110 + 10) + "px";
    document.getElementById("board-tiles-container").appendChild(tile);
    searchTable[StringP(x, y)] = tile;

    setTimeout(function() {
        tile.style.width = tile.style.height = "100px";
        tile.style.fontSize = "20px";
        tile.style.margin = "";
    }, 0);
    OnceListener(tile, finished);
}

function DisplayMove(x, y, newX, newY, finished)
{
    var tile = searchTable[StringP(x, y)];
    tile.style.transition = "all 0.15s";
    tile.style.top  = (newY * 110 + 10) + "px";
    tile.style.left = (newX * 110 + 10) + "px";
    // There's no need to worry about overriding.
    // Any override tile will be override again by substitution.
    // So any of them survives will be okay.
    if (registryTable[StringP(newX, newY)] !== undefined)
    {
        var dead = registryTable[StringP(newX, newY)];
        deadQueue.push(dead);
    }

    delete searchTable[StringP(x, y)];
    registryTable[StringP(newX, newY)] = tile;
    OnceListener(tile, finished);
}

function DisplayAfterMove()
{
    while (deadQueue.length > 0)
    {
        var dead = deadQueue.pop();
        dead.parentElement.removeChild(dead);
    }

    Object.keys(registryTable).forEach(function(pos)
    {
        if (searchTable[pos] !== undefined)
        {
            var dead = searchTable[pos];
            dead.parentElement.removeChild(dead);
        }
        searchTable[pos] = registryTable[pos];
    });
    registryTable = new Object;
    // console.log(searchTable);
}

function DisplaySubstitute(x, y, num, finished)
{
    var tile = searchTable[StringP(x, y)];
    tile.innerText = num;
    tile.style.transition = "all 0.07s";
    tile.style.width = tile.style.height = tile.style.lineHeight = "110px";
    tile.style.fontSize = "22px";
    tile.style.margin = "-5px";
    OnceListener(tile, function() {
        tile.style.width = tile.style.height = tile.style.lineHeight = "100px";
        tile.style.fontSize = "20px";
        tile.style.margin = "";
        OnceListener(tile, finished);
    });
}

function DisplayOver()
{
    var gameOverMessage = document.getElementById("board-game-over-message");
    gameOverMessage.style.display = "";
    setTimeout(function() {
        gameOverMessage.style.opacity = 1;
        document.getElementById("board-tiles-container").style.opacity = 0.5;
    }, 0);
}

function DisplayScore(score)
{
    document.getElementById("score-message").innerText = score;
}


// Main Part.
// The main game loop and entry point.
window.onload = function()
{
    DisplayInitialize();
    var turn = new Turn();
    var grid = new Grid(4);
    grid.AddRandom(turn);
    grid.AddRandom(turn);
    turn.Trigger(null, null, null, null);
    // console.log(grid);

    var animating = false, over = false;
    window.addEventListener("keypress", function(e)
    {
        // Disable key press during animation.
        if (animating || over)
            return;
        var map = {w: 0, d: 1, s: 2, a: 3};
        if (e.key in map)
        {
            if (grid.Slide(map[e.key], turn))
            {
                animating = true;
                turn.Trigger(DisplayAfterMove, null, function() {
                    animating = false;
                    // console.log(StringG(grid));
                }, function() {
                    if (grid.Over())
                    {
                        console.log("Game Over");
                        DisplayOver();
                        over = true;
                    }
                });
            }
            // console.log(searchTable);
        }
    });
}


// Utility Part.
// Tool functions that are required above.
function StringP(x, y)
{
    return "(" + x + ", " + y + ")";
}

function Random(range)
{
    return Math.floor(Math.random() * range);
}

function StringG(grid)
{
    var str = "";
    // Only work on square.
    for (var y = 0; y < grid._grid[0].length; y++)
    {
        for (var x = 0; x < grid._grid.length; x++)
        {
            str += grid._grid[x][y] + " ";
        }
        str += "\n";
    }
    return str;
}

function OnceListener(target, callback)
{
    target.addEventListener("transitionend", function()
    {
        // console.log("On transition end.");
        target.removeEventListener("transitionend", arguments.callee);
        callback();
    });
}
