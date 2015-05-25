/*
 ==DOCUMENTATION==
 Create a game with new Asteroids(div), where div is the ZEPTO/JQUERY object for the div you want the game to run in.
 Note that this div could hypothetically not be in the DOM anywhere (and the game would run just fine), but use cases
 for this are few and far between.

 game.stop() stops the game.
 game.start() starts the game; CALLING THE CONSTRUCTOR ISN'T ENOUGH.
 game.deadHandlers is an array of functions to be called when the player dies (not loses a life, but has 0 lives).
 game.score is the score; one per asteroid.

 Whenever the asteroids app-page is loaded, the global variable asteroids is assigned to a new instance of Asteroids.
 Wherever you see "game" in the documentation, that generally means "asteroids".

 You MUST attach your own event handlers to game.handleKeydown and game.handleKeyup; it will not add them itself.

 A quick tutorial on the controls:
 The joypad in the bottom-center controls movement. Up/down on the joypad are forward and back, respectively.
 Move left/right to TURN (not translate) left or right.
 Press anywhere else on the screen to fire.

 A tip: try to stay fairly slow. When you get going fast, it can get very hard to regain control and very easy
 to crash into an asteroid.

 Note that circle collision is used, not polygon collision. You and the asteroids will collide when your two
 circles intersect, even if you're not visibly touching.
*/
function contains(a, obj) {

    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
}
var asteroids;
App.controller('asteroids', function(page) {
    asteroids = new Asteroids($(page).find("#si-main-div"));
    asteroids.start();
    $(window).on("keypress", asteroids.handleKeydown);
    $(window).on("keyup", asteroids.handleKeyup);
    $(page).on("appDestroy", function() {
        $(window).off("keypress", asteroids.handleKeydown);
        $(window).off("keyup", asteroids.handleKeydown);
        asteroids.stop();
    });
});
function filterIsNot(obj) {
    return function(o) {
        return o != obj;
    };
}
function Asteroids(div) {
    var thiz = this;
    thiz.deadHandlers = [
        function() {
            console.log("You died.");
            thiz.stop();
        }
    ];
    thiz.score = 0;
    div.attr("isDiv", "yes");
    div.css("background-image", "url(images/stars" + Math.floor(Math.random() * 3 + 1) + ".png)");
    this.div = div;
    thiz.scorecounter = $("<div>")
        .addClass("si-scorecounter")
        .appendTo(thiz.div)
        .html("Score: 0");
    thiz.levelcounter = $("<div>")
        .addClass("si-levelcounter")
        .appendTo(thiz.div)
        .html("Level: 1");
    thiz.joystickDiv = createNewJoystickDiv();
    div.append(thiz.joystickDiv);
    thiz.joystick = new Joystick(thiz.joystickDiv);
    thiz.joystickDown = false;
    thiz.level = 1;
    $(thiz.joystick)
        .on("start", function() {
            thiz.joystickDown = true;
            console.log("start");
        })
        .on("done", function() {
            thiz.joystickDown = false;
            thiz.player.rotating = 0;
            console.log("done");
        });
    $(thiz.div)
        .on("touchstart", function(evt) {
            evt = getOriginalEvent(evt);
            var touch = evt.changedTouches[0];
            if($(touch.target).attr("isDiv") == "yes") {
                evt.preventDefault();
                thiz.firing = true;
            }
        })
        .on("touchend", function(evt) {
            evt = getOriginalEvent(evt);
            var touch = evt.changedTouches[0];
            if($(touch.target).attr("isDiv") == "yes") {
                evt.preventDefault();
                thiz.firing = false;
            }
        });
    thiz.wedgeDiv = $("<div>")
        .html("")
        .addClass("si-wedge")
        .appendTo(thiz.div);
    this.div.addClass("si-main");
    this.sprites = [];
    this.prevPhysicsTime = new Date();
    thiz.lives = 3;
    this.stopped = false;
    thiz.directions = {
        left: [-1, 0],
        right: [1, 0],
        up: [0, -1],
        down: [0, 1]
    };
    thiz.enemyDirection = 1; //1 for right, -1 for left; multiplier.
    thiz.viewportWidth = window.innerWidth;
    thiz.viewportHeight = window.innerHeight - 44;
    thiz.score = 0;
    thiz.asteroids = [];
    thiz.particles = [];
    thiz.pendingParticles = [];
    thiz.requiredScoreForPass = 10;
    thiz.createParticles = function(pos, size, amt, vel, ttl) { //ttl is time to live
        for(var i = 0; i < amt; i++) {
            var div = $("<div>")
                .addClass("si-particle")
                .css("width", size)
                .css("height", size)
                .css("left", pos[0])
                .css("top", pos[1])
                .css("transition", ttl + "s left, " + ttl + "s top")
                .appendTo(thiz.div);
            var particle = {
                div: div,
                ttl: ttl,
                lived: 0,
                vel: vel,
                created: false,
                waitingTime: 5
            };
            thiz.pendingParticles.push(particle);
        }
    }
    thiz.createWall = function(pos, scale) {
        thiz.createSprite($("<div>")
            .addClass("si-wall")
            .css("width", scale)
            .css("height", scale), function() {}, pos);
    }
    thiz.handleKeydown = function(evt) {
        var found = true;
        if(evt.which == 119) {
            thiz.downDown = true;
        } else if(evt.which == 115) {
            thiz.upDown = true;
        } else if(evt.which == 32) {
            thiz.firing = true;
        } else if(evt.which == 100) {
            thiz.player.rotating = 1;
        } else if(evt.which == 97) {
            thiz.player.rotating = -1;
        };
    }
    thiz.handleKeyup = function(evt) {
        if(evt.which == 83) {
            thiz.upDown = false;
        } else if(evt.which == 87) {
            thiz.downDown = false;
        } else if(evt.which == 32) {
            //Do nothing
            thiz.firing = false;
        } else if(evt.which == 68 || evt.which == 65) {
            thiz.player.rotating = 0;
        }
    };
    thiz.createWedge = function(text) {
        thiz.wedgeDiv.html(text);
        setTimeout(function() {
            thiz.wedgeDiv.html("");
        }, 3000);
    }
    thiz.createSprite = function(div, update, position) {
        div.addClass("si-sprite");
        div.css("left", position[0])
        div.css("top", position[1]);
        thiz.div.append(div);
        var sprite = {
            div: div,
            update: update,
            x: position[0],
            y: position[1],
            setPosition: function(pos) {
                this.x = pos[0];
                this.y = pos[1];
                this.div.css("left", Math.floor(pos[0]))
                    .css("top", Math.floor(pos[1]));
            },
            setX: function(x) {
                this.setPosition([x, this.y]);
            },
            setY: function(y) {
                this.setPosition([this.x, y]);
            },
            addX: function(x) {
                this.setPosition([this.x + x, this.y]);
            },
            addY: function(y) {
                this.setPosition([this.x, this.y + y]);
            }
        };
        thiz.sprites.push(sprite);
        return sprite;
    };
    thiz.createVelSprite = function(div, update, position, startVel) {
        var sprite = thiz.createSprite(div, function(deltaTime) {
            update(deltaTime); //Call the "superclass"'s update
            this.addX(this.velX * deltaTime);
            this.addY(this.velY * deltaTime);
        }, position);
        sprite.velX = startVel[0];
        sprite.velY = startVel[1];
        return sprite;
    };
    thiz.updateScore = function() {
        thiz.scorecounter.html("Score: " + thiz.score * 10);
    }
    thiz.updateLevel = function() {
        thiz.levelcounter.html("Level: " + thiz.level);
    }
    thiz.createBullet = function(position, velocity) {
        var sprite = thiz.createVelSprite($("<div>")
            .addClass("si-pellet"), function(deltaTime) {
                for(key in thiz.asteroids) {
                    var asteroid = thiz.asteroids[key];
                    var distX = Math.abs(asteroid.x - (sprite.x + sprite.widthHeight));
                    var distY = Math.abs(asteroid.y - (sprite.y + sprite.widthHeight));
                    var dist = Math.sqrt(distX * distX + distY * distY);
                    if(dist < 20 * asteroid.size && !sprite.inactive && !asteroid.hidden) {
                        asteroid.hide();
                        if(asteroid.size > 1) {
                            for(var i = 0; i < 2; i++) {
                                var spt = thiz.createAsteroid([asteroid.x, asteroid.y],
                                    [Math.floor(Math.random() * 40 - 20) * thiz.level,
                                        Math.floor(Math.random() * 40 - 20) * thiz.level], asteroid.size - 1);
                            }
                        }
                        sprite.inactive = true;
                        sprite.div.hide();
                        thiz.score++;
                        thiz.updateScore();
                        if(thiz.score > thiz.requiredScoreForPass) {
                            //Advance to the next level
                            thiz.level++;
                            thiz.updateLevel();
                            thiz.requiredScoreForPass += thiz.level * 10;
                            thiz.createWedge("Level Up!");
                            setTimeout(function() {
                                thiz.createWedge("Current level: " + thiz.level);
                            }, 3001)
                        }
                    }
                }
            }, position, velocity);
        sprite.inactive = false;
        sprite.widthHeight = sprite.div.width();
    }
    thiz.createEnemy = function(position, scale) {
        var sprite = thiz.createSprite($("<div>")
            .addClass("si-enemy"), function(deltaTime) {
                if(this.isCollidingWithPlayer()) {
                    console.log("You died.");
                }
            }, position);
        sprite.isCollidingWithPlayer = function() {
            var distX = Math.abs(this.x - thiz.player.x);
            var distY = Math.abs(this.y - thiz.player.y);
            var totalDist = Math.sqrt(distX * distX + distY * distY);
            if(totalDist <= this.div.width() / 2 + thiz.player.div.width() / 2) {
                return true;
            } else {
                return false;
            }
        }
        sprite.isCollidingWithOld = function(other) { //This is never used, keeping it around in case it becomes useful
            var theirWidth = other.div.width();
            var theirRadius = theirWidth / 2;
            var ourWidth = this.div.width();
            var ourRadius = theirWidth / 2;
            //We're doing circle collision here.
            //Get the point equadistant to both sprites.
            var point = [
                //X
                this.x + (other.x - this.x),
                //Y
                this.y + (other.y - this.y)
            ];
            //Is is contained within both of us? If so, return true.
            var ourA = point[0] - this.x;
            var ourB = point[1] - this.y;
            var ourC = Math.sqrt((ourA * ourA) + (ourB * ourB));
            var theirA = point[0] - other.x;
            var theirB = point[1] - other.y;
            var theirC = Math.sqrt((theirA * theirA) + (theirB * theirB));
            //Check to see if both theirC and ourC is less than the respective radii
            if(theirC < other.div.width() / 2) {
                if(ourC < this.div.width() / 2) {
                    //We're colliding
                    return true;
                }
            }
            return false;
        };
        sprite.div.css("width", Math.floor(scale))
            .css("height", Math.floor(scale));
    }
    thiz.stop = function() {
        thiz.stopped = true;
    };
    thiz.removeSprite = function(sprite) {
        delete thiz.sprites[thiz.sprites.indexOf(sprite)];
    };
    thiz.createAsteroid = function(position, speed, size) {
        //BUG: Collision should be centered on div, not top-left corner
        var sprite = thiz.createVelSprite($("<div>")
            .addClass("si-asteroid")
            .addClass("si-asteroid-" + Math.floor(Math.random() * 3 + 1)), function() {
                if(!sprite.hidden) {
                    //Are we colliding with the player? If so, game over.
                    var distX = Math.abs(sprite.x - (thiz.player.x + sprite.widthHeight / 2));
                    var distY = Math.abs(sprite.y - (thiz.player.y + sprite.widthHeight / 2));
                    var dist = Math.sqrt(distX * distX + distY * distY);
                    if(dist < 20 * sprite.size) {
                        thiz.lives--;
                        thiz.player.respawn();
                        if(thiz.lives < 1) {
                            for(key in thiz.deadHandlers) {
                                thiz.deadHandlers[key]();
                            }
                            thiz.createWedge("Game over.");
                            for(var i = 0; i < 12; i++) {
                                setTimeout(function() {
                                    createWedge("Game over.");
                                }, i * 12);
                            }
                        } else {
                            thiz.createWedge("You died.");
                            setTimeout(function() {
                                thiz.createWedge("Lives left: " + thiz.lives);
                            }, 3001);
                        }
                    }
                }
                if(sprite.x < -1000 || sprite.x > window.innerWidth + 1000 || sprite.y < -1000 ||
                    sprite.y > window.innerHeight + 1000) {
                    thiz.removeSprite(sprite);
                    delete thiz.asteroids[thiz.asteroids.indexOf(sprite)];
                }
            }, position, speed);
        sprite.hide = function() {
            sprite.div.hide();
            sprite.hidden = true;
            thiz.removeSprite(sprite);
        }
        sprite.widthHeight = sprite.div.width();
        sprite.size = size;
        sprite.div.css("width", size * 20)
            .css("height", size * 20);
        sprite.uuid = Math.random();
        thiz.asteroids.push(sprite);
        return sprite;
    }
    thiz.createRandomAsteroid = function() {
        //We need to create an asteroid around the edges of the screen. Figure out what edge and how far along.
        //What edge?
        var edge = Math.floor(Math.random() * 4);
        var amtAlong = edge == 0 || edge == 2 ? Math.floor(Math.random() * window.innerHeight)
            : Math.floor(Math.random() * window.innerWidth);
        var coords;
        var vel;
        if(edge == 0) {
            coords = [-80, amtAlong];
            vel = [20 * thiz.level, 0];
        } else if(edge == 2) {
            coords = [window.innerWidth + 80, amtAlong];
            vel = [-20 * thiz.level, 0];
        } else if(edge == 1) {
            coords = [amtAlong, -80];
            vel = [0, 20 * thiz.level];
        } else if(edge == 3) {
            coords = [amtAlong, window.innerHeight + 80];
            vel = [0, -20 * thiz.level];
        } else {
            throw "Basic arithmetic failed...?";
        }
        // console.log(coords);
        return thiz.createAsteroid(coords, vel, 2);
    }
    thiz.createPlayer = function() {
        var sprite = thiz.createSprite($("<div>")
            .addClass("si-player"), function(deltaTime) {
                if(thiz.leftDown) {
                    this.velX += this.acceleration * deltaTime;
                } else if(thiz.rightDown) {
                    this.velX -= this.acceleration * deltaTime;
                } else if(thiz.upDown) {
                    this.velY += Math.cos(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * this.acceleration;
                    this.velX += Math.sin(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * this.acceleration;
                } else if(thiz.downDown) {
                    this.velY -= Math.cos(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * this.acceleration;
                    this.velX -= Math.sin(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * this.acceleration;
                }
                if(thiz.joystickDown) {
                    var joystickOffset = thiz.joystick.getOffset();
                    if(joystickOffset.x > 0) {
                        this.rotating = joystickOffset.x / 300;
                    } else if(joystickOffset.x < 0) {
                        this.rotating = joystickOffset.x / 300;
                    }
                    if(joystickOffset.y > 0) {
                        this.velY += Math.cos(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * joystickOffset.y / 2000;
                        this.velX += Math.sin(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * joystickOffset.y / 2000;
                    } else if(joystickOffset.y < 0) {
                        this.velY += Math.cos(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * joystickOffset.y / 2000;
                        this.velX += Math.sin(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * joystickOffset.y / 2000;
                    }
                }
                if(thiz.firing) {
                    this.firingDelay += deltaTime;
                    if(this.firingDelay > 0.5) {
                        var velX = -Math.sin(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * 500;
                        var velY = -Math.cos(Math.abs(360 - this.rotation) / 360 * 3.14159265 * 2) * 500;
                        thiz.createBullet([this.x + 12, this.y + 12], [velX, velY]);
                        this.firingDelay = 0;
                    }
                }
                this.rotate(this.rotating * 200 * deltaTime);
                this.addX(this.velX);
                this.addY(this.velY);
                if(this.x > thiz.div.width()) {
                    this.x = -this.div.width();
                }
                if(this.x < -this.div.width()) {
                    this.x = thiz.div.width();
                }
                if(this.y > thiz.div.height()) {
                    this.y = -this.div.height();
                }
                if(this.y < -this.div.height()) {
                    this.y = thiz.div.height();
                }
            }, [0, 0]);
        sprite.velX = 0;
        sprite.velY = 0;
        sprite.firingDelay = 0;
        sprite.acceleration = 0.1;
        sprite.div.css("width", 32)
            .css("height", 32);
        sprite.rotation = 0;
        sprite.rotating = 0;
        sprite.rotate = function(amt) {
            this.rotation += amt;
            this.div.css("transform", "rotate(" + this.rotation + "deg)")
                .css("-webkit-transform", "rotate(" + this.rotation + "deg)")
                .css("-moz-transform", "rotate(" + this.rotation + "deg)")
                .css("-ms-transform", "rotate(" + this.rotation + "deg)")
                .css("-o-transform", "rotate(" + this.rotation + "deg)");
        }
        sprite.attemptTurn = function(direction) {
            //Attempt to turn in direction if there is no wall obstructing our path.
            //Get the square in the map that the sprite is in
            var x = Math.floor(this.x / thiz.squareScale);
            var y = Math.floor(this.y / thiz.squareScale);
            var newX = x + direction[0];
            var newY = y + direction[1];
            if(thiz.map[newY][newX] != "x") {
                //We can turn there! Yay!
                this.velX = 1.5 * thiz.squareScale * direction[0];
                this.velY = 1.5 * thiz.squareScale * direction[1];
            }
        };
        sprite.respawn = function() {
            this.setPosition([300, 300]);
            this.rotation = 0;
        }
        thiz.player = sprite;
    };
    thiz.start = function() {
        thiz.createPlayer();
        thiz.updateLoop();
    };
    thiz.updateLoop = function() {
        if(thiz.stopped) {
            return;
        }
        requestAnimationFrame(thiz.updateLoop);
        thiz.update();
    };
    thiz.asteroidTime = 0;
    thiz.update = function() {
        var currentTime = new Date();
        var millis = currentTime - thiz.prevPhysicsTime;
        var delta = millis / 1000;
        thiz.asteroidTime -= delta;
        if(thiz.asteroidTime <= 0) {
            //We want the game to be fair across screen sizes, so scale back the amt. of asteroids spawned based on screen area
            var area = window.innerWidth * window.innerHeight;
            //The game was balanced around a screen area of 833,000, so 1 is 833,000
            area /= 833000;
            console.log("Screen area multiplier: " + area)
            thiz.asteroidTime = (3 / thiz.level) / area;
            thiz.createRandomAsteroid();
        }
        for(key in thiz.sprites) {
            var sprite = thiz.sprites[key];
            sprite.update(delta);
        }
        thiz.prevPhysicsTime = currentTime;
        for(key in thiz.pendingParticles) {
            var particle = thiz.pendingParticles[key];
            particle.waitingTime--;
            if(particle.waitingTime > 0) {
                continue;
            }
            var velX = Math.floor((Math.random() * 2 - 1) * particle.vel);
            var velY = Math.floor((Math.random() * 2 - 1) * particle.vel);
            particle.x += velX;
            particle.y += velY;
            particle.div.css("left", particle.x)
                .css("top", particle.y);
            particle.created = true;
            delete thiz.pendingParticles[key];
            thiz.particles.push(particle);
        }
        for(key in thiz.particles) {
            var particle = thiz.particles[key];
            particle.lived += delta;
            if(particle.lived > particle.ttl) {
                particle.div.remove();
                delete thiz.particles[particle];
            }
        }
    }
}
