const Block = require("./block.js");
const Player = require("./player.js");


const GameSession = (function(){
    let newGame = function(name, map, maxPlayers, host) {
        this.name = name;
        this.map = map;
        this.maxPlayers = maxPlayers; // for future reference if the game handles more than 5 players
        this.initialized = false; // for players in hall to know if the game is being played
        this.valid = false; //after one round it becomes valid and results will be update in database
        this.host = host; //for future reference when games can be created by players
        this.carte = {
            blocks: [],
            taille: {x: null, y: null},
            tailleBlock: null,
            base: {},
            departs: []
        };
        this.players = [];
        this.nextRound = [];
    };

    newGame.prototype.drawMap = function(tileset){
        let map = this.map;
        this.carte.taille.x = map.width;
        this.carte.taille.y = map.height;
        this.carte.tailleBlock = map.tileheight;
        let taille = map.tileheight;
        let indexY = 0;
        let indexX = 0;
        for(let i = 0 ; map.layers[0].data[i] ; i++){ //pour chaque block in map JSON
            //trouver les propriétés du block
            let base = false;
            let depart = false;
            for(let t = 0 ; tileset.tiles[t] ; t++){
                if( tileset.tiles[t].id === (map.layers[0].data[i]-1) ){ //les id match
                    let properties = tileset.tiles[t].properties;
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
            let posX = indexX;
            let posY = indexY;
            indexX++
            //condition for changing X, Y index
            if(i % map.width === 0 && i > 0){
                posX = 0;
                posY++;
                indexX = 1;
                indexY++;
            }

            //creates the new block and assigns it to Carte
            let newBlock = Block(taille, posX, posY, type, base, depart);
            this.carte.blocks.push(newBlock);
            if(base){
                this.carte.base = newBlock;
            }
            if(depart){
                this.carte.departs.push(newBlock);
            }
        }
    };
    newGame.prototype.addPlayer = function(id, role, x, y, radius, sauteDistance, speed, socketID, color){
        let newPlayer = Player(id, role, x, y, radius, sauteDistance, speed, socketID, color)
        this.players.push(newPlayer);
        return newPlayer;
    }

    return function(name, map, maxPlayers, host){
        return new newGame(name, map, maxPlayers, host);
    }
}());

module.exports = GameSession;