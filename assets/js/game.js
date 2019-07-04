
var gameLoop = function(){

    //reinitialize map
    ctx.clearRect(0, 0, 1024, 704);

    //draws map blocks of type "sol"
    for(var b = 0 ; carte.blocks[b] ; b++){
        if(carte.blocks[b].type === "sol"){
            carte.blocks[b].draw();
        }
    }
    //applies mask
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, 1024, 704);
    
    //draws map blocks of type "mur"
    for(var b = 0 ; carte.blocks[b] ; b++){
        if(carte.blocks[b].type === "mur"){
            carte.blocks[b].draw();
        }
    }

    //Getting visible blocks to the player
    player.getMyBlock();
    player2.getMyBlock();
    player.blocksVisibles = outils.getVisibleBlocks(player);
    for(var i = 0 ; player.blocksVisibles[i] ; i++){
        carte.blocks[player.blocksVisibles[i]].draw();
        if(i > 0 && carte.blocks[player.blocksVisibles[i]].playerIn){
            carte.blocks[player.blocksVisibles[i]].playerIn.draw();

            if(!carte.blocks[player.blocksVisibles[i]].playerIn.trouve){
                console.log("Trouvé !!!");
                console.log(carte.blocks[player.blocksVisibles[i]].playerIn);
    
                carte.blocks[player.blocksVisibles[i]].playerIn.trouve = true;
                player.playersTrouves.push(carte.blocks[player.blocksVisibles[i]].playerIn);
                carte.base.flashBase();
            }
        }
    }
    
    // For debugging collision walls
    // for(var i = 0 ; player.blocksAround[i] ; i++){
    //     if(carte.blocks[player.blocksAround[i]].type === "mur"){
    //         carte.blocks[player.blocksAround[i]].drawAgain();
    //     }
    // }

    //check for collision
    outils.checkCollision(player);

    //draw player
    player.draw();

    window.requestAnimationFrame(gameLoop);
};




/***********************************
*******EVENT LISTENERS**************
***********************************/

window.addEventListener("keydown", function(event){
    //send event to server
    var key = event.key;
    if(key === "ArrowRight"){
        if(player.direction !== "right" || player.moving === null) {
            clearInterval(player.moving);
            player.moving = setInterval(function(){
                player.pos.x += 1;
            }, player.speed);
            player.direction = "right";
        };
    };
    if(key === "ArrowLeft") {
        if(player.direction !== "left" || player.moving === null) {
            clearInterval(player.moving);
            player.moving = setInterval(function(){
                player.pos.x -= 1;
            }, player.speed);
            player.direction = "left";
        };
    };
    if(key === "ArrowDown"){
        if(player.direction !== "down" || player.moving === null) {
            clearInterval(player.moving);
            player.moving = setInterval(function(){
                player.pos.y += 1;
            }, player.speed);
            player.direction = "down";
        };
    };
    if(key === "ArrowUp") {
        if(player.direction !== "up" || player.moving === null) {
            clearInterval(player.moving);
            player.moving = setInterval(function(){
                player.pos.y -= 1;
            }, player.speed);
            player.direction = "up";
        };
    };
    if(key === " " && player.saute === false && (player.role === "chasseur" || player.found) && player.moving){
        player.saute = true;
        if(player.direction === "right" && carte.blocks[player.blocksAround[4]].type !== "mur"){
            player.pos.x += player.sauteDistance;
        }
        if(player.direction === "left" && carte.blocks[player.blocksAround[3]].type !== "mur"){
            player.pos.x -= player.sauteDistance;
        }
        if(player.direction === "up" && carte.blocks[player.blocksAround[1]].type !== "mur"){
            player.pos.y -= player.sauteDistance;
        }
        if(player.direction === "down" && carte.blocks[player.blocksAround[6]].type !== "mur"){
            player.pos.y += player.sauteDistance;
        }
    }
});

window.addEventListener("keyup", function(event){
    //send event to server
    var key = event.key;
    if((key === "ArrowRight" && player.direction === "right") ||
       (key === "ArrowLeft" && player.direction === "left") || 
       (key === "ArrowDown" && player.direction === "down") ||
       (key === "ArrowUp" && player.direction === "up")
     ){
        clearInterval(player.moving);
        player.moving = null;
        // player.direction = null;
    };
    if( key === " " ){
        player.saute = false;
    }
});