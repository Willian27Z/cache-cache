const Player = (function(){
    let NewPlayer = function (name, role, x, y, radius, sauteDistance, speed, socketId , color){
        this.name = name;
        this.socket = socketId;
        this.done = false;
        this.color = color;
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
        this.gameTime = 0;
        this.gameTimer = null;
        this.moving = null;
        this.direction = "up";
        this.spriteTiming = null;
        this.nextSprite = true;
        this.currentSprite = 1;
    };

    return function(id, role, x, y, radius, sauteDistance, speed, socketId , color){
        return new NewPlayer(id, role, x, y, radius, sauteDistance, speed, socketId , color);
    }
}());

module.exports = Player;