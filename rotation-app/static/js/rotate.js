//Default threshold before user input
//Maximum value for greyness
//Scale values for grayscaling RGB (taken from http://www.mathworks.com/help/toolbox/images/ref/rgb2gray.html )
var widthLim = 750;
var heightLim = 750;
var imageObj;
var stage;
var defRulerWidth = 100;
var defRulerHeight = 4;
rulerShow = true;
rulerHoriz = true;
var scaleVal = 1;

//Setup
window.onload = function() {
    imageObj = new Image();
    //Calculate initial threshold with the Brink formula and draw binarized image
    imageObj.onload = initImage;
    
    //Image path (TO BE REPLACED LATER)
    imageObj.src = "/static/images/oldscore.jpg";
    
    //jQuery slider definition for threshold controller
    $(function() {
		$(".knob").knob({
		    'value':0,
			'min':0,
			'max':360,
			'displayPrevious':true,
			'change':function(v, ipt) {
			    rotate(v);
			}
		});
	});
};

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
    var dist = Math.ceil(Math.sqrt(Math.pow(imageObj.width, 2) + Math.pow(imageObj.height, 2)));
    stage = new Kinetic.Stage({
        container: "container",
        width: dist,
        height: dist
    });
    var layer = new Kinetic.Layer();
    var image = new Kinetic.Image({
        x: dist / 2,
        y: dist / 2,
        width: imageObj.width,
        height: imageObj.height,
        centerOffset: [imageObj.width / 2, imageObj.height / 2],
        image: imageObj,
        name: "image"
    });
    layer.add(image);
    stage.add(layer);
    
    var rulerOffset = dist / 10;
    defRulerWidth = dist;
    var rLayer = new Kinetic.Layer();
    var ruler = new Kinetic.Rect({
        x: 0,
        y: rulerOffset,
        width: defRulerWidth,
        height: defRulerHeight,
        fill: 'black',
        draggable: true,
        dragConstraint: "vertical",
        name: "ruler"
    });
    
    rLayer.add(ruler);
    stage.add(rLayer);
    toggleRuler();
    rotate(0);
}

//Binarizes data, splitting foreground and background at a given brightness level
rotate = function(angle) {
    var image = stage.get(".image")[0];
    image.setRotationDeg(angle);
    image.getLayer().draw()
}

toggleRuler = function() {
    var ruler = stage.get(".ruler")[0];
    if (rulerShow) {
        rulerShow = false;
        ruler.hide();
    } else {
        rulerShow = true;
        ruler.show();
    }
    ruler.getLayer().draw();
}

reorientRuler = function() {
    var ruler = stage.get(".ruler")[0];
    if (rulerHoriz) {
        rulerHoriz = false;
        ruler.attrs.width = defRulerHeight;
        ruler.attrs.height = defRulerWidth;
        ruler.attrs.dragConstraint = "horizontal";
    } else {
        rulerHoriz = true;
        ruler.attrs.width = defRulerWidth;
        ruler.attrs.height = defRulerHeight;
        ruler.attrs.dragConstraint = "vertical";
    }
    var rX = ruler.attrs.x;
    ruler.attrs.x = ruler.attrs.y;
    ruler.attrs.y = rX;
    ruler.getLayer().draw();
}