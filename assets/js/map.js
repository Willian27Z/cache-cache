"use strict";

var canvas = document.getElementById("canvas");
var ctx;
if (canvas.getContext) {
    ctx = canvas.getContext('2d');
} else {
    alert("Canvas not supported! Désolé...");
}


var carte = {
    blocks: [],
    taille: {x: null, y: null},
    tailleBlock: null,
    base: {},
    departs: []
};

var player = {
    role: "chasseur",
    pos: {x: null, y: null},
    radius: 11,
    sauteDistance: 20,
    trouve: false,
    playersTrouves: [],
    surBlock: {},
    blocksVisibles: [],
    blocksAround: [],
    score: 0,
    moving: null,
    direction: "up",
    speed: 10,
    draw: function(){
        //To get squares around (for collision later)
        // var inBlockX = Math.floor(this.pos.x/32);
        // var inBlockY = Math.floor(this.pos.y/32);
        // var b = (inBlockY*32) + inBlockX;
        // carte.blocks[b-33].drawAgain();
        // carte.blocks[b-32].drawAgain();
        // carte.blocks[b-31].drawAgain();
        // carte.blocks[b-1].drawAgain();
        // carte.blocks[b+1].drawAgain();
        // carte.blocks[b+31].drawAgain();
        // carte.blocks[b+32].drawAgain();
        // carte.blocks[b+33].drawAgain();

        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    },
    getMyBlock: function(){
        var inBlockX = Math.floor(this.pos.x/carte.tailleBlock);
        var inBlockY = Math.floor(this.pos.y/carte.tailleBlock);
        var blockIndex = (inBlockY * carte.taille.x) + inBlockX;
        // console.log("TCL: blockIndex", blockIndex)
        if(this.surBlock !== carte.blocks[blockIndex]){ //si block a changé
            //send event to server
            console.log("block changed!");
            this.blocksAround = outils.getBlocksAround(this);
            // console.log(this.blocksAround);
            this.surBlock.playerIn = null;
            this.surBlock = carte.blocks[blockIndex];
            carte.blocks[blockIndex].playerIn = this;

            if(carte.base == this.surBlock && player.playersTrouves.length){
                outils.killFound(this);
                
            }
        }
    }
};
var player2 = {
    role: "cacheur",
    pos: {x: null, y: null},
    radius: 11,
    sauteDistance: 20,
    trouve: false,
    playersTrouves: [],
    surBlock: {},
    blocksVisibles: [],
    blocksAround: [],
    score: 0,
    moving: null,
    direction: "up",
    speed: 10,
    draw: function(){
        //To get squares around (for collision later)
        // var inBlockX = Math.floor(this.pos.x/32);
        // var inBlockY = Math.floor(this.pos.y/32);
        // var b = (inBlockY*32) + inBlockX;
        // carte.blocks[b-33].drawAgain();
        // carte.blocks[b-32].drawAgain();
        // carte.blocks[b-31].drawAgain();
        // carte.blocks[b-1].drawAgain();
        // carte.blocks[b+1].drawAgain();
        // carte.blocks[b+31].drawAgain();
        // carte.blocks[b+32].drawAgain();
        // carte.blocks[b+33].drawAgain();

        ctx.fillStyle = "purple";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    },
    getMyBlock: function(){
        var inBlockX = Math.floor(this.pos.x/carte.tailleBlock);
        var inBlockY = Math.floor(this.pos.y/carte.tailleBlock);
        var blockIndex = (inBlockY * carte.taille.x) + inBlockX;
        // console.log("TCL: blockIndex", blockIndex)
        if(this.surBlock !== carte.blocks[blockIndex]){ //si block a changé
            //send event to server
            console.log("block changed!");
            this.blocksAround = outils.getBlocksAround(this);
            // console.log(this.blocksAround);
            this.surBlock.playerIn = null;
            this.surBlock = carte.blocks[blockIndex];
            carte.blocks[blockIndex].playerIn = this;
        }
    }
};

var Block = function(taille, x, y, type, base, depart){
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
    this.draw = function(){
        // ctx.rect(this.x*taille, this.y*taille, this.taille, this.taille);
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
            // if(this.playerIn === player){
            //     ctx.fillStyle = "rgba(255,255,255,0.5)";
            // }
        }
        ctx.fillRect(this.x*taille, this.y*taille, this.taille, this.taille);
    },
    this.drawAgain = function(){
        ctx.fillStyle = "green";
        ctx.fillRect(this.x*taille, this.y*taille, this.taille, this.taille);
    },
    this.path = function(){
        ctx.beginPath();
        ctx.rect(this.x*taille, this.y*taille, this.taille, this.taille);
        ctx.closePath();
    }
    this.flashBase = function(){
        this.flashing = setInterval(function(){
            // console.log("blip");
            if(carte.base.baseColor === "orange"){
                carte.base.baseColor = "red";
            } else {
                carte.base.baseColor = "orange";
            }
        }, 1000);
    }
};

var drawMap = function(map, tileset){
    carte.taille.x = map.width;
    carte.taille.y = map.height;
    carte.tailleBlock = map.tileheight;
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
        if(i % carte.taille.x === 0 && i > 0){
            posX = 0;
            posY++;
            indexX = 1;
            indexY++;
        }

        //creates the new block and assigns it to Carte
        var newBlock = new Block(taille, posX, posY, type, base, depart);
        carte.blocks.push(newBlock);
        if(base){
            newBlock.playerIn = player;
            carte.base = newBlock;
        }
        if(depart){
            carte.departs.push(newBlock);
        }
    }
};

$.getJSON("/maps/map1.json", function( data ) {
    var mapLoaded = data;
    $.getJSON( "/maps/terrain.json", function( data2 ) {
        var tileset = data2;
        drawMap(mapLoaded[0], tileset);
        player.surBlock = carte.base;
        player.pos.x = (carte.base.x * carte.tailleBlock) + carte.tailleBlock/2;
        player.pos.y = (carte.base.y * carte.tailleBlock) + carte.tailleBlock/2;
        player.blocksAround = outils.getBlocksAround(player);
        player2.surBlock = carte.base;
        player2.pos.x = (carte.departs[1].x * carte.tailleBlock) + carte.tailleBlock/2;
        player2.pos.y = (carte.departs[1].y * carte.tailleBlock) + carte.tailleBlock/2;
        gameLoop();
    })
});

// drawMap(map, tileset);
