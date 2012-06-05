var widthLim = 750;
var heightLim = 750;
var imageObj;
var scaleVal = 1;
var BLACK = 0;
var WHITE = 255;
var FAIL = 128;
var rScale = 0.2989;
var gScale = 0.5870;
var bScale = 0.1140;

function Point(x, y) {
    this.x = x;
    this.y = y;
}

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
window.onload = function() {
    imageObj = new Image();
    //Calculate initial threshold with the Brink formula and draw binarized image
    imageObj.onload = initImage;
    
    //Image path (TO BE REPLACED LATER)
    imageObj.src = "/static/images/testbin.jpg";
    
    //jQuery slider definition for threshold controller
    $("#slider").slider({
                        animate: true,
                        min: 0,
                        max: 100,
                        orientation: "horizontal",
                        step: 1,
                        value: 0,
                        range: false,
                        change: function(event, ui) {despeckle(ui.value)},
                        });
};

initImage = function() {
    //Adjust size of canvas to fit image
    var canvas = document.getElementById("imview");
    var context = canvas.getContext("2d");
    if (imageObj.width > widthLim || imageObj.height > heightLim) {
        var scaleValX = 0;
        var scaleValY = 0;
        scaleValX = widthLim / imageObj.width;
        scaleValY = heightLim / imageObj.height;
        scaleVal = Math.min(scaleValX, scaleValY);
        imageObj.height *= scaleVal;
        imageObj.width *= scaleVal;
    }
    canvas.width = imageObj.width;
    canvas.height = imageObj.height;
    context.scale(scaleVal, scaleVal);
    binarize(47);
};



despeckle = function(size) {
    var cSize = size;
    var canvas = document.getElementById("imview");
    var context = canvas.getContext("2d");
    binarize(47);
    if (cSize > 0) {
        var imageDataO = context.getImageData(0, 0, canvas.width, canvas.height);
        var dataO = new IData(imageDataO.data);
        var imageDataT = context.getImageData(0, 0, canvas.width, canvas.height);
        var dataT = new IData(imageDataT.data);
        var pixelQueue = [];
        for (var y = 0; y < imageObj.height; ++y) {
            for (var x = 0; x < imageObj.width; ++x) {
                if (dataT.isBlack(x, y) && dataO.isBlack(x, y)) {
                    pixelQueue = new Array();
                    pixelQueue.push(new Point(x, y));
                    var bail = false;
                    dataT.setPoint(x, y, WHITE);
                    for (var i = 0; (i < pixelQueue.length) && (pixelQueue.length < cSize); ++i) {
                        var center = pixelQueue[i];
                        for (var y2 = ((center.y > 0) ? center.y - 1 : 0); (y2 < Math.min(center.y + 2, imageObj.height)); ++y2) {
                            for (var x2 = ((center.x > 0) ? center.x - 1 : 0); (x2 < Math.min(center.x + 2, imageObj.width)); ++x2) {
                                if (dataT.isBlack(x2, y2) && dataO.isBlack(x2, y2)) {
                                    dataT.setPoint(x2, y2, WHITE);
                                    pixelQueue.push(new Point(x2, y2));
                                } else if (dataT.isFail(x2, y2)) {
                                    bail = true;
                                    break;
                                }
                            }
                            if (bail)
                                break;
                        }
                        if (bail)
                            break;
                    }
                    if ((!bail) && (pixelQueue.length < cSize)) {
                        //console.log(pixelQueue.getLength(), cSize);
                        while(pixelQueue.length > 0) {
                            var pointO = pixelQueue.pop();
                            dataO.setPoint(pointO.x, pointO.y, WHITE);
                        }
                    } else {
                        while (pixelQueue.length > 0) {
                            var pointT = pixelQueue.pop();
                            dataT.setPoint(pointT.x, pointT.y, FAIL);
                        }
                    }
                }
            }
        }
        context.putImageData(imageDataO, 0, 0);
    } else {
        binarize(47);
    }
}

binarize = function(thresh) {
    var canvas = document.getElementById("imview");
    var context = canvas.getContext("2d");
    //$("#threshsend").attr("value", thresh);
    //globalThresh = thresh;
    //Have to redraw image and then scrape data
    context.drawImage(imageObj, 0, 0);
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i +=4) {
        //Brightness is the greyscale value for the given pixel
        var brightness = rScale * data[i] + gScale * data[i + 1] + bScale * data[i + 2];
        
        // Binarize image (set to black or white)
        if (brightness > thresh) {
            data[i] = WHITE;
            data[i + 1] = WHITE;
            data[i + 2] = WHITE;
        } else {
            data[i] = BLACK;
            data[i + 1] = BLACK;
            data[i + 2] = BLACK;
        }
    }
    //Draw binarized image
    context.putImageData(imageData, 0, 0);
}