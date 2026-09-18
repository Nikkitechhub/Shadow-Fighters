```javascript
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const player1Health = document.getElementById("player1Health");
const player2Health = document.getElementById("player2Health");

const timerElement = document.getElementById("timer");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const winnerText = document.getElementById("winnerText");


/* =========================
   GAME VARIABLES
========================= */

const FLOOR = 430;
const GRAVITY = 0.7;

let gameState = "MENU";

let player1;
let player2;

let timeLeft = 60;

let timerInterval = null;
let animationId = null;

const keys = {};


/* =========================
   KEYBOARD
========================= */

window.addEventListener("keydown", function(event) {

    const key = event.key.toLowerCase();

    keys[key] = true;

    if (
        key === "arrowup" ||
        key === "arrowdown" ||
        key === "arrowleft" ||
        key === "arrowright"
    ) {
        event.preventDefault();
    }
});


window.addEventListener("keyup", function(event) {

    const key = event.key.toLowerCase();

    keys[key] = false;
});


/* =========================
   FIGHTER CLASS
========================= */

class Fighter {

    constructor(x, color, controls) {

        this.startX = x;

        this.x = x;
        this.y = FLOOR - 100;

        this.width = 50;
        this.height = 100;

        this.color = color;

        this.velocityX = 0;
        this.velocityY = 0;

        this.speed = 5;

        this.health = 100;

        this.isJumping = false;
        this.isBlocking = false;
        this.isAttacking = false;

        this.facing = 1;

        this.attackCooldown = 0;

        this.attackTimer = 0;

        this.currentAttack = null;

        this.attackHasHit = false;

        this.controls = controls;

        this.hitFlash = 0;
    }


    reset() {

        this.x = this.startX;

        this.y = FLOOR - this.height;

        this.velocityX = 0;
        this.velocityY = 0;

        this.health = 100;

        this.isJumping = false;

        this.isBlocking = false;

        this.isAttacking = false;

        this.facing = 1;

        this.attackCooldown = 0;

        this.attackTimer = 0;

        this.currentAttack = null;

        this.attackHasHit = false;

        this.hitFlash = 0;
    }


    update(opponent) {

        if (gameState !== "PLAYING") {
            return;
        }

        this.velocityX = 0;


        /* FACE OPPONENT */

        if (opponent.x > this.x) {
            this.facing = 1;
        } else {
            this.facing = -1;
        }


        /* BLOCK */

        this.isBlocking =
            keys[this.controls.block] &&
            !this.isAttacking;


        if (!this.isBlocking) {

            /* MOVE */

            if (keys[this.controls.left]) {
                this.velocityX = -this.speed;
            }

            if (keys[this.controls.right]) {
                this.velocityX = this.speed;
            }


            /* JUMP */

            if (
                keys[this.controls.jump] &&
                !this.isJumping
            ) {

                this.velocityY = -14;

                this.isJumping = true;
            }


            /* ATTACK */

            if (
                keys[this.controls.punch] &&
                this.attackCooldown <= 0
            ) {

                this.startAttack("punch");
            }


            if (
                keys[this.controls.kick] &&
                this.attackCooldown <= 0
            ) {

                this.startAttack("kick");
            }


            if (
                keys[this.controls.special] &&
                this.attackCooldown <= 0
            ) {

                this.startAttack("special");
            }
        }


        /* PHYSICS */

        this.velocityY += GRAVITY;

        this.x += this.velocityX;

        this.y += this.velocityY;


        /* FLOOR */

        if (this.y + this.height >= FLOOR) {

            this.y = FLOOR - this.height;

            this.velocityY = 0;

            this.isJumping = false;
        }


        /* WALLS */

        if (this.x < 10) {
            this.x = 10;
        }

        if (this.x + this.width > canvas.width - 10) {
            this.x = canvas.width - this.width - 10;
        }


        /* COOLDOWN */

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }


        /* ATTACK */

        if (this.isAttacking) {

            this.attackTimer--;

            if (this.attackTimer <= 0) {

                this.isAttacking = false;

                this.currentAttack = null;

                this.attackHasHit = false;
            }
        }


        if (this.hitFlash > 0) {
            this.hitFlash--;
        }
    }


    startAttack(type) {

        this.isAttacking = true;

        this.currentAttack = type;

        this.attackHasHit = false;


        if (type === "punch") {

            this.attackTimer = 12;

            this.attackCooldown = 22;
        }


        if (type === "kick") {

            this.attackTimer = 15;

            this.attackCooldown = 30;
        }


        if (type === "special") {

            this.attackTimer = 20;

            this.attackCooldown = 80;
        }
    }


    getAttackHitbox() {

        if (!this.isAttacking) {
            return null;
        }


        let range = 0;

        let height = 50;


        if (this.currentAttack === "punch") {
            range = 65;
        }


        if (this.currentAttack === "kick") {
            range = 85;
        }


        if (this.currentAttack === "special") {
            range = 140;
            height = 80;
        }


        let hitboxX;


        if (this.facing === 1) {

            hitboxX = this.x + this.width;

        } else {

            hitboxX = this.x - range;
        }


        return {

            x: hitboxX,

            y: this.y + 25,

            width: range,

            height: height
        };
    }


    draw() {

        /* SHADOW */

        ctx.beginPath();

        ctx.ellipse(
            this.x + 25,
            FLOOR + 3,
            35,
            8,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "rgba(0,0,0,0.5)";

        ctx.fill();


        /* FLASH */

        if (this.hitFlash > 0) {

            ctx.fillStyle = "white";

        } else {

            ctx.fillStyle = this.color;
        }


        /* BODY */

        ctx.fillRect(
            this.x,
            this.y + 30,
            this.width,
            70
        );


        /* HEAD */

        ctx.beginPath();

        ctx.arc(
            this.x + 25,
            this.y + 18,
            18,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#f0bd78";

        ctx.fill();


        /* EYES */

        ctx.fillStyle = "#111";

        ctx.fillRect(
            this.x + 17,
            this.y + 14,
            5,
            5
        );

        ctx.fillRect(
            this.x + 29,
            this.y + 14,
            5,
            5
        );


        /* ARMS */

        ctx.fillStyle = this.color;

        ctx.fillRect(
            this.x - 15,
            this.y + 35,
            15,
            45
        );

        ctx.fillRect(
            this.x + this.width,
            this.y + 35,
            15,
            45
        );


        /* LEGS */

        ctx.fillRect(
            this.x + 5,
            this.y + 100,
            15,
            30
        );

        ctx.fillRect(
            this.x + 30,
            this.y + 100,
            15,
            30
        );


        /* BLOCK EFFECT */

        if (this.isBlocking) {

            ctx.beginPath();

            ctx.arc(
                this.x + 25,
                this.y + 55,
                65,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle = "#fff";

            ctx.lineWidth = 5;

            ctx.stroke();
        }


        /* ATTACK EFFECT */

        if (this.isAttacking) {

            const hitbox = this.getAttackHitbox();

            if (hitbox) {

                ctx.fillStyle =
                    this.currentAttack === "special"
                        ? "rgba(255,255,0,0.35)"
                        : "rgba(255,255,255,0.25)";

                ctx.fillRect(
                    hitbox.x,
                    hitbox.y,
                    hitbox.width,
                    hitbox.height
                );
            }
        }
    }
}


/* =========================
   COLLISION
========================= */

function rectanglesOverlap(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}


/* =========================
   ATTACK CHECK
========================= */

function checkAttack(attacker, defender) {

    if (!attacker.isAttacking) {
        return;
    }

    if (attacker.attackHasHit) {
        return;
    }

    const hitbox = attacker.getAttackHitbox();

    const defenderBox = {

        x: defender.x,

        y: defender.y,

        width: defender.width,

        height: defender.height
    };


    if (
        hitbox &&
        rectanglesOverlap(hitbox, defenderBox)
    ) {

        let damage = 0;

        if (attacker.currentAttack === "punch") {
            damage = 8;
        }

        if (attacker.currentAttack === "kick") {
            damage = 12;
        }

        if (attacker.currentAttack === "special") {
            damage = 20;
        }


        /* BLOCK */

        if (defender.isBlocking) {

            damage *= 0.3;
        }


        defender.health -= damage;

        defender.health =
            Math.max(0, defender.health);


        defender.hitFlash = 8;


        /* KNOCKBACK */

        if (!defender.isBlocking) {

            if (attacker.facing === 1) {

                defender.x +=
                    attacker.currentAttack === "special"
                        ? 60
                        : 25;

            } else {

                defender.x -=
                    attacker.currentAttack === "special"
                        ? 60
                        : 25;
            }
        }


        attacker.attackHasHit = true;


        updateHealth();


        if (defender.health <= 0) {

            endGame(
                attacker === player1
                    ? "PLAYER 1 WINS!"
                    : "PLAYER 2 WINS!"
            );
        }
    }
}


/* =========================
   HEALTH
========================= */

function updateHealth() {

    player1Health.style.width =
        player1.health + "%";

    player2Health.style.width =
        player2.health + "%";
}


/* =========================
   BACKGROUND
========================= */

function drawBackground() {

    /* SKY */

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );

    gradient.addColorStop(
        0,
        "#080820"
    );

    gradient.addColorStop(
        1,
        "#25254a"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /* MOON */

    ctx.beginPath();

    ctx.arc(
        500,
        100,
        55,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#eeeecc";

    ctx.fill();


    /* BUILDINGS */

    for (
        let x = 0;
        x < canvas.width;
        x += 100
    ) {

        const height =
            80 + (x % 4) * 25;

        ctx.fillStyle = "#101020";

        ctx.fillRect(
            x,
            FLOOR - height,
            80,
            height
        );


        /* WINDOWS */

        ctx.fillStyle = "#444466";

        for (
            let y = FLOOR - height + 15;
            y < FLOOR - 10;
            y += 25
        ) {

            ctx.fillRect(
                x + 15,
                y,
                8,
                8
            );

            ctx.fillRect(
                x + 40,
                y,
                8,
                8
            );
        }
    }


    /* FLOOR */

    ctx.fillStyle = "#181820";

    ctx.fillRect(
        0,
        FLOOR,
        canvas.width,
        canvas.height - FLOOR
    );


    /* FLOOR LINE */

    ctx.strokeStyle = "#00eaff";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(
        0,
        FLOOR
    );

    ctx.lineTo(
        canvas.width,
        FLOOR
    );

    ctx.stroke();
}


/* =========================
   CREATE PLAYERS
========================= */

function createPlayers() {

    player1 = new Fighter(
        200,
        "#00eaff",
        {
            left: "a",
            right: "d",
            jump: "w",
            punch: "f",
            kick: "g",
            special: "h",
            block: "s"
        }
    );


    player2 = new Fighter(
        750,
        "#ff1744",
        {
            left: "arrowleft",
            right: "arrowright",
            jump: "arrowup",
            punch: "j",
            kick: "k",
            special: "l",
            block: "arrowdown"
        }
    );
}


/* =========================
   START GAME
========================= */

function startGame() {

    if (animationId !== null) {

        cancelAnimationFrame(animationId);

        animationId = null;
    }


    clearInterval(timerInterval);


    createPlayers();


    timeLeft = 60;

    timerElement.textContent =
        timeLeft;


    updateHealth();


    startScreen.classList.add(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );


    gameState = "PLAYING";


    timerInterval = setInterval(
        function() {

            if (gameState !== "PLAYING") {
                return;
            }

            timeLeft--;

            timerElement.textContent =
                timeLeft;


            if (timeLeft <= 0) {

                finishByTime();
            }

        },
        1000
    );


    gameLoop();
}


/* =========================
   TIMER FINISH
========================= */

function finishByTime() {

    if (player1.health > player2.health) {

        endGame("PLAYER 1 WINS!");

    } else if (
        player2.health > player1.health
    ) {

        endGame("PLAYER 2 WINS!");

    } else {

        endGame("DRAW!");
    }
}


/* =========================
   GAME OVER
========================= */

function endGame(message) {

    if (gameState === "GAME_OVER") {
        return;
    }


    gameState = "GAME_OVER";


    clearInterval(timerInterval);


    winnerText.textContent =
        message;


    gameOverScreen.classList.remove(
        "hidden"
    );
}


/* =========================
   GAME LOOP
========================= */

function gameLoop() {

    if (gameState !== "PLAYING") {
        return;
    }


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawBackground();


    player1.update(player2);

    player2.update(player1);


    checkAttack(
        player1,
        player2
    );

    checkAttack(
        player2,
        player1
    );


    player1.draw();

    player2.draw();


    animationId =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================
   BUTTONS
========================= */

startButton.addEventListener(
    "click",
    startGame
);


restartButton.addEventListener(
    "click",
    startGame
);


/* =========================
   INITIAL SCREEN
========================= */

createPlayers();

drawBackground();

player1.draw();

player2.draw();
```
