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
    finished();
}

function Move(x, y, newX, newY, finished)
{
    console.log("The number at " + StringP(x, y) + " is now at " +
        StringP(newX, newY));
    finished();
}

function Substitute(x, y, number, finished)
{
    console.log("The number at" + StringP(x, y) + " is now changed to " +
        number);
    finished();
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
        self._actions.substitute.push({x: x, y: y, number: number * 2});
    };

    this.Trigger = function()
    {
        function CommonPatternHere(dataSet, count, call, after)
        {
            return function()
            {
                while (dataSet.length > 0)
                {
                    var data = dataSet.pop();
                    call(data, function()
                    {
                        // It is heard that in Javascript there's no data race.
                        // The following code need fix if I was wrong.
                        // It is neccessary to wrap `count` into an object so
                        // I can change its value here.
                        count.value--;
                        if (count.value === 0)
                            after();
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
            this.Call = function(dataSet, count, call)
            {
                self._list.push({dataSet: dataSet, count: count, call: call});
                return self;
            };
            this.List = function()
            {
                return self._list.map(function(argument)
                {
                    return function(after)
                    {
                        return CommonPatternHere(argument.dataSet,
                            argument.count, argument.call, after);
                    };
                });
            };
        }
        new CurryList()
        .Call(self._actions.move, {value: self._remain.move},
            function(move, finished)
            {
                Move(move.x1, move.x2, move.y1, move.y2, finished);
            })
        .Call(self._actions.substitute, {value: self._remain.substitute},
            function(sub, finished)
            {
                Substitute(sub.x, sub.y, sub.number, finished);
            })
        .Call(self._actions.advent, {value: self._remain.advent},
            function(advent, finished)
            {
                Advent(advent.x, advent.y, advent.number, finished);
            })
        .List().reduceRight(
            function(after, previous) { return previous(after); },
            function() { console.log("All done for this turn."); })();
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
        this._grid[i] = new Array(size).fill(0);  // 0 means no number here.
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


}


// Main Part.
// The main game loop and entry point.
window.onload = function()
{
    var turn = new Turn();
    turn.Advent(3, 2, 16);
    turn.Merge(2, 1, 0, 1, 2);
    turn.Move(3, 3, 0, 3);
    turn.Trigger();
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
