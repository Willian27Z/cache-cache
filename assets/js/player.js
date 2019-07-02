var player = {
    role: "chasseur",
    pos: {x: null, y: null},
    dir: "up",
    surBlock: {},
    blocksVisibles: [],
    score: 0,
    moving: false,
    draw: function(){
        ctx.fillStyle = "blue";
        ctx.fillCircle(this.pos.x, this.pos.y, 22, 0, Math.PI * 2, true);
    }
};

