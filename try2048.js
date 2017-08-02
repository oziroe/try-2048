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
//
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


// Basic Logic Part.
// There are some promises when calling basic interfaces, such as the order of
// a "turn" should be move -> substitute -> advent. This part would provide
// a higher level of abstraction for this purpose.
// Additionally, basic operation "merge" is a combination of move and
// substitute, which will also be defined in the part.
//
// NOTICE: After score counting is introduced into Turn, a Turn object must be
// reused for an entire game to keep the score.
function Turn()
{
    this._actions = {advent: [], move: [], substitute: []};
    this._remain  = {advent: 0,  move: 0,  substitute: 0};
    this._score = 0;
    var self = this;

    this.Advent = function(x, y, number)
    {
        self._remain.advent++;
        self._actions.advent.push(function(finished) {
            Advent(x, y, number, finished);
        });
    };

    this.Move = function(x, y, newX, newY)
    {
        self._remain.move++;
        self._actions.move.push(function(finished) {
            Move(x, y, newX, newY, finished);
        });
    };

    this.Merge = function(x, y, toX, toY, number)
    {
        self.Move(x, y, toX, toY);
        self._remain.substitute++;
        self._actions.substitute.push(function(finished) {
            Substitute(toX, toY, number * 2, finished);
        });
        self._score += number;
    };

    this.Trigger = function(afterMove, afterSubstitute, afterAdvent, afterAll)
    {
        DisplayScore(self._score);
        DisplayShowStart();

        function CommonPatternHere(callQueue, remain, beforeNext)
        {
            return function(next)
            {
                return function()
                {
                    if (callQueue.length === 0)
                    {
                        beforeNext && beforeNext();
                        next();
                        return;
                    }

                    while (callQueue.length > 0)
                    {
                        // The following lambda would be sent as `finished` to
                        // Interface Part.
                        callQueue.pop()(function() {
                            // It is heard that in Javascript there's no data
                            // race. The following code need fix if I was wrong.
                            // Think clearly, this should not be `<= 0`.
                            // Or an accident double calling to one `finished`
                            // may cause the `next` be called more than one
                            // time, too.
                            if (--remain === 0)
                            {
                                beforeNext && beforeNext();
                                next();
                            }
                        });
                    }
                };
            };
        };

        [
            CommonPatternHere(self._actions.move,
                self._remain.move, afterMove),
            CommonPatternHere(self._actions.substitute,
                self._remain.substitute, afterSubstitute),
            CommonPatternHere(self._actions.advent,
                self._remain.advent, afterAdvent)
        ].reduceRight(function(after, previous) { return previous(after); },
            // Clean up code here.
            function() {
                if (afterAll !== null)
                    afterAll();
                console.log("All done for this turn.");
                DisplayShowEnd();
            })();

        Object.keys(self._remain).forEach(function(key) {
            self._remain[key] = 0;
        });
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
        return true;
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
        // Maybe this function can be impl like a seq of
        // `xxx.map(...).filter(...).reduce(...)` things, but it would be nicer
        // to write as C in C part.
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
    // Create tiles container and insert to page.
    var container = document.createElement("div");
    container.id = "board-tiles-container";
    var containerSize = config.game.boardSize *
        (config.size.tile + config.size.tileMargin) + config.size.tileMargin;
    container.style.width = container.style.height = containerSize + "px";
    document.getElementById("board-container").appendChild(container);

    // Other dynimical style settings.
    document.getElementById("page-container").style.width =
        (containerSize + 2) + "px";  // In case for border overflow.
    var gameOverMessage = document.getElementById("board-game-over-message");
    gameOverMessage.style.width = gameOverMessage.style.height =
        gameOverMessage.style.lineHeight = containerSize + "px";
}

// These three global var must be keeping, so I can track tiles during moving
// action. The limitation of Interface Part brings this problem. Hope it would
// be solved one day.
var searchTable = {}, registryTable = {}, deadQueue = [];

function DisplayAdvent(x, y, number, finished)
{
    var tile = document.createElement("div");
    tile.innerText = number;
    tile.classList.add("board-tile");
    tile.style.transition = "all " + config.trans.advent + "s";
    tile.style.width = tile.style.height = 0;
    tile.style.lineHeight = config.size.tile + "px";
    tile.style.fontSize = 0;
    tile.style.margin = (config.size.tile / 2) + "px";
    tile.style.top  =
        (y * config.size.tile + (y + 1) * config.size.tileMargin) + "px";
    tile.style.left =
        (x * config.size.tile + (x + 1) * config.size.tileMargin) + "px";
    document.getElementById("board-tiles-container").appendChild(tile);
    searchTable[StringP(x, y)] = tile;

    setTimeout(function() {
        tile.style.width = tile.style.height = config.size.tile + "px";
        tile.style.fontSize = config.size.tileFont + "px";
        tile.style.margin = "";  // It is heard that IE cannot take a null here.
    }, 0);
    OnceListener(tile, function() {
        // console.log("Advent finished.");
        finished();
    });
    // console.log("Set advent transition listener.");
}

function DisplayMove(x, y, newX, newY, finished)
{
    var tile = searchTable[StringP(x, y)];
    tile.style.transition = "all " + config.trans.move + "s";
    tile.style.top  =
        (newY * config.size.tile + (newY + 1) * config.size.tileMargin) + "px";
    tile.style.left =
        (newX * config.size.tile + (newX + 1) * config.size.tileMargin) + "px";
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
    registryTable = {};
    // console.log(searchTable);
}

function DisplaySubstitute(x, y, num, finished)
{
    var tile = searchTable[StringP(x, y)];
    tile.innerText = num;
    tile.style.transition = "all " + config.trans.substitution + "s";
    tile.style.width = tile.style.height = tile.style.lineHeight =
        (config.size.tile + config.size.tileZoom * 2) + "px";
    tile.style.fontSize =
        config.size.tileFont + config.size.tileFontZoom + "px";
    tile.style.margin = -config.size.tileZoom + "px";
    // Don't know why but seems IE11 always time out on this trigger.
    OnceListener(tile, function() {
        tile.style.width = tile.style.height = tile.style.lineHeight =
            config.size.tile + "px";
        tile.style.fontSize = config.size.tileFont + "px";
        tile.style.margin = "";
        OnceListener(tile, finished);
    });
}

// NOTICE: The game over effect is not set here.
// Go to `style.css` instead.
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

// These two are only for fun.
function DisplayShowStart()
{
    document.getElementById("board-tiles-container").style.borderColor = "grey";
}

function DisplayShowEnd()
{
    document.getElementById("board-tiles-container").style.borderColor = "";
}


// Main Part.
// The main game loop and entry point.
window.addEventListener("load", function()
{
    // Initialize the game.
    DisplayInitialize();
    var turn = new Turn();
    var grid = new Grid(config.game.boardSize);
    grid.AddRandom(turn);
    grid.AddRandom(turn);
    turn.Trigger(null, null, null, null);
    // console.log(grid);

    // Handle every action user makes.
    var animating = false, over = false;
    function UserSlide(direction)
    {
        if (grid.Slide(direction, turn))
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
    }
    // Desktop client by pressing keyboard.
    window.addEventListener("keypress", function(event) {
        // Disable key press during animation or game is already over.
        if (animating || over)
            return;
        var map = {w: 0, d: 1, s: 2, a: 3};
        if (event.key in map)
        {
            UserSlide(map[event.key]);
            // console.log(searchTable);
        }
    });
    // Mobile client by swiping screen.
    var startX = null, startY = null, startDuringAnimation = false;
    document.getElementById("board-tiles-container")
        .addEventListener("touchstart", function(event) {
            if (over)
                return;
            if (animating)
            {
                startDuringAnimation = true;
                return;
            }

            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
            // console.log(StringP(startX, startY));
        }, false);
    document.getElementById("board-tiles-container")
        .addEventListener("touchmove", function(event) {
            if (over)
                return;
            if (startDuringAnimation || (startX === null || startY === null))
            {
                startX = null;
                startY = null;
                startDuringAnimation = false;
                return;
            }

            var endX = event.touches[0].clientX,
                endY = event.touches[0].clientY;
            // console.log(StringP(endX, endY));
            var x = endX - startX, y = endY - startY;
            if (Math.max(Math.abs(x), Math.abs(y)) > 5)
            {
                if (Math.abs(x) > Math.abs(y))
                {
                    if (x > 0)
                        UserSlide(1);
                    else
                        UserSlide(3);
                }
                else
                {
                    if (y > 0)
                        UserSlide(2);
                    else
                        UserSlide(0);
                }
            }

            startX = null;
            startY = null;
        }, false);

    document.getElementById("restart-button")
            .addEventListener("click", function() {
        // Go to hell
        window.location.reload();
    });
});


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

// This util seems a little abnormal, right, I do not know `once` option at
// first. :)
function OnceListener(target, callback)
{
    var triggered = false;
    function CallbackWrapper()
    {
        // This may be later than time out protection.
        // If so, then prevent to call it twice.
        if (!triggered)
        {
            triggered = true;
            callback();
        }
    }
    target.addEventListener("transitionend", CallbackWrapper, {once: true});
    // console.log(target.ontransitionend);

    // Trigger the callback explicitly after timeout.
    setTimeout(function() {
        if (!triggered)
        {
            console.log("Time out! Force executing callback.");
            // console.log(target);
            triggered = true;
            callback();
        }
    }, config.trans.timeout * 1000);
}
