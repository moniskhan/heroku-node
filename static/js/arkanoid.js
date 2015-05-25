App.controller('arkanoid', function($page) {
        // RequestAnimFrame: a browser API for getting smooth animations
        window.requestAnimFrame = (function(){
            return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     ||  
            function( callback ){
                return window.setTimeout(callback, 1000 / 60);
            };
        })();

        window.cancelRequestAnimFrame = ( function() {
            return window.cancelAnimationFrame          ||
            window.webkitCancelRequestAnimationFrame    ||
            window.mozCancelRequestAnimationFrame       ||
            window.oCancelRequestAnimationFrame     ||
            window.msCancelRequestAnimationFrame        ||
            clearTimeout
        } )();

        // Initialize canvas and required variables
        var canvas = $page.querySelector(".canvas");
        var ctx = canvas.getContext("2d"); // Create canvas context
        var ball = {}; // Ball object
        var paddle; // paddle
        var points = 0; // Varialbe to store points
        var fps = 60; // Max FPS (frames per second)
        var startBtn = {}; // Start button object
        var restartBtn = {}; // Restart button object
        var over = 0; // flag varialbe, changed when the game is over
        var init; // variable to initialize animation
        var paddleHit;
        var level = 1;

        canvas.addEventListener("touchstart", touchHandler, false);
        canvas.addEventListener("touchmove", moveHandler, false);
        canvas.addEventListener("touchend", touchHandler, false);

        $(canvas).on('vmousedown', function(e){
            // Variables for storing mouse position on click
            var mx = e.pageX;
            var my = e.pageY;
            
            // Click start button
            if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w && my >= startBtn.y + titlebar_height && my <= startBtn.y + titlebar_height + startBtn.h) {
                animloop();
                
                // Delete the start button after clicking it
                startBtn = {};
            }

            if(mx >= levelBtn.x && mx <= levelBtn.x + levelBtn.w && my >= levelBtn.y + titlebar_height && my <= levelBtn.y + titlebar_height + levelBtn.h) {
                ball.x = W/2;
                ball.y = H/2 + 5;
                ball.vx = 0;
                ball.vy = 6;
                direction = "";
                paddle.x = W/2 - paddle.w/2;
                paddle.y = H - paddle.h;
                bricks = [];
                for(var rank = 0; rank < ranks; rank++){
                    for(var file = 1; file < files; file++) {
                        var colourNum = Math.floor(Math.random() * (5));
                        bricks.push(new Brick(
                            (W / 2) + ((files/2 - file) * W / files),
                            (titlebar_height + rank * 20),
                            rank, file, 'Brick', colours[colourNum], colourNum));
                    }
                }
                animloop();
            }
            
            // If the game is over, and the restart button is clicked
            if(over == 1) {
                if(mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w && my >= restartBtn.y + titlebar_height && my <= restartBtn.y + titlebar_height + restartBtn.h) {
                    ball.x = W/2;
                    ball.y = H/2 + 5;
                    points = 0;
                    ball.vx = 0;
                    ball.vy = 6;
                    direction = "";
                    paddle.x = W/2 - paddle.w/2;
                    paddle.y = H - paddle.h;
                    bricks = [];
                    level = 1;
                    for(var rank = 0; rank < ranks; rank++){
                        for(var file = 1; file < files; file++) {
                            var colourNum = Math.floor(Math.random() * (5));
                            bricks.push(new Brick(
                                (W / 2) + ((files/2 - file) * W / files),
                                (titlebar_height + rank * 20),
                                rank, file, 'Brick', colours[colourNum], colourNum));
                        }
                    }

                    animloop();
                    
                    over = 0;
                }
            }
        });

        /*$(canvas).on('taphold', function(e){
            //alert('X: ' + e.pageX + ' Y: ' + e.pageY ); 
        });*/

        // Initialise the collision sound
        collision = $page.querySelector("#collide");

        //var ratio = window.devicePixelRatio || 1;
        //var w = screen.width * ratio;
        //var h = screen.height * ratio;

        var titlebar_height = 44;

        // Set the canvas's height and width
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 10*titlebar_height/9;

        var W = canvas.width; // Window's width
        var H = canvas.height/2; // Window's height

        var direction = "";

        var colours = ["red", "green", "yellow", "blue", "orange"];
        

        function touchHandler(event) {
            if (event.targetTouches.length >= 1) { //one finger touch
                var touch = event.targetTouches[event.targetTouches.length -1];
                if (event.type == "touchstart") {
                    if(touch.pageX > dx && touch.pageX < (dx + down_arrow.width) && touch.pageY > (dy + titlebar_height) && touch.pageY < (dy + titlebar_height + down_arrow.height)){
                        //alert("touch " + touch.pageX + ", " + touch.pageY + " down_arrow " + down_arrow.x + ", " + down_arrow.y + ", " + down_arrow.r + " bar height " + titlebar_height);
                        direction = "down";
                    }
                    else if(touch.pageX > ux && touch.pageX < (ux + up_arrow.width) && touch.pageY > (uy + titlebar_height) && touch.pageY < (uy + titlebar_height + up_arrow.height)){
                        //alert("touch " + touch.pageX + ", " + touch.pageY + " up_arrow " + up_arrow.x + ", " + up_arrow.y + ", " + up_arrow.r + " bar height " + titlebar_height);
                        direction = "up";
                    }
                    else if (touch.pageX > lx && touch.pageX < (lx + left_arrow.width) && touch.pageY > (ly + titlebar_height) && touch.pageY < (ly + titlebar_height + left_arrow.height)){
                        //alert("touch " + touch.pageX + ", " + touch.pageY + " left_arrow " + left_arrow.x + ", " + left_arrow.y + ", " + left_arrow.r + " bar height " + titlebar_height);
                        direction = "left";
                    }
                    else if (touch.pageX > rx && touch.pageX < (rx + right_arrow.width) && touch.pageY > (ry + titlebar_height) && touch.pageY < (ry + titlebar_height + right_arrow.height)){
                        //alert("touch " + touch.pageX + ", " + touch.pageY + " right_arrow " + right_arrow.x + ", " + right_arrow.y + ", " + right_arrow.r + " bar height " + titlebar_height);
                        direction = "right";
                    }
                }
            }
        }

        function moveHandler(event) {
            if (event.targetTouches.length >= 1) { //one finger touch
                var touch = event.targetTouches[event.targetTouches.length -1];
                if (event.type == "touchmove") {
                    if(touch.pageX > dx && touch.pageX < (dx + down_arrow.width) && touch.pageY > (dy + titlebar_height) && touch.pageY < (dy + titlebar_height + down_arrow.height)){
                        //alert("touch " + touch.pageX + ", " + touch.pageY + " down_arrow " + down_arrow.x + ", " + down_arrow.y + ", " + down_arrow.r + " bar height " + titlebar_height);
                        direction = "down";
                    }
                    else if(touch.pageX > ux && touch.pageX < (ux + up_arrow.width) && touch.pageY > (uy + titlebar_height) && touch.pageY < (uy + titlebar_height + up_arrow.height)){
                        //alert("touch " + touch.pageX + ", " + touch.pageY + " up_arrow " + up_arrow.x + ", " + up_arrow.y + ", " + up_arrow.r + " bar height " + titlebar_height);
                        direction = "up";
                    }
                    else if (touch.pageX > lx && touch.pageX < (lx + left_arrow.width) && touch.pageY > (ly + titlebar_height) && touch.pageY < (ly + titlebar_height + left_arrow.height)){
                        //alert("touch " + touch.pageX + ", " + touch.pageY + " left_arrow " + left_arrow.x + ", " + left_arrow.y + ", " + left_arrow.r + " bar height " + titlebar_height);
                        direction = "left";
                    }
                    else if (touch.pageX > rx && touch.pageX < (rx + right_arrow.width) && touch.pageY > (ry + titlebar_height) && touch.pageY < (ry + titlebar_height + right_arrow.height)){
                        //alert("touch " + touch.pageX + ", " + touch.pageY + " right_arrow " + right_arrow.x + ", " + right_arrow.y + ", " + right_arrow.r + " bar height " + titlebar_height);
                        direction = "right";
                    }
                }
            }
        }

        // Function to paint canvas
        function paintCanvas() {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = "#360a57";
            ctx.fillRect(0, H, W, H*2);
        }

        // Function for creating paddle
        function Paddle(pos) {
            // Height and width
            this.h = 5;
            this.w = 150;
            this.vx = 0;
            this.pos = pos;
            
            // Paddle's position
            this.x = W/2 - this.w/2;
            this.y = H - this.h;
        }

        function Brick(x, y, rank, file, type, colour, points) {
            this.x = x;
            this.y = y;
            this.rank = rank;
            this.file = file;
            this.type = type;
            this.width = W/10;
            this.height = titlebar_height/3;
            this.colour = colour;
            this.points = points;
        }

        var ranks = 5;
        var files = 8;
        var bricks = [];
        for(var rank = 0; rank < ranks; rank++){
            for(var file = 1; file < files; file++) {
                var colourNum = Math.floor(Math.random() * (5));
                bricks.push(new Brick(
                    (W / 2) + ((files/2 - file) * W / files),
                    (titlebar_height + rank * 20),
                    rank, file, 'Brick', colours[colourNum],colourNum));
            }
        }

        // create new paddle
        paddle = new Paddle("bottom");

        // Ball object
        ball = {
            x: W/2,
            y: H/2 + 5, 
            r: 5,
            c: "white",
            vx: 0,
            vy: 6,
            
            // Function for drawing ball on canvas
            draw: function() {
                ctx.beginPath();
                ctx.fillStyle = this.c;
                ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
                ctx.fill();
            }
        };

        var controller = new Image();
        controller.src = "../images/controller.png";
        var cx = 0; //W/2 - controller.width/2;
        var cy = H;

        // Directional Controls
        var up_arrow = new Image();
        up_arrow.src = "../images/up_green.png";
        var ux = W/2 - up_arrow.width/2;
        var uy = 10*(H/9);
        var down_arrow = new Image();
        down_arrow.src = "../images/down_green.png";
        var dx = W/2 - down_arrow.width/2;
        var dy = 9*(H/6);
        var left_arrow = new Image();
        left_arrow.src = "../images/left_green.png";
        var lx = W/4 - left_arrow.width/2;
        var ly = 9*(H/7);
        var right_arrow = new Image();
        right_arrow.src = "../images/right_green.png";
        var rx = 3*W/4 - right_arrow.width/2;
        var ry = 9*(H/7);

        // Start Button object
        startBtn = {
            w: 100,
            h: 50,
            x: W/2 - 50,
            y: H/2 + 25,
            
            draw: function() {
                ctx.strokeStyle = "white";
                ctx.lineWidth = "2";
                ctx.strokeRect(this.x, this.y, this.w, this.h);
                
                ctx.font = "18px Arial, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStlye = "white";
                ctx.fillText("Start", W/2, H/2 + 50);
            }
        };

        levelBtn = {};

        // Restart Button object
        restartBtn = {
            w: 100,
            h: 50,
            x: W/2 - 50,
            y: H/2 + 50,
            
            draw: function() {
                ctx.strokeStyle = "white";
                ctx.lineWidth = "2";
                ctx.strokeRect(this.x, this.y, this.w, this.h);
                
                ctx.font = "18px Arial, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStlye = "white";
                ctx.fillText("Restart", W/2, H/2 + 75);
            }
        };

        // Draw everything on canvas
        function draw() {
            paintCanvas();
            ctx.drawImage(controller, cx, cy, W, H);
            ctx.drawImage(up_arrow, ux, uy);
            ctx.drawImage(down_arrow, dx, dy);
            ctx.drawImage(right_arrow,rx, ry);
            ctx.drawImage(left_arrow, lx, ly);

            ctx.fillStyle = "white";
            ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

            for(var i=0; i<bricks.length; i++) {
                var brick = bricks[i];
                ctx.fillStyle = brick.colour;
                ctx.fillRect(brick.x - brick.width/2, brick.y - brick.height/2, brick.width, brick.height);
            }

            ball.draw();
            update();
        }

        // Function to update positions, score and everything.
        // Basically, the main game logic is defined here
        function update() {

            // Update scores
            updateScore(); 

            if (direction == "left"){
                paddle.vx = -6;
            }
            else if (direction == "right"){
                paddle.vx = 6;
            } 
            else {
                paddle.vx = 0;
            }

            // Move paddle
            if (paddle.x <= 0 && paddle.vx < 0){
                paddle.vx = 0;
            }
            else if ((paddle.x + paddle.w) >= W && paddle.vx > 0){
                paddle.vx = 0;
            }
            paddle.x += paddle.vx;
            
            // Move the ball
            ball.x += ball.vx;
            ball.y += ball.vy;

            
            // If the ball strikes with paddle,
            // invert the y-velocity vector of ball,
            // increment the points, play the collision sound,
            // save collision's position
            if(collides(ball, paddle)) {
                if (ball.vx == 0){
                    ball.vx = 4;
                }
                collideAction(ball, paddle);
            }
            else {
                // Collide with walls, If the ball hits the bottom,
                // wall, run gameOver function
                if(ball.y + ball.r > H) {
                    ball.y = H - ball.r;
                    gameOver(false);
                }
                
                // If ball strikes the vertical walls, invert the 
                // x-velocity vector of ball
                if(ball.x + ball.r > W) {
                    ball.vx = -ball.vx;
                    ball.x = W - ball.r;
                }
                
                else if(ball.x - ball.r < 0) {
                    ball.vx = -ball.vx;
                    ball.x = ball.r;
                }

                else if(ball.y < 0) {
                    ball.vy = -ball.vy;
                    ball.y = ball.r;
                }
            }

            brickCollision(ball, bricks);

            if (bricks.length == 0){
                if (level >= 5){
                    gameOver(true);
                } else {
                    // Level Button object
                    levelBtn = {
                        w: 100,
                        h: 50,
                        x: W/2 - 50,
                        y: H/2 + 25,
                        
                        draw: function() {
                            ctx.strokeStyle = "white";
                            ctx.lineWidth = "2";
                            ctx.strokeRect(this.x, this.y, this.w, this.h);
                            
                            ctx.font = "18px Arial, sans-serif";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStlye = "white";
                            ctx.fillText("Next Level", W/2, H/2 + 50);
                        }
                    };
                    levelUp();
                }
            }
        }

        //Function to check collision with bricks
        function brickCollision(ball, bricks) {
            for(i=0; i<bricks.length; i++) {
                var brick = bricks[i];
                var hit = false;
                if(ball.x + ball.r >= (brick.x - brick.width/2) && ball.x - ball.r <= (brick.x + brick.width/2) &&
                    ball.y >= (brick.y - brick.height/2) && ball.y <= (brick.y + brick.height/2)) {
                    ball.vy = -ball.vy;
                    hit = true;
                    points += (brick.points + 1) * 5;
                }
                if(hit) {
                    bricks.splice(i--, 1);
                }
            }
        }

        //Function to check collision between ball and one of
        //the paddle
        function collides(b, p) {
            if(b.x + ball.r >= p.x && b.x - ball.r <=p.x + p.w) {
                if(b.y >= (p.y - p.h) && p.y > 0){
                    paddleHit = 1;
                    return true;
                }
                
                else if(b.y <= p.h && p.y == 0) {
                    paddleHit = 2;
                    return true;
                }
                
                else return false;
            }
        }

        //Do this when collides == true
        function collideAction(ball, p) {
            if (ball.vy > 0) {
                ball.vy = -(Math.floor(Math.random()*(8-5+1)+5));
            } else {
                ball.vy = (Math.floor(Math.random()*(8-5+1)+5));
            }
            
            if(paddleHit == 1) {
                ball.y = p.y - p.h;
            }
            
            else if(paddleHit == 2) {
                ball.y = p.h + ball.r;
            }
            
            if(collision) {
                if(points > 0) 
                    collision.pause();
                
                collision.currentTime = 0;
                collision.play();
            }
        }

        // Function for updating score
        function updateScore() {
            ctx.fillStlye = "white";
            ctx.font = "16px Arial, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText("Score: " + points, 20, 20 );
            ctx.textAlign = "right";
            ctx.fillText("Level: " + level, 9*W/10, 20 );
        }

        function levelUp(){
            cancelRequestAnimFrame(init);
            levelBtn.draw();
            level++;
        }

        // Function to run when the game overs
        function gameOver(win) {
            ctx.fillStlye = "white";
            ctx.font = "20px Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if (win){
                ctx.fillText("Victory - You scored "+points+" points!", W/2, H/2 + 25 );
            } else {
                ctx.fillText("Game Over - You scored "+points+" points!", W/2, H/2 + 25 );
            }
            
            // Stop the Animation
            cancelRequestAnimFrame(init);
            
            // Set the over flag
            over = 1;
            
            // Show the restart button
            restartBtn.draw();
        }

        // Function for running the whole animation
        function animloop() {
            init = requestAnimFrame(animloop);
            draw();
        }

        // Function to execute at startup
        function startScreen() {
            draw();
            startBtn.draw();
        }

        // Show the start screen
        startScreen();
});