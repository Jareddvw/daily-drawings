
// stack of commands that gets pushed to whenever undo is called.
var redoStack = []
// stack of commands that the user called. Undo will pop the top item from the command stack
// and perform the opposite action. E.g. if the last command was lastChild.remove(), 
// undo() will add back that child. 
var undoStack = []

var path;
var currentColor = 'black';
var currentWidth = 10;
var bgColor = 'white';

//variable to let us know if strokeEraser is active or not
var strokeEraser = false;

tool.onMouseDown = function(event) { //This code in this function is called whenever the mouse is clicked.
    path = new Path({
        strokeColor: currentColor,
        strokeWidth: currentWidth,
        strokeCap: 'round',
        strokeJoin: 'round'
    });     // Create a new path each time.
    path.add(event.point);
    // path.fullySelected = true;
}
tool.onMouseDrag = function(event) {
    path.add(event.point); //Add points to the path as the user drags their mouse.
        // reset the redo stack
    if (strokeEraser === true) {
        var kids = project.activeLayer.children
        for (var i = 0; i < kids.length; i++) {
            if (path.intersects(kids[i]) && path !== kids[i]) {
                var child = project.activeLayer.children[i]
                undoStack.push(child)
                undoStack.push("removedPath")
                child.remove();
                redoStack = [];
            }
        }
    }
}
tool.onMouseUp = function(event) {
    path.add(event.point);
    path.simplify();
    if (strokeEraser === true) {
        path.remove()
        return;
    }
    redoStack = [];
    undoStack.push("addedPath")
}

function clearCanvas() {
    if (project.activeLayer.children.length === 0) {
        return;
    }
    while (project.activeLayer.children.length > 0) {
        undoStack.push(project.activeLayer.lastChild)
        project.activeLayer.lastChild.remove()
    }
    undoStack.push("clearedCanvas")
}

function undo() {
    if (undoStack.length === 0) {
        return;
    }
    var lastCommand = undoStack.pop();
    if (lastCommand === "addedPath") {
        var newestPath = project.activeLayer.children.pop()
        if (newestPath !== undefined) {
            redoStack.push(newestPath)
            redoStack.push(lastCommand)
            newestPath.remove();
        }
    } else if (lastCommand === "removedPath") {
        var pathThatWasRemoved = undoStack.pop();
        project.activeLayer.addChild(pathThatWasRemoved)
        redoStack.push(lastCommand)
    } else if (lastCommand === "clearedCanvas") {
        while (typeof undoStack[undoStack.length - 1] !== "string") {
            child = undoStack.pop()
            project.activeLayer.addChild(child)
        }
        redoStack.push(lastCommand);
    }
}
function redo() {
    if (redoStack.length === 0) {
        return;
    }
    var lastCommand = redoStack.pop()
    // lastCommand is the command that undo() most recently reversed.
    if (lastCommand === "addedPath") {
        var topOfRedoStack = redoStack.pop()
        project.activeLayer.addChild(topOfRedoStack)
        undoStack.push(lastCommand)
    } else if (lastCommand === "removedPath") {
        var pathToRemove = project.activeLayer.children.pop()
        if (pathToRemove !== undefined) {
            undoStack.push(pathToRemove)
            undoStack.push(lastCommand)
            pathToRemove.remove();
        }
    } else if (lastCommand === "clearedCanvas") {
        clearCanvas();
    }
}

$('#undo-button').on('click', function(e) {
    undo();
})
$('#redo-button').on('click', function(e) {
    redo();
})
$("#clear-button").on("click", function(e) {
    clearCanvas();
})

$('.pen').on('click', function(e) {
    // if we use an eraser, currentColor should be set to background color.
    if ($(this).attr('id') === 'stroke-eraser') {
        currentColor = $(this).css("--main-canvas-bg");
        strokeEraser = true;
    } else {
        currentColor = $(this).css("background-color");
        strokeEraser = false;
    }
})

$('#thick-stroke').on('click', function(e) {
    if (currentWidth < 39) {
        currentWidth += 2;
    }
})
$('#thin-stroke').on('click', function(e) {
    if (currentWidth > 2) {
        currentWidth -= 2;
    }
})

$(document).on('click', '.pen', function (e) {
    // if button already selected, want user to be able to open colorpicker.
    // Otherwise we should disable other colorpickers and enable only this one.
    $(".pen").removeClass("active");
    $(this).addClass("active");
    if ($(this).attr('id') === "eraser-button" || $(this).attr('id') === "stroke-eraser") {
        return;
    }
    $(this).spectrum({
        type: "color",
        showPaletteOnly: true,
        togglePaletteOnly: true,
        hideAfterPaletteSelect: true,
        containerClassName: 'colorPickerContainer',
        beforeShow: function(color) {
            if (!$(this).hasClass("active")) {
                $(".pen").removeClass("active")
                currentColor = $(this).css("background-color")
                $("#stroke-width").css("background-color", currentColor);
                $(this).addClass("active")
                return false;
            } else {
                return true;
            }
        },
        change: function(color) {
            $(this).css("background-color", color.toHexString()); // #ff0000
            currentColor = color.toHexString()
            $("#stroke-width").css("background-color", currentColor);
        }
    });
    $(this).spectrum("set", $(this).css("background-color"));
 });

$(document).on('click', '.bob' ,function (e) {
    $("#stroke-width").css("height", currentWidth);
    $("#stroke-width").css("width", currentWidth);
    $("#stroke-width").css("background-color", currentColor);
});

 $(document).ready(function (e) {
    $("#default").addClass("active")
    $("#stroke-width").css("height", currentWidth);
    $("#stroke-width").css("width", currentWidth);
    $("#stroke-width").css("background-color", currentColor);
 });


// Kind of pen-like drawing tool with "blotting":
// tool.maxDistance = 10;
// function onMouseDrag(event) {
// 	var circle = new Path.Circle({
// 		center: event.middlePoint,
// 		radius: event.delta.length
// 	});
// 	circle.fillColor = currentColor;
// }
