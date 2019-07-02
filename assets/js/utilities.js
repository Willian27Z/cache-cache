var outils = {
    getMyBlock: function(player){
        var inBlockX = Math.floor(player.pos.x/carte.tailleBlock);
        var inBlockY = Math.floor(player.pos.y/carte.tailleBlock);
        return (inBlockY*carte.taille.x) + inBlockX;
    },
    getBlocksAround: function(player){
        var inBlockX = Math.floor(player.pos.x/carte.tailleBlock);
        var inBlockY = Math.floor(player.pos.y/carte.tailleBlock);
        var b = (inBlockY*carte.taille.x) + inBlockX;
        return [b-carte.taille.x-1,
                b-carte.taille.x,
                b-carte.taille.x+1,
                b-1,
                b+1,
                b+carte.taille.x-1,
                b+carte.taille.x,
                b+carte.taille.x+1];
    },
    getVisibleBlocks: function(player){
        var inBlockX = Math.floor(player.pos.x/carte.tailleBlock);
        var inBlockY = Math.floor(player.pos.y/carte.tailleBlock);
        var blockRef = (inBlockY * carte.taille.x) + inBlockX;
        
        var blocksVisibles = [];

        if(player.direction === "right"){
            for(var i = blockRef ; carte.blocks[i] ; i++){
                if(carte.blocks[i].type === "sol"){
                    blocksVisibles.push(i);
                } else {
                    return blocksVisibles;
                }
            }
        }
        if(player.direction === "left"){
            for(var i = blockRef ; carte.blocks[i] ; i--){
                if(carte.blocks[i].type === "sol"){
                    blocksVisibles.push(i);
                } else {
                    return blocksVisibles;
                }
            }
        }
        if(player.direction === "up"){
            for(var i = blockRef ; carte.blocks[i] ; i-=carte.taille.x){
                if(carte.blocks[i].type === "sol"){
                    blocksVisibles.push(i);
                } else {
                    return blocksVisibles;
                }
            }
        }
        if(player.direction === "down"){
            for(var i = blockRef ; carte.blocks[i] ; i+=carte.taille.x){
                if(carte.blocks[i].type === "sol"){
                    blocksVisibles.push(i);
                } else {
                    return blocksVisibles;
                }
            }
        }
    },
    checkCollision: function(player){
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
                if( carte.blocks[player.blocksAround[i]].type === "mur" || (carte.blocks[player.blocksAround[i]].type === "sol" && carte.blocks[player.blocksAround[i]].playerIn) ){
                    var block = carte.blocks[player.blocksAround[i]];
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
    checkIfFound: function(player){
        for(var i = 0 ; player.blocksVisibles[i] ; i++){ //pour chaque block visible
            if(carte.blocks[player.blocksVisibles[i]].playerIn){ //si joueur est là
                console.log("Trouvé !!! => " + carte.blocks[player.blocksVisibles[i]].playerIn);
                carte.blocks[player.blocksVisibles[i]].playerIn.trouve = true;
                player.playersTrouves.push(carte.blocks[player.blocksVisibles[i]].playerIn);
                carte.base.flashDepart();
            }
        }
    },
    killFound: function(player){
        for(var i = 0 ; player.playersTrouves[i] ; i++ ){
            // player.playersTrouves[i].dead = true;
            // player.playersTrouves[i].dead = true;
            
        }
        console.log("Player killed");
        clearInterval(carte.base.flashing);
        carte.base.baseColor = "orange";
        player.playersTrouves = [];
    }
};