App.controller('space-invaders', function($page) {
        // STARFIELD ============================================================================================
        //  Define the starfield class.
        function Starfield() {
            this.fps = 30;
            this.canvas = null;
            this.width = 0;
            this.height = 0;
            this.minVelocity = 15;
            this.maxVelocity = 30;
            this.stars = 100;
            this.intervalId = 0;
        }

        //  The main function - initialises the starfield.
        Starfield.prototype.initialise = function(div) {
            var self = this;

            //  Store the div.
            this.containerDiv = div;
            self.width = W;
            self.height = H;

            window.onresize = function(event) {
                self.width = window.innerWidth;
                self.height = window.innerHeight;
                self.canvas.width = self.width;
                self.canvas.height = self.height;
                self.draw();
            }

            //  Create the canvas.
            var canvas = document.createElement('canvas');
            div.appendChild(canvas);
            this.canvas = canvas;
            this.canvas.width = W;
            this.canvas.height = H;
        };

        Starfield.prototype.start = function() {

            //  Create the stars.
            var stars = [];
            for(var i=0; i<this.stars; i++) {
                stars[i] = new Star(Math.random()*this.width, Math.random()*this.height, Math.random()*3+1,
                 (Math.random()*(this.maxVelocity - this.minVelocity))+this.minVelocity);
            }
            this.stars = stars;

            var self = this;
            //  Start the timer.
            this.intervalId = setInterval(function() {
                self.update();
                self.draw();    
            }, 1000 / this.fps);
        };

        Starfield.prototype.stop = function() {
            clearInterval(this.intervalId);
        };

        Starfield.prototype.update = function() {
            var dt = 1 / this.fps;

            for(var i=0; i<this.stars.length; i++) {
                var star = this.stars[i];
                star.y += dt * star.velocity;
                //  If the star has moved from the bottom of the screen, spawn it at the top.
                if(star.y > this.height) {
                    this.stars[i] = new Star(Math.random()*this.width, 0, Math.random()*3+1, 
                    (Math.random()*(this.maxVelocity - this.minVelocity))+this.minVelocity);
                }
            }
        };

        Starfield.prototype.draw = function() {
            //  Get the drawing context.
            var ctx = this.canvas.getContext("2d");

            //  Draw the background.
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, this.width, this.height);

            //  Draw stars.
            ctx.fillStyle = '#ffffff';
            for(var i=0; i<this.stars.length;i++) {
                var star = this.stars[i];
                ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        };

        function Star(x, y, size, velocity) {
            this.x = x;
            this.y = y; 
            this.size = size;
            this.velocity = velocity;
        }

        // GAME LOGIC ============================================================================================
        //  Creates an instance of the Game class.
        function Game() {

            //  Set the initial config.
            this.config = {
                bombRate: 0.05,
                bombMinVelocity: 50,
                bombMaxVelocity: 50,
                invaderInitialVelocity: 25,
                invaderAcceleration: 0,
                invaderDropDistance: 20,
                rocketVelocity: 120,
                rocketMaxFireRate: 2,
                gameWidth: W,
                gameHeight: H,
                fps: 50,
                debugMode: false,
                invaderRanks: 5,
                invaderFiles: 10,
                shipSpeed: 120,
                levelDifficultyMultiplier: 0.2,
                pointsPerInvader: 5
            };

            //  All state is in the variables below.
            this.lives = 3;
            this.width = 0;
            this.height = 0;
            this.gameBounds = {left: 0, top: 0, right: 0, bottom: 0};
            this.intervalId = 0;
            this.score = 0;
            this.level = 1;
            this.direction = "";

            //  The state stack.
            this.stateStack = [];
            this.stateNameStack = [];

            //  Input/output
            this.pressedKeys = {};
            this.gameCanvas =  null;

            this.invader_img = new Image();
            this.invader_img.src = "../images/spaceInvaderVillain.png";

            this.ship = new Image();
            this.ship.src = "../images/ship.png";
        }

        //  Initialis the Game with a canvas.
        Game.prototype.initialise = function(gameCanvas) {

            //  Set the game canvas.
            this.gameCanvas = gameCanvas;

            //  Set the game width and height.
            this.width = W;
            this.height = H;

            //  Set the state game bounds.
            this.gameBounds = {
                left: this.config.gameWidth/ 2 - this.config.gameWidth / 2,
                right: this.config.gameWidth / 2 + this.config.gameWidth / 2,
                top: this.config.gameHeight / 2 - this.config.gameHeight / 2,
                bottom: this.config.gameHeight / 2 + this.config.gameHeight / 2,
            };

            //  Move into the 'welcome' state.
            this.moveToState(new WelcomeState(), "WelcomeState");

        };

        // Function for drawing arrow key on canvas
        Game.prototype.drawButton = function(ctx, arrow) {
            ctx.beginPath();
            ctx.fillStyle = arrow.c;
            ctx.arc(arrow.x, arrow.y, arrow.r, 0, Math.PI*2, false);
            ctx.fill();
        }

        Game.prototype.moveToState = function(state, stateName) {
         
           //  If we are in a state, leave it.
           if(this.currentState() && this.currentState().leave) {
             this.currentState().leave(game);
             this.stateStack.pop();
             this.stateNameStack.pop();
           }
           
           //  If there's an enter function for the new state, call it.
           if(state.enter) {
             state.enter(game);
           }
         
           //  Set the current state.
           this.stateStack.pop();
           this.stateNameStack.pop();
           this.stateStack.push(state);
           this.stateNameStack.push(stateName);
         };

        //  Start the Game.
        Game.prototype.start = function() {
            //  Set the game variables.
            this.lives = 3;
            this.config.debugMode = /debug=true/.test(window.location.href);

            //  Start the game loop.
            var game = this;
            this.intervalId = setInterval(function () { GameLoop(game);}, 1000 / this.config.fps);
        };

        //  Returns the current state.
        Game.prototype.currentState = function() {
            return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
        };

        //  Returns the current state.
        Game.prototype.currentStateName = function() {
            return this.stateNameStack.length > 0 ? this.stateNameStack[this.stateNameStack.length - 1] : null;
        };

        //  The main loop.
        function GameLoop(game) {
            var currentState = game.currentState();
            if(currentState) {

                //  Delta t is the time to update/draw.
                var dt = 1 / game.config.fps;

                //  Get the drawing context.
                var ctx = game.gameCanvas.getContext("2d");
                
                //  Update if we have an update function. Also draw
                //  if we have a draw function.
                if(currentState.update) {
                    currentState.update(game, dt);
                }
                if(currentState.draw) {
                    currentState.draw(game, dt, ctx);
                }
            }
        }

        Game.prototype.pushState = function(state, stateName) {

            //  If there's an enter function for the new state, call it.
            if(state.enter) {
                state.enter(game);
            }
            //  Set the current state.
            this.stateStack.push(state);
            this.stateNameStack.push(stateName);
        };

        Game.prototype.popState = function() {

            //  Leave and pop the state.
            if(this.currentState()) {
                if(this.currentState().leave) {
                    this.currentState().leave(game);
                }

                //  Set the current state.
                this.stateStack.pop();
                this.stateNameStack.pop();
            }
        };

        //  The stop function stops the game.
        Game.prototype.stop = function Stop() {
            clearInterval(this.intervalId);
        };

        function WelcomeState() {

        }

        WelcomeState.prototype.update = function (game, dt) {


        };

        WelcomeState.prototype.draw = function(game, dt, ctx) {

            //  Clear the background.
            ctx.clearRect(0, 0, game.width, game.height);

            ctx.font="30px Arial";
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline="center"; 
            ctx.textAlign="center"; 
            ctx.fillText("Space Invaders", game.width / 2, game.height/2 - 40); 
            ctx.font="16px Arial";

            ctx.fillText("Tap to start.", game.width / 2, game.height/2); 
        };

        function GameOverState() {

        }

        GameOverState.prototype.update = function(game, dt) {

        };

        GameOverState.prototype.draw = function(game, dt, ctx) {

            //  Clear the background.
            ctx.clearRect(0, 0, game.width, game.height);

            ctx.font="30px Arial";
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline="center"; 
            ctx.textAlign="center"; 
            ctx.fillText("Game Over!", game.width / 2, game.height/2 - 40); 
            ctx.font="16px Arial";
            ctx.fillText("You scored " + game.score + " and got to level " + game.level, game.width / 2, game.height/2);
            ctx.font="16px Arial";
            ctx.fillText("Tap to play again.", game.width / 2, game.height/2 + 40);   
        };

        //  Create a PlayState with the game config and the level you are on.
        function PlayState(config, level) {
            this.config = config;
            this.level = level;

            //  Game state.
            this.invaderCurrentVelocity =  10;
            this.invaderCurrentDropDistance =  0;
            this.invadersAreDropping =  false;
            this.lastRocketTime = null;

            //  Game entities.
            this.ship = null;
            this.invaders = [];
            this.rockets = [];
            this.bombs = [];
        }

        PlayState.prototype.enter = function(game) {

            //  Create the ship.
            this.ship = new Ship(game.width / 2, game.gameBounds.bottom - 8);

            //  Setup initial state.
            this.invaderCurrentVelocity =  10;
            this.invaderCurrentDropDistance =  0;
            this.invadersAreDropping =  false;

            //  Set the ship speed for this level, as well as invader params.
            var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
            this.shipSpeed = this.config.shipSpeed;
            this.invaderInitialVelocity = this.config.invaderInitialVelocity + (levelMultiplier * this.config.invaderInitialVelocity);
            this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
            this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
            this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);

            //  Create the invaders.
            var ranks = this.config.invaderRanks;
            var files = this.config.invaderFiles;
            var invaders = [];
            for(var rank = 0; rank < ranks; rank++){
                for(var file = 0; file < files; file++) {
                    invaders.push(new Invader(
                        (game.width / 2) + ((files/2 - file) * 200 / files),
                        (game.gameBounds.top + rank * 20),
                        rank, file, 'Invader'));
                }
            }
            this.invaders = invaders;
            this.invaderCurrentVelocity = this.invaderInitialVelocity;
            this.invaderVelocity = {x: -this.invaderInitialVelocity, y:0};
            this.invaderNextVelocity = null;
        };

        PlayState.prototype.update = function(game, dt) {

            if (game.direction == "left"){
                this.ship.vx = -2;
            } else if (game.direction == "right"){
                this.ship.vx = 2;
            } else {
                this.ship.vx = 0;
            }
            this.ship.x += this.ship.vx;

            //  Keep the ship in bounds.
            if(this.ship.x < game.gameBounds.left) {
                this.ship.x = game.gameBounds.left;
            }
            if(this.ship.x > game.gameBounds.right) {
                this.ship.x = game.gameBounds.right;
            }

            //  Move each bomb.
            for(var i=0; i<this.bombs.length; i++) {
                var bomb = this.bombs[i];
                bomb.y += dt * bomb.velocity;

                //  If the rocket has gone off the screen remove it.
                if(bomb.y > H) {
                    this.bombs.splice(i--, 1);
                }
            }

            //  Move each rocket.
            for(i=0; i<this.rockets.length; i++) {
                var rocket = this.rockets[i];
                rocket.y -= dt * rocket.velocity;

                //  If the rocket has gone off the screen remove it.
                if(rocket.y < 0) {
                    this.rockets.splice(i--, 1);
                }
            }

            //  Move the invaders.
            var hitLeft = false, hitRight = false, hitBottom = false;
            for(i=0; i<this.invaders.length; i++) {
                var invader = this.invaders[i];
                var newx = invader.x + this.invaderVelocity.x * dt;
                var newy = invader.y + this.invaderVelocity.y * dt;
                if(hitLeft == false && newx < game.gameBounds.left) {
                    hitLeft = true;
                }
                else if(hitRight == false && newx > game.gameBounds.right) {
                    hitRight = true;
                }
                else if(hitBottom == false && newy > game.gameBounds.bottom) {
                    hitBottom = true;
                }

                if(!hitLeft && !hitRight && !hitBottom) {
                    invader.x = newx;
                    invader.y = newy;
                }
            }

            //  Update invader velocities.
            if(this.invadersAreDropping) {
                this.invaderCurrentDropDistance += this.invaderVelocity.y * dt;
                if(this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
                    this.invadersAreDropping = false;
                    this.invaderVelocity = this.invaderNextVelocity;
                    this.invaderCurrentDropDistance = 0;
                }
            }
            //  If we've hit the left, move down then right.
            if(hitLeft) {
                this.invaderCurrentVelocity += this.config.invaderAcceleration;
                this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
                this.invadersAreDropping = true;
                this.invaderNextVelocity = {x: this.invaderCurrentVelocity , y:0};
            }
            //  If we've hit the right, move down then left.
            if(hitRight) {
                this.invaderCurrentVelocity += this.config.invaderAcceleration;
                this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
                this.invadersAreDropping = true;
                this.invaderNextVelocity = {x: -this.invaderCurrentVelocity , y:0};
            }
            //  If we've hit the bottom, it's game over.
            if(hitBottom) {
                this.lives = 0;
            }
            
            //  Check for rocket/invader collisions.
            for(i=0; i<this.invaders.length; i++) {
                var invader = this.invaders[i];
                var bang = false;

                for(var j=0; j<this.rockets.length; j++){
                    var rocket = this.rockets[j];

                    if(rocket.x >= (invader.x - invader.width/2) && rocket.x <= (invader.x + invader.width/2) &&
                        rocket.y >= (invader.y - invader.height/2) && rocket.y <= (invader.y + invader.height/2)) {
                        
                        //  Remove the rocket, set 'bang' so we don't process
                        //  this rocket again.
                        this.rockets.splice(j--, 1);
                        bang = true;
                        game.score += this.config.pointsPerInvader;
                        break;
                    }
                }
                if(bang) {
                    this.invaders.splice(i--, 1);
                }
            }

            //  Find all of the front rank invaders.
            var frontRankInvaders = {};
            for(var i=0; i<this.invaders.length; i++) {
                var invader = this.invaders[i];
                //  If we have no invader for game file, or the invader
                //  for game file is futher behind, set the front
                //  rank invader to game one.
                if(!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
                    frontRankInvaders[invader.file] = invader;
                }
            }

            //  Give each front rank invader a chance to drop a bomb.
            for(var i=0; i<this.config.invaderFiles; i++) {
                var invader = frontRankInvaders[i];
                if(!invader) continue;
                var chance = this.bombRate * dt;
                if(chance > Math.random()) {
                    //  Fire!
                    this.bombs.push(new Bomb(invader.x, invader.y + invader.height / 2, 
                        this.bombMinVelocity + Math.random()*(this.bombMaxVelocity - this.bombMinVelocity)));
                }
            }

            //  Check for bomb/ship collisions.
            for(var i=0; i<this.bombs.length; i++) {
                var bomb = this.bombs[i];
                if(bomb.x >= (this.ship.x - this.ship.width/2) && bomb.x <= (this.ship.x + this.ship.width/2) &&
                        bomb.y >= (this.ship.y - this.ship.height/2) && bomb.y <= (this.ship.y + this.ship.height/2)) {
                    this.bombs.splice(i--, 1);
                    game.lives--;
                }
                        
            }

            //  Check for invader/ship collisions.
            for(var i=0; i<this.invaders.length; i++) {
                var invader = this.invaders[i];
                if((invader.x + invader.width/2) > (this.ship.x - this.ship.width/2) && 
                    (invader.x - invader.width/2) < (this.ship.x + this.ship.width/2) &&
                    (invader.y + invader.height/2) > (this.ship.y - this.ship.height/2) &&
                    (invader.y - invader.height/2) < (this.ship.y + this.ship.height/2)) {
                    //  Dead by collision!
                    game.lives = 0;
                }
            }

            //  Check for failure
            if(game.lives <= 0) {
                game.moveToState(new GameOverState(), "GameOverState");
            }

            //  Check for victory
            if(this.invaders.length === 0) {
                game.score += this.level * 50;
                game.level += 1;
                game.moveToState(new LevelIntroState(game.level), "LevelIntroState");
            }
        };

        PlayState.prototype.draw = function(game, dt, ctx) {

            //  Clear the background.
            ctx.clearRect(0, 0, game.width, game.height);
            
            //  Draw ship.
            //ctx.fillStyle = '#999999';
            //ctx.fillRect(this.ship.x - (this.ship.width / 2), this.ship.y - (this.ship.height / 2), this.ship.width, this.ship.height);
            ctx.drawImage(game.ship, this.ship.x - this.ship.width/2, this.ship.y - this.ship.height/2, this.ship.width, this.ship.height);

            //  Draw invaders.
            ctx.fillStyle = '#006600';
            for(var i=0; i<this.invaders.length; i++) {
                var invader = this.invaders[i];
                ctx.drawImage(game.invader_img, invader.x - invader.width/2, invader.y - invader.height/2, invader.width, invader.height);
            }

            //  Draw bombs.
            ctx.fillStyle = '#ff5555';
            for(var i=0; i<this.bombs.length; i++) {
                var bomb = this.bombs[i];
                ctx.fillRect(bomb.x - 2, bomb.y - 2, 4, 4);
            }

            //  Draw rockets.
            ctx.fillStyle = '#ff0000';
            for(var i=0; i<this.rockets.length; i++) {
                var rocket = this.rockets[i];
                ctx.fillRect(rocket.x, rocket.y - 2, 2, 8);
            }

            //  Draw info.
            var textYpos = game.gameBounds.top + ((game.height - game.gameBounds.bottom) / 2) + 14/2;
            ctx.font="14px Arial";
            ctx.fillStyle = '#ffffff';
            var info = "Lives: " + game.lives;
            ctx.textAlign = "left";
            ctx.fillText(info, game.gameBounds.left, textYpos);
            info = "Score: " + game.score + ", Level: " + game.level;
            ctx.textAlign = "right";
            ctx.fillText(info, game.gameBounds.right, textYpos);

            //  If we're in debug mode, draw bounds.
            if(this.config.debugMode) {
                ctx.strokeStyle = '#ff0000';
                ctx.strokeRect(0,0,game.width, game.height);
                ctx.strokeRect(game.gameBounds.left, game.gameBounds.top,
                    game.gameBounds.right - game.gameBounds.left,
                    game.gameBounds.bottom - game.gameBounds.top);
            }

        };

        PlayState.prototype.fireRocket = function() {
            //  If we have no last rocket time, or the last rocket time 
            //  is older than the max rocket rate, we can fire.
            if(this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.config.rocketMaxFireRate))
            {
                //  Add a rocket.
                this.rockets.push(new Rocket(this.ship.x, this.ship.y - 12, this.config.rocketVelocity));
                this.lastRocketTime = (new Date()).valueOf();
            }
        };

        //    Level Intro State

        //    The Level Intro state shows a 'Level X' message and
        //    a countdown for the level.
        function LevelIntroState(level) {
            this.level = level;
            this.countdownMessage = "3";
        }

        LevelIntroState.prototype.update = function(game, dt) {

            //  Update the countdown.
            if(this.countdown === undefined) {
                this.countdown = 3; // countdown from 3 secs
            }
            this.countdown -= dt;

            if(this.countdown < 2) {
                this.countdownMessage = "2";
            }
            if(this.countdown < 1) {
                this.countdownMessage = "1";
            }
            if(this.countdown <= 0) {
                //  Move to the next level, popping this state.
                game.moveToState(new PlayState(game.config, this.level), "PlayState");
            }

        };

        LevelIntroState.prototype.draw = function(game, dt, ctx) {

            //  Clear the background.
            ctx.clearRect(0, 0, game.width, game.height);

            ctx.font="36px Arial";
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline="middle";
            ctx.textAlign="center";
            ctx.fillText("Level " + this.level, game.width / 2, game.height/2);
            ctx.font="24px Arial";
            ctx.fillText("Ready in " + this.countdownMessage, game.width / 2, game.height/2 + 36);
            return;
        };


        //  Ship

        //  The ship has a position and that's about it.
        function Ship(x, y) {
            this.x = x;
            this.y = y;
            this.width = 20;
            this.height = 16;
            this.vx = 0;
        }

        // Directional Controls
        function Button(x, y, r, c) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.c = c;
        }

        //    Rocket

        //    Fired by the ship, they've got a position, velocity and state.
        function Rocket(x, y, velocity) {
            this.x = x;
            this.y = y;
            this.velocity = velocity;
        }


        //    Bomb

        //    Dropped by invaders, they've got position, velocity.
        function Bomb(x, y, velocity) {
            this.x = x;
            this.y = y;
            this.velocity = velocity;
        }
         

        //    Invader 

        //   Invader's have position, type, rank/file and that's about it. 
        function Invader(x, y, rank, file, type) {
            this.x = x;
            this.y = y;
            this.rank = rank;
            this.file = file;
            this.type = type;
            this.width = 18;
            this.height = 14;
        }


        //    Game State

        //    A Game State is simply an update and draw proc.
        //    When a game is in the state, the update and draw procs are
        //    called, with a dt value (dt is delta time, i.e. the number)
        //    of seconds to update or draw).
        function GameState(updateProc, drawProc, enter, leave) {
            this.updateProc = updateProc;
            this.drawProc = drawProc;
            this.enter = enter;
            this.leave = leave;
        }

        // START ============================================================================================
        var titlebar_height = 44;

        //  Setup the canvas.
        var canvas = $page.querySelector(".canvas");
        canvas.width = window.innerWidth;
        canvas.height = 3*window.innerHeight/4 - 10*titlebar_height/9;

        var W = canvas.width; // Window's width
        var H = canvas.height; // Window's height

        var container = $page.querySelector("#starfield");
        var starfield = new Starfield();
        starfield.initialise(container);
        starfield.start();

         
        //  Create the game.
        var game = new Game();
         
        //  Initialise it with the game canvas.
        game.initialise(canvas);

        var left = $page.querySelector("#space-invaders-left");
        left.addEventListener('click', function() {
            game.direction = "left";
        });
        var right = $page.querySelector("#space-invaders-right");
        right.addEventListener('click', function() {
            game.direction = "right";
        });
        var fire = $page.querySelector("#space-invaders-fire");
        fire.addEventListener('click', function() {
            game.currentState().fireRocket();
        });

        window.onkeydown = function(e) {
            var key = e.keyCode ? e.keyCode : e.which;
            
            if (key == 37) {
                game.direction = "left";
            }else if (key == 39) {
                game.direction = "right";
            }
            else if (key == 32) {
                game.currentState().fireRocket();
            }
        }

        game.gameCanvas.addEventListener("touchstart", function touchHandler(event) {
            if (event.targetTouches.length >= 1) { //one finger touche
                var touch = event.targetTouches[event.targetTouches.length -1];

                if (event.type == "touchstart"){
                    if ((game.currentStateName() == "WelcomeState") || (game.currentStateName() == "GameOverState")) {
                        game.level = 1;
                        game.score = 0;
                        game.lives = 3;
                        game.moveToState(new LevelIntroState(game.level), "LevelIntroState");
                        //alert("touch " + touch.pageX + ", " + touch.pageY + " " + this.currentState());
                    }
                }
            }
        }, false);


        game.gameCanvas.addEventListener("touchmove", function(event) {
            if (event.targetTouches.length >= 1) { //one finger touche
                var touch = event.targetTouches[event.targetTouches.length -1];

                if (event.type == "touchmove"){
                    if ((game.currentStateName() == "WelcomeState") || (game.currentStateName() == "GameOverState")) {
                        game.level = 1;
                        game.score = 0;
                        game.lives = 3;
                        game.moveToState(new LevelIntroState(game.level), "LevelIntroState");
                    }
                }
            }
        }, false);

        game.gameCanvas.addEventListener("click", function moveHandler(event) {
            if ((game.currentStateName() == "WelcomeState") || (game.currentStateName() == "GameOverState")) {
                game.level = 1;
                game.score = 0;
                game.lives = 3;
                game.moveToState(new LevelIntroState(game.level), "LevelIntroState");
            }
        }, false);
         
        //  Start the game.
        game.start();
});