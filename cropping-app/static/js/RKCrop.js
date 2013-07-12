(function ($)
{
    var RKCrop = function(element, options)
    {
        var defaults = {

        };

        var settings = $.extend({}, defaults, options);

        var globals = {
        };

        $.extend(settings, globals);
    };

    var init = function()
    {
    };

    init();

    $.fn.RKCrop = function(options)
    {
        return this.each(function ()
        {
            var element = $(this);

            if (element.data('RKCrop'))
                return;

            options.parentObject = element[0];

            var crop = new RKCrop(this, options);
            element.data('RKCrop', crop);
        });
    };

})(jQuery);