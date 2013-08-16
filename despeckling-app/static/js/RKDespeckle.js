(function ($)
{
    var RKDespeckle = function(element, options)
    {
        var defaults = {
            imageUrl: null,
            thumbUrl: null,
            binarizationThreshold: 100,
            speckleSize: 0,
            displayOutput: null,
            subImageAspectRatio: 16 / 9
        };

        var settings = $.extend({}, defaults, options);

        var instanceVariables = {
            imageObj: null,          // The main image is quite large and is only viewed through the viewPort
            imageThumb: null,        // The thumbnail is displayed completely, it's the larger top view that has the blue viewBox
            subImageRect: null,      // The blue rectangle that drags around the thumbnail to choose what part of the image to despeckle and display
            scaleVal: null,          // imageThumbWidth / imageObjWidth
            kineticContainer: null,
            viewPortCanvas: null,
            viewPortSize: null,
            kineticImage: null,
            stage: null,
            layerB: null
            // parentObject gets set at the bottom
        };

        $.extend(settings, instanceVariables);

        var self = this;

        var init = function()
        {
            settings.kineticContainer = document.createElement('div');
            settings.kineticContainer.id = "main-image-view";
            settings.viewPortCanvas = document.createElement('canvas');
            settings.parentObject.appendChild(settings.kineticContainer);
            settings.parentObject.appendChild(settings.viewPortCanvas);

            settings.imageObj = new Image();
            settings.imageThumb = new Image();
            settings.imageObj.src = settings.imageUrl;

            settings.imageObj.onload = function ()
            {
                settings.imageThumb.src = settings.thumbUrl;
            };

            settings.imageThumb.onload = function ()
            {
                initializeImageThumb();
            };
        };

        var initializeImageThumb = function ()
        {
            settings.scaleVal = settings.imageThumb.width / settings.imageObj.width;
            
            instantiateKinetic();

            window.onresize = drawViewPortAndSubImageRect;
            drawViewPortAndSubImageRect();

            initializeMouseBehaviours();
        };

        var instantiateKinetic = function ()
        {
            var layer;

            settings.stage = new Kinetic.Stage({
                container: settings.kineticContainer.id,
                width: settings.imageThumb.width,
                height: settings.imageThumb.height
            });

            layer = new Kinetic.Layer();

            settings.kineticImage = new Kinetic.Image({
                x: 0,
                y: 0,
                width: settings.imageThumb.width,
                height: settings.imageThumb.height,
                image: settings.imageThumb,
                stroke: 'black',
                strokewidth: 2
            });

            layer.add(settings.kineticImage);
            settings.stage.add(layer);

            settings.layerB = new Kinetic.Layer();

            settings.subImageRect = new Kinetic.Rect({
                x: 0,
                y: 0,
                width: 5,  // gets set later (drawViewPortAndSubImageRect)
                height: 5,
                fill: 'blue',
                stroke: 'black',
                strokeWidth: 2,
                opacity: 0.2,
                draggable: false,
                name: 'subImageRect'
            });

            settings.layerB.add(settings.subImageRect);
            settings.stage.add(settings.layerB);
        };

        var drawViewPortAndSubImageRect = function ()
        {
            var canvas = self.getViewPortCanvas(),
                viewPortHeight = Math.min(
                    $(window).height() - canvas.offsetTop - 15,
                    settings.imageObj.height,
                    ($(window).width() - canvas.offsetLeft - 15) / settings.subImageAspectRatio,
                    settings.imageObj.width / settings.subImageAspectRatio
                );

            settings.viewPortSize = {
                h: viewPortHeight,
                w: viewPortHeight * settings.subImageAspectRatio
            };

            canvas.height = settings.viewPortSize.h;
            canvas.width = settings.viewPortSize.w;

            drawSubImageRect();

            self.despeckle(self.speckleSize);
        };

        var drawSubImageRect = function ()
        {
            settings.subImageRect.setWidth(settings.viewPortSize.w * settings.scaleVal);
            settings.subImageRect.setHeight(settings.viewPortSize.h * settings.scaleVal);
            settings.subImageRect.setX(Math.min(settings.subImageRect.getX(), settings.imageThumb.width - settings.subImageRect.getWidth()));
            settings.subImageRect.setY(Math.min(settings.subImageRect.getY(), settings.imageThumb.height - settings.subImageRect.getHeight()));
            settings.layerB.draw();
        };

        var initializeMouseBehaviours = function ()
        {
            var canvas, thumbnailMouseDown, viewportMouseDown, prevX, prevY;

            thumbnailMouseDown = false;

            settings.subImageRect.on("mousedown", function (e)
            {
                moveSubImageRect(e);
                thumbnailMouseDown = true;
            });

            settings.kineticImage.on("mousedown", function (e)
            {
                moveSubImageRect(e);
                thumbnailMouseDown = true;
            });

            viewportMouseDown = false;
            prevX = 0;
            prevY = 0;

            canvas = self.getViewPortCanvas();
            canvas.addEventListener("mousedown", function (e)
            {
                viewportMouseDown = true;
                prevX = e.clientX;
                prevY = e.clientY;
            });

            window.addEventListener("mousemove", function (e)
            {
                if (thumbnailMouseDown)
                {
                    moveSubImageRect(e);
                }
                else if (viewportMouseDown)
                {
                    moveSubImageRectRelatively(e, prevX, prevY);
                    prevX = e.clientX;
                    prevY = e.clientY;
                    binarise(settings.binarizationThreshold);
                }
            });

            window.addEventListener("mouseup", function (e)
            {
                if (thumbnailMouseDown)
                {
                    thumbnailMouseDown = false;
                    self.despeckle();
                }
                else if (viewportMouseDown)
                {
                    viewportMouseDown = false;
                    moveSubImageRectRelatively(e, prevX, prevY);
                    self.despeckle();
                }
            });
        };

        this.getCurrentSpeckleSize = function()
        {
            return settings.speckleSize;
        };

        this.getViewPortCanvas = function()
        {
            return settings.viewPortCanvas;
        };

        var moveSubImageRect = function (e)
        {
            var kineticPosition = $(settings.kineticContainer).position(),
                mousePosition = {
                    x: event.pageX - kineticPosition.left,
                    y: event.pageY - kineticPosition.top
                },
                newX = mousePosition.x - settings.subImageRect.getWidth() / 2;
                newY = mousePosition.y - settings.subImageRect.getHeight() / 2;
                // Translates coordinates from the middle of the rect (mousePos) to the top left corner of the rect, where it's drawn from

            setSubImageRectPosition(newX, newY);

            binarise(settings.binarizationThreshold);
        };

        var moveSubImageRectRelatively = function(e, prevX, prevY)
        {
            // Relative motion is required when the user drags on the viewPort (not the subImageRect)

            var dX = e.clientX - prevX,
                dY = e.clientY - prevY,
                newX = settings.subImageRect.getX() - (dX * settings.scaleVal),
                newY = settings.subImageRect.getY() - (dY * settings.scaleVal);

            setSubImageRectPosition(newX, newY);
        };

        var setSubImageRectPosition = function (newX, newY)
        {
            // The position is allowed to be non-integer

            newX = Math.max(newX, 0);
            newX = Math.min(newX, settings.imageThumb.width - settings.subImageRect.getWidth());
            newY = Math.max(newY, 0);
            newY = Math.min(newY, settings.imageThumb.height - settings.subImageRect.getHeight());

            settings.subImageRect.setX(newX);
            settings.subImageRect.setY(newY);
            settings.subImageRect.getLayer().draw();
        };

        // Binarises the image data under the subImageRect and displays it with the viewPort
        var binarise = function (thresh)
        {
            var rScale = 0.2989,
                gScale = 0.5870,
                bScale = 0.1140,
                x, y;

            if (settings.subImageRect)
            {
                x = Math.round(settings.subImageRect.getX() / settings.scaleVal);
                y = Math.round(settings.subImageRect.getY() / settings.scaleVal);
            }
            else
            {
                x = 0;
                y = 0;
            }

            var canvas = self.getViewPortCanvas(),
                context = canvas.getContext("2d");

            x = Math.min(x, settings.imageObj.width - canvas.width);
            y = Math.min(y, settings.imageObj.height - canvas.height);
            context.drawImage(settings.imageObj, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

            var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
                data = imageData.data,
                dLen = data.length;

            for (var i = 0; i < dLen; i += 4)
            {
                var greyscaleValue = rScale * data[i] + gScale * data[i + 1] + bScale * data[i + 2];

                if (greyscaleValue > thresh)
                {
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                }
                else
                {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
            }

            context.putImageData(imageData, 0, 0);
        };

        // Despeckles the image data under the blue square and displays it with the viewPort
        // The argument is optional: if undefined, then this.despeckle() simply redespeckles with the same size.
        this.despeckle = function (size)
        {
            var BLACK = 0,
                WHITE = 255;

            var canvas, context, imageDataO, dataO, w, h, dataT, i, j, x, y, pixelQueue, convX, convY, p, bail,
                center, cX, cY, x2i, y2i, x2Lim, y2Lim, y2, x2, convX2, convY2, p2,
                pointO, pointT, pX, pY;

            if (size !== undefined)
            {
                settings.speckleSize = size;
            }
            else
            {
                size = settings.speckleSize;
            }

            canvas = self.getViewPortCanvas();
            context = canvas.getContext("2d");
            binarise(settings.binarizationThreshold);

            if (settings.displayOutput)
            {
                settings.displayOutput.innerHTML = size;
            }

            if (size > 0)
            {
                imageDataO = context.getImageData(0, 0, canvas.width, canvas.height);
                dataO = imageDataO.data;

                w = canvas.width;
                h = canvas.height;

                dataT = [];
                for (i = 0; i < w; i++)
                {
                    dataT[i] = [];
                    for (j = 0; j < h; j++)
                    {
                        dataT[i][j] = 0;
                    }
                }

                pixelQueue = [];
                for (y = 0; y < h; y++)
                {
                    for (x = 0; x < w; x++)
                    {
                        convX = x * 4;
                        convY = y * w * 4;
                        p = convX + convY;
                        if (dataT[x][y] === 0 && dataO[p] === BLACK)
                        {
                            pixelQueue = [];
                            pixelQueue.push(p);
                            bail = false;
                            dataT[x][y] = 1;
                            for (i = 0; (i < pixelQueue.length) && (pixelQueue.length <= size); i++)
                            {
                                center = pixelQueue[i];

                                cX = (center % (w * 4)) / 4;
                                cY = (center - (cX * 4)) / (w * 4);
                                x2i = (cX > 0) ? (cX - 1) : 0;
                                y2i = (cY > 0) ? (cY - 1) : 0;

                                x2Lim = Math.min(cX + 2, w);
                                y2Lim = Math.min(cY + 2, h);
                                for (y2 = y2i; y2 < y2Lim; y2++)
                                {
                                    for (x2 = x2i; x2 < x2Lim; x2++)
                                    {
                                        if (dataT[x2][y2] === 2)
                                        {
                                            bail = true;
                                            break;
                                        }
                                        convX2 = x2 * 4;
                                        convY2 = y2 * w * 4;
                                        p2 = convX2 + convY2;
                                        if (dataT[x2][y2] === 0 && dataO[p2] === BLACK)
                                        {
                                            dataT[x2][y2] = 1;
                                            pixelQueue.push(p2);
                                        }
                                    }
                                    if (bail)
                                    {
                                        break;
                                    }
                                }
                                if (bail)
                                {
                                    break;
                                }
                            }
                            if ((!bail) && (pixelQueue.length <= size))
                            {
                                while (pixelQueue.length > 0)
                                {
                                    pointO = pixelQueue.pop();
                                    dataO[pointO] = WHITE;
                                    dataO[pointO + 1] = WHITE;
                                    dataO[pointO + 2] = WHITE;
                                }
                            }
                            else
                            {
                                while (pixelQueue.length > 0)
                                {
                                    pointT = pixelQueue.pop();
                                    pX = (pointT % (w * 4)) / 4;
                                    pY = (pointT - (pX * 4)) / (w * 4);
                                    dataT[pX][pY] = 2;
                                }
                            }
                        }
                    }
                }
                context.putImageData(imageDataO, 0, 0);
            }
        };

        init();
    };

    $.fn.RKDespeckle = function(options)
    {
        return this.each(function ()
        {
            var element = $(this);

            if (element.data('RKDespeckle'))
                return;

            options.parentObject = element[0];

            var template = new RKDespeckle(this, options);

            element.data('RKDespeckle', template);
        });
    };
})(jQuery)