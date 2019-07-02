const express = require("express");
const io = require("socket.io");
const session = require("session");
const path = require("path");
const app = express();

//game mechanics
const Game = require("./game/js/game.js");
const outils = require("./game/js/outils.js");
const map = require("./assets/maps/map1.json");
const tileset = require("./assets/maps/terrain.json");


app.use("/js", express.static(path.normalize(__dirname + "/assets/js")));
app.use("/lib", express.static(path.normalize(__dirname + "/assets/libs")));
app.use("/img", express.static(path.normalize(__dirname + "/assets/img")));
app.use("/css", express.static(path.normalize(__dirname + "/assets/css")));
app.use("/maps", express.static(path.normalize(__dirname + "/assets/maps")));

app.get("/", function(req, res){
    res.sendFile(path.normalize(__dirname + "/index.html"));
})

const httpServer = app.listen(2727, function(){
    console.log("Server listening at port: 2727");
});

let ioServer = new io(httpServer);

let currentGame = null;
let playerCounter = 0;

ioServer.on("connection", function(socket){
    playerCounter++
    let gameChair = playerCounter;
    let playerID = socket.id
    console.log("Player " + playerCounter + " connected: id: " + socket.id);
    let player = {
        id: playerID,
        role: null,
        pos: {x: null, y: null},
        radius: 11,
        blocksVisibles: []
    };
    if(!currentGame){
        // Initialize game
        console.log("game started");
        currentGame = Game();
        
        // Generates Map
        currentGame.drawMap(map[0], tileset);
        // let carte = currentGame.carte;
        player.role = "chasseur";

        // Adds Player
        player.pos.x = (currentGame.carte.base.x * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
        player.pos.y = (currentGame.carte.base.y * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
        currentGame.addPlayer(playerID, player.role, player.pos.x, player.pos.y, player.radius, 20, 10);
        
        // Initialize player
        currentGame.players[gameChair-1].socket = socket;
        let thisplayer = currentGame.players[gameChair-1];
        outils.getMyBlock(thisplayer, currentGame);
        let blocksVisibles = outils.getVisibleBlocks(thisplayer, currentGame);
        player.blocksVisibles = blocksVisibles;

    } else {
        if(playerCounter >= 6){
            player.role = "spectateur";
            
        } else {

            player.role = "cacheur";

            // Adds Player
            player.pos.x = (currentGame.carte.departs[gameChair-2].x * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
            player.pos.y = (currentGame.carte.departs[gameChair-2].y * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
            currentGame.addPlayer(playerID, player.role, player.pos.x, player.pos.y, player.radius, 20, 10);
            // Initialize player
            currentGame.players[gameChair-1].socket = socket;
            let thisplayer = currentGame.players[gameChair-1];
            outils.getMyBlock(thisplayer, currentGame);
            let blocksVisibles = outils.getVisibleBlocks(thisplayer, currentGame);
            player.blocksVisibles = blocksVisibles
        }
    };

    if(player.role === "spectateur"){

    } else {
        socket.emit("gameStarted", {
            gameID: currentGame.id,
            player: player
        });
    }


    socket.on("move", function(data){
        let thisplayer = currentGame.players[gameChair-1];
        outils.movePlayer(thisplayer, currentGame, data, socket);
    });
    socket.on("stop", function(data){
        let thisplayer = currentGame.players[gameChair-1];
        outils.stopPlayer(thisplayer, currentGame, data, socket);
    });

    socket.on("disconnect", function(){
        playerCounter--
        console.log("Player " + gameChair + " disconnected");
        if(playerCounter === 0){
            console.log("game terminated");
            currentGame = null;
        }
    });
});