
// stack of commands that gets pushed to whenever undo is called.
var redoStack = []
// stack of commands that the user called. Undo will pop the top item from the command stack
// and perform the opposite action. E.g. if the last command was lastChild.remove(),
// undo() will add back that child.
var undoStack = []

var topLayer = new Layer()
var path;
var currentColor = 'black';
var currentWidth = 10;
var bgColor = 'white';

//variable to let us know if strokeEraser is active or not
var strokeEraser = false;
var selectionTool = false;
var smallEraser = false;
var defaultTool = new Tool();

defaultTool.onMouseDown = function(event) { //This code in this function is called whenever the mouse is clicked.
    if (selectionTool) {
        return;
    }
    path = new Path({
        strokeColor: currentColor,
        strokeWidth: currentWidth,
        strokeCap: 'round',
        strokeJoin: 'round',
        onMouseDown: function(event) {
            if (selectionTool) {
                undoStack.push(this.position)
                this.selected = true
                view.element.style.cursor = "pointer";
                return;
            }
        },
        onMouseDrag: function(event) {
            if (selectionTool) {
                this.position += event.delta
            }
        },
        onMouseUp: function(event) {
            if (selectionTool) {
                undoStack.push(this)
                undoStack.push("movedPath")
                this.fullySelected = false
                view.element.style.cursor = "default";
                console.log(project.activeLayer.children)
            }
        },
        onMouseEnter: function(event) {
            if (selectionTool) {
                view.element.style.cursor = "pointer";
            }
        },
        onMouseLeave: function(event) {
            if (selectionTool) {
                view.element.style.cursor = "default";
            }
        },
    });     // Create a new path each time.
    path.add(event.point);
}
defaultTool.onMouseDrag = function(event) {
    if (selectionTool) {
        return;
    }
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
defaultTool.onMouseUp = function(event) {
    if (selectionTool) {
        return;
    }
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
    } else if (lastCommand === "movedPath") {
        var currentPath = undoStack.pop()
        redoStack.push(currentPath.position)
        redoStack.push(currentPath)
        redoStack.push(lastCommand)
        var prevPathPosition = undoStack.pop()
        currentPath.position = prevPathPosition;
    } else if (lastCommand == "erasedStuff") {
        kids = undoStack.pop()
        kids.forEach(function (kid) {
            kid.remove()
        })
        if (undoStack.pop() !== "itemsToPutBack") {
            console.log("error, should have more items to put back.")
        }
        while (typeof undoStack[undoStack.length - 1] !== "string") {
            thingToPutBack = undoStack.pop()
            project.activeLayer.addChild(thingToPutBack)
        }
        console.log(undoStack[undoStack.length - 1])
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
    } else if (lastCommand === "movedPath") {
        var currentPath = redoStack.pop()
        var prevPathPosition = redoStack.pop()
        undoStack.push(currentPath.position)
        undoStack.push(currentPath)
        undoStack.push(lastCommand)
        currentPath.position = prevPathPosition;
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
$('#select-button').on("click", function(e) {
    defaultTool.activate()
    $(".pen").removeClass("active");
    currentColor = bgColor;
    if (selectionTool === false) {
        $(this).addClass("active")
        selectionTool = true
    } else {
        $(this).removeClass("active")
        selectionTool = false
    }
})
$("#settings-button").on("click", function(e) {
    if ($("#nav").css("display") === "block") {
        $("#nav").css("display", "none");
        return;
    }
    $("#nav").css("display", "block");
})
$("#closebtn").on("click", function(e) {
    $("#nav").css("display", "none");
})

$('.pen').on('click', function(e) {
    // if we use an eraser, currentColor should be set to background color.
    selectionTool = false;
    $("#select-button").removeClass("active")
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
    $(".pen").removeClass("active");
    $(this).addClass("active");
    // if ($(this).attr('id') === "eraser-button") {
    //     eraseTool.activate()
    // } else {
    //     defaultTool.activate()
    // }
    // if button already selected, want user to be able to open colorpicker.
    // Otherwise we should disable other colorpickers and enable only this one.
    if ($(this).attr('id') === "eraser-button" || $(this).attr('id') === "stroke-eraser" ||
        $(this).attr('id') === "select-button") {
        return;
    }
    $(this).spectrum({
        type: "color",
        localStorageKey: $(this).attr('id'),
        showPaletteOnly: true,
        togglePaletteOnly: true,
        hideAfterPaletteSelect: true,
        containerClassName: 'colorpickerContainer',
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


function randomXorY(base) {
  return Math.floor((Math.random() * parseInt(base) * 3.0/4.0)) + parseInt(base) / 8
}
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

$('#displayx').on('click', function(e) {
  $("#display").remove()
})
$('#save').on('click', function(e) {
  alert("Saved drawing!");
})

 $(document).ready(function (e) {
    $("#default").addClass("active")
    $("#stroke-width").css("height", currentWidth);
    $("#stroke-width").css("width", currentWidth);
    $("#stroke-width").css("background-color", currentColor);
    $("#displayx").addClass("show");
    path = new Path({
        strokeColor: new Color("#" + Math.floor(Math.random()*16777215).toString(16)),
        strokeWidth: currentWidth,
        strokeCap: 'round',
        strokeJoin: 'round',
        onMouseDown: function(event) {
            if (selectionTool) {
                undoStack.push(this.position)
                this.selected = true
                view.element.style.cursor = "pointer";
                return;
            }
        },
        onMouseDrag: function(event) {
            if (selectionTool) {
                this.position += event.delta
            }
        },
        onMouseUp: function(event) {
            if (selectionTool) {
                undoStack.push(this)
                undoStack.push("movedPath")
                this.fullySelected = false
                view.element.style.cursor = "default";
                console.log(project.activeLayer.children)
            }
        },
        onMouseEnter: function(event) {
            if (selectionTool) {
                view.element.style.cursor = "pointer";
            }
        },
        onMouseLeave: function(event) {
            if (selectionTool) {
                view.element.style.cursor = "default";
            }
        },
    })
    var canvasHeight = $('#main-canvas').css('height')
    var canvasWidth = $('#main-canvas').css('width')
    for (var i = 0; i <= randomIntFromInterval(5, 10); i += 1) {
        path.add(new Point(randomXorY(canvasWidth), randomXorY(canvasHeight)));
    }
    path.smooth();

    // setting history. If none, initialize it as 1. Otherwise, left shift and add 1.
    var history = localStorage.getItem("history")
    if (history) {
        history = (history << 1) + 1
    } else {
        history = 1
    }
    localStorage.setItem("history", history)
    console.log(history)

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


// erase tool from here: https://bl.ocks.org/beardicus/8cbe9511d43e3fb58d76e336f76f4eb2
// var eraseTool = new Tool()
// eraseTool.minDistance = 10
// var erasePath, tmpGroup, mask

// eraseTool.onMouseDown = function(event) {
//     console.log("mouse down erase")
//     // TODO: deal w/ noop when activeLayer has no children
//     //       right now we just draw in white

//     // create the path object that will record the toolpath
//     erasePath = new Path({
//       strokeWidth: currentWidth,
//       strokeCap: 'round',
//       strokeJoin: 'round',
//       strokeColor: bgColor
//     })

//     // learned about this blend stuff from this issue on the paperjs repo:
//     // https://github.com/paperjs/paper.js/issues/1313

//     // move everything on the active layer into a group with 'source-out' blend
//     tmpGroup = new Group({
//       children: topLayer.removeChildren(),
//       blendMode: 'source-out',
//       insert: false
//     })

//     // combine the path and group in another group with a blend of 'source-over'
//     mask = new Group({
//       children: [erasePath, tmpGroup],
//       blendMode: 'source-over'
//     })
// }

// eraseTool.onMouseDrag = function(event) {
//     // onMouseDrag simply adds points to the path
//     erasePath.add(event.point)
// }

// var kids;

// eraseTool.onMouseUp = function(event) {
//     // simplify the path first, to make the following perform better
//     erasePath.simplify()

//     var eraseRadius = (currentWidth * view.pixelRatio) / 2

//     // find the offset path on each side of the line
//     // this uses routines in the offset.js file
//     var outerPath = OffsetUtils.offsetPath(erasePath, eraseRadius)
//     var innerPath = OffsetUtils.offsetPath(erasePath, -eraseRadius)
//     erasePath.remove() // done w/ this now

//     outerPath.insert = false
//     innerPath.insert = false
//     innerPath.reverse() // reverse one path so we can combine them end-to-end

//     // create a new path and connect the two offset paths into one shape
//     var deleteShape = new Path({
//       closed: true,
//       insert: false
//     })
//     deleteShape.addSegments(outerPath.segments)
//     deleteShape.addSegments(innerPath.segments)

//     // create round endcaps for the shape
//     // as they aren't included in the offset paths
//     var endCaps = new CompoundPath({
//       children: [
//         new Path.Circle({
//           center: erasePath.firstSegment.point,
//           radius: eraseRadius
//         }),
//         new Path.Circle({
//           center: erasePath.lastSegment.point,
//           radius: eraseRadius
//         })
//       ],
//       insert: false
//     })

//     // unite the shape with the endcaps
//     // this also removes all overlaps from the stroke
//     deleteShape = deleteShape.unite(endCaps)
//     deleteShape.simplify()

//     // grab all the items from the tmpGroup in the mask group
//     var items = tmpGroup.getItems({ overlapping: deleteShape.bounds })

//     items.forEach(function(item) {
//         undoStack.push(item)
//       var result = item.subtract(deleteShape, {
//         trace: false,
//         insert: false
//       }) // probably need to detect closed vs open path and tweak these settings

//       if (result.children) {
//         // if result is compoundShape, yoink the individual paths out
//         item.parent.insertChildren(item.index, result.removeChildren())
//         item.remove()
//       } else {
//         if (result.length === 0) {
//           // a fully erased path will still return a 0-length path object
//           item.remove()
//         } else {
//           item.replaceWith(result)
//         }
//       }
//     })
//     undoStack.push("itemsToPutBack")
//     if (kids === undefined) {
//         kids = []
//     }
//     kids = tmpGroup.removeChildren().map(function(a) {
//         if (a === undefined) {
//             return;
//         }
//         topLayer.addChild(a)
//         if (a && !kids.includes(a)) {
//             return a;
//         }
//     })
//     kids = kids.filter(function(x) {
//         return x !== undefined;
//     });
//     console.log(kids)
//     undoStack.push(kids)
//     mask.remove()
//     undoStack.push("erasedStuff")
//     console.log(undoStack)
// }

//   var OffsetUtils =  {
//     offsetPath: function(path, offset, result) {
//         var outerPath = new Path({ insert: false }),
//             epsilon = Numerical.GEOMETRIC_EPSILON,
//             enforeArcs = true;
//         for (var i = 0; i < path.curves.length; i++) {
//             var curve = path.curves[i];
//             if (curve.hasLength(epsilon)) {
//                 var segments = this.getOffsetSegments(curve, offset),
//                     start = segments[0];
//                 if (outerPath.isEmpty()) {
//                     outerPath.addSegments(segments);
//                 } else {
//                     var lastCurve = outerPath.lastCurve;
//                     if (!lastCurve.point2.isClose(start.point, epsilon)) {
//                         if (enforeArcs || lastCurve.getTangentAtTime(1).dot(start.point.subtract(curve.point1)) >= 0) {
//                             this.addRoundJoin(outerPath, start.point, curve.point1, Math.abs(offset));
//                         } else {
//                             // Connect points with a line
//                             outerPath.lineTo(start.point);
//                         }
//                     }
//                     outerPath.lastSegment.handleOut = start.handleOut;
//                     outerPath.addSegments(segments.slice(1));
//                 }
//             }
//         }
//         if (path.isClosed()) {
//             if (!outerPath.lastSegment.point.isClose(outerPath.firstSegment.point, epsilon) && (enforeArcs ||
//                     outerPath.lastCurve.getTangentAtTime(1).dot(outerPath.firstSegment.point.subtract(path.firstSegment.point)) >= 0)) {
//                 this.addRoundJoin(outerPath, outerPath.firstSegment.point, path.firstSegment.point, Math.abs(offset));
//             }
//             outerPath.closePath();
//         }
//         return outerPath;
//     },

//     /**
//      * Creates an offset for the specified curve and returns the segments of
//      * that offset path.
//      *
//      * @param {Curve} curve the curve to be offset
//      * @param {Number} offset the offset distance
//      * @returns {Segment[]} an array of segments describing the offset path
//      */
//     getOffsetSegments: function(curve, offset) {
//         if (curve.isStraight()) {
//             var n = curve.getNormalAtTime(0.5).multiply(offset),
//                 p1 = curve.point1.add(n),
//                 p2 = curve.point2.add(n);
//             return [new Segment(p1), new Segment(p2)];
//         } else {
//             var curves = this.splitCurveForOffseting(curve),
//                 segments = [];
//             for (var i = 0, l = curves.length; i < l; i++) {
//                 var offsetCurves = this.getOffsetCurves(curves[i], offset, 0),
//                     prevSegment;
//                 for (var j = 0, m = offsetCurves.length; j < m; j++) {
//                     var curve = offsetCurves[j],
//                         segment = curve.segment1;
//                     if (prevSegment) {
//                         prevSegment.handleOut = segment.handleOut;
//                     } else {
//                         segments.push(segment);
//                     }
//                     segments.push(prevSegment = curve.segment2);
//                 }
//             }
//             return segments;
//         }
//     },

//     /**
//      * Approach for Curve Offsetting based on:
//      *   "A New Shape Control and Classification for Cubic Bézier Curves"
//      *   Shi-Nine Yang and Ming-Liang Huang
//      */
//     offsetCurve_middle: function(curve, offset) {
//         var v = curve.getValues(),
//             p1 = curve.point1.add(Curve.getNormal(v, 0).multiply(offset)),
//             p2 = curve.point2.add(Curve.getNormal(v, 1).multiply(offset)),
//             pt = Curve.getPoint(v, 0.5).add(
//                     Curve.getNormal(v, 0.5).multiply(offset)),
//             t1 = Curve.getTangent(v, 0),
//             t2 = Curve.getTangent(v, 1),
//             div = t1.cross(t2) * 3 / 4,
//             d = pt.multiply(2).subtract(p1.add(p2)),
//             a = d.cross(t2) / div,
//             b = d.cross(t1) / div;
//         return new Curve(p1, t1.multiply(a), t2.multiply(-b), p2);
//     },

//     offsetCurve_average: function(curve, offset) {
//         var v = curve.getValues(),
//             p1 = curve.point1.add(Curve.getNormal(v, 0).multiply(offset)),
//             p2 = curve.point2.add(Curve.getNormal(v, 1).multiply(offset)),
//             t = this.getAverageTangentTime(v),
//             u = 1 - t,
//             pt = Curve.getPoint(v, t).add(
//                     Curve.getNormal(v, t).multiply(offset)),
//             t1 = Curve.getTangent(v, 0),
//             t2 = Curve.getTangent(v, 1),
//             div = t1.cross(t2) * 3 * t * u,
//             v = pt.subtract(
//                     p1.multiply(u * u * (1 + 2 * t)).add(
//                     p2.multiply(t * t * (3 - 2 * t)))),
//             a = v.cross(t2) / (div * u),
//             b = v.cross(t1) / (div * t);
//         return new Curve(p1, t1.multiply(a), t2.multiply(-b), p2);
//     },

//     /**
//      * This algorithm simply scales the curve so its end points are at the
//      * calculated offsets of the original end points.
//      */
//     offsetCurve_simple: function (crv, dist) {
//         // calculate end points of offset curve
//         var p1 = crv.point1.add(crv.getNormalAtTime(0).multiply(dist));
//         var p4 = crv.point2.add(crv.getNormalAtTime(1).multiply(dist));
//         // get scale ratio
//         var pointDist = crv.point1.getDistance(crv.point2);
//         // TODO: Handle cases when pointDist == 0
//         var f = p1.getDistance(p4) / pointDist;
//         if (crv.point2.subtract(crv.point1).dot(p4.subtract(p1)) < 0) {
//             f = -f; // probably more correct than connecting with line
//         }
//         // Scale handles and generate offset curve
//         return new Curve(p1, crv.handle1.multiply(f), crv.handle2.multiply(f), p4);
//     },

//     getOffsetCurves: function(curve, offset, method) {
//         var errorThreshold = 0.01,
//             radius = Math.abs(offset),
//             offsetMethod = this['offsetCurve_' + (method || 'middle')],
//             that = this;

//         function offsetCurce(curve, curves, recursion) {
//             var offsetCurve = offsetMethod.call(that, curve, offset),
//                 cv = curve.getValues(),
//                 ov = offsetCurve.getValues(),
//                 count = 16,
//                 error = 0;
//             for (var i = 1; i < count; i++) {
//                 var t = i / count,
//                     p = Curve.getPoint(cv, t),
//                     n = Curve.getNormal(cv, t),
//                     roots = Curve.getCurveLineIntersections(ov, p.x, p.y, n.x, n.y),
//                     dist = 2 * radius;
//                 for (var j = 0, l = roots.length; j < l; j++) {
//                     var d = Curve.getPoint(ov, roots[j]).getDistance(p);
//                     if (d < dist)
//                         dist = d;
//                 }
//                 var err = Math.abs(radius - dist);
//                 if (err > error)
//                     error = err;
//             }
//             if (error > errorThreshold && recursion++ < 8) {
//                 if (error === radius) {
//                     // console.log(cv);
//                 }
//                 var curve2 = curve.divideAtTime(that.getAverageTangentTime(cv));
//                 offsetCurce(curve, curves, recursion);
//                 offsetCurce(curve2, curves, recursion);
//             } else {
//                 curves.push(offsetCurve);
//             }
//             return curves;
//         }

//         return offsetCurce(curve, [], 0);
//     },

//     /**
//      * Split curve into sections that can then be treated individually by an
//      * offset algorithm.
//      */
//     splitCurveForOffseting: function(curve) {
//         var curves = [curve.clone()], // Clone so path is not modified.
//             that = this;
//         if (curve.isStraight())
//             return curves;

//         function splitAtRoots(index, roots) {
//             for (var i = 0, prevT, l = roots && roots.length; i < l; i++) {
//                 var t = roots[i],
//                     curve = curves[index].divideAtTime(
//                             // Renormalize curve-time for multiple roots:
//                             i ? (t - prevT) / (1 - prevT) : t);
//                 prevT = t;
//                 if (curve)
//                     curves.splice(++index, 0, curve);
//             }
//         }

//         // Recursively splits the specified curve if the angle between the two
//         // handles is too large (we use 60° as a threshold).
//         function splitLargeAngles(index, recursion) {
//             var curve = curves[index],
//                 v = curve.getValues(),
//                 n1 = Curve.getNormal(v, 0),
//                 n2 = Curve.getNormal(v, 1).negate(),
//                 cos = n1.dot(n2);
//             if (cos > -0.5 && ++recursion < 4) {
//                 curves.splice(index + 1, 0,
//                         curve.divideAtTime(that.getAverageTangentTime(v)));
//                 splitLargeAngles(index + 1, recursion);
//                 splitLargeAngles(index, recursion);
//             }
//         }

//         // Split curves at cusps and inflection points.
//         var info = curve.classify();
//         if (info.roots && info.type !== 'loop') {
//             splitAtRoots(0, info.roots);
//         }

//         // Split sub-curves at peaks.
//         for (var i = curves.length - 1; i >= 0; i--) {
//             splitAtRoots(i, Curve.getPeaks(curves[i].getValues()));
//         }

//         // Split sub-curves with too large angle between handles.
//         for (var i = curves.length - 1; i >= 0; i--) {
//             //splitLargeAngles(i, 0);
//         }
//         return curves;
//     },

//     /**
//      * Returns the first curve-time where the curve has its tangent in the same
//      * direction as the average of the tangents at its beginning and end.
//      */
//     getAverageTangentTime: function(v) {
//         var tan = Curve.getTangent(v, 0).add(Curve.getTangent(v, 1)),
//             tx = tan.x,
//             ty = tan.y,
//             abs = Math.abs,
//             flip = abs(ty) < abs(tx),
//             s = flip ? ty / tx : tx / ty,
//             ia = flip ? 1 : 0, // the abscissa index
//             io = ia ^ 1,       // the ordinate index
//             a0 = v[ia + 0], o0 = v[io + 0],
//             a1 = v[ia + 2], o1 = v[io + 2],
//             a2 = v[ia + 4], o2 = v[io + 4],
//             a3 = v[ia + 6], o3 = v[io + 6],
//             aA =     -a0 + 3 * a1 - 3 * a2 + a3,
//             aB =  3 * a0 - 6 * a1 + 3 * a2,
//             aC = -3 * a0 + 3 * a1,
//             oA =     -o0 + 3 * o1 - 3 * o2 + o3,
//             oB =  3 * o0 - 6 * o1 + 3 * o2,
//             oC = -3 * o0 + 3 * o1,
//             roots = [],
//             epsilon = Numerical.CURVETIME_EPSILON,
//             count = Numerical.solveQuadratic(
//                     3 * (aA - s * oA),
//                     2 * (aB - s * oB),
//                     aC - s * oC, roots,
//                     epsilon, 1 - epsilon);
//         // Fall back to 0.5, so we always have a place to split...
//         return count > 0 ? roots[0] : 0.5;
//     },

//     addRoundJoin: function(path, dest, center, radius) {
//         // return path.lineTo(dest);
//         var middle = path.lastSegment.point.add(dest).divide(2),
//             through = center.add(middle.subtract(center).normalize(radius));
//         path.arcTo(through, dest);
//     },
// }
