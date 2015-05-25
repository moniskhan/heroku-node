App.controller('pong', function($page) {
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
        var paddles = [2]; // Array containing two paddles
        var points = 0; // Varialbe to store points
        var fps = 60; // Max FPS (frames per second)
        var startBtn = {}; // Start button object
        var restartBtn = {}; // Restart button object
        var over = 0; // flag varialbe, changed when the game is over
        var init; // variable to initialize animation
        var paddleHit;

        canvas.addEventListener("touchstart", touchHandler, false);
        canvas.addEventListener("touchmove", moveHandler, false);
        canvas.addEventListener("touchend", touchHandler, false);

        $(canvas).on('vmousedown', function(e){
            // Variables for storing mouse position on click
            var mx = e.pageX,
            my = e.pageY;
            
            // Click start button
            if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w && my >= startBtn.y + titlebar_height && my <= startBtn.y + titlebar_height + startBtn.h) {
                animloop();
                
                // Delete the start button after clicking it
                startBtn = {};
            }
            
            // If the game is over, and the restart button is clicked
            if(over == 1) {
                if(mx >= restartBtn.x && mx <= restartBtn.x + restartBtn.w && my >= restartBtn.y + titlebar_height && my <= restartBtn.y + titlebar_height + restartBtn.h) {
                    ball.x = W/2;
                    ball.y = H/2;
                    points = 0;
                    ball.vx = 0;
                    ball.vy = 6;
                    direction = "";

                    for(var i = 1; i < paddles.length; i++) {
                        p = paddles[i];
                        p.x = W/2 - p.w/2;
                        p.y = (p.pos == "top") ? 0 : H - p.h;
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
        collision = document.getElementById("collide");

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

        // Function for creating paddles
        function Paddle(pos) {
            // Height and width
            this.h = 5;
            this.w = 150;
            this.vx = 0;
            this.pos = pos;
            
            // Paddle's position
            this.x = W/2 - this.w/2;
            this.y = (pos == "top") ? 0 : H - this.h;
        }

        // Push two new paddles into the paddles[] array
        paddles.push(new Paddle("bottom"));
        paddles.push(new Paddle("top"));

        // Ball object
        ball = {
            x: W/2,
            y: H/2, 
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
                ctx.fillText("Restart", W/2, H/2 + 75 );
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
            for(var i = 0; i < paddles.length; i++) {
                p = paddles[i];
                
                ctx.fillStyle = "white";
                ctx.fillRect(p.x, p.y, p.w, p.h);
            }
            
            ball.draw();
            update();
        }

        // Function to increase speed after every 5 points
        function increaseSpd() {
            if(points % 9 == 0) {
                if(Math.abs(ball.vx) < 15) {
                    ball.vx += (ball.vx < 0) ? -1 : 1;
                    ball.vy += (ball.vy < 0) ? -2 : 2;
                }
            }
        }

        // Function to update positions, score and everything.
        // Basically, the main game logic is defined here
        function update() {

            // Update scores
            updateScore(); 

            for(var i = 1; i < paddles.length; i++) {
                p = paddles[i];
                if (direction == "left"){
                    p.vx = -4;
                }
                else if (direction == "right"){
                    p.vx = 4;
                } 
                else {
                    p.vx = 0;
                }
            }

            // Move paddles
            for(var i = 1; i < paddles.length; i++) {
                p = paddles[i];
                if (p.x <= 0 && p.vx < 0){
                    p.vx = 0;
                }
                else if ((p.x + p.w) >= W && p.vx > 0){
                    p.vx = 0;
                }
                p.x += p.vx;
            }
            
            // Move the ball
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Collision with paddles
            p1 = paddles[1];
            p2 = paddles[2];
            
            // If the ball strikes with paddles,
            // invert the y-velocity vector of ball,
            // increment the points, play the collision sound,
            // save collision's position
            if(collides(ball, p1)) {
                if (ball.vx == 0){
                    ball.vx = 4;
                }
                collideAction(ball, p1);
            }
            
            
            else if(collides(ball, p2)) {
                collideAction(ball, p2);
            } 
            
            else {
                // Collide with walls, If the ball hits the top/bottom,
                // walls, run gameOver() function
                if(ball.y + ball.r > H) {
                    ball.y = H - ball.r;
                    gameOver();
                } 
                
                else if(ball.y < 0) {
                    ball.y = ball.r;
                    gameOver();
                }
                
                // If ball strikes the vertical walls, invert the 
                // x-velocity vector of ball
                if(ball.x + ball.r > W) {
                    ball.vx = -ball.vx;
                    ball.x = W - ball.r;
                }
                
                else if(ball.x -ball.r < 0) {
                    ball.vx = -ball.vx;
                    ball.x = ball.r;
                }
            }
        }

        //Function to check collision between ball and one of
        //the paddles
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
            ball.vy = -ball.vy;
            
            if(paddleHit == 1) {
                ball.y = p.y - p.h;
            }
            
            else if(paddleHit == 2) {
                ball.y = p.h + ball.r;
            }
            
            points++;
            increaseSpd();
            
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
        }

        // Function to run when the game overs
        function gameOver() {
            ctx.fillStlye = "white";
            ctx.font = "20px Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Game Over - You scored "+points+" points!", W/2, H/2 + 25 );
            
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