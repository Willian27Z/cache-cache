const outils = {
    getMyBlock: function(player, game){
        var inBlockX = Math.floor(player.pos.x/game.carte.tailleBlock);
        var inBlockY = Math.floor(player.pos.y/game.carte.tailleBlock);
        var blockIndex = (inBlockY * game.carte.taille.x) + inBlockX;
        if(player.surBlock !== game.carte.blocks[blockIndex] && !player.done){ //si block a changé
            player.blocksAround = outils.getBlocksAround(player, game);
            player.surBlock.playerIn = null;
            player.surBlock = game.carte.blocks[blockIndex];
            if(game.carte.blocks[blockIndex]){
                game.carte.blocks[blockIndex].playerIn = player;
            }

            if(game.carte.base == player.surBlock && player.playersTrouves.length){
                outils.killFound(player, game);
            }
            if(game.carte.base == player.surBlock && player.role === "cacheur"){
                clearInterval(player.moving);
                player.done = true;
                outils.cacheurGagne(player, game);
            }
        }
    },
    getBlocksAround: function(player, game){
        var inBlockX = Math.floor(player.pos.x/game.carte.tailleBlock);
        var inBlockY = Math.floor(player.pos.y/game.carte.tailleBlock);
        var b = (inBlockY * game.carte.taille.x) + inBlockX;
        return [b - game.carte.taille.x - 1,
                b - game.carte.taille.x,
                b - game.carte.taille.x + 1,
                b - 1,
                b + 1,
                b + game.carte.taille.x - 1,
                b + game.carte.taille.x,
                b + game.carte.taille.x + 1];
    },
    getVisibleBlocks: function(player, game){
        var inBlockX = Math.floor(player.pos.x/game.carte.tailleBlock);
        var inBlockY = Math.floor(player.pos.y/game.carte.tailleBlock);
        var blockRef = (inBlockY * game.carte.taille.x) + inBlockX;
        
        var blocksVisibles = [];

        if(player.direction === "right"){
            for(var i = blockRef ; game.carte.blocks[i] ; i++){
                if(game.carte.blocks[i].type === "sol"){
                    blocksVisibles.push(i);
                } else {
                    return blocksVisibles;
                }
            }
        }
        if(player.direction === "left"){
            for(var i = blockRef ; game.carte.blocks[i] ; i--){
                if(game.carte.blocks[i].type === "sol"){
                    blocksVisibles.push(i);
                } else {
                    return blocksVisibles;
                }
            }
        }
        if(player.direction === "up"){
            for(var i = blockRef ; game.carte.blocks[i] ; i-=game.carte.taille.x){
                if(game.carte.blocks[i].type === "sol"){
                    blocksVisibles.push(i);
                } else {
                    return blocksVisibles;
                }
            }
        }
        if(player.direction === "down"){
            for(var i = blockRef ; game.carte.blocks[i] ; i+=game.carte.taille.x){
                if(game.carte.blocks[i].type === "sol"){
                    blocksVisibles.push(i);
                } else {
                    return blocksVisibles;
                }
            }
        }
    },
    checkCollision: function(player, game){
        if(!player.done && player.blocksAround.length){
            // console.log(player.name);
            for(var i = 0 ; i < player.blocksAround.length ; i++){
                if( game.carte.blocks[player.blocksAround[i]].type === "mur" || (game.carte.blocks[player.blocksAround[i]].type === "sol" && game.carte.blocks[player.blocksAround[i]].playerIn) ){
                    var block = game.carte.blocks[player.blocksAround[i]];
                    if(i === 1){ // top block
                        while(player.pos.x >= block.x * block.taille &&
                            player.pos.x <= block.x * block.taille + block.taille && 
                            player.pos.y - player.radius < block.y * block.taille + block.taille){
                                player.pos.y++;
                        };
                    }
                    if(i === 6){ //bottom block
                        while(player.pos.x >= block.x * block.taille &&
                            player.pos.x <= block.x * block.taille + block.taille && 
                            player.pos.y + player.radius > block.y * block.taille){
                                player.pos.y--;
                        };
                    }
                    if(i === 3){ //left block
                        while(player.pos.y >= block.y * block.taille &&
                            player.pos.y <= block.y * block.taille + block.taille && 
                            player.pos.x - player.radius < block.x * block.taille + block.taille){
                                player.pos.x++;
                        };
                    }
                    if(i === 4){ //right block
                        while(player.pos.y >= block.y * block.taille &&
                            player.pos.y <= block.y * block.taille + block.taille && 
                            player.pos.x + player.radius > block.x * block.taille){
                                player.pos.x--;
                        };
                    }
                }
            }
        }
    },
    checkIfFound: function(player, game, socket){
        let playersFound = [];
        let didHunterFindSomeone = false;
        let foundByHunter = [];
        for(var i = 1 ; i < player.blocksVisibles.length ; i++){ //pour chaque block visible
            if(game.carte.blocks[player.blocksVisibles[i]].playerIn){ //si joueur est là
                let playerFound = game.carte.blocks[player.blocksVisibles[i]].playerIn
                playersFound.push({
                    pos: {x: playerFound.pos.x, y: playerFound.pos.y},
                    radius: playerFound.radius,
                    role: playerFound.role,
                    name: playerFound.name,
                    color: playerFound.color,
                    gameChair: playerFound.gameChair,
                });
                
                if(player.role === "chasseur" && !game.carte.blocks[player.blocksVisibles[i]].playerIn.trouve){
                    // console.log("Trouvé !!!");
                    // console.log(game.carte.blocks[player.blocksVisibles[i]].playerIn);
                    game.carte.blocks[player.blocksVisibles[i]].playerIn.trouve = true;
                    didHunterFindSomeone = true;
                    foundByHunter.push(game.carte.blocks[player.blocksVisibles[i]].playerIn.gameChair);
                    player.playersTrouves.push(game.carte.blocks[player.blocksVisibles[i]].playerIn);
                    game.carte.base.flashBase(game);
                    socket.emit("playerFound", "Go to Center!");
                }
            }
        }
        socket.emit("playersSeen", playersFound);
        // if(game.nextRound.length){
        //     game.nextRound.forEach(function(playerout){
        //         playerout.socket.emit("playersSeen", playersFound);
        //     });
        // }

        if(didHunterFindSomeone){
            game.players.forEach(function(player){
                player.socket.emit("foundByHunter", foundByHunter);
            });
        }
    },
    killFound: function(player, game){
        let playersKilled = [];
        for(var i = 0 ; i < player.playersTrouves.length ; i++ ){
            // player.playersTrouves[i].dead = true;
            // player.playersTrouves[i].socket.emit("lost", player.playersTrouves[i].gameChair);

            playersKilled.push(player.playersTrouves[i].gameChair)
            console.log("Player killed: " + player.playersTrouves[i].name);

            player.score++

            // game.nextRound.push(player.playersTrouves[i]);
            outils.sendToNextRound(player.playersTrouves[i], game);

            
        }
        clearInterval(game.carte.base.flashing);
        game.carte.base.flashing = null;
        game.carte.base.baseColor = "orange";
        player.playersTrouves = [];

        // Inform players
        game.players.forEach(function(oneplayer){
            oneplayer.socket.emit("players killed", playersKilled);
            oneplayer.socket.emit("add points", {gameChair: player.gameChair, score: player.score});
        });
    },
    cacheurGagne: function(player, game){
        player.score++
        outils.sendToNextRound(player, game);
        // Inform players
        game.players.forEach(function(oneplayer){
            oneplayer.socket.emit("cacheur gagné", player.gameChair);
            oneplayer.socket.emit("add points", {gameChair: player.gameChair, score: player.score});
        });
        if(player.trouve){
            let hunter = game.players.find(function(playerx){
                return playerx.role === "chasseur";
            });
            let cible = hunter.playersTrouves.find(function(thiscible){
                return thiscible.name === player.name
            });
            let indexCible = hunter.playersTrouves.indexOf(cible);
            hunter.playersTrouves.splice(indexCible, 1);
            if(!hunter.playersTrouves.length){
                hunter.socket.emit("ciblesOntFuit", player.gameChair);
            }
        }

    },
    movePlayer: function(player, game, key, socket){
        if(key === "ArrowRight"){
            if(player.direction !== "right" || player.moving === null) {
                clearInterval(player.moving);
                player.moving = setInterval(function(){
                    player.pos.x += 1;

                    
                    outils.checkAll(game);


                    socket.emit("moved", {pos: player.pos, blocksVisibles: player.blocksVisibles});

                    if(game.nextRound.length){
                        game.nextRound.forEach(function(playerout){
                            playerout.socket.emit("spectateur", {
                                pos: {x: player.pos.x, y: player.pos.y},
                                radius: player.radius,
                                name: player.name,
                                color: player.color,
                            });
                        });
                    }

                }, player.speed);
                player.direction = "right";
            };
        };
        if(key === "ArrowLeft") {
            if(player.direction !== "left" || player.moving === null) {
                clearInterval(player.moving);
                player.moving = setInterval(function(){
                    player.pos.x -= 1;

                    // outils.getMyBlock(player, game);
                    // player.blocksAround = outils.getBlocksAround(player, game);
                    // outils.checkCollision(player, game);
                    // player.blocksVisibles = outils.getVisibleBlocks(player, game);
                    // outils.checkIfFound(player, game);
                    outils.checkAll(game);

                    socket.emit("moved", {pos: player.pos, blocksVisibles: player.blocksVisibles});

                    if(game.nextRound.length){
                        game.nextRound.forEach(function(playerout){
                            playerout.socket.emit("spectateur", {
                                pos: {x: player.pos.x, y: player.pos.y},
                                radius: player.radius,
                                name: player.name,
                                color: player.color,
                            });
                        });
                    }

                }, player.speed);
                player.direction = "left";
            };
        };
        if(key === "ArrowDown"){
            if(player.direction !== "down" || player.moving === null) {
                clearInterval(player.moving);
                player.moving = setInterval(function(){
                    player.pos.y += 1;

                    // outils.getMyBlock(player, game);
                    // player.blocksAround = outils.getBlocksAround(player, game);
                    // outils.checkCollision(player, game);
                    // player.blocksVisibles = outils.getVisibleBlocks(player, game);
                    // outils.checkIfFound(player, game);
                    outils.checkAll(game);

                    socket.emit("moved", {pos: player.pos, blocksVisibles: player.blocksVisibles});

                    if(game.nextRound.length){
                        game.nextRound.forEach(function(playerout){
                            playerout.socket.emit("spectateur", {
                                pos: {x: player.pos.x, y: player.pos.y},
                                radius: player.radius,
                                name: player.name,
                                color: player.color,
                            });
                        });
                    }

                }, player.speed);
                player.direction = "down";
            };
        };
        if(key === "ArrowUp") {
            if(player.direction !== "up" || player.moving === null) {
                clearInterval(player.moving);
                player.moving = setInterval(function(){
                    player.pos.y -= 1;

                    // outils.getMyBlock(player, game);
                    // player.blocksAround = outils.getBlocksAround(player, game);
                    // outils.checkCollision(player, game);
                    // player.blocksVisibles = outils.getVisibleBlocks(player, game);
                    // outils.checkIfFound(player, game);
                    outils.checkAll(game);

                    socket.emit("moved", {pos: player.pos, blocksVisibles: player.blocksVisibles});

                    if(game.nextRound.length){
                        game.nextRound.forEach(function(playerout){
                            playerout.socket.emit("spectateur", {
                                pos: {x: player.pos.x, y: player.pos.y},
                                radius: player.radius,
                                name: player.name,
                                color: player.color,
                            });
                        });
                    }

                }, player.speed);
                player.direction = "up";
            };
        };
        if(key === " " && player.saute === false && (player.role === "chasseur" || player.found) && player.moving){
            player.saute = true;
            if(player.direction === "right" && game.carte.blocks[player.blocksAround[4]].type !== "mur"){
                player.pos.x += player.sauteDistance;
            }
            if(player.direction === "left" && game.carte.blocks[player.blocksAround[3]].type !== "mur"){
                player.pos.x -= player.sauteDistance;
            }
            if(player.direction === "up" && game.carte.blocks[player.blocksAround[1]].type !== "mur"){
                player.pos.y -= player.sauteDistance;
            }
            if(player.direction === "down" && game.carte.blocks[player.blocksAround[6]].type !== "mur"){
                player.pos.y += player.sauteDistance;
            }
        }
    },
    stopPlayer: function(player, game, key, socket){
        if((key === "ArrowRight" && player.direction === "right") ||
           (key === "ArrowLeft" && player.direction === "left") || 
           (key === "ArrowDown" && player.direction === "down") ||
           (key === "ArrowUp" && player.direction === "up")
         ){
            clearInterval(player.moving);
            player.moving = null;

            // outils.getMyBlock(player, game);
            // player.blocksAround = outils.getBlocksAround(player, game);
            // outils.checkCollision(player, game);
            // player.blocksVisibles = outils.getVisibleBlocks(player, game);
            // outils.checkIfFound(player, game);
            outils.checkAll(game);

            socket.emit("moved", {pos: player.pos, blocksVisibles: player.blocksVisibles});
            // player.direction = null;
        };
        if( key === " " ){
            player.saute = false;
        }
    },
    checkAll: function(game){
        for(let i = 0 ; i < game.players.length ; i++){
            if(!game.players[i].done){
                outils.getMyBlock(game.players[i] , game);
                outils.checkCollision(game.players[i], game);
                // game.players[i].blocksAround = outils.getBlocksAround(game.players[i] , game);
                game.players[i].blocksVisibles = outils.getVisibleBlocks(game.players[i] , game);
                outils.checkIfFound(game.players[i], game, game.players[i].socket);
            }
        }
    },
    isGameReady: function(game){
        let hunter = game.players.find(function(player){
            return player.role === "chasseur"
        });
        if(game.players.length >= 2 && hunter){
            return true
        } else {
            return false
        }
    },
    hunterSocket: function (game){
        let hunter = game.players.find(function(player){
            return player.role === "chasseur"
        });
        if(hunter){
            return hunter.socket
        } else {
            return false
        }
    },
    sendToNextRound: function(player, game){
        game.nextRound.push(player);
        if(player.moving){
            clearInterval(player.moving);
            player.moving = null;
        }
        player.socket.emit("you are done", "bruh");
        // player.pos.x = -100;
        // player.pos.y = -100;
        player.surBlock.playerIn = null;
        // player.blocksAround = [];
        // player.surBlock = null;
        if(game.nextRound.length === game.players.length - 1){
            outils.restartGame(game);
        }
    },
    restartGame: function(game){
        let seconds = 5000;
        game.players.forEach(function(player){
            player.socket.emit("gameRestarting", seconds);
        });
        setTimeout(function(){
            let departIndex = 0;
            game.players.forEach(function(player){
                //change roles
                if(player.role === "chasseur"){
                    player.role = "cacheur"
                    player.pos.x = (game.carte.departs[departIndex].x * game.carte.tailleBlock) + game.carte.tailleBlock/2;
                    player.pos.y = (game.carte.departs[departIndex].y * game.carte.tailleBlock) + game.carte.tailleBlock/2;
                    departIndex++;
                } else {
                    if(player == game.nextRound[0]){
                        player.role = "chasseur";
                        player.pos.x = (game.carte.base.x * game.carte.tailleBlock) + game.carte.tailleBlock/2;
                        player.pos.y = (game.carte.base.y * game.carte.tailleBlock) + game.carte.tailleBlock/2;
    
                    } else {
                        player.pos.x = (game.carte.departs[departIndex].x * game.carte.tailleBlock) + game.carte.tailleBlock/2;
                        player.pos.y = (game.carte.departs[departIndex].y * game.carte.tailleBlock) + game.carte.tailleBlock/2;
                        departIndex++;
                    }
                }
                
                //reset parameters
                player.direction = "up";
                outils.getMyBlock(player, game);
                player.blocksVisibles = outils.getVisibleBlocks(player, game);
                player.done = false;
                player.trouve = false;
                player.playersTrouves = [];
                if(player.moving){
                    clearInterval(player.moving);
                    player.moving = null;
                }
                
                // player.blocksVisibles = [];
                // player.blocksAround = [];
                //send new info
                let gameData = {
                    pos: player.pos,
                    blocksVisibles: player.blocksVisibles,
                    role: player.role
                }
                player.socket.emit("game restarted", gameData);
                game.players.forEach(function(oneplayer){
                    oneplayer.socket.emit("player restart", {gameChair: player.gameChair, role: player.role});
                })
            });
    
            //reset game parameters
            game.nextRound = [];
            if(game.carte.base.flashing){
                clearInterval(game.carte.base.flashing);
                game.carte.base.flashing = null;
                game.carte.base.baseColor = "orange";
            }
        }, seconds);

    }
};

module.exports = outils;