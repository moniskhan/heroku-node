/*
 ==DOCUMENTATION==
 Append the div structure created by createNewJoystickDiv() to your div. Create a new Joystick on that div structure.
 The joystick will trigger three events: start, move, done.
 The first parameter of any event is nonsense; it's the second you care about.
 THERE IS ALSO AN API TO GET PARAMETERS AT THE CURRENT TIME -- SEE BELOW
 For example:
 var div = $("#mydiv");
 div.append(createNewJoystickDiv());
 var joystick = new Joystick(div);
 $(joystick) //!!!IMPORTANT: Remember $(joystick) not just joystick!!!
    .on("start", function() {
        //Do something
    })
    .on("move", function(nonsense, pos) {
        //Discard nonsense
        console.log("x: " + pos.x + ", y: " + pos.y);
        //x and y are the offset from the start position.
    })
    .on("done", function(nonsense, pos) {
        //Discard nonsense
        console.log("finished at x: " + pos.x + ", y: " + pos.y);
        //x and y are offset from the start position.
    });
 To get the offset at the current time:
 joystick.getOffset()
 Returns an object with x and y properties.

 To get whether or not there is a currently active touch:
 joystick.isTouchActive

 CONFIGURATION OPTIONS
 joystick.deadzone controls the deadzone (the zone which is considered to be "close enough" to zero)
*/
var Joystick = function(elm) {
    var thiz = this;
    thiz.div = elm;
    thiz.currentTouch = -1;
    thiz.startPosX = 0;
    thiz.startPosY = 0;
    thiz.currPosX = 0;
    thiz.currPosY = 0;

    thiz.deadzone = 8;
    thiz.div.on("touchstart", function(evt) {
        evt = getOriginalEvent(evt);
        evt.preventDefault();

        var touch = evt.changedTouches[0];
        thiz.currentTouch = touch.identifier;

        thiz.startPosX = touch.clientX;
        thiz.startPosY = touch.clientY;
        thiz.currPosX = touch.clientX;
        thiz.currPosY = touch.clientY;

        thiz.isTouchActive = true;

        $(thiz).trigger("start");
    });
    thiz.div.on("touchmove", function(evt) {
        evt = getOriginalEvent(evt);
        var touch = evt.changedTouches[0];
        if(touch.identifier == thiz.currentTouch) {
            evt.preventDefault();

            thiz.currPosX = touch.clientX;
            thiz.currPosY = touch.clientY;
            $(thiz).trigger("move", thiz.getOffset());
        }
    });
    thiz.div.on("touchend", function(evt) {
        evt = getOriginalEvent(evt);
        var touch = evt.changedTouches[0];
        if(touch.identifier == thiz.currentTouch) {
            evt.preventDefault();

            thiz.currPosX = touch.clientX;
            thiz.currPosY = touch.clientY;

            thiz.isTouchActive = false;

            $(thiz).trigger("done", thiz.getOffset());
        }
    })
    thiz.getOffset = function() {
        var x = thiz.currPosX - thiz.startPosX;
        var y = thiz.currPosY - thiz.startPosY;
        if(Math.abs(x) < thiz.deadzone) {
            x = 0;
        }
        if(Math.abs(y) < thiz.deadzone) {
            y = 0;
        }
        return {
            x: x,
            y: y
        };
    }
}

function createNewJoystickDiv() {
    return $("<div>")
        .append($("<div>")
            .addClass("si-trackpad-container")
            .append($("<div>")
                .addClass("si-trackpad")));
}
function getOriginalEvent(evt) {
    if(evt["originalEvent"] != undefined) {
        return getOriginalEvent(evt.originalEvent);
    }
    return evt;
}