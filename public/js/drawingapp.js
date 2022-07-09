

var path;
var currentColor = 'black'
var currentWidth = 5

tool.onMouseDown = function(event) { //This code in this function is called whenever the mouse is clicked.
    path = new Path();     // Create a new path each time.
    path.add(event.point);
    path.strokeColor = currentColor;
    path.strokeWidth = currentWidth;
}
tool.onMouseDrag = function(event) {
    path.add(event.point); //Add points to the path as the user drags their mouse.
}

function undo() {
    var newestPath = project.activeLayer.children.pop()
    newestPath.remove();
}

$('#undo-button').on('click', function(e) {
    undo();
})

$('#default').on('click', function(e) {
    currentColor = 'black';
})
$('#green-line').on('click', function(e) {
    currentColor = 'green';
})
$('#blue-line').on('click', function(e) {
    currentColor = 'blue';
})
$('#red-line').on('click', function(e) {
    currentColor = 'red';
})
$('#thick-stroke').on('click', function(e) {
    currentWidth += 2
})
$('#thin-stroke').on('click', function(e) {
    currentWidth -= 2
})


// Kind of pen-like drawing tool with "blotting":
// tool.maxDistance = 3;
// function onMouseDrag(event) {
// 	var circle = new Path.Circle({
// 		center: event.middlePoint,
// 		radius: event.delta.length
// 	});
// 	circle.fillColor = 'black';
// }