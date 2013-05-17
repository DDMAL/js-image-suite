(function ($) {
    "use strict";
    //Default threshold before user input
    //Maximum value for greyness
    //Scale values for grayscaling RGB (taken from http://www.mathworks.com/help/toolbox/images/ref/rgb2gray.html )
    var defColour = "blue";
    var imageObj;
    var stage;

    //Fraction of image width to make the margin
    var marginWidth = 0.05;

    // Pixel margin size
    var margin = 0;
    
    function update(group, activeAnchor) {
        var topLeft = group.get(".topLeft")[0];
        var topRight = group.get(".topRight")[0];
        var bottomRight = group.get(".bottomRight")[0];
        var bottomLeft = group.get(".bottomLeft")[0];
        var rect = group.get(".rect")[0];

        // update anchor positions
        switch (activeAnchor.getName()) {
          case "topLeft":
            topRight.setY(activeAnchor.getY());
            bottomLeft.setX(activeAnchor.getX());
            break;
          case "topRight":
            topLeft.setY(activeAnchor.getY());
            bottomRight.setX(activeAnchor.getX());
            break;
          case "bottomRight":
            bottomLeft.setY(activeAnchor.getY());
            topRight.setX(activeAnchor.getX());
            break;
          case "bottomLeft":
            bottomRight.setY(activeAnchor.getY());
            topLeft.setX(activeAnchor.getX());
            break;
        }

        rect.setPosition(topLeft.attrs.x, topLeft.attrs.y);
        rect.setSize(topRight.attrs.x - topLeft.attrs.x, bottomLeft.attrs.y - topLeft.attrs.y);
    }

    function addAnchor(group, x, y, name) {
        var stage = group.getStage();
        var layer = group.getLayer();
    
        var anchor = new Kinetic.Circle({
            x: x,
            y: y,
            stroke: '#666',
            fill: '#ddd',
            strokeWidth: 1,
            radius: 3,
            name: name,
            draggable: true,
            dragBoundFunc: function(pos) {
                var newX = pos.x < margin ? margin : pos.x;
                newX = newX > (margin + imageObj.width) ? (margin + imageObj.width) : newX;
                var newY = pos.y < margin ? margin : pos.y;
                newY = newY > (margin + imageObj.height) ? (margin + imageObj.height) : newY;
                return {
                    x: newX,
                    y: newY
                };
            }
        });
    
        anchor.on("dragmove", function() {
            update(group, this);
            layer.draw();
        });
        anchor.on("mousedown touchstart", function() {
            group.setDraggable(false);
            layer.draw();
        });
        anchor.on("dragend", function() {
            var rect = group.get(".rect")[0];
            group.setDraggable(true);
            layer.draw();
        });
        anchor.on("mouseover", function() {
            var layer = this.getLayer();
            document.body.style.cursor = "pointer";
            this.setStrokeWidth(3);
            layer.draw();
        });
        anchor.on("mouseout", function() {
            var layer = this.getLayer();
            document.body.style.cursor = "default";
            this.setStrokeWidth(1);
            layer.draw();
        });
    
        group.add(anchor);
    }

    function makeRect() {
        var group = new Kinetic.Group({
            x: 0,
            y: 0,
            draggable: true,
            name: "box"
        });
    
        var layer = new Kinetic.Layer();
    
        layer.add(group);
        stage.add(layer);
    
        var rect = new Kinetic.Rect({
            x: (imageObj.width / 20.0) + margin,
            y: (imageObj.height / 20.0) + margin,
            width: 18.0 * (imageObj.width / 20.0),
            height: 18.0 * (imageObj.height / 20.0),
            fill: defColour,
            stroke: 'black',
            strokeWidth: 2,
            opacity: 0.2,
            name: "rect"
        });
        group.setDragBoundFunc(function(pos) {
            var topLim = margin - rect.getY();
            var leftLim = margin - rect.getX();
            var rightLim = margin + imageObj.width - (rect.getX() + rect.getWidth());
            var bottomLim = margin + imageObj.height - (rect.getY() + rect.getHeight());
            var newX = pos.x < leftLim ? leftLim : pos.x;
            newX = newX > rightLim ? rightLim : newX;
            var newY = pos.y < topLim ? topLim : pos.y;
            newY = newY > bottomLim ? bottomLim : newY;
            return {
                x: newX,
                y: newY
            };
        });
        group.add(rect);

        addAnchor(group, rect.getX(), rect.getY(), "topLeft");
        addAnchor(group, rect.getX() + rect.getWidth(), rect.getY(), "topRight");
        addAnchor(group, rect.getX() + rect.getWidth(), rect.getY() + rect.getHeight(), "bottomRight");
        addAnchor(group, rect.getX(), rect.getY() + rect.getHeight(), "bottomLeft");
    
        stage.draw();
    }
    
    function logRect() {
        var group = stage.get(".box")[0];
        var topLeft = group.get(".topLeft")[0];
        var bottomRight = group.get(".bottomRight")[0];
        var oCoords = [];
        oCoords[0] = Math.round(topLeft.getX() + group.getX() - margin);
        oCoords[1] = Math.round(topLeft.getY() + group.getY() - margin);
        oCoords[2] = Math.round(bottomRight.getX() + group.getX() - margin);
        oCoords[3] = Math.round(bottomRight.getY() + group.getY() - margin);
        return oCoords;
    }

    //Setup
    $(document).ready(function() {
        imageObj = new Image();
        //Calculate initial threshold with the Brink formula and draw binarized image
        imageObj.onload = function () {
            margin = imageObj.width * marginWidth;
            stage = new Kinetic.Stage({
                container: "image-preview",
                width: imageObj.width + (2 * margin),
                height: imageObj.height + (2 * margin)
            });
            var layer = new Kinetic.Layer();
            var image = new Kinetic.Image({
                x: margin,
                y: margin,
                width: imageObj.width,
                height: imageObj.height,
                image: imageObj,
                stroke: 'black',
                strokewidth: 2
            });

            layer.add(image);
            stage.add(layer);

            makeRect();
        };
    
        //Image path (TO BE REPLACED LATER)
        imageObj.src = "/static/images/smk.png";
    
        $('#form').submit(function () {
            var points = logRect();
            $('#tlx-input').val(points[0]);
            $('#tly-input').val(points[1]);
            $('#brx-input').val(points[2]);
            $('#bry-input').val(points[3]);
            $('#imw-input').val(imageObj.width);
        });
    });
})(jQuery)

