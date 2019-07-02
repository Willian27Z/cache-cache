const outils = {
    getMyBlock: function(player, game){
        var inBlockX = Math.floor(player.pos.x/game.carte.tailleBlock);
        var inBlockY = Math.floor(player.pos.y/game.carte.tailleBlock);
        var blockIndex = (inBlockY * game.carte.taille.x) + inBlockX;
        // console.log("TCL: blockIndex", blockIndex)
        if(player.surBlock !== game.carte.blocks[blockIndex]){ //si block a changé
            // console.log("block changed!");
            player.blocksAround = outils.getBlocksAround(player, game);
            // console.log(this.blocksAround);
            player.surBlock.playerIn = null;
            player.surBlock = game.carte.blocks[blockIndex];
            game.carte.blocks[blockIndex].playerIn = player;

            if(game.carte.base == player.surBlock && player.playersTrouves.length){
                outils.killFound(player, game);
                
            }
        }
    },
    getBlocksAround: function(player, game){
        var inBlockX = Math.floor(player.pos.x/game.carte.tailleBlock);
        var inBlockY = Math.floor(player.pos.y/game.carte.tailleBlock);
        var b = (inBlockY*game.carte.taille.x) + inBlockX;
        return [b-game.carte.taille.x-1,
                b-game.carte.taille.x,
                b-game.carte.taille.x+1,
                b-1,
                b+1,
                b+game.carte.taille.x-1,
                b+game.carte.taille.x,
                b+game.carte.taille.x+1];
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
        // for(var i = 0 ; player.blocksAround[i] ; i++){
        //     if(carte.blocks[player.blocksAround[i]].type === "mur"){
        //         carte.blocks[player.blocksAround[i]].path();
        //         if(ctx.isPointInPath(player.pos.x, player.pos.y)
        //     }
        // }

        
        // for(var angle = 0 ; angle <= 360 ; angle++){
        //     var x = player.pos.x + (player.radius * Math.sin( angle * Math.PI/180 ));
        //     var y = player.pos.y + (player.radius * Math.cos( angle * Math.PI/180 ));
            
            for(var i = 0 ; player.blocksAround[i] ; i++){
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
        //}
        
    },
    checkIfFound: function(player, game, socket){
        let playersFound = [];
        for(var i = 1 ; player.blocksVisibles[i] ; i++){ //pour chaque block visible
            if(game.carte.blocks[player.blocksVisibles[i]].playerIn){ //si joueur est là
                let playerFound = game.carte.blocks[player.blocksVisibles[i]].playerIn
                playersFound.push({
                    pos: {x: playerFound.pos.x, y: playerFound.pos.y},
                    radius: playerFound.radius,
                    role: playerFound.role,
                    id: playerFound.id
                })
                
                if(player.role === "chasseur" && !game.carte.blocks[player.blocksVisibles[i]].playerIn.trouve){
                    // console.log("Trouvé !!!");
                    // console.log(game.carte.blocks[player.blocksVisibles[i]].playerIn);
                    game.carte.blocks[player.blocksVisibles[i]].playerIn.trouve = true;
                    player.playersTrouves.push(game.carte.blocks[player.blocksVisibles[i]].playerIn);
                    game.carte.base.flashBase();
                    socket.emit("playerFound", playersFound)
                }
            }
        }
        socket.emit("playersSeen", playersFound);
    },
    killFound: function(player, game, socket){
        for(var i = 0 ; player.playersTrouves[i] ; i++ ){
            // player.playersTrouves[i].dead = true;
            player.playersTrouves[i].socket.emit("lost", "Vous avez perdu!");
            
        }
        console.log("Player killed");
        clearInterval(game.carte.base.flashing);
        game.carte.base.baseColor = "orange";
        player.playersTrouves = [];
        socket.emit("pl")
    },
    movePlayer: function(player, game, key, socket){
        if(key === "ArrowRight"){
            if(player.direction !== "right" || player.moving === null) {
                clearInterval(player.moving);
                player.moving = setInterval(function(){
                    player.pos.x += 1;

                    
                    outils.checkAll(game);


                    socket.emit("moved", {pos: player.pos, blocksVisibles: player.blocksVisibles});
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
        for(let i = 0 ; game.players[i] ; i++){
            outils.getMyBlock(game.players[i] , game);
            outils.checkCollision(game.players[i], game);
            // game.players[i].blocksAround = outils.getBlocksAround(game.players[i] , game);
            game.players[i].blocksVisibles = outils.getVisibleBlocks(game.players[i] , game);
            outils.checkIfFound(game.players[i], game, game.players[i].socket);
        }
    }
};

module.exports = outils;