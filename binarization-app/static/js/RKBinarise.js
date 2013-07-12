(function ($)
{
    var RKBinarise = function(element, options)
    {
        var defaults = {
            fullImage: null,
            originalWidth: null,
            defaultThreshold: 127
        };

        var settings = $.extend({}, defaults, options);

        var globals = {
            kStage: null,
            kImageLayer: null,
            kImage: null,
            fullImageObject: null,
            fullImageCanvas: null,
            fullDiv: null,
            currentThreshold: null,

            //Scale values for grayscaling RGB (taken from http://www.mathworks.com/help/toolbox/images/ref/rgb2gray.html )
            rScale: 0.2989,
            gScale: 0.5870,
            bScale: 0.1140,
            maximumGreyness: 255,

            globalThresh: 0
        };

        $.extend(settings, globals);

        var self = this;

        var init = function()
        {
            settings.fullImageObject = new Image();
            settings.fullImageCanvas = document.createElement("canvas");

            settings.fullDiv = document.createElement("div");
            settings.fullDiv.setAttribute("id", "binarize-fullview");
            settings.fullDiv.appendChild(settings.fullImageCanvas);

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

            settings.fullImageObject.src = settings.fullImage;
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
                G = settings.maximumGreyness,
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


        /*
            Ported from Gamera -- BUGGY DOES NOT WORK.
            Put here for future debugging and use.
        */
        // var _histogram_real_values = function(image, canvas)
        // {
        //     var context = canvas.getContext("2d");

        //     context.drawImage(image, 0, 0);

        //     var imageData = context.getImageData(0, 0, canvas.width, canvas.height),
        //         data = imageData.data,
        //         rScale = settings.rScale,
        //         gScale = settings.gScale,
        //         bScale = settings.bScale,
        //         dlen = data.length,
        //         values = [],
        //         i = settings.maximumGreyness + 1;

        //     while (i--)
        //     {
        //         values[i] = 0;
        //     }

        //     var j = 0;
        //     while (j < dlen)
        //     {
        //         var brightness = rScale * data[j] + gScale * data[j + 1] + bScale * data[j + 2];
        //         values[Math.round(brightness)]++;
        //         j += 4;
        //     }

        //     return values;
        // };

        // var _get_brink_threshold_value = function(histogram)
        // {
        //     // compute sum of the histogram
        //     var vecSum = 0,
        //         optimum_threshold = 0,
        //         minimum_init = 0,
        //         local_minimum = 0,
        //         pmf = [],  // probability mass function
        //         m_f = [],  // foreground moments
        //         m_b = [],  // background moments
        //         tmp1 = [],
        //         tmp2 = [],
        //         tmp3 = [],
        //         tmp4 = [],
        //         tmpVec1 = [],
        //         tmpVec2 = [],
        //         tmpVec3 = [],
        //         tmpMat1 = [],
        //         tmpMat2 = [];

        //     // 2-dimensionalise matrices
        //     var t = 256;
        //     while (t--)
        //     {
        //         tmp1[t] = [];
        //         tmp2[t] = [];
        //         tmp3[t] = [];
        //         tmp4[t] = [];
        //         tmpMat1[t] = [];
        //         tmpMat2[t] = [];
        //     }

        //     var i = histogram.length;
        //     while (i--)
        //     {
        //         vecSum += histogram[i];
        //     }

        //     // invert the sum
        //     invVecSum = 1.0 / vecSum;
        //     var j = 256;

        //     console.log(invVecSum);
        //     while (j--)
        //     {
        //         pmf[j] = histogram[j] * invVecSum;
        //     }

        //     var k = 1;
        //     m_f[0] = 0.0;
        //     while (k < 256)
        //     {
        //         m_f[k] = k * pmf[k] + m_f[k - 1];
        //         ++k;
        //     }

        //     m_b = m_f.slice(0);

        //     var m  = 0;
        //     while (m < 256)
        //     {
        //         m_b[m] = m_f[255] - m_b[m];
        //         ++m;
        //     }

        //     i = j = 0;
        //     while (i < 256)
        //     {
        //         while (j < 256)
        //         {
        //             tmp1[i][j] = m_f[j] / i;

        //             if ((m_f[j] === 0) || i === 0)
        //             {
        //                 tmp2[i][j] = 0.0;
        //                 tmp3[i][j] = 0.0;
        //             }
        //             else
        //             {
        //                 tmp2[i][j] = Math.log(tmp1[i][j]);
        //                 tmp3[i][j] = Math.log(1.0 / tmp1[i][j]);
        //             }

        //             tmp4[i][j] = pmf[i] * (m_f[j] * tmp2[i][j] + i * tmp3[i][j]);
        //             ++j;
        //         }
        //         ++i;
        //     }

        //     // compute the diagonal of the cumulative sum of tmp4 and store result in tmpVec1
        //     tmpMat1[0] = tmp4[0].slice(0);
        //     i = 1;
        //     j = 0;
        //     while (i < 256)
        //     {
        //         while (j < 256)
        //         {
        //             tmpMat1[i][j] = tmpMat1[i - 1][j] + tmp4[i][j];
        //             ++j;
        //         }
        //         ++i;
        //     }

        //     i = 0;
        //     while (i < 256)
        //     {
        //         tmpVec1[i] = tmpMat1[i][i];
        //         ++i;
        //     }

        //     // same operation but for background moment, NOTE: tmp1 through tmp4 get overwritten
        //     i = j = 0;
        //     while (i < 256)
        //     {
        //         while (j < 256)
        //         {
        //             tmp1[i][j] = m_b[j] / i;

        //             if ((m_b[j] === 0) || (i === 0))
        //             {
        //                 tmp2[i][j] = 0.0;
        //                 tmp3[i][j] = 0.0;
        //             }
        //             else
        //             {
        //                 tmp2[i][j] = Math.log(tmp1[i][j]);
        //                 tmp3[i][j] = Math.log(1.0 / tmp1[i][j]);
        //             }

        //             tmp4[i][j] = pmf[i] * (m_b[j] * tmp2[i][j] + i * tmp3[i][j]);
        //             ++j;
        //         }
        //         ++i;
        //     }

        //     // sum columns, subtract diagonal of cumulative sum of tmp4
        //     tmpVec2 = tmp4[0].slice(0);
        //     i = j = 0;
        //     while (i < 256)
        //     {
        //         while (j < 256)
        //         {
        //             tmpVec2[j] += tmp4[i][j];
        //             ++j;
        //         }
        //         ++i;
        //     }

        //     // compute the diagonal of the cumulative sum of tmp4 and store result in tmpVec1
        //     tmpMat2[0] = tmp4[0].slice(0);
        //     i = 1;
        //     j = 0;
        //     while (i < 256)
        //     {
        //         while (j < 256)
        //         {
        //             tmpMat2[i][j] = tmpMat2[i - 1][j] + tmp4[i][j];
        //             ++j;
        //         }
        //         ++i;
        //     }

        //     i = 0;
        //     while (i < 256)
        //     {
        //         tmpVec3[i] = tmpMat2[i][i];
        //         ++i;
        //     }

        //     i = 0;
        //     while (i < 256)
        //     {
        //         tmpVec2[i] -= tmpVec3[i];
        //         ++i;
        //     }

        //     i = 0;
        //     while (i < 256)
        //     {
        //         tmpVec1[i] += tmpVec2[i];
        //         ++i;
        //     }

        //     i = 0;
        //     while (i < 256)
        //     {
        //         if ((m_f[i] !== 0) && m_b[i] !== 0)
        //         {
        //             if ((minimum_init === 0) || (tmpVec1[i] < local_minimum))
        //             {
        //                 minimum_init = 1;
        //                 local_minimum = tmpVec1[i];
        //                 optimum_threshold = i;
        //             }
        //         }
        //         ++i;
        //     }

        //     return optimum_threshold;
        // };

        /* PUBLIC METHODS*/
        this.threshold = function(threshold, image, canvas)
        {
            settings.currentThreshold = threshold;
            _binarise(image, canvas);
        };

        this.getHistogram = function(image, canvas)
        {
            return _histogram_real_values(image, canvas);
        };

        this.predictBrinkThreshold = function(histogram)
        {
            return _get_brink_threshold_value(histogram);
        };

        this.getFullImageCanvas = function()
        {
            return settings.fullImageCanvas;
        };

        this.getFullImageObject = function()
        {
            return settings.fullImageObject;
        };

        this.getThresholdValue = function()
        {
            return settings.currentThreshold;
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