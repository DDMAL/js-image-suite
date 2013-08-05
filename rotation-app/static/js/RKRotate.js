(function ($)
{
    var RKRotate = function(element, options)
    {
        var defaults = {
           imageUrl: null
        };

        var settings = $.extend({}, defaults, options);

        var instanceVariables = {
            canvasObject: null,
            imageObject:  null,
            currentAngle: null
        };

        $.extend(settings, instanceVariables);

        var self = this;

        var init = function()
        {
            settings.canvasObject = document.createElement('canvas');
            settings.parentObject.appendChild(settings.canvasObject);
            settings.imageObject = new Image();

            settings.imageObject.onload = function ()
            {
                var context = settings.canvasObject.getContext('2d'),
                    canvas = settings.canvasObject,
                    w = settings.imageObject.width,
                    h = settings.imageObject.height,
                    neededSize = Math.ceil(Math.sqrt(h*h + w*w));

                canvas.width = neededSize;
                canvas.height = neededSize;
                context.drawImage(settings.imageObject, (neededSize - w)/2, (neededSize - h)/2, w, h);
            };

            settings.imageObject.src = settings.imageUrl;
            settings.currentAngle = 0;
        };

        init();

        this.rotate = function (angle)
        {
            // Rotate image by 'angle' degrees from the original orientation

            var canvas = this.getCanvas(),
                context = canvas.getContext('2d'),
                image = this.getImage();

            context.save();
            context.clearRect(0,0,canvas.width, canvas.height);
            context.translate(canvas.width / 2, canvas.height / 2);
            context.rotate(angle * Math.PI / 180);
            context.translate(-canvas.width / 2, -canvas.height / 2);
            context.drawImage(settings.imageObject, (canvas.width - image.width)/2, (canvas.height - image.height)/2, image.width, image.height);
            context.restore();

            this.setCurrentAngle(angle);
        };


        this.getCurrentAngle = function ()
        {
            console.log("getCurrentAngle returning " + settings.currentAngle);
            return settings.currentAngle;
        };

        this.setCurrentAngle = function (angle)
        {
            settings.currentAngle = angle;
        };

        this.getCanvas = function ()
        {
            return settings.canvasObject;
        };

        this.getImage = function ()
        {
            return settings.imageObject;
        };

    };

    $.fn.RKRotate = function(options)
    {
        return this.each(function ()
        {
            var element = $(this);

            if (element.data('RKRotate'))
                return;

            options.parentObject = element[0];

            var template = new RKRotate(this, options);
            element.data('RKRotate', template);

            });
        };
    }
)(jQuery);