(function ($)
{
    var RKBinarise = function(element, options)
    {
        var defaults = {
            fullImage: null,
            previewImage: null,
            originalWidth: null,
            defaultThreshold: 127
        };

        var settings = $.extend({}, defaults, options);

        var globals = {
            kStage: null,
            kImageLayer: null,
            kImage: null,
            fullImageObject: null,
            previewImageObject: null,
            fullImageCanvas: null,
            previewImageCanvas: null,
            fullDiv: null,
            previewDiv: null,
            currentThreshold: null,

            //Scale values for grayscaling RGB (taken from http://www.mathworks.com/help/toolbox/images/ref/rgb2gray.html )
            rScale: 0.2989,
            gScale: 0.5870,
            bScale: 0.1140,
            maxiumGreyness: 255,

            globalThresh: 0
        };

        $.extend(settings, globals);

        var self = this;

        var init = function()
        {
            settings.fullImageObject = new Image();
            settings.previewImageObject = new Image();
            settings.fullImageCanvas = document.createElement("canvas");
            settings.previewImageCanvas = document.createElement("canvas");

            settings.previewDiv = document.createElement("div");
            settings.previewDiv.setAttribute("id", "binarise-preview");
            settings.previewDiv.appendChild(settings.previewImageCanvas);

            settings.fullDiv = document.createElement("div");
            settings.fullDiv.setAttribute("id", "binarize-fullview");
            settings.fullDiv.appendChild(settings.fullImageCanvas);

            settings.parentObject.appendChild(settings.previewDiv);
            settings.parentObject.appendChild(settings.fullDiv);

            settings.currentThreshold = settings.defaultThreshold;

            settings.fullImageObject.onload = function ()
            {
                settings.fullImageCanvas.width = settings.fullImageObject.width;
                settings.fullImageCanvas.height = settings.fullImageObject.height;

                var context = settings.fullImageCanvas.getContext("2d");
                context.drawImage(settings.fullImageObject, 
                                    0,
                                    0, 
                                    settings.fullImageCanvas.width,
                                    settings.fullImageCanvas.height
                                  );
                _binarise(settings.fullImageObject, settings.fullImageCanvas);
            };

            settings.previewImageObject.onload = function ()
            {
                settings.previewImageCanvas.width = settings.previewImageObject.width;
                settings.previewImageCanvas.height = settings.previewImageObject.height;

                var context = settings.previewImageCanvas.getContext("2d");
                context.drawImage(settings.previewImageObject,
                                    0,
                                    0,
                                    settings.previewImageCanvas.width,
                                    settings.previewImageCanvas.height
                                  )

                settings.fullImageObject.src = settings.fullImage;
            };

            settings.previewImageObject.src = settings.previewImage;
        };

        init();

        var _binarise = function(imageObject, canvas)
        {
            // x = (typeof x === "undefined") ? x : 0;
            // y = (typeof y === "undefined") ? y : 0;

            var context = canvas.getContext("2d");
            context.drawImage(imageObject, 0, 0, canvas.width, canvas.height);

            var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
                data = imageData.data,
                i = 0,
                dlen = data.length,
                rScale = settings.rScale,
                gScale = settings.gScale,
                bScale = settings.bScale,
                G = settings.maxiumGreyness,
                threshold = settings.currentThreshold;

            while (i < dlen)
            {
                var brightness = (rScale * data[i]) + (gScale * data[i + 1]) + (bScale * data[i + 2]);
                if (brightness > threshold)
                {
                    data[i] = G;
                    data[i + 1] = G;
                    data[i + 2] = G;
                }
                else
                {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
                i += 4;
            }
            context.putImageData(imageData, 0, 0);
        };

        /* PUBLIC METHODS*/
        this.threshold = function(threshold, image, canvas)
        {
            settings.currentThreshold = threshold;
            _binarise(image, canvas);
        };

        this.getFullImageCanvas = function()
        {
            return settings.fullImageCanvas;
        };

        this.getFullImageObject = function()
        {
            return settings.fullImageObject;
        }

        this.getPreviewImageCanvas = function()
        {
            return settings.previewImageCanvas;
        };

    };

    $.fn.RKBinarise = function(options)
    {
        return this.each(function ()
        {
            var element = $(this);

            if (element.data('RKBinarise'))
                return;

            options.parentObject = element[0];

            var bin = new RKBinarise(this, options);
            element.data('RKBinarise', bin);
        });
    };
})(jQuery);