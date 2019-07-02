const Player = (function(){
    let newPlayer = function (id, role, x, y, radius, sauteDistance, speed){
        this.id = id;
        this.role = role;
        this.pos = {x: x, y:y};
        this.radius = radius;
        this.sauteDistance = sauteDistance;
        this.speed = speed;
        this.trouve = false;
        this.playersTrouves = [];
        this.surBlock = {};
        this.blocksVisibles = [];
        this.blocksAround = [];
        this.score = 0;
        this.moving = null;
        this.direction = "up";
    };
    newPlayer.prototype.draw = function(){
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
    };
    // newPlayer.prototype.getMyBlock = function(){
    //     var inBlockX = Math.floor(this.pos.x/currentGame.carte.tailleBlock);
    //     var inBlockY = Math.floor(this.pos.y/currentGame.carte.tailleBlock);
    //     var blockIndex = (inBlockY * currentGame.carte.taille.x) + inBlockX;
    //     // console.log("TCL: blockIndex", blockIndex)
    //     if(this.surBlock !== currentGame.carte.blocks[blockIndex]){ //si block a changé
    //         //send event to server
    //         console.log("block changed!");
    //         this.blocksAround = outils.getBlocksAround(this);
    //         // console.log(this.blocksAround);
    //         this.surBlock.playerIn = null;
    //         this.surBlock = currentGame.carte.blocks[blockIndex];
    //         currentGame.carte.blocks[blockIndex].playerIn = this;

    //         if(currentGame.carte.base == this.surBlock && this.playersTrouves.length){
    //             outils.killFound(this);
                
    //         }
    //     }
    // };

    return function(id, role, x, y, radius, sauteDistance, speed){
        return new newPlayer(id, role, x, y, radius, sauteDistance, speed);
    }
}());

module.exports = Player;