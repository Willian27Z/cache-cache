var canvas = document.getElementById("canvas");
var ctx;
var socket;
if (canvas.getContext) {
    ctx = canvas.getContext('2d');
} else {
    alert("Canvas not supported! Désolé...");
}
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
        id: null,
        color: null,
        role: null,
        pos: null,
        blocksVisibles: [],
        radius: null,
        playersTrouves: [],
        draw: function(){
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        },
    }
};

var gameLoop = function(){

    //reinitialize map
    ctx.clearRect(0, 0, 1024, 704);

    //draws map blocks of type "sol"
    for(var b = 0 ; game.carte.blocks[b] ; b++){
        if(game.carte.blocks[b].type === "sol"){
            game.carte.blocks[b].draw();
        }
    }
    //applies mask
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, 1024, 704);
    
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

    for(var i = 0 ; game.player.playersTrouves[i]; i++){
        ctx.fillStyle = game.player.playersTrouves[i].color;
        ctx.beginPath();
        ctx.arc(game.player.playersTrouves[i].pos.x, game.player.playersTrouves[i].pos.y, game.player.playersTrouves[i].radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }
    
    //draw player
    game.player.draw();

    window.requestAnimationFrame(gameLoop);
};

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
        this.flashing = setInterval(function(){
            if(game.carte.base.baseColor === "orange"){
                game.carte.base.baseColor = "red";
            } else {
                game.carte.base.baseColor = "orange";
            }
        }, 1000);
    }

    return function(taille, x, y, type, base, depart){
        return new OneBlock(taille, x, y, type, base, depart);
    }
}());

var addEventListeners = function(){
    window.addEventListener("keydown", function(event){
        socket.emit("move", event.key);
    });
    
    window.addEventListener("keyup", function(event){
        socket.emit("stop", event.key);
    });
}

window.document.addEventListener("DOMContentLoaded", function () {
    socket = io("http://192.168.106.118:2727");

    socket.on("connect", function(){
        console.log("client connected");
        
        socket.emit("game", {username: myUsername, gameName: myGamename});

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
                    addEventListeners();

                    socket.on("moved", function(data){
                        game.player.pos = data.pos;
                        game.player.blocksVisibles = data.blocksVisibles;
                    });

                    socket.on("playersSeen", function(data){
                        game.player.playersTrouves = data;
                    })
                    socket.on("playerFound", function(data){
                        console.log("TCL: data", data)
                        game.carte.base.flashBase();
                        $("<p>").text(data[0].id).appendTo("body");

                    })
                    gameLoop();
                });
            });
        });
    });
});