/*

//Default threshold before user input
//Maximum value for greyness
//Scale values for grayscaling RGB (taken from http://www.mathworks.com/help/toolbox/images/ref/rgb2gray.html )
var widthLim = 1000;
var heightLim = 1000;
defColour = "blue"
var jsonPath = "/static/json_in/imdata.json";
var imageObj;
var stage;
var scaleVal = 1;

function IData(data) {
    this.data = data;
    this.getPoint = function(x, y) {
        var convX = x * 4;
        var convY = y * imageObj.width * 4;
        return this.data[convX + convY];
    };
    this.setPoint = function(x, y, val) {
        var convX = x * 4;
        var convY = y * imageObj.width * 4;
        this.data[convX + convY] = val;
        this.data[convX + convY + 1] = val;
        this.data[convX + convY + 2] = val;
    };
    this.isBlack = function(x, y) {
        return this.getPoint(x, y) === BLACK;
    };
    this.isFail = function(x, y) {
        return this.getPoint(x, y) === FAIL;
    };
}

//Setup
$(document).ready(function() {
    imageObj = new Image();
    //Calculate initial threshold with the Brink formula and draw binarized image
    imageObj.onload = initImage;
    
    //Image path (TO BE REPLACED LATER)
    imageObj.src = "/static/images/smk.png";
});

initImage = function() {
    if (imageObj.width > widthLim || imageObj.height > heightLim) {
        var scaleValX = 0;
        var scaleValY = 0;
        scaleValX = widthLim / imageObj.width;
        scaleValY = heightLim / imageObj.height;
        scaleVal = Math.min(scaleValX, scaleValY);
        imageObj.height *= scaleVal;
        imageObj.width *= scaleVal;
    }
    
    stage = new Kinetic.Stage({
        container: "container",
        width: imageObj.width,
        height: imageObj.height
    });
    var layer = new Kinetic.Layer();
    var image = new Kinetic.Image({
        x: 0,
        y: 0,
        width: imageObj.width,
        height: imageObj.height,
        image: imageObj
    });
    
    layer.add(image);
    stage.add(layer);
    
    makeRect();
}

makeRect = function() {
    var group = new Kinetic.Group({
        x: 0,
        y: 0,
        draggable: true,
        name: "box"
    });
    
    var layer = new Kinetic.Layer();
    
    layer.add(group);
    stage.add(layer);
    
    var rect = new Kinetic.Rect({
        x: imageObj.width / 20.,
        y: imageObj.height / 20.,
        width: 18. * (imageObj.width / 20.),
        height: 18. * (imageObj.height / 20.),
        fill: defColour,
        stroke: 'black',
        strokeWidth: 2,
        alpha: .2,
        name: "rect"
    });
    group.add(rect);

    addAnchor(group, rect.attrs.x, rect.attrs.y, "topLeft");
    addAnchor(group, rect.attrs.x + rect.attrs.width, rect.attrs.y, "topRight");
    addAnchor(group, rect.attrs.x + rect.attrs.width, rect.attrs.y + rect.attrs.height, "bottomRight");
    addAnchor(group, rect.attrs.x, rect.attrs.y + rect.attrs.height, "bottomLeft");
    
    group.on("dragend", function() {
        logRect();
    });
    
    stage.draw();
    logRect();
}

function update(group, activeAnchor) {
    var topLeft = group.get(".topLeft")[0];
    var topRight = group.get(".topRight")[0];
    var bottomRight = group.get(".bottomRight")[0];
    var bottomLeft = group.get(".bottomLeft")[0];
    var rect = group.get(".rect")[0];

    // update anchor positions
    switch (activeAnchor.getName()) {
      case "topLeft":
        topRight.attrs.y = activeAnchor.attrs.y;
        bottomLeft.attrs.x = activeAnchor.attrs.x;
        break;
      case "topRight":
        topLeft.attrs.y = activeAnchor.attrs.y;
        bottomRight.attrs.x = activeAnchor.attrs.x;
        break;
      case "bottomRight":
        bottomLeft.attrs.y = activeAnchor.attrs.y;
        topRight.attrs.x = activeAnchor.attrs.x;
        break;
      case "bottomLeft":
        bottomRight.attrs.y = activeAnchor.attrs.y;
        topLeft.attrs.x = activeAnchor.attrs.x;
        break;
    }

    rect.setPosition(topLeft.attrs.x, topLeft.attrs.y);
    rect.setSize(topRight.attrs.x - topLeft.attrs.x, bottomLeft.attrs.y - topLeft.attrs.y);
}

addAnchor = function(group, x, y, name) {
    var stage = group.getStage();
    var layer = group.getLayer();
    
    var anchor = new Kinetic.Circle({
        x: x,
        y: y,
        stroke: '#666',
        fill: '#ddd',
        strokeWidth: 1,
        radius: 3,
        name: name,
        draggable: true
    });
    
    anchor.on("dragmove", function() {
        update(group, this);
        layer.draw();
    });
    anchor.on("mousedown touchstart", function() {
        group.draggable(false);
        layer.draw();
    });
    anchor.on("dragend", function() {
        group.draggable(true);
        layer.draw();
    })
    anchor.on("mouseover", function() {
        var layer = this.getLayer();
        document.body.style.cursor = "pointer";
        this.setStrokeWidth(3);
        layer.draw();
    });
    anchor.on("mouseout", function() {
        var layer = this.getLayer();
        document.body.style.cursor = "default";
        this.setStrokeWidth(1);
        layer.draw();
    });
    
    group.add(anchor);
}

logRect = function() {
    var group = stage.get(".box")[0];
    var topLeft = group.get(".topLeft")[0];
    var bottomRight = group.get(".bottomRight")[0];
    var oCoords = new Array(2);
    oCoords[0] = new Array(2);
    oCoords[1] = new Array(2);
    oCoords[0][0] = Math.round((topLeft.attrs.x + group.attrs.x) / scaleVal);
    oCoords[0][1] = Math.round((topLeft.attrs.y + group.attrs.y) / scaleVal);
    oCoords[1][0] = Math.round((bottomRight.attrs.x + group.attrs.x) / scaleVal);
    oCoords[1][1] = Math.round((bottomRight.attrs.y + group.attrs.y) / scaleVal);
    $('input[name="JSON"]').attr("value", (JSON.stringify(oCoords)));
}

*/