var imageObj;
var gR = 1;
var gG = 1;
var gB = 1;
var gBand = 0.01;
var gPos = -1;
var stage;
var selectionSquare = null;

//Setup
window.onload = function() {
    imageObj = new Image();
    imageObj.onload = function() {
        //Adjust size of canvas to fit image
        canvasV = document.getElementById("imview");
        contextV = canvasV.getContext("2d");
        
        stage = new Kinetic.Stage({
            container: "imorig",
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
        image.on("mousedown", function(e) {
            dragMouse(e);
            image.on("mousemove", dragMouse);
            image.on("mouseup", function() {
                image.off("mousemove");
            });
        })

        layer.add(image);
        stage.add(layer);
        
        canvasV.width = imageObj.width;
        canvasV.height = imageObj.height;
        
        contextV.drawImage(imageObj, 0, 0, canvasV.width, canvasV.height, 0, 0, canvasV.width, canvasV.height);
        
        $("#rslider").slider("value", gR);
        $("#gslider").slider("value", gG);
        $("#bslider").slider("value", gB);
        $("#bandslider").slider("value", gBand);
        $("#rslider").width(imageObj.width * 2);
        $("#gslider").width(imageObj.width * 2);
        $("#bslider").width(imageObj.width * 2);
        $("#bandslider").width(imageObj.width * 2);
    };
    
    imageObj.src = "/static/images/CF-026_400.jpg";
    
    function dragMouse(e) {
        var pos = stage.getMousePosition(e);
        var pX = pos.x - 3;
        var pY = pos.y - 3;
        var dPos = pX * 4 + pY * 4 * imageObj.width;
        gPos = dPos;
        removeColour(dPos);
        if (selectionSquare != null) {
            stage.remove(selectionSquare.getLayer());
        }
        selectionSquare = new Kinetic.Line({
            points: [pX-2, pY-2,
                     pX+2, pY-2,
                     pX+2, pY+2,
                     pX-2, pY+2,
                     pX-2, pY-2],
            stroke: 'black',
            strokeWidth: 1
        });
        var sLayer = new Kinetic.Layer();
        sLayer.add(selectionSquare);
        stage.add(sLayer);
    }
    
    function removeColour(dPos) {
        canvasV = document.getElementById("imview");
        contextV = canvasV.getContext("2d");
        
        contextV.drawImage(imageObj, 0, 0, canvasV.width, canvasV.height, 0, 0, canvasV.width, canvasV.height);
        imageData = contextV.getImageData(0, 0, canvasV.width, canvasV.height);
        data = imageData.data;
        
        var pix = [];
        pix[0] = data[dPos];
        pix[1] = data[dPos+1];
        pix[2] = data[dPos+2];
        for (i = 0; i < data.length; i += 4) {
            if (Math.abs(data[i] - pix[0]) < (pix[0] * gBand) &&
                Math.abs(data[i+1] - pix[1]) < (pix[1] * gBand) &&
                Math.abs(data[i+2] - pix[2]) < (pix[2] * gBand)) {
                data[i] = 255;
                data[i+1] = 255;
                data[i+2] = 255;
            }
        }
        contextV.putImageData(imageData, 0, 0);
    }
    
    function rgbProcess() {
        canvasV = document.getElementById("imview");
        contextV = canvasV.getContext("2d");
        
        contextV.drawImage(imageObj, 0, 0, canvasV.width, canvasV.height, 0, 0, canvasV.width, canvasV.height);
        imageData = contextV.getImageData(0, 0, canvasV.width, canvasV.height);
        data = imageData.data;
        var i;
        for (i = 0; i < data.length; i += 4) {
            data[i] *= gR;
            data[i+1] *= gG;
            data[i+2] *= gB;
        }
        
        contextV.putImageData(imageData, 0, 0);
    }
    
    $("#rslider").slider({
                        animate: true,
                        min: 0,
                        max: 5,
                        orientation: "horizontal",
                        step: 0.025,
                        value: gR,
                        range: false,
                        slide: function(event, ui) {
                            gR = ui.value;
                            rgbProcess();
                        }
    });

    $("#gslider").slider({
                        animate: true,
                        min: 0,
                        max: 5,
                        orientation: "horizontal",
                        step: 0.025,
                        value: gG,
                        range: false,
                        slide: function(event, ui) {
                            gG = ui.value;
                            rgbProcess();
                        }
    });
    
    $("#bslider").slider({
                        animate: true,
                        min: 0,
                        max: 5,
                        orientation: "horizontal",
                        step: 0.025,
                        value: gB,
                        range: false,
                        slide: function(event, ui) {
                            gB = ui.value;
                            rgbProcess();
                        }
    });
    
    $("#bandslider").slider({
                        animate: true,
                        min: 0.01,
                        max: 1.00,
                        orientation: "horizontal",
                        step: 0.01,
                        value: gBand,
                        range: false,
                        slide: function(event, ui) {
                            gBand = ui.value;
                            if (gPos > 0) {
                                removeColour(gPos);
                            }
                        }
    });
};
