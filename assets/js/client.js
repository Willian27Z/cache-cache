/******************************* 
********GLOBAL VARIABLES********
*******************************/

var canvas = document.getElementById("canvas");
var ctx;
if (canvas.getContext) {
    ctx = canvas.getContext('2d');
} else {
    alert("Canvas not supported! Désolé...");
}
var socket;
var game = {
    id: null,
    carte: {
        blocks: [],
        taille: {x: null, y: null},
        tailleBlock: null,
        base: {},
        departs: []
    },
    player: {
        score: 0,
        done: false,
        id: null,
        color: null,
        role: null,
        pos: null,
        blocksVisibles: [],
        radius: null,
        playersSeen: [],
        draw: function(){
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        },
    },
    spectateur: [],
    restarting: null
};


/******************************* 
***********GAME LOOP************
*******************************/


var gameLoop = function(){

    //reinitialize map
    ctx.clearRect(0, 0, 1024, 704);

    //draws map blocks of type "sol"
    for(var b = 0 ; game.carte.blocks[b] ; b++){
        if(game.carte.blocks[b].type === "sol"){
            game.carte.blocks[b].draw();
        }
    }

    if(!game.player.done){
        //applies mask
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, 1024, 704);
    }
    
    //draws map blocks of type "mur"
    for(var b = 0 ; game.carte.blocks[b] ; b++){
        if(game.carte.blocks[b].type === "mur"){
            game.carte.blocks[b].draw();
        }
    }

    //drawing visible blocks to the player
    for(var i = 0 ; game.player.blocksVisibles[i] ; i++){
        game.carte.blocks[game.player.blocksVisibles[i]].draw();
    }

    //drawing visible opponents
    if(!game.player.done){
        for(var i = 0 ; game.player.playersSeen[i]; i++){
            ctx.fillStyle = game.player.playersSeen[i].color;
            ctx.beginPath();
            ctx.arc(game.player.playersSeen[i].pos.x, game.player.playersSeen[i].pos.y, game.player.playersSeen[i].radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
    }

    //drawing all players if spectateur mode
    for(var i = 0 ; i < game.spectateur.length; i++){
        if(game.spectateur[i].name !== game.player.id){
            ctx.fillStyle = game.spectateur[i].color;
            ctx.beginPath();
            ctx.arc(game.spectateur[i].pos.x, game.spectateur[i].pos.y, game.spectateur[i].radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    //draw player
    if(!game.player.done){
        game.player.draw();
    }

    //game restart countdown
    if(game.restarting){
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, 1024, 704);
        ctx.fillStyle = "white";
        ctx.font = "48px Comic Sans";
        ctx.fillText("Partie Finit! Prochain partie dans... " + game.restarting, 150, 304);
    }

    window.requestAnimationFrame(gameLoop);
};


/******************************* 
********MAP CONSTRUCTION********
*******************************/


var drawMap = function(map, tileset){
    game.carte.taille.x = map.width;
    game.carte.taille.y = map.height;
    game.carte.tailleBlock = map.tileheight;
    var taille = map.tileheight;
    var indexY = 0;
    var indexX = 0;
    for(var i = 0 ; map.layers[0].data[i] ; i++){ //pour chaque block in map JSON
        //trouver les propriétés du block
        var base = false;
        var depart = false;
        for(var t = 0 ; tileset.tiles[t] ; t++){
            if( tileset.tiles[t].id === (map.layers[0].data[i]-1) ){ //les id match
                var properties = tileset.tiles[t].properties;
                for(var p = 0 ; properties[p] ; p++){
                    if(properties[p].name === "type"){
                        var type = properties[p].value;
                    }
                    if(properties[p].name === "base"){
                        base = properties[p].value;
                    }
                    if(properties[p].name === "depart"){
                        depart = properties[p].value;
                    }
                }
            }
        }
        
        //defining block position
        var posX = indexX;
        var posY = indexY;
        indexX++
        //condition for changing X, Y index
        if(i % map.width === 0 && i > 0){
            posX = 0;
            posY++;
            indexX = 1;
            indexY++;
        }

        //creates the new block and assigns it to Carte
        var newBlock = Block(taille, posX, posY, type, base, depart);
        game.carte.blocks.push(newBlock);
        if(base){
            game.carte.base = newBlock;
        }
        if(depart){
            game.carte.departs.push(newBlock);
        }
    }
};

var Block = (function(){
    var OneBlock = function(taille, x, y, type, base, depart){
        this.taille = taille; //taille du carre en pixel
        this.x = x; //coordonnées dans la carte
        this.y = y;
        this.type = type; //string "mur" ou "sol" 
        this.playerIn = null; //sera populé in runtime, reference à un joueur
        // this.image = urlImage; //string
        this.base = base; //boolean
        this.baseColor = "orange";
        this.depart = depart; //boolean
        // this.cachable = cachable; //boolean
    };
    OneBlock.prototype.draw = function(){
        if(this.type === "mur"){
            ctx.fillStyle = "brown";
        } else {
            if(this.base){
                ctx.fillStyle = this.baseColor;
            } else if (this.depart){
                ctx.fillStyle = "yellow";
            } else {
                ctx.fillStyle = "white";
            }
        }
        ctx.fillRect(this.x*this.taille, this.y*this.taille, this.taille, this.taille);
    },
    // OneBlock.prototype.drawAgain = function(){
    //     ctx.fillStyle = "green";
    //     ctx.fillRect(this.x*taille, this.y*taille, this.taille, this.taille);
    // },
    // OneBlock.prototype.path = function(){
    //     ctx.beginPath();
    //     ctx.rect(this.x*taille, this.y*taille, this.taille, this.taille);
    //     ctx.closePath();
    // }
    OneBlock.prototype.flashBase = function(){
        if(!this.flashing){
            this.flashing = setInterval(function(){
                if(game.carte.base.baseColor === "orange"){
                    game.carte.base.baseColor = "red";
                } else {
                    game.carte.base.baseColor = "orange";
                }
            }, 1000);
        }
    }

    return function(taille, x, y, type, base, depart){
        return new OneBlock(taille, x, y, type, base, depart);
    }
}());

// var addEventListeners = function(){
//     window.addEventListener("keydown", function(event){
//         socket.emit("move", event.key);
//     });
    
//     window.addEventListener("keyup", function(event){
//         socket.emit("stop", event.key);
//     });
// }


/******************************* 
********SOCKET.IO EVENTS********
*******************************/


window.document.addEventListener("DOMContentLoaded", function () {
    socket = io("http://192.168.1.10:2727");

    socket.on("connect", function(){
        console.log("client connected");
        
        socket.emit("game", {username: myUsername, gameName: myGamename});


        /******************************* 
        ******CONNECTING ACTIONS********
        *******************************/


        socket.on("connected players", function(playersConnected){
            console.log(playersConnected);
            for(var i = 0 ; i < playersConnected.length ; i++){
                if(playersConnected[i].joined === myGamename){

                    //change chair name
                    $("div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='gameChairInGame']").text(playersConnected[i].name);

                    //change role
                    if(playersConnected[i].role === "chasseur") {
                        $("div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='role'] > div > span").text("Chasseur").removeClass("badge-dark").addClass("badge-primary");
                    } else {
                        $("div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='role'] > div > span").text("Cacheur")
                    }
                    
                    //change status
                    $("div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='role'] > div > p").text("Points : 0");
                }
            }
        });

        socket.on("player entered", function(user){
            console.log(user);
            if(user.joined === myGamename){
                console.log("somebody entered game!");
                //change chair name
                $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='gameChairInGame']").text(user.name);

                //change role
                if(user.role === "chasseur") {
                    $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("Chasseur").removeClass("badge-dark").addClass("badge-primary");
                } else {
                    $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("Cacheur");
                }

                //change score
                $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > p").text("Points : 0");
            }
        });

        socket.on("player disconnected", function(user){
            console.log("somebody quit!");
            if(user.joined === myGamename){

                //change chair name
                $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='gameChairInGame']").text("Libre");

                //Change role
                $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("hors ligne").removeClass("badge-primary").addClass("badge-dark");

                //change status
                $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > p").text("Quitté");
            }
        });

        socket.on("access denied", function(message){
            alert(message);
            window.location.href = "http://192.168.1.10:2727/hall";
        });

        
        /******************************* 
        ***********GAME LOGIC***********
        *******************************/


        socket.on("gameStarted", function(gameData){
            console.log(gameData);
            game.id = gameData.gameID;
            game.player.id = gameData.player.id;
            game.player.pos = gameData.player.pos;
            game.player.radius = gameData.player.radius;
            game.player.blocksVisibles = gameData.player.blocksVisibles;
            game.player.role = gameData.player.role;
            game.player.color = gameData.player.color;
            //get map and charge locally
            $.getJSON("/maps/map1.json", function( mapData ) {
                var mapLoaded = mapData;
                $.getJSON( "/maps/terrain.json", function( tileset ) {
                    var tileset = tileset;
                    drawMap(mapLoaded[0], tileset);
                    
                    document.addEventListener("keydown", function(event){
                        event.preventDefault();
                        if(!game.player.done){
                            socket.emit("move", event.key);
                        }
                    });
                    
                    document.addEventListener("keyup", function(event){
                        event.preventDefault();
                        if(!game.player.done){
                            socket.emit("stop", event.key);
                        }
                    });

                    socket.on("moved", function(data){
                        game.player.pos = data.pos;
                        game.player.blocksVisibles = data.blocksVisibles;
                    });

                    socket.on("playersSeen", function(data){
                        game.player.playersSeen = data;
                    });

                    socket.on("playerFound", function(data){
                        console.log("TCL: data", data)
                        if(!game.carte.base.flashing){
                            game.carte.base.flashBase();
                        }
                    });

                    socket.on("foundByHunter", function(data){
                        for(var i = 0 ; i < data.length ; i++){
                            //change player chair status
                            $("div[class*='gameChair" + data[i] + "'] >  div[class*='role'] > div > span").text("Trouvé").removeClass("badge-dark").addClass("badge-warning");
                        }
                    });

                    socket.on("players killed", function(data){
                        for(var i = 0 ; i < data.length ; i++){
                            //change player chair status
                            $("div[class*='gameChair" + data[i] + "'] >  div[class*='role'] > div > span").text("Perdu").removeClass("badge-warning").addClass("badge-danger");
                        }
                        if(game.carte.base.flashing){
                            clearInterval(game.carte.base.flashing);
                            game.carte.base.flashing = null;
                            game.carte.baseColor = "orange";
                        }
                    });

                    socket.on("cacheur gagné", function(data){
                            //change player chair status
                            $("div[class*='gameChair" + data + "'] >  div[class*='role'] > div > span").text("Gagné").removeClass("badge-warning badge-dark").addClass("badge-success");
                    });

                    socket.on("ciblesOntFuit", function(){
                        if(game.carte.base.flashing){
                            clearInterval(game.carte.base.flashing);
                            game.carte.base.flashing = null;
                            game.carte.baseColor = "orange";
                        }
                    });

                    socket.on("add points", function(data){
                        //change player chair points
                        $("div[class*='gameChair" + data.gameChair + "'] >  div[class*='role'] > div > p").text("Points : " + data.score);
                    });

                    socket.on("you are done", function(data){
                        game.player.done = true;
                        game.player.pos.x = -100;
                        game.player.pos.y = -100;
                        game.player.blocksVisibles = [];
                        game.player.playersSeen = [];
                    });

                    socket.on("spectateur", function(playerInfo){
                        var spectateurTrouve = false;
                        for(var i = 0 ; i < game.spectateur.length ; i++){
                            if(game.spectateur[i].name === playerInfo.name){
                                game.spectateur[i].pos = playerInfo.pos;
                                spectateurTrouve = true;
                            }
                        }
                        if(!spectateurTrouve){
                            game.spectateur.push({
                                pos: playerInfo.pos,
                                radius: playerInfo.radius,
                                name: playerInfo.name,
                                color: playerInfo.color,
                            })
                        }
                    });

                    socket.on("gameRestarting", function(seconds){
                        game.restarting = seconds/1000;
                        game.counter = setInterval(function(){
                            game.restarting--;
                            if(game.restarting <= 0){
                                clearInterval(game.counter);
                                game.counter = null;
                                game.restarting = null
                            }
                        }, 1000);
                    });

                    socket.on("game restarted", function(gameData){
                        game.player.pos = gameData.pos;
                        game.player.blocksVisibles = gameData.blocksVisibles;
                        game.player.role = gameData.role;
                        game.player.done = false;
                        game.player.playersSeen = [];
                        game.spectateur = [];
                    });

                    socket.on("player restart", function(user){
                        //change role
                        if(user.role === "chasseur") {
                            $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("Chasseur").removeClass("badge-dark badge-primary badge-warning badge-danger badge-success").addClass("badge-primary");
                        } else {
                            $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("Cacheur").removeClass("badge-dark badge-primary badge-warning badge-danger badge-success").addClass("badge-dark");
                        }
                    })

                    gameLoop();
                });
            });
        });
    });
});