(function ($)
{
    var RKRotate = function(element, options)
    {
        var defaults = {
            imageUrl: null
        };

        var settings = $.extend({}, defaults, options);

        var instanceVariables = {
            imageObject:  null,
            canvasObject: null,
            gridObject:   null,
            currentAngle: null
        };

        $.extend(settings, instanceVariables);

        var self = this;  // Use self, not this, inside functions. 

        var init = function()
        {
            settings.canvasObject = document.createElement('canvas');
            settings.rkRotateElement.appendChild(settings.canvasObject);
            settings.imageObject = new Image();

            settings.imageObject.onload = function ()
            {
                _setUpCanvas();
                _setUpGrid();
                _setUpRotateByDraggingTheImage();
            };

            settings.imageObject.src = settings.imageUrl;
            settings.currentAngle = 0;
        };

        this.rotate = function (angle)
        {
            // Clockwise is positive.

            var canvas = this.getCanvas(),
                context = canvas.getContext('2d'),
                image = this.getImage();

            context.save();
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.translate(canvas.width / 2, canvas.height / 2);
            context.rotate(angle);
            context.translate(-canvas.width / 2, -canvas.height / 2);
            context.drawImage(settings.imageObject, (canvas.width - image.width)/2, (canvas.height - image.height)/2, image.width, image.height);
            context.restore();

            this.setCurrentAngle(angle);
        };

        this.getImage = function ()
        {
            return settings.imageObject;
        };

        this.getCanvas = function ()
        {
            return settings.canvasObject;
        };

        this.getRkRotateElement = function ()
        {
            return settings.rkRotateElement;
        };

        this.getCurrentAngle = function ()
        {
            return settings.currentAngle;
        };

        this.setCurrentAngle = function (angle)
        {
            settings.currentAngle = angle;
        };

        this.getGrid = function ()
        {
            return settings.gridObject;
        };

        this.showGrid = function ()
        {
            var grid = this.getGrid();

            $(grid).stop();
            $(grid).fadeIn(800);
        };

        this.hideGrid = function ()
        {
            var grid = this.getGrid();

            $(grid).stop();
            $(grid).fadeOut(800);
        };

        var _setUpCanvas = function()
        {
            var context = settings.canvasObject.getContext('2d'),
                canvas = settings.canvasObject,
                w = settings.imageObject.width,
                h = settings.imageObject.height,
                neededSize = Math.ceil(Math.sqrt(h*h + w*w)),
                rkRotateElement = settings.rkRotateElement;

            rkRotateElement.style.position = 'relative';
            rkRotateElement.style.height = neededSize.toString() + 'px';
            rkRotateElement.style.width  = neededSize.toString() + 'px';
            canvas.height = neededSize;
            canvas.width  = neededSize;
            canvas.style.zIndex = 1;
            context.drawImage(settings.imageObject, (neededSize - w)/2, (neededSize - h)/2, w, h);
        };

        var _setUpGrid = function()
        {
            var gridObject = settings.gridObject,
                canvasSize = settings.canvasObject.width;

            gridObject = document.createElement('div');
            gridObject.style.position = 'absolute';
            gridObject.style.left = '0px';
            gridObject.style.top  = '0px';
            gridObject.style.height = canvasSize;
            gridObject.style.width = canvasSize;
            gridObject.style.zIndex = 2;

            var gridBoxHeight = 80,
                gridBoxWidth = 112,
                numberOfColumns = Math.floor(canvasSize / gridBoxWidth),
                numberOfRows = Math.floor(canvasSize / gridBoxHeight),
                numberOfRectanglesInGrid = numberOfColumns * numberOfRows;

            for(var i = 0; i < numberOfRectanglesInGrid; ++i)
            {
                var gridRect = document.createElement('div');

                gridRect.style.float = 'left';
                gridRect.style.height = gridBoxHeight.toString() + 'px';
                gridRect.style.width  = gridBoxWidth.toString() + 'px';
                gridRect.style.marginBottom = '-1px';
                gridRect.style.marginRight  = '-1px';
                gridRect.style.border = '1px solid rgba(0,0,150,0.1)';

                gridObject.appendChild(gridRect);
            }

            $(gridObject).hide();
            settings.gridObject = gridObject;
            settings.rkRotateElement.appendChild(gridObject);
        };

        var _setUpRotateByDraggingTheImage = function()
        {
            var canvas = self.getCanvas();

            $(canvas).mousedown( function()
            {
                // if (! self.clickedInsideImage(event))
                //     return;

                self.showGrid();

                var clickLocation = {x: event.pageX, y: event.pageY},
                    previousAngle = self.getCurrentAngle(),
                    canvasOffset = $(canvas).offset(),
                    centre = {x: canvasOffset.left + canvas.width / 2, y: canvasOffset.top + canvas.height / 2},
                    clickAngle = Math.atan2(clickLocation.y - centre.y, clickLocation.x - centre.x);

                $(window).mousemove( function(event)
                {
                    var dragAngle = Math.atan2(event.pageY - centre.y, event.pageX - centre.x);

                    self.rotate(dragAngle - clickAngle + previousAngle);
                });
            });

            var grid = self.getGrid();

            $(grid).mousedown( function()
            {
                $(canvas).trigger('mousedown');
            });

            $(window).mouseup( function()
            {
                $(window).unbind("mousemove");
                self.hideGrid();
            });
        };

        init();
    };

    $.fn.RKRotate = function(options)
    {
        return this.each(function ()
        {
            var element = $(this);

            if (element.data('RKRotate'))
                return;

            options.rkRotateElement = element[0];

            var template = new RKRotate(this, options);

            element.data('RKRotate', template);
        });
    };
}
)(jQuery);