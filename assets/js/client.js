/******************************* 
********GLOBAL VARIABLES********
*******************************/
var serverAddress = "https://cache-cache.herokuapp.com/"
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
        departs: [],
        image: null
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
        dir: "up",
        gameChair: null,
        image: null,
        currentSprite: 1,
        draw: function(){
            ctx.drawImage(
                game.player.image,
                game.sprites[game.player.dir][game.player.currentSprite][0],
                game.sprites[game.player.dir][game.player.currentSprite][1],
                game.sprites.width,
                game.sprites.height,
                game.player.pos.x - game.sprites.width / 2,
                game.player.pos.y - game.player.radius * 2,
                game.sprites.width,
                game.sprites.height,
            );
            
            
            /* OLD WAY
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            */
        },
    },
    sprites: {
        images: ["this 0 index is for the sprite image to correspond to the player's gameChair"],
        width: 24,
        height: 32,
        profile: [84,4,62,67],
        up: [[0,0],[24,0],[48,0]],
        right: [[0,32],[24,32],[48,32]],
        down: [[0,64],[24,64],[48,64]],
        left: [[0,96],[24,96],[48,96]]
    },
    spectateur: [],
    restarting: null,
    spottedSFX: null,
    time: 0
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
            /*
            ctx.fillStyle = game.player.playersSeen[i].color;
            ctx.beginPath();
            ctx.arc(game.player.playersSeen[i].pos.x, game.player.playersSeen[i].pos.y, game.player.playersSeen[i].radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            */

            ctx.drawImage(
                game.sprites.images[game.player.playersSeen[i].gameChair],
                game.sprites[game.player.playersSeen[i].dir][game.player.playersSeen[i].currentSprite][0],
                game.sprites[game.player.playersSeen[i].dir][game.player.playersSeen[i].currentSprite][1],
                game.sprites.width,
                game.sprites.height,
                game.player.playersSeen[i].pos.x - game.sprites.width / 2,
                game.player.playersSeen[i].pos.y - game.player.playersSeen[i].radius * 2,
                game.sprites.width,
                game.sprites.height,
            );
        }
    }

    //drawing all players if spectateur mode
    for(var i = 0 ; i < game.spectateur.length; i++){
        if(game.spectateur[i].name !== game.player.id){
            /*
            ctx.fillStyle = game.spectateur[i].color;
            ctx.beginPath();
            ctx.arc(game.spectateur[i].pos.x, game.spectateur[i].pos.y, game.spectateur[i].radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            */

            ctx.drawImage(
                game.sprites.images[game.spectateur[i].gameChair],
                game.sprites[game.spectateur[i].dir][game.spectateur[i].currentSprite][0],
                game.sprites[game.spectateur[i].dir][game.spectateur[i].currentSprite][1],
                game.sprites.width,
                game.sprites.height,
                game.spectateur[i].pos.x - game.sprites.width / 2,
                game.spectateur[i].pos.y - game.spectateur[i].radius * 2,
                game.sprites.width,
                game.sprites.height,
            );
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
        var imageIndex = map.layers[0].data[i]-1;
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
        var newBlock = Block(taille, posX, posY, type, imageIndex, base, depart);
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
    var OneBlock = function(taille, x, y, type, imageIndex, base, depart){
        this.taille = taille; //taille du carre en pixel
        this.x = x; //coordonnées dans la carte
        this.y = y;
        this.type = type; //string "mur" ou "sol" 
        this.imageIndex = imageIndex //number
        this.playerIn = null; //sera populé in runtime, reference à un joueur
        // this.image = urlImage; //string
        this.base = base; //boolean
        this.baseColor = "orange";
        this.depart = depart; //boolean
        // this.cachable = cachable; //boolean
    };
    OneBlock.prototype.draw = function(){
        /* BASIC DRAWING
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
        */
        // IMAGE DRAWING
        var sourceX;
        var sourceY;
        if(this.imageIndex < tileset.columns){
            sourceX = this.imageIndex * this.taille;
            sourceY = 0;
        } else {
            sourceX = (this.imageIndex % tileset.columns) * this.taille;
            sourceY = Math.floor(this.imageIndex / tileset.columns) * this.taille;
        }

        ctx.drawImage(game.carte.image, sourceX, sourceY, this.taille, this.taille, this.x * this.taille, this.y * this.taille, this.taille, this.taille)
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

    return function(taille, x, y, type, imageIndex, base, depart){
        return new OneBlock(taille, x, y, type, imageIndex, base, depart);
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
    socket = io(serverAddress);

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
                    var playerLink = $("<a href='/profil/" + playersConnected[i].name + "'  target='_blank' class='playerLink'>").text(playersConnected[i].name)

                    $("div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='gameChairInGame']").text("").append(playerLink);

                    //change role
                    if(playersConnected[i].role === "chasseur") {
                        $("div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='role'] > div > span").text("Chasseur").removeClass("badge-light").addClass("badge-primary");
                    } else {
                        $("div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='role'] > div > span").text("Cacheur").removeClass("badge-light").addClass("badge-dark");
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
                    $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("Chasseur").removeClass("badge-light").addClass("badge-primary");
                } else {
                    $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("Cacheur").removeClass("badge-light").addClass("badge-dark");
                }

                //change score
                $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > p").text("Points : 0");
            }
        });

        socket.on("player disconnected", function(user){
            console.log("somebody quit!");
            if(user.joined === myGamename){

                //change chair name
                //$("div[class*='gameChair" + user.gameChair + "'] >  div[class*='gameChairInGame']").text("Libre");

                //Change role
                $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("Deconnecté").removeClass("badge-primary badge-warning badge-danger badge-dark").addClass("badge-light");

                //change status
                var currentText = $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > p").text();
                var minutes = Math.floor(game.time/60);
                if(minutes < 10){ minutes = "0" + minutes }
                var seconds = (game.time % 60).toString();
                if(seconds < 10){ seconds = "0" + seconds }
                $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > p").text(currentText + " | Temps de partie: " + minutes + ":" + seconds);
            }
        });

        socket.on("access denied", function(message){
            alert(message);
            window.location.href = serverAddress + "hall";
        });

        
        /******************************* 
        ***********GAME LOGIC***********
        *******************************/


        socket.on("gameStarted", function(gameData){
            //clear unused game seats
            $("div[class*='gameChairInGame']").each(function(index){
                if($(this).text() === "Libre"){
                    // $(this).text("");
                    //remove image avatar
                    // console.log($(this));
                    //$(this.nextSibling.firstElementChild).remove()
                    $(this.parentElement).remove()
                }
            });
            // //Change role
            // $("span[class*='badge-light']").each(function(index){
            //     $(this).text("");
            // });
            // //change status
            // $("span[class*='badge-light'] + p").each(function(index){
            //     $(this).text("Non utilisé");
            // });

            //initialize game
            console.log(gameData);
            game.id = gameData.gameID;
            game.player.id = gameData.player.id;
            game.player.pos = gameData.player.pos;
            game.player.radius = gameData.player.radius;
            game.player.blocksVisibles = gameData.player.blocksVisibles;
            game.player.role = gameData.player.role;
            game.player.color = gameData.player.color;
            game.player.gameChair = gameData.player.gameChair;
            //get map and charge locally
            // $.getJSON("/maps/map1.json", function( mapData ) {
            //     var mapLoaded = mapData;
            //     $.getJSON( "/maps/terrain.json", function( tileset ) {
            //         var tileset = tileset;
            //        drawMap(mapLoaded[0], tileset);
            drawMap(map, tileset);
            game.spottedSFX = document.getElementById("spotted");
            game.carte.image = document.getElementById("tileset");
            var timer = document.getElementById("time");
            game.timer = setInterval(function(){
                game.time++;
                var minutes = Math.floor(game.time/60);
                if(minutes < 10){ minutes = "0" + minutes }
                var seconds = (game.time % 60).toString();
                if(seconds < 10){ seconds = "0" + seconds }
                timer.textContent = minutes + ":" + seconds;
            }, 1000);
            for(var i = 1 ; i < 6 ; i++){
                game.sprites.images.push(document.getElementById("sprite-gamechair" + i));
            }
            game.player.image = game.sprites.images[game.player.gameChair];
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
                game.player.dir = data.dir;
                game.player.currentSprite = data.sprite;
                if(data.stopped){
                    game.player.currentSprite = 1;
                }
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
                    game.spottedSFX.play();
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
                    game.carte.base.baseColor = "orange";
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
                    game.carte.base.baseColor = "orange";
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
                        game.spectateur[i].dir = playerInfo.dir;
                        game.spectateur[i].currentSprite = playerInfo.currentSprite;
                        game.spectateur[i].gameChair = playerInfo.gameChair;
                        spectateurTrouve = true;
                    }
                }
                if(!spectateurTrouve){
                    game.spectateur.push({
                        pos: playerInfo.pos,
                        radius: playerInfo.radius,
                        name: playerInfo.name,
                        color: playerInfo.color,
                        dir: playerInfo.dir,
                        currentSprite: playerInfo.currentSprite,
                        gameChair: playerInfo.gameChair
                    })
                }
            });

            socket.on("gameRestarting", function(seconds){
                if(game.carte.base.flashing){
                    clearInterval(game.carte.base.flashing);
                    game.carte.base.flashing = null;
                    game.carte.base.baseColor = "orange";
                }
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
                game.carte.base.baseColor = "orange";
            });

            socket.on("player restart", function(user){
                //change role
                if(user.role === "chasseur") {
                    $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("Chasseur").removeClass("badge-dark badge-primary badge-warning badge-danger badge-success").addClass("badge-primary");
                } else {
                    $("div[class*='gameChair" + user.gameChair + "'] >  div[class*='role'] > div > span").text("Cacheur").removeClass("badge-dark badge-primary badge-warning badge-danger badge-success").addClass("badge-dark");
                }
            })

            socket.on("kick", function(message){
                alert(message);
                window.location.href = serverAddress + "hall";
            })

            gameLoop();
            //    });
            //});
        });
    });
});