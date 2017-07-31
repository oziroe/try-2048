/*
 * try2048.js
 * An implementation of game "2048" with a robot player.
 *
 * Restarted by oziroe on July 31, 2017.
 */

// Painting Part.
// The basic painting API from displaying shapes and numbers on the web page.
function InitializePainting(containerID, n, size, margin)
{
    var tilesContainer = document.createElement("div");
    tilesContainer.id = "board-tiles-container";
    tilesContainer.style.width = tilesContainer.style.height =
        n * size + (n - 1) * margin + "px";
    tilesContainer.style.border = "1px solid";

    document.getElementById(containerID).appendChild(tilesContainer);

    return {
        tilesContainer: tilesContainer
    };
}

// Main Part.
// The main game loop and entry point.
function Main(config)
{
    paintingContext = InitializePainting(config["containerID"],
        config["boardSize"], config["tileSize"], config["tileMargin"]);
}
window.onload = function() { Main(CONFIG); };